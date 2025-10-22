import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

//api route to register
router.post('/register', validateRequest(registerSchema), AuthController.register);

//api route to login
router.post('/login', validateRequest(loginSchema), AuthController.login);

//api route to get current user profile
router.get('/me', authenticate, AuthController.getMe);

router.post('/auth/google', AuthController.googleAuth);

export default router;