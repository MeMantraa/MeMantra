import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema, userIdSchema } from '../validators/user.validator';

const router = Router();

//all the routes here require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

router.get('/', UserController.getAllUsers);

router.get(
  '/:id',
  validateRequest(userIdSchema),
  UserController.getUserById
);

router.post(
  '/',
  validateRequest(createUserSchema),
  UserController.createUser
);

router.put(
  '/:id',
  validateRequest(userIdSchema),
  validateRequest(updateUserSchema),
  UserController.updateUser
);

router.delete(
  '/:id',
  validateRequest(userIdSchema),
  UserController.deleteUser
);

router.get(
  '/:id/feature-flags',
  validateRequest(userIdSchema),
  UserController.getUserFeatureFlags
);

router.put(
  '/:id/feature-flags',
  validateRequest(userIdSchema),
  UserController.setUserFeatureFlags
);

router.post(
  '/:id/feature-flags/:flag',
  validateRequest(userIdSchema),
  UserController.enableUserFeatureFlag
);

router.delete(
  '/:id/feature-flags/:flag',
  validateRequest(userIdSchema),
  UserController.disableUserFeatureFlag
);

export default router;