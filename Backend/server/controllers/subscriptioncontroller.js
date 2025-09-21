// server/controllers/subscriptionController.js
import Stripe from 'stripe';
import { z } from 'zod';
import { supabase } from '../supabase/client.js';
import { tierFromPriceId } from '../utils/tierMap.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Body validation for checkout only needs priceId; userId is optional (we prefer req.user.id)
const CheckoutSchema = z.object({
  priceId: z.string().min(1),
  userId: z.string().uuid().optional(),
});

// Helper: resolve userId from auth middleware first, fallback to body
function resolveUserId(req, fallback) {
  const id = req.user?.id ?? fallback;
  if (!id) {
    const e = new Error('Missing user id');
    e.statusCode = 401;
    throw e;
  }
  return id;
}

export const createCheckoutSession = async (req, res) => {
  try {
    const parsed = CheckoutSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const { priceId } = parsed.data;
    const userId = resolveUserId(req, parsed.data.userId);

    // Load or create Stripe customer for this profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }

    const frontend = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const tier = tierFromPriceId(priceId) || 'unknown';

    // --- TEST STABILITY FLAGS ---
    const isTestE2E = process.env.TEST_E2E === 'true' || process.env.NODE_ENV === 'test';

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${frontend}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontend}/subscription-cancelled`,
        // Default behavior (prod/dev)
        automatic_payment_methods: isTestE2E ? { enabled: false } : { enabled: true },
        allow_promotion_codes: isTestE2E ? false : true,
        // Test-only: force legacy card fields so automation is stable
        ...(isTestE2E
          ? {
              payment_method_types: ['card'],
              customer_email: profile.email || 'test-checkout@example.com',
            }
          : {}),
        metadata: { userId, tier },
      },
      { idempotencyKey: `checkout_${userId}_${priceId}` }
    );

    return res.json({ url: session.url });
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({ error: err.message || 'createCheckoutSession failed' });
  }
};

// Status is now auth-driven; no body schema needed
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    // Latest subscription from your DB
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Convenience read from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, is_subscribed, stripe_customer_id')
      .eq('id', userId)
      .single();

    return res.json({ subscription: sub ?? null, profile: profile ?? null });
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({ error: err.message || 'getSubscriptionStatus failed' });
  }
};

export const cancelAtPeriodEnd = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !sub?.stripe_subscription_id) {
      return res.status(404).json({ error: 'Active subscription not found' });
    }

    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabase
      .from('subscriptions')
      .update({ status: updated.status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.stripe_subscription_id);

    return res.json({
      ok: true,
      status: updated.status,
      cancel_at_period_end: updated.cancel_at_period_end,
    });
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({ error: err.message || 'cancelAtPeriodEnd failed' });
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !sub?.stripe_subscription_id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await supabase
      .from('subscriptions')
      .update({ status: updated.status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.stripe_subscription_id);

    return res.json({
      ok: true,
      status: updated.status,
      cancel_at_period_end: updated.cancel_at_period_end,
    });
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({ error: err.message || 'resumeSubscription failed' });
  }
};
