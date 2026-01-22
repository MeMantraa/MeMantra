import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import bcrypt from 'bcryptjs';

export const UserController = {
  // GET /api/users - Get all users (admin only)
  async getAllUsers(_req: Request, res: Response) {
    try {
      const users = await UserModel.findAll();
      
      // Remove sensitive data
      const sanitizedUsers = users.map(user => ({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
      }));

      return res.status(200).json({
        status: 'success',
        data: { users: sanitizedUsers },
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving users',
      });
    }
  },

  // GET /api/users/:id - Get single user (admin only)
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(Number(id));

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      // Remove sensitive data
      const sanitizedUser = {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
      };

      return res.status(200).json({
        status: 'success',
        data: { user: sanitizedUser },
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving user',
      });
    }
  },

  // POST /api/users - Create user (admin only)
  async createUser(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use',
        });
      }

      const existingUserByUsername = await UserModel.findByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already taken',
        });
      }

      // Create user
      const newUser = await UserModel.create({
        username,
        email,
        password,
        auth_provider: 'local',
      });

      return res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
          user: {
            user_id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
          },
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating user',
      });
    }
  },

  // PUT /api/users/:id - Update user (admin only)
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { username, email, password } = req.body;

      const existingUser = await UserModel.findById(Number(id));
      if (!existingUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      // Check if email is taken by another user
      if (email && email !== existingUser.email) {
        const emailTaken = await UserModel.findByEmail(email);
        if (emailTaken && emailTaken.user_id !== Number(id)) {
          return res.status(400).json({
            status: 'error',
            message: 'Email already in use',
          });
        }
      }

      // Check if username is taken by another user
      if (username && username !== existingUser.username) {
        const usernameTaken = await UserModel.findByUsername(username);
        if (usernameTaken && usernameTaken.user_id !== Number(id)) {
          return res.status(400).json({
            status: 'error',
            message: 'Username already taken',
          });
        }
      }

      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(password, salt);
      }

      const updatedUser = await UserModel.update(Number(id), updateData);

      return res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: {
          user: {
            user_id: updatedUser?.user_id,
            username: updatedUser?.username,
            email: updatedUser?.email,
          },
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating user',
      });
    }
  },

  // DELETE /api/users/:id - Delete user (admin only)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingUser = await UserModel.findById(Number(id));
      if (!existingUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      // Prevent deleting yourself
      if (req.user?.userId === Number(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete your own account',
        });
      }

      await UserModel.delete(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting user',
      });
    }
  },
};