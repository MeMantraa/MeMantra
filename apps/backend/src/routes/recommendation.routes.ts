import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { cacheResponse } from '../middleware/cache.middleware';
import {
  createRecommendationSchema,
  recommendationIdSchema,
  recommendationQuerySchema,
  recentQuerySchema,
  suggestQuerySchema,
} from '../validators/recommendation.validator';

const router = Router();

// All recommendation routes require authentication
router.use(authenticate);

router.get(
  '/',
  validateRequest(recommendationQuerySchema),
  cacheResponse({ ttl: 300, perUser: true, keyPrefix: '/api/recommendations' }),
  RecommendationController.getUserRecommendations,
);

router.get(
  '/detailed',
  cacheResponse({ ttl: 300, perUser: true, keyPrefix: '/api/recommendations/detailed' }),
  RecommendationController.getDetailedRecommendations,
);

router.get(
  '/recent',
  validateRequest(recentQuerySchema),
  cacheResponse({ ttl: 120, perUser: true, keyPrefix: '/api/recommendations/recent' }),
  RecommendationController.getRecentRecommendations,
);

router.get(
  '/suggest',
  validateRequest(suggestQuerySchema),
  cacheResponse({ ttl: 600, perUser: true }),
  RecommendationController.suggestRecommendations,
);

router.get(
  '/stats',
  cacheResponse({ ttl: 300, perUser: true, keyPrefix: '/api/recommendations/stats' }),
  RecommendationController.getRecommendationStats,
);

router.get(
  '/:id',
  validateRequest(recommendationIdSchema),
  RecommendationController.getRecommendationById,
);

router.post(
  '/',
  validateRequest(createRecommendationSchema),
  RecommendationController.createRecommendation,
);

router.delete(
  '/:id',
  validateRequest(recommendationIdSchema),
  RecommendationController.deleteRecommendation,
);

export default router;
