import { Router } from 'express';
import { LikeController } from '../controllers/like.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { likeMantraIdSchema, popularMantrasQuerySchema } from '../validators/like.validator';

const router = Router();

// Public route
router.get(
  '/popular',
  validateRequest(popularMantrasQuerySchema),
  LikeController.getMostLikedMantras
);

// Protected routes (require authentication)
router.use(authenticate);

router.post(
  '/:mantraId',
  validateRequest(likeMantraIdSchema),
  LikeController.likeMantra
);

router.delete(
  '/:mantraId',
  validateRequest(likeMantraIdSchema),
  LikeController.unlikeMantra
);

router.get('/mantras', LikeController.getLikedMantras);

router.get(
  '/:mantraId/check',
  validateRequest(likeMantraIdSchema),
  LikeController.checkIfLiked
);

export default router;
