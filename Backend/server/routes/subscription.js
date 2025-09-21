// server/routes/subscription.js
import { Router } from 'express';
import {
  createCheckoutSession,
  getSubscriptionStatus,
  cancelAtPeriodEnd,
  resumeSubscription,
} from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Small helper to bubble async errors to Express
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/subscriptions/create-checkout-session
router.post('/create-checkout-session', requireAuth, asyncHandler(createCheckoutSession));

// STATUS — support both GET and POST (tests use POST)
router.get('/status', requireAuth, asyncHandler(getSubscriptionStatus));
router.post('/status', requireAuth, asyncHandler(getSubscriptionStatus));

// CANCEL AT PERIOD END — POST
router.post('/cancel-at-period-end', requireAuth, asyncHandler(cancelAtPeriodEnd));

// RESUME — POST
router.post('/resume', requireAuth, asyncHandler(resumeSubscription));

export default router;
