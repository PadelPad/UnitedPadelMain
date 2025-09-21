// server/controllers/customerPortalController.js
import Stripe from 'stripe';
import { supabase } from '../supabase/client.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/**
 * POST /api/customer-portal
 * Requires req.user (use requireAuth).
 * Returns { url } to Stripe Billing Portal for the current user.
 */
export const createCustomerPortalSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !profile?.stripe_customer_id) {
      return res.status(404).json({ error: 'Stripe customer ID not found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_BASE_URL}/account`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe portal error:', err.message);
    return res.status(500).json({ error: 'Stripe portal creation failed' });
  }
};
