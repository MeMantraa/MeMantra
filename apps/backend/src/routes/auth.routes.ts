import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, sendSignupCodeSchema, verifySignupCodeSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Signup email verification routes
router.post('/signup/send-code', validateRequest(sendSignupCodeSchema), AuthController.sendSignupCode);
router.post('/signup/verify-code', validateRequest(verifySignupCodeSchema), AuthController.verifySignupCode);

//api route to register (requires verified email code)
router.post('/register', validateRequest(registerSchema), AuthController.register);

//api route to login
router.post('/login', validateRequest(loginSchema), AuthController.login);

//api route to get current user profile
router.get('/me', authenticate, AuthController.getMe);

//api route for user updating email
router.patch('/email', authenticate, AuthController.updateEmail);

//api route for user updating password
router.patch('/password', authenticate, AuthController.updatePassword);

//api route for deleting account
router.delete('/account', authenticate, AuthController.deleteAccount);

// Password reset routes
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-code', AuthController.verifyResetCode);
router.post('/reset-password', AuthController.resetPassword);

export default router;