import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt.utils';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const userData = req.body as RegisterInput;
      
      //check if user exists
      const existingUser = await UserModel.findByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use',
        });
      }
      
      //create new user
      const newUser = await UserModel.create(userData);
      
      //generate jwt token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
      });
      
      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
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
      
      // Find user by email
      const user = await UserModel.findByEmail(email);
      
      // Check if user exists
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
      }
      
      //check pass
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
        });
      }
      
      //update last login
      await UserModel.updateLastLogin(user.id);
      
      //generate jwt token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
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
            id: user.id,
            email: user.email,
            full_name: user.full_name,
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
};