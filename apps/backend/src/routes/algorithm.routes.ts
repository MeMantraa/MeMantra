import { Router } from 'express';
import { AlgorithmController } from '../controllers/algorithm.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All algorithm routes require authentication
router.use(authenticate);

// GET /api/algorithm/scores — view all category scores
router.get('/scores', AlgorithmController.getMyScores);

// GET /api/algorithm/top — view top N categories
router.get('/top', AlgorithmController.getTopCategories);

// PUT /api/algorithm/scores/:categoryId — manually set a category score
router.put('/scores/:categoryId', AlgorithmController.updateScore);

// DELETE /api/algorithm/scores/:categoryId — reset a single category score
router.delete('/scores/:categoryId', AlgorithmController.resetScore);

// DELETE /api/algorithm/scores — reset ALL scores
router.delete('/scores', AlgorithmController.resetAllScores);

export default router;
