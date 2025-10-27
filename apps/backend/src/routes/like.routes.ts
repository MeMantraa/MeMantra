import { Router } from 'express';
import { LikeController } from '../controllers/like.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  likeMantraSchema,
  getMantraLikeStatusSchema,
} from '../validators/like.validator';

const router = Router();

// All like routes require authentication
router.use(authenticate);

// Get all liked mantras for the authenticated user
router.get(
  '/',
  LikeController.getUserLikedMantras
);

// Like a mantra
router.post(
  '/',
  validateRequest(likeMantraSchema),
  LikeController.likeMantra
);

// Unlike a mantra
router.delete(
  '/',
  validateRequest(likeMantraSchema),
  LikeController.unlikeMantra
);

// Toggle like (like if not liked, unlike if liked)
router.post(
  '/toggle',
  validateRequest(likeMantraSchema),
  LikeController.toggleLike
);

// Check if user has liked a specific mantra
router.get(
  '/status/:mantraId',
  validateRequest(getMantraLikeStatusSchema),
  LikeController.checkLikeStatus
);

// Get like count for a mantra (public endpoint - remove auth middleware for this one)
router.get(
  '/count/:mantraId',
  validateRequest(getMantraLikeStatusSchema),
  LikeController.getMantraLikeCount
);

export default router;
