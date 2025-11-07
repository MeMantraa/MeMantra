import { Router } from 'express';
import { MantraController } from '../controllers/mantra.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createMantraSchema,
  updateMantraSchema,
  mantraQuerySchema,
  mantraIdSchema,
  categoryIdSchema,
} from '../validators/mantra.validator';

const router = Router();

// Public routes
router.get(
  '/',
  validateRequest(mantraQuerySchema),
  MantraController.getAllMantras
);

router.get(
  '/popular',
  MantraController.getPopularMantras
);

router.get(
  '/category/:categoryId',
  validateRequest(categoryIdSchema),
  MantraController.getMantrasByCategory
);

router.get(
  '/:id',
  validateRequest(mantraIdSchema),
  MantraController.getMantraById
);

// Protected routes (require authentication)
router.post(
  '/',
  authenticate,
  validateRequest(createMantraSchema),
  MantraController.createMantra
);

router.put(
  '/:id',
  authenticate,
  validateRequest(mantraIdSchema),
  validateRequest(updateMantraSchema),
  MantraController.updateMantra
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(mantraIdSchema),
  MantraController.deleteMantra
);

export default router;
