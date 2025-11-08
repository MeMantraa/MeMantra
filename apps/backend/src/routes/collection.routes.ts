import { Router } from 'express';
import { CollectionController } from '../controllers/collection.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionIdSchema,
  collectionMantraSchema,
} from '../validators/collection.validator';

const router = Router();

// All collection routes require authentication
router.use(authenticate);

router.get('/', CollectionController.getUserCollections);

router.get(
  '/:id',
  validateRequest(collectionIdSchema),
  CollectionController.getCollectionById
);

router.post(
  '/',
  validateRequest(createCollectionSchema),
  CollectionController.createCollection
);

router.put(
  '/:id',
  validateRequest(collectionIdSchema),
  validateRequest(updateCollectionSchema),
  CollectionController.updateCollection
);

router.delete(
  '/:id',
  validateRequest(collectionIdSchema),
  CollectionController.deleteCollection
);

router.post(
  '/:id/mantras/:mantraId',
  validateRequest(collectionMantraSchema),
  CollectionController.addMantraToCollection
);

router.delete(
  '/:id/mantras/:mantraId',
  validateRequest(collectionMantraSchema),
  CollectionController.removeMantraFromCollection
);

export default router;
