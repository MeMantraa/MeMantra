import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createRecommendationSchema,
  recommendationIdSchema,
  recommendationQuerySchema,
  recentQuerySchema,
} from '../validators/recommendation.validator';

const router = Router();

// All recommendation routes require authentication
router.use(authenticate);

router.get(
  '/',
  validateRequest(recommendationQuerySchema),
  RecommendationController.getUserRecommendations
);

router.get(
  '/detailed',
  RecommendationController.getDetailedRecommendations
);

router.get(
  '/recent',
  validateRequest(recentQuerySchema),
  RecommendationController.getRecentRecommendations
);

router.get(
  '/stats',
  RecommendationController.getRecommendationStats
);

router.get(
  '/:id',
  validateRequest(recommendationIdSchema),
  RecommendationController.getRecommendationById
);

router.post(
  '/',
  validateRequest(createRecommendationSchema),
  RecommendationController.createRecommendation
);

router.delete(
  '/:id',
  validateRequest(recommendationIdSchema),
  RecommendationController.deleteRecommendation
);

export default router;
