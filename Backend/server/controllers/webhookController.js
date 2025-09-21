// server/controllers/webhookController.js
import Stripe from 'stripe';
import { supabase } from '../supabase/client.js';
import { tierFromPriceId } from '../utils/tierMap.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ---------- Helper exported for tests ----------
export async function upsertSubscriptionFromStripe(supabaseClient, sub) {
  const customerId = sub.customer;
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const priceObj = sub.items?.data?.[0]?.price ?? null;

  const tier = tierFromPriceId(priceId) || 'unknown';
  const interval = priceObj?.recurring?.interval ?? null;
  const amount = priceObj?.unit_amount != null ? priceObj.unit_amount / 100 : null;
  const currency = priceObj?.currency ?? null;
  const status = sub.status;

  // Find owning user via profiles.stripe_customer_id
  const { data: profile, error: profileErr } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileErr) {
    console.warn('profiles lookup warning:', profileErr.message);
  }

  // Upsert subscriptions (idempotent)
  const subPayload = {
    user_id: profile?.id ?? null,
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    price_id: priceId,
    status,
    interval,
    amount,
    currency,
  };

  const { error: upsertErr } = await supabaseClient
    .from('subscriptions')
    .upsert(subPayload, { onConflict: 'stripe_subscription_id' });

  if (upsertErr) {
    console.error('subscriptions upsert error:', upsertErr.message);
    throw upsertErr;
  }

  // Update profile’s subscription flags/tier
  if (profile?.id) {
    const isSubscribed = ['active', 'trialing', 'past_due'].includes(status);
    const { error: profErr } = await supabaseClient
      .from('profiles')
      .update({
        is_subscribed: isSubscribed,
        subscription_tier: tier,
      })
      .eq('id', profile.id);
    if (profErr) throw profErr;
  }
}
// ----------------------------------------------

async function markProcessed(eventId) {
  const { data: existing, error: selErr } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();

  if (selErr) {
    console.error('stripe_events select error:', selErr.message);
    throw selErr;
  }
  if (existing) return false;

  const { error: insErr } = await supabase
    .from('stripe_events')
    .insert({ id: eventId });

  if (insErr) {
    console.error('stripe_events insert error:', insErr.message);
    throw insErr;
  }
  return true;
}

export const handleStripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw buffer (express.raw)
      req.headers['stripe-signature'],
      endpointSecret
    );
  } catch (err) {
    console.error('❌ Invalid webhook signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const firstTime = await markProcessed(event.id);
    if (!firstTime) return res.json({ received: true, duplicate: true });

    switch (event.type) {
      case 'checkout.session.completed':
        // canonical state comes via subscription.created/updated
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await upsertSubscriptionFromStripe(supabase, sub);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;

        // mark canceled
        const { error: updErr } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);
        if (updErr) throw updErr;

        const { data: s, error: selErr } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single();

        if (!selErr && s?.user_id) {
          const { error: profErr } = await supabase
            .from('profiles')
            .update({ is_subscribed: false })
            .eq('id', s.user_id);
          if (profErr) throw profErr;
        }
        break;
      }

      case 'invoice.payment_failed':
        // optional: insert a backend-only notification or email
        break;

      case 'invoice.paid':
        // optional: confirm active if needed
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.status(500).send('Webhook handler failed');
  }
};
