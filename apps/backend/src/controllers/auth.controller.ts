import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt.utils';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


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

      if (rawIdToken == null) {
        return res.status(400).json({ status: 'error', message: 'Google ID token is required' });
      }
      if (typeof rawIdToken !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Google ID token must be a string' });
      }

      const idToken = rawIdToken.trim();
      if (idToken.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Google ID token is required' });
      }

      let ticket;
      try {
        ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
      } catch (verifyError) {
        console.error('Google verify error:', verifyError);
        return res.status(400).json({ status: 'error', message: 'Invalid Google token' });
      }

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.status(400).json({ status: 'error', message: 'Invalid Google token' });
      }

      const { email, name, sub: googleId } = payload;

      let user = await UserModel.findByEmail(email);

      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        const username = name ? name.replace(/\s+/g, '').toLowerCase() : email.split('@')[0];

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
  }
};