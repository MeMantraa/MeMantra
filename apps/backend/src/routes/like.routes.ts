import { Router } from 'express';
import { LikeController } from '../controllers/like.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { cacheResponse } from '../middleware/cache.middleware';
import { likeMantraIdSchema, popularMantrasQuerySchema } from '../validators/like.validator';

const router = Router();

// Public route
router.get(
  '/popular',
  validateRequest(popularMantrasQuerySchema),
  cacheResponse({ ttl: 600, keyPrefix: '/api/likes/popular' }),
  LikeController.getMostLikedMantras,
);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/:mantraId', validateRequest(likeMantraIdSchema), LikeController.likeMantra);

router.delete('/:mantraId', validateRequest(likeMantraIdSchema), LikeController.unlikeMantra);

router.get(
  '/mantras',
  cacheResponse({ ttl: 120, perUser: true, keyPrefix: '/api/likes/mantras' }),
  LikeController.getLikedMantras,
);

router.get('/:mantraId/check', validateRequest(likeMantraIdSchema), LikeController.checkIfLiked);

export default router;
