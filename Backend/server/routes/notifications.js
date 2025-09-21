// server/routes/notifications.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listMyNotifications, markAsRead } from '../controllers/notificationsController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET /api/notifications/me
router.get('/me', requireAuth, asyncHandler(listMyNotifications));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, asyncHandler(markAsRead));

export default router;
