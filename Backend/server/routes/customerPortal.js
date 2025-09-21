// server/routes/customerPortal.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createCustomerPortalSession } from '../controllers/customerPortalController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// POST /api/customer-portal
router.post('/', requireAuth, asyncHandler(createCustomerPortalSession));

export default router;
