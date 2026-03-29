import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  featureFlagRolloutSchema,
  featureFlagAssignUserSchema,
  featureFlagToggleAllSchema,
} from '../validators/user.validator';

const router = Router();

//all the routes here require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

router.get('/feature-flags', UserController.listFeatureFlags);

router.get('/feature-flags/users', UserController.getUsersWithFlags);

router.post(
  '/feature-flags/:flag/users/:id',
  validateRequest(featureFlagAssignUserSchema),
  UserController.setSingleUserFeatureFlag,
);

router.post(
  '/feature-flags/:flag/all',
  validateRequest(featureFlagToggleAllSchema),
  UserController.setFeatureFlagForAllUsers,
);

router.post(
  '/feature-flags/:flag/rollout',
  validateRequest(featureFlagRolloutSchema),
  UserController.rolloutFeatureFlagToPercentage,
);

router.post(
  '/feature-flags/:flag/rollout/exact',
  validateRequest(featureFlagRolloutSchema),
  UserController.setExactFeatureFlagRolloutToPercentage,
);

router.get('/', UserController.getAllUsers);

router.get('/:id', validateRequest(userIdSchema), UserController.getUserById);

router.post('/', validateRequest(createUserSchema), UserController.createUser);

router.put(
  '/:id',
  validateRequest(userIdSchema),
  validateRequest(updateUserSchema),
  UserController.updateUser,
);

router.delete('/:id', validateRequest(userIdSchema), UserController.deleteUser);

router.get('/:id/feature-flags', validateRequest(userIdSchema), UserController.getUserFeatureFlags);

export default router;
