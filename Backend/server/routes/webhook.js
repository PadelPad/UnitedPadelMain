// server/routes/webhook.js
import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// IMPORTANT: this route must receive the raw body, not JSON-parsed
router.post('/stripe', handleStripeWebhook);

export default router;
