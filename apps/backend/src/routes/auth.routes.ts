import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

// Rate limiter for authenticated user-info routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

const router = Router();

//api route to register
router.post('/register', validateRequest(registerSchema), AuthController.register);

//api route to login
router.post('/login', validateRequest(loginSchema), AuthController.login);

//api route to get current user profile
router.get('/me', authRateLimiter, authenticate, AuthController.getMe);

export default router;