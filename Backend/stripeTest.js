import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const price = await stripe.prices.retrieve('price_1RS0HfRqoRyLHnkoljOCrcWh');
    console.log('✅ Price info:', price);
  } catch (error) {
    console.error('❌ Stripe API test error:', error);
  }
})();