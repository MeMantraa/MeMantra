import { Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { PasswordResetTokenModel } from '../models/password-reset-token.model';
import { generateToken } from '../utils/jwt.utils';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { OAuth2Client } from 'google-auth-library';
import { emailService } from '../services/email.service';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to verify reset code and return user
async function verifyResetCodeAndGetUser(email: string, code: string) {
  // Find user
  const user = await UserModel.findByEmail(email.toLowerCase().trim());
  if (!user) {
    return null;
  }

  // Verify code
  const validToken = await PasswordResetTokenModel.findValidToken(user.user_id, code.trim());
  if (!validToken) {
    return null;
  }

  return user;
}

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const userData = req.body as RegisterInput;
      
      //check if user exists by email
      const existingUserByEmail = await UserModel.findByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use',
        });
      }
      
      //check if username exists
      const existingUserByUsername = await UserModel.findByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already taken',
        });
      }
      
      //create new user
      const newUser = await UserModel.create(userData);
      
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
      
      //find by email
      const user = await UserModel.findByEmail(email);
      
      //check if user exists
      if (!user?.password_hash) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
      }
      
      //check pass
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
      }
      
      //generate JWT
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

  async googleAuth(req: Request, res: Response) {
    try {
      const rawIdToken = req.body?.idToken;
      if (typeof rawIdToken !== 'string' || rawIdToken.trim() === '') {
        return res.status(400).json({ status: 'error', message: 'Google ID token is required' });
      }
      const idToken = rawIdToken.trim();

      // Delegate actual validity check to Google's verifyIdToken.
      let ticket;
      try {
        ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
      } catch (verifyError) {
        console.error('Google verify error:', verifyError);
        // Verification errors should be reported as a 400 (invalid token)
        return res.status(400).json({ status: 'error', message: 'Invalid Google token' });
      }

      const payload = ticket.getPayload();

      if (!payload?.email) {
        return res.status(400).json({ status: 'error', message: 'Invalid Google token' });
      }

      const { email, name, sub: googleId } = payload;

      let user = await UserModel.findByEmail(email);

      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        const username = name ? name.replaceAll(' ', '').toLowerCase() : email.split('@')[0];
        user = await UserModel.create({
          email: email.toLowerCase(),
          username,
          password: passwordHash,
          google_id: googleId,
          auth_provider: 'google',
        });
      }

      const token = generateToken({ userId: user.user_id, email: user.email || '' });

      return res.status(200).json({
        status: 'success',
        message: 'Google authentication successful',
        data: { user: { user_id: user.user_id, username: user.username, email: user.email }, token },
      });
    } catch (error) {
      console.error('Google auth error:', error);
      return res.status(500).json({ status: 'error', message: 'Error during Google authentication' });
    }
  },

async updatePassword(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ status: "error", message: "Password required" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await UserModel.update(userId!, { password_hash: hashed });

    return res.json({
      status: "success",
      message: "Password updated",
    });

  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", message: "Failed to update password" });
  }
},


async deleteAccount(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    await UserModel.delete(userId!);

    res.json({ status: "success", message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to delete account" });
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
        return res.status(400).json({
          status: 'error',
          message: 'Email is required',
        });
      }

      // Find user by email
      const user = await UserModel.findByEmail(email.toLowerCase().trim());

      // For security, will always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        return res.status(200).json({
          status: 'success',
          message: 'If an account exists with this email, a verification code has been sent',
        });
      }

      // only allow resend after 60 seconds
      const lastTokenTime = await PasswordResetTokenModel.getLastTokenTime(user.user_id);
      if (lastTokenTime) {
        const secondsSinceLastToken = (Date.now() - lastTokenTime.getTime()) / 1000;
        if (secondsSinceLastToken < 60) {
          const waitTime = Math.ceil(60 - secondsSinceLastToken);
          return res.status(429).json({
            status: 'error',
            message: `Please wait ${waitTime} seconds before requesting another code`,
            waitTime,
          });
        }
      }

      // Generate 6-digit code
      const code = emailService.generate6DigitCode();

      // Save token to database (expires in 10 minutes)
      await PasswordResetTokenModel.create(user.user_id, code, 10);

      // Send email with code
      const emailSent = await emailService.send6DigitCode(user.email!, code);

      if (!emailSent) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to send verification email. Please try again later',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Verification code sent to your email',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error processing password reset request',
      });
    }
  },

  // Verify the 6-digit code
   
  async verifyResetCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Email and verification code are required',
        });
      }

      const trimmedCode = code.trim();
      
      // Validate code format BEFORE any database queries
      if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid verification code format',
        });
      }

      // Find user (only after validating code format)
      const user = await UserModel.findByEmail(email.toLowerCase().trim());
      
      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired verification code',
        });
      }
      
      // Verify code
      const validToken = await PasswordResetTokenModel.findValidToken(user.user_id, trimmedCode);
      
      if (!validToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired verification code',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Code verified successfully',
        data: {
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Verify code error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error verifying code',
      });
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


};