import { Router } from 'express';
import { RatingController } from '../controllers/rating.controller';
import { authenticate } from '../middleware/auth.middleware';
import { cacheResponse } from '../middleware/cache.middleware';

const router = Router();

router.post('/', authenticate, RatingController.rateMantra);

router.get(
  '/mantra/:mantraId',
  authenticate,
  cacheResponse({ ttl: 120, perUser: true }),
  RatingController.getUserRating,
);

router.get(
  '/mantra/:mantraId/average',
  cacheResponse({ ttl: 300 }),
  RatingController.getAverageRating,
);

router.delete('/:ratingId', authenticate, RatingController.deleteRating);

export default router;
