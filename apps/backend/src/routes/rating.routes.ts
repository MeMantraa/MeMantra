import { Router } from 'express';
import { RatingController } from '../controllers/rating.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, RatingController.rateMantra);

router.get('/mantra/:mantraId', authenticate, RatingController.getUserRating);

router.get('/mantra/:mantraId/average', RatingController.getAverageRating);

router.delete('/:ratingId', authenticate, RatingController.deleteRating);

export default router;
