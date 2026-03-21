import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { PasswordResetTokenModel } from '../models/password-reset-token.model';
import { EmailVerificationTokenModel } from '../models/email-verification-token.model';
import { generateToken } from '../utils/jwt.utils';
import { LoginInput } from '../validators/auth.validator';
import { emailService } from '../services/email.service';

// Standard JSON error response
function errorResponse(
  res: Response,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  return res.status(status).json({ status: 'error', message, ...extra });
}

// Standard JSON success response
function successResponse(
  res: Response,
  message: string,
  data?: Record<string, unknown>,
  status = 200,
) {
  return res.status(status).json({ status: 'success', message, ...(data ? { data } : {}) });
}

// Validate that a trimmed 6-digit code string is well-formed
function isValid6DigitCode(code: string): boolean {
  return code.length === 6 && /^\d{6}$/.test(code);
}

// Check rate-limit: returns waitTime (seconds) if too soon, else null
async function checkRateLimit(
  getLastTokenTime: (key: string | number) => Promise<Date | null>,
  key: string | number,
  cooldownSeconds = 60,
): Promise<number | null> {
  const lastTokenTime = await getLastTokenTime(key);
  if (lastTokenTime) {
    const elapsed = (Date.now() - lastTokenTime.getTime()) / 1000;
    if (elapsed < cooldownSeconds) {
      return Math.ceil(cooldownSeconds - elapsed);
    }
  }
  return null;
}

// Generate a verification code, persist it, and email it
async function generateAndSendCode(
  res: Response,
  email: string,
  createToken: (email: string, code: string, minutes: number) => Promise<unknown>,
  sendEmail: (email: string, code: string) => Promise<boolean>,
) {
  const code = emailService.generate6DigitCode();
  await createToken(email, code, 10);

  const emailSent = await sendEmail(email, code);
  if (!emailSent) {
    return {
      sent: false,
      res: errorResponse(res, 500, 'Failed to send verification email. Please try again later.'),
    };
  }
  return { sent: true };
}

// Verify reset code and return user
async function verifyResetCodeAndGetUser(email: string, code: string) {
  const user = await UserModel.findByEmail(email.toLowerCase().trim());
  if (!user) return null;

  const validToken = await PasswordResetTokenModel.findValidToken(user.user_id, code.trim());
  if (!validToken) return null;

  return user;
}

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password, code, device_token } = req.body;

      const trimmedEmail = email.toLowerCase().trim();
      const trimmedCode = code.trim();

      // Verify the email verification code before creating the account
      const validToken = await EmailVerificationTokenModel.findValidToken(
        trimmedEmail,
        trimmedCode,
      );
      if (!validToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired verification code. Please verify your email again.',
        });
      }

      //check if user exists by email
      const existingUserByEmail = await UserModel.findByEmail(trimmedEmail);
      if (existingUserByEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use',
        });
      }

      //check if username exists
      const existingUserByUsername = await UserModel.findByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already taken',
        });
      }

      //create new user
      const newUser = await UserModel.create({
        username,
        email: trimmedEmail,
        password,
        device_token,
      });

      // Clean up the verification token
      await EmailVerificationTokenModel.deleteByEmail(trimmedEmail);

      //generate JWT
      const token = generateToken({
        userId: newUser.user_id,
        email: newUser.email || '',
      });

      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            user_id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
            feature_flags: newUser.feature_flags,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error registering user',
      });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginInput;

      const user = await UserModel.findByEmail(email);

      if (!user?.password_hash) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
      }

      const token = generateToken({
        userId: user.user_id,
        email: user.email || '',
      });

      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            feature_flags: user.feature_flags,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error during login',
      });
    }
  },

  async getMe(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated',
        });
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            feature_flags: user.feature_flags,
          },
        },
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving user profile',
      });
    }
  },

  async updatePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ status: 'error', message: 'Password required' });
      }

      const hashed = await bcrypt.hash(password, 10);
      await UserModel.update(userId!, { password_hash: hashed });

      return res.json({
        status: 'success',
        message: 'Password updated',
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: 'Failed to update password' });
    }
  },

  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      await UserModel.delete(userId!);

      res.json({ status: 'success', message: 'Account deleted' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'Failed to delete account' });
    }
  },

  async updateEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { email } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated',
        });
      }

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email',
        });
      }

      // Check if email already exists
      const existing = await UserModel.findByEmail(email);
      if (existing && existing.user_id !== userId) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use',
        });
      }

      // Update email in database
      await UserModel.updateEmail(userId, email);

      return res.status(200).json({
        status: 'success',
        message: 'Email updated successfully',
        data: { email },
      });
    } catch (error) {
      console.error('Update email error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating email',
      });
    }
  },

  // Initiate password reset by sending 6-digit code to email
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return errorResponse(res, 400, 'Email is required');
      }

      // Find user by email
      const user = await UserModel.findByEmail(email.toLowerCase().trim());

      if (!user) {
        return successResponse(
          res,
          'If an account exists with this email, a verification code has been sent',
        );
      }

      // Rate-limit
      const waitTime = await checkRateLimit(
        (id) => PasswordResetTokenModel.getLastTokenTime(id as number),
        user.user_id,
      );
      if (waitTime) {
        return errorResponse(
          res,
          429,
          `Please wait ${waitTime} seconds before requesting another code`,
          { waitTime },
        );
      }

      // Generate, persist, and send code
      const result = await generateAndSendCode(
        res,
        user.email!,
        (_, code, mins) => PasswordResetTokenModel.create(user.user_id, code, mins),
        (addr, code) => emailService.send6DigitCode(addr, code),
      );
      if (!result.sent) return result.res;

      return successResponse(res, 'Verification code sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      return errorResponse(res, 500, 'Error processing password reset request');
    }
  },

  // Verify the 6-digit code
  async verifyResetCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
        return errorResponse(res, 400, 'Email and verification code are required');
      }

      const trimmedCode = code.trim();

      if (!isValid6DigitCode(trimmedCode)) {
        return errorResponse(res, 400, 'Invalid verification code format');
      }

      const user = await UserModel.findByEmail(email.toLowerCase().trim());
      if (!user) {
        return errorResponse(res, 400, 'Invalid or expired verification code');
      }

      const validToken = await PasswordResetTokenModel.findValidToken(user.user_id, trimmedCode);
      if (!validToken) {
        return errorResponse(res, 400, 'Invalid or expired verification code');
      }

      return successResponse(res, 'Code verified successfully', { email: user.email });
    } catch (error) {
      console.error('Verify code error:', error);
      return errorResponse(res, 500, 'Error verifying code');
    }
  },

  // Reset password with verified code
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, code, and new password are required',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 8 characters',
        });
      }

      const user = await verifyResetCodeAndGetUser(email, code);

      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired verification code',
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await UserModel.update(user.user_id, { password_hash: passwordHash });

      // Delete all reset tokens for this user
      await PasswordResetTokenModel.deleteByUserId(user.user_id);

      return res.status(200).json({
        status: 'success',
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error resetting password',
      });
    }
  },

  // Step 1 of signup: check email availability, generate & send verification code
  async sendSignupCode(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return errorResponse(res, 400, 'Email is required');
      }

      const trimmedEmail = email.toLowerCase().trim();

      // Check if email is already registered
      const existingUser = await UserModel.findByEmail(trimmedEmail);
      if (existingUser) {
        return errorResponse(res, 400, 'This email is already in use by another account');
      }

      // Rate-limit
      const waitTime = await checkRateLimit(
        (addr) => EmailVerificationTokenModel.getLastTokenTime(addr as string),
        trimmedEmail,
      );
      if (waitTime) {
        return errorResponse(
          res,
          429,
          `Please wait ${waitTime} seconds before requesting another code`,
          { waitTime },
        );
      }

      // Generate, persist, and send code
      const result = await generateAndSendCode(
        res,
        trimmedEmail,
        (addr, code, mins) => EmailVerificationTokenModel.create(addr, code, mins),
        (addr, code) => emailService.sendSignupVerificationCode(addr, code),
      );
      if (!result.sent) return result.res;

      return successResponse(res, 'Verification code sent to your email');
    } catch (error) {
      console.error('Send signup code error:', error);
      return errorResponse(res, 500, 'Error sending verification code');
    }
  },

  // Step 2 of signup: verify the 6-digit code (account not created yet)
  async verifySignupCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
        return errorResponse(res, 400, 'Email and verification code are required');
      }

      const trimmedCode = code.trim();

      if (!isValid6DigitCode(trimmedCode)) {
        return errorResponse(res, 400, 'Invalid verification code format');
      }

      const trimmedEmail = email.toLowerCase().trim();

      const validToken = await EmailVerificationTokenModel.findValidToken(
        trimmedEmail,
        trimmedCode,
      );
      if (!validToken) {
        return errorResponse(res, 400, 'Invalid or expired verification code');
      }

      return successResponse(res, 'Email verified successfully', { email: trimmedEmail });
    } catch (error) {
      console.error('Verify signup code error:', error);
      return errorResponse(res, 500, 'Error verifying code');
    }
  },
};
