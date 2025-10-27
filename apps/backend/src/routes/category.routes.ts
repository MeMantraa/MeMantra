import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoryByIdSchema,
} from '../validators/category.validator';

const router = Router();

// Public routes - no authentication required
router.get(
  '/',
  CategoryController.listCategories
);

router.get(
  '/:id',
  validateRequest(getCategoryByIdSchema),
  CategoryController.getCategoryById
);

router.get(
  '/:id/mantras',
  validateRequest(getCategoryByIdSchema),
  CategoryController.getCategoryMantras
);

// Protected routes - authentication required
// TODO: Add admin middleware for create, update, delete operations
router.post(
  '/',
  authenticate,
  validateRequest(createCategorySchema),
  CategoryController.createCategory
);

router.patch(
  '/:id',
  authenticate,
  validateRequest(updateCategorySchema),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(getCategoryByIdSchema),
  CategoryController.deleteCategory
);

export default router;
