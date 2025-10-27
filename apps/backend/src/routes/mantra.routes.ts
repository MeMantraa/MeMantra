import { Router } from 'express';
import { MantraController } from '../controllers/mantra.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createMantraSchema,
  updateMantraSchema,
  getMantraByIdSchema,
  listMantrasSchema,
  searchMantrasSchema,
} from '../validators/mantra.validator';

const router = Router();

// Public routes - no authentication required
router.get(
  '/',
  validateRequest(listMantrasSchema),
  MantraController.listMantras
);

router.get(
  '/search',
  validateRequest(searchMantrasSchema),
  MantraController.searchMantras
);

router.get(
  '/popular',
  MantraController.getPopularMantras
);

router.get(
  '/:id',
  validateRequest(getMantraByIdSchema),
  MantraController.getMantraById
);

// Protected routes - authentication required
// TODO: Add admin middleware for create, update, delete operations
router.post(
  '/',
  authenticate,
  validateRequest(createMantraSchema),
  MantraController.createMantra
);

router.patch(
  '/:id',
  authenticate,
  validateRequest(updateMantraSchema),
  MantraController.updateMantra
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(getMantraByIdSchema),
  MantraController.deleteMantra
);

export default router;
