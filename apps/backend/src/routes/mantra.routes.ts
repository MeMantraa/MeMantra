import { Router } from 'express';
import { MantraController } from '../controllers/mantra.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import {
  createMantraSchema,
  updateMantraSchema,
  mantraQuerySchema,
  mantraIdSchema,
  categoryIdSchema,
} from '../validators/mantra.validator';

const router = Router();



// Feed route (
router.get(
  '/feed',
  authenticate,
  MantraController.getFeedMantras
);

// Popular mantras
router.get(
  '/popular',
  MantraController.getPopularMantras
);

// Category filter
router.get(
  '/category/:categoryId',
  validateRequest(categoryIdSchema),
  MantraController.getMantrasByCategory
);

// List all mantras (public)
router.get(
  '/',
  validateRequest(mantraQuerySchema),
  MantraController.getAllMantras
);

// Get single mantra by ID 
router.get(
  '/:id',
  validateRequest(mantraIdSchema),
  MantraController.getMantraById
);

// Protected routes (require authentication + admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createMantraSchema),
  MantraController.createMantra
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(mantraIdSchema),
  validateRequest(updateMantraSchema),
  MantraController.updateMantra
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(mantraIdSchema),
  MantraController.deleteMantra
);

export default router;