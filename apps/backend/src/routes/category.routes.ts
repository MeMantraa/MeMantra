import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categoryTypeSchema,
  mantraCategorySchema,
} from '../validators/category.validator';

const router = Router();

// Public routes
router.get('/', CategoryController.getAllCategories);

router.get(
  '/type/:type',
  validateRequest(categoryTypeSchema),
  CategoryController.getCategoriesByType
);

router.get(
  '/:id',
  validateRequest(categoryIdSchema),
  CategoryController.getCategoryById
);

router.get(
  '/:id/mantras',
  validateRequest(categoryIdSchema),
  CategoryController.getMantrasInCategory
);

// Protected routes (require authentication)
router.post(
  '/',
  authenticate,
  validateRequest(createCategorySchema),
  CategoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  validateRequest(categoryIdSchema),
  validateRequest(updateCategorySchema),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(categoryIdSchema),
  CategoryController.deleteCategory
);

router.post(
  '/:id/mantras/:mantraId',
  authenticate,
  validateRequest(mantraCategorySchema),
  CategoryController.addMantraToCategory
);

router.delete(
  '/:id/mantras/:mantraId',
  authenticate,
  validateRequest(mantraCategorySchema),
  CategoryController.removeMantraFromCategory
);

export default router;
