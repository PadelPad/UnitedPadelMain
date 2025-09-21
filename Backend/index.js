import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

import subscriptionRoutes from './server/routes/subscription.js';
import customerPortalRoute from './server/routes/customerPortal.js';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// === Middleware
app.use(cors());
app.use(express.json()); // Normal JSON
app.use('/webhook', express.raw({ type: 'application/json' })); // Raw for Stripe webhook

// === Health Check
app.get('/', (req, res) => {
  res.send('✅ United Padel backend is live!');
});

// === Normal API Routes
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/customer-portal', customerPortalRoute);

// === Stripe Webhook
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const type = event.type;
  const object = event.data.object;

  // === 1. Checkout completed
  if (type === 'checkout.session.completed') {
    const session = object;
    const userId = session.metadata?.userId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const priceId = session?.items?.data?.[0]?.price?.id ||
                    session?.lines?.data?.[0]?.price?.id ||
                    session?.subscription?.items?.data?.[0]?.price?.id;

    let membership_type;

    switch (priceId) {
      case 'price_1Rpv4nRvEGYvE2VtSzOaB26y': membership_type = 'basic'; break;
      case 'price_1Rpv6HRvEGYvE2VtWCuBgoJs': membership_type = 'plus'; break;
      case 'price_1Rpv7WRvEGYvE2VtGXoMKDds': membership_type = 'elite'; break;
      case 'price_1Rpv8RRvEGYvE2Vtoo8556Zq': membership_type = 'club_basic'; break;
      case 'price_1Rpv98RvEGYvE2VtxDrfd5fO': membership_type = 'club_plus'; break;
      case 'price_1Rpv9pRvEGYvE2Vtd3JeJt4Z': membership_type = 'club_elite'; break;
      default: membership_type = null;
    }

if (userId && membership_type && customerId && subscriptionId) {
  const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);

  const interval = subscriptionDetails.items.data[0].price.recurring.interval;
  const amount = subscriptionDetails.items.data[0].price.unit_amount / 100;
  const currency = subscriptionDetails.items.data[0].price.currency;
  const status = subscriptionDetails.status;

  if (membership_type.startsWith('club')) {
    const { error: clubUpdateError } = await supabase
      .from('clubs')
      .update({
        membership_type,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId
      })
      .eq('auth_user_id', userId);

    if (clubUpdateError) {
      console.error('❌ Failed to update club:', clubUpdateError.message);
      return res.status(500).send('Failed to update club');
    }

    await supabase
      .from('subscriptions')
      .insert({
        club_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        price_id: priceId,
        membership_type,
        interval,
        amount,
        currency,
        status
      });

    console.log(`🏟️ Club ${userId} upgraded to ${membership_type}`);
  } else {
    const { error: userUpdateError } = await supabase
      .from('profiles')
      .update({
        membership_type,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('❌ Failed to update user:', userUpdateError.message);
      return res.status(500).send('Failed to update user');
    }

    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        price_id: priceId,
        membership_type,
        interval,
        amount,
        currency,
        status
      });

    console.log(`🎾 User ${userId} upgraded to ${membership_type}`);
  }
}
  }

  // === 2. Subscription cancelled
  if (type === 'customer.subscription.deleted') {
    const subscription = object;
    const customerId = subscription.customer;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ membership_type: 'basic' })
        .eq('id', profile.id);
      console.log(`🔻 Player ${profile.id} downgraded to basic`);
    } else {
      const { data: club } = await supabase
        .from('clubs')
        .select('auth_user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (club) {
        await supabase
          .from('clubs')
          .update({ membership_type: 'basic' })
          .eq('auth_user_id', club.auth_user_id);
        console.log(`🔻 Club ${club.auth_user_id} downgraded to basic`);
      } else {
        console.warn('⚠️ No profile or club found for cancelled customer:', customerId);
      }
    }
  }

  res.status(200).send('Webhook processed');
});

// === Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 United Padel server running at http://localhost:${PORT}`);
});
