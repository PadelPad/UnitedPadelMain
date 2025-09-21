// server/app.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';

import subscriptionRouter from './routes/subscription.js';
import customerPortalRouter from './routes/customerPortal.js';
import notificationsRouter from './routes/notifications.js';
import postsRouter from './routes/posts.js';
import { handleStripeWebhook } from './controllers/webhookController.js';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// If you're behind a proxy (Render/Heroku/Nginx), keep IPs/cookies correct
app.set('trust proxy', 1);

// Security headers via Helmet (CSP disabled for dev & Stripe)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// HTTP logging
app.use(
  pinoHttp({
    logger,
    autoLogging: true,
    redact: ['req.headers.authorization'],
  })
);

// IMPORTANT: Stripe webhook must get the raw body BEFORE JSON middleware
app.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// JSON for the rest of the API
app.use(express.json({ limit: '1mb' }));

// Rate limiters
const tightLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount routers
app.use('/api/subscriptions', tightLimiter, subscriptionRouter);
app.use('/api/customer-portal', tightLimiter, customerPortalRouter);
app.use('/api/notifications', tightLimiter, notificationsRouter);
app.use('/api/posts', postsRouter);

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.get('/readyz', (_req, res) => res.json({ ready: true }));

// 404
app.use((req, res, _next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Centralized error handler
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'Unhandled error');
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const port = process.env.PORT || 3001;

// Export app for tests; only listen when not under test
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => logger.info(`Server listening on http://localhost:${port}`));
}

export default app;
