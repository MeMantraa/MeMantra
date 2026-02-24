import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import bcrypt from 'bcryptjs';
import { FEATURE_FLAGS, isValidFeatureFlag } from '../utils/featureFlags';
import { User } from '../types/database.types';

function sanitizeUser(user: User) {
  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    auth_provider: user.auth_provider,
    created_at: user.created_at,
  };
}

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ status: 'error', message });
}

function sendFeatureFlagResponse(res: Response, user: User, message: string) {
  return res.status(200).json({
    status: 'success',
    message,
    data: { user_id: user.user_id, feature_flags: user.feature_flags ?? [] },
  });
}

function toUserFlagSummary(user: User) {
  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    created_at: user.created_at,
    feature_flags: user.feature_flags ?? [],
  };
}

async function validateUniqueUserFields(
  userId: number,
  existingUser: User,
  username?: string,
  email?: string,
) {
  if (email && email !== existingUser.email) {
    const emailTaken = await UserModel.findByEmail(email);
    if (emailTaken && emailTaken.user_id !== userId) {
      return 'Email already in use';
    }
  }

  if (username && username !== existingUser.username) {
    const usernameTaken = await UserModel.findByUsername(username);
    if (usernameTaken && usernameTaken.user_id !== userId) {
      return 'Username already taken';
    }
  }

  return null;
}

export const UserController = {
  // GET /api/users - Get all users (admin only)
  async getAllUsers(_req: Request, res: Response) {
    try {
      const users = await UserModel.findAll();
      const sanitizedUsers = users.map(sanitizeUser);

      return res.status(200).json({
        status: 'success',
        data: { users: sanitizedUsers },
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return sendError(res, 500, 'Error retrieving users');
    }
  },

  // GET /api/users/:id - Get single user (admin only)
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(Number(id));

      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      const sanitizedUser = sanitizeUser(user);

      return res.status(200).json({
        status: 'success',
        data: { user: sanitizedUser },
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      return sendError(res, 500, 'Error retrieving user');
    }
  },

  // POST /api/users - Create user (admin only)
  async createUser(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        return sendError(res, 400, 'Email already in use');
      }

      const existingUserByUsername = await UserModel.findByUsername(username);
      if (existingUserByUsername) {
        return sendError(res, 400, 'Username already taken');
      }

      // Create user
      const newUser = await UserModel.create({
        username,
        email,
        password,
      });

      return res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
          user: sanitizeUser(newUser),
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      return sendError(res, 500, 'Error creating user');
    }
  },

  // PUT /api/users/:id - Update user (admin only)
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = Number(id);
      const { username, email, password } = req.body;

      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        return sendError(res, 404, 'User not found');
      }

      const uniquenessError = await validateUniqueUserFields(userId, existingUser, username, email);
      if (uniquenessError) {
        return sendError(res, 400, uniquenessError);
      }

      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(password, salt);
      }

      const updatedUser = await UserModel.update(userId, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: {
          user: updatedUser ? sanitizeUser(updatedUser) : null,
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      return sendError(res, 500, 'Error updating user');
    }
  },

  // DELETE /api/users/:id - Delete user (admin only)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingUser = await UserModel.findById(Number(id));
      if (!existingUser) {
        return sendError(res, 404, 'User not found');
      }

      if (req.user?.userId === Number(id)) {
        return sendError(res, 400, 'Cannot delete your own account');
      }

      await UserModel.delete(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return sendError(res, 500, 'Error deleting user');
    }
  },

  // GET /api/users/feature-flags
  async listFeatureFlags(_req: Request, res: Response) {
    try {
      const flags = FEATURE_FLAGS.map((key) => ({
        key,
        label: key.replaceAll('_', ' '),
      }));

      return res.status(200).json({
        status: 'success',
        data: { flags },
      });
    } catch (error) {
      console.error('List feature flags error:', error);
      return sendError(res, 500, 'Error retrieving feature flags');
    }
  },

  //GET /api/users/:id/feature-flags - Get user feature flags (admin only)
  async getUserFeatureFlags(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) {
        return sendError(res, 400, 'Invalid user id');
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      return res.status(200).json({
        status: 'success',
        data: { user_id: user.user_id, feature_flags: user.feature_flags ?? [] },
      });
    } catch (error) {
      console.error('Get user feature flags error:', error);
      return sendError(res, 500, 'Error retrieving feature flags');
    }
  },

   // GET /api/users/feature-flags/users
  async getUsersWithFlags(_req: Request, res: Response) {
    try {
      const users = await UserModel.findAll();

      return res.status(200).json({
        status: 'success',
        data: {
          users: users.map(toUserFlagSummary),
        },
      });
    } catch (error) {
      console.error('Get users with flags error:', error);
      return sendError(res, 500, 'Error retrieving users with feature flags');
    }
  },

  // POST /api/users/feature-flags/:flag/users/:id - replace all (admin only)
  async setUserFeatureFlags(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const flag = req.params.flag;
      const enabled = Boolean(req.body?.enabled);

      if (!Number.isFinite(userId)) {
        return sendError(res, 400, 'Invalid user id');
      }
      if (!isValidFeatureFlag(flag)) {
        return sendError(res, 400, `Invalid feature flag: ${flag}`);
      }

      if (enabled) {
        const updated = await UserModel.addFlag(userId, flag);
        if (!updated) {
          const existing = await UserModel.findById(userId);
          if (!existing) {
            return sendError(res, 404, 'User not found');
          }
          return sendFeatureFlagResponse(res, existing, `Feature flag already enabled: ${flag}`);
        }
        return sendFeatureFlagResponse(res, updated, `Feature flag enabled: ${flag}`);
      }

      const updated = await UserModel.removeFlag(userId, flag);
      if (!updated) {
        return sendError(res, 404, 'User not found');
      }
      return sendFeatureFlagResponse(res, updated, `Feature flag disabled: ${flag}`);
    } catch (error) {
      console.error('Set user feature flag error:', error);
      return sendError(res, 500, 'Error updating user feature flag');
    }
  },

// POST /api/users/feature-flags/:flag/all
  async setFeatureFlagForAllUsers(req: Request, res: Response) {
    try {
      const flag = req.params.flag;
      const enabled = Boolean(req.body?.enabled);

      if (!isValidFeatureFlag(flag)) {
        return sendError(res, 400, `Invalid feature flag: ${flag}`);
      }

      const affectedUsers = enabled
        ? await UserModel.enableFlagForAllUsers(flag)
        : await UserModel.disableFlagForAllUsers(flag);

      return res.status(200).json({
        status: 'success',
        message: enabled
          ? `Feature flag enabled for all users: ${flag}`
          : `Feature flag disabled for all users: ${flag}`,
        data: { flag, enabled, affected_users: affectedUsers },
      });
    } catch (error) {
      console.error('Set feature flag for all users error:', error);
      return sendError(res, 500, 'Error updating feature flag for all users');
    }
  },

  // POST /api/users/feature-flags/:flag/rollout
  async rolloutFeatureFlagToPercentage(req: Request, res: Response) {
    try {
      const flag = req.params.flag;
      const percentage = Number(req.body?.percentage);

      if (!isValidFeatureFlag(flag)) {
        return sendError(res, 400, `Invalid feature flag: ${flag}`);
      }
      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        return sendError(res, 400, 'percentage must be a number between 0 and 100');
      }

      const result = await UserModel.rolloutFlagToPercentage(flag, percentage);

      return res.status(200).json({
        status: 'success',
        message: `Feature flag rollout applied: ${flag} -> ${percentage}%`,
        data: {
          flag,
          percentage,
          total_users: result.totalUsers,
          selected_users: result.selectedUsers,
        },
      });
    } catch (error) {
      console.error('Feature flag rollout error:', error);
      return sendError(res, 500, 'Error applying feature flag rollout');
    }
  },

};
