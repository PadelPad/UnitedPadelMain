// server/routes/posts.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createPost,
  likePost,
  unlikePost,
  repostPost,
  addHashtag,
  addComment,
  deleteComment,
} from '../controllers/postsController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Create post
router.post('/', requireAuth, asyncHandler(createPost));

// Likes
router.post('/:id/like', requireAuth, asyncHandler(likePost));
router.delete('/:id/like', requireAuth, asyncHandler(unlikePost));

// Repost
router.post('/:id/repost', requireAuth, asyncHandler(repostPost));

// Hashtags
router.post('/:id/hashtags', requireAuth, asyncHandler(addHashtag));

// Comments
router.post('/:id/comments', requireAuth, asyncHandler(addComment));
router.delete('/comments/:commentId', requireAuth, asyncHandler(deleteComment));

export default router;
