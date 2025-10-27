import { Router } from 'express';
import { CollectionController } from '../controllers/collection.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCollectionSchema,
  updateCollectionSchema,
  getCollectionByIdSchema,
  addMantraToCollectionSchema,
  removeMantraFromCollectionSchema,
} from '../validators/collection.validator';

const router = Router();

// All collection routes require authentication
router.use(authenticate);

// Get all collections for the authenticated user
router.get(
  '/',
  CollectionController.getUserCollections
);

// Get a single collection by ID with mantras
router.get(
  '/:id',
  validateRequest(getCollectionByIdSchema),
  CollectionController.getCollectionById
);

// Get mantras in a collection
router.get(
  '/:id/mantras',
  validateRequest(getCollectionByIdSchema),
  CollectionController.getCollectionMantras
);

// Create a new collection
router.post(
  '/',
  validateRequest(createCollectionSchema),
  CollectionController.createCollection
);

// Update a collection
router.patch(
  '/:id',
  validateRequest(updateCollectionSchema),
  CollectionController.updateCollection
);

// Delete a collection
router.delete(
  '/:id',
  validateRequest(getCollectionByIdSchema),
  CollectionController.deleteCollection
);

// Add a mantra to a collection
router.post(
  '/:id/mantras',
  validateRequest(addMantraToCollectionSchema),
  CollectionController.addMantraToCollection
);

// Remove a mantra from a collection
router.delete(
  '/:id/mantras/:mantraId',
  validateRequest(removeMantraFromCollectionSchema),
  CollectionController.removeMantraFromCollection
);

export default router;
