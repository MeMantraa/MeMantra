import request from 'supertest';
import express from 'express';

import { UserController } from '../../src/controllers/user.controller';
import { UserModel } from '../../src/models/user.model';
import bcrypt from 'bcryptjs';

jest.mock('../../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('../../src/utils/featureFlags', () => ({
  FEATURE_FLAGS: ['EXPERIMENTAL_FEATURE', 'DARK_MODE', 'ADVANCED_ANALYTICS'],
  isValidFeatureFlag: jest.fn((flag: string) =>
    ['EXPERIMENTAL_FEATURE', 'DARK_MODE', 'ADVANCED_ANALYTICS'].includes(flag),
  ),
}));

// Setup express app with all routes
const app = express();
app.use(express.json());
app.get('/api/users', UserController.getAllUsers);
app.get('/api/users/feature-flags', UserController.listFeatureFlags);
app.get('/api/users/feature-flags/users', UserController.getUsersWithFlags);
app.post('/api/users/feature-flags/:flag/users/:id', UserController.setSingleUserFeatureFlag);
app.post('/api/users/feature-flags/:flag/all', UserController.setFeatureFlagForAllUsers);
app.post('/api/users/feature-flags/:flag/rollout', UserController.rolloutFeatureFlagToPercentage);
app.get('/api/users/:id', UserController.getUserById);
app.post('/api/users', UserController.createUser);
app.put('/api/users/:id', UserController.updateUser);
// For deleteUser, inject mock req.user
app.delete('/api/users/:id', (req, _res, next) => {
  req.user = req.headers['x-user'] ? JSON.parse(req.headers['x-user'] as string) : {};
  next();
}, UserController.deleteUser);
// Feature flag routes
app.get('/api/users/:id/feature-flags', UserController.getUserFeatureFlags);
app.put('/api/users/:id/feature-flags', UserController.setUserFeatureFlags);
app.post('/api/users/:id/feature-flags/:flag', UserController.enableUserFeatureFlag);
app.delete('/api/users/:id/feature-flags/:flag', UserController.disableUserFeatureFlag);

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users excluding sensitive data', async () => {
      (UserModel.findAll as jest.Mock).mockResolvedValue([
        {
          user_id: 1,
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'secret',
          auth_provider: 'local',
          created_at: 'now'
        },
        {
          user_id: 2,
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'secret2',
          auth_provider: 'local',
          created_at: 'now'
        },
      ]);
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body.data.users).toEqual([
        {
          user_id: 1,
          username: 'user1',
          email: 'user1@example.com',
          auth_provider: 'local',
          created_at: 'now'
        },
        {
          user_id: 2,
          username: 'user2',
          email: 'user2@example.com',
          auth_provider: 'local',
          created_at: 'now'
        },
      ]);
      expect(res.body.data.users.find((u: any) => u.password_hash)).toBeUndefined();
    });

    it('should handle errors', async () => {
      (UserModel.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Error retrieving users');
    });
  });

  describe('getUserById', () => {
    it('should return a single user with sanitized data', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 2,
        username: 'testuser',
        email: 'testuser@email.com',
        password_hash: 'hash',
        auth_provider: 'local',
        created_at: 'yesterday'
      });
      const res = await request(app).get('/api/users/2');
      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual({
        user_id: 2,
        username: 'testuser',
        email: 'testuser@email.com',
        auth_provider: 'local',
        created_at: 'yesterday'
      });
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should return 404 if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get('/api/users/222');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });

    it('should handle errors', async () => {
      (UserModel.findById as jest.Mock).mockRejectedValue(new Error('DB fail'));
      const res = await request(app).get('/api/users/666');
      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Error retrieving user');
    });
  });

  describe('createUser', () => {
    it('should create a user if email and username are unique', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue({
        user_id: 3,
        username: 'newuser',
        email: 'new@email.com',
        auth_provider: 'local',
      });

      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'newuser',
          email: 'new@email.com',
          password: 'pw'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data.user).toMatchObject({
        user_id: 3,
        username: 'newuser',
        email: 'new@email.com',
      });
    });

    it('should reject duplicate email', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({ user_id: 4 });

      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'anyone',
          email: 'dup@email.com',
          password: 'pw'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should reject duplicate username', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserModel.findByUsername as jest.Mock).mockResolvedValue({ user_id: 5 });

      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'takenuser',
          email: 'free@email.com',
          password: 'pw'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username already taken');
    });

    it('should handle errors', async () => {
      (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('DB error'));
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'erruser',
          email: 'err@email.com',
          password: 'pw'
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error creating user');
    });
  });

  describe('updateUser', () => {
    it('should update user if user exists and unique fields are preserved', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 7,
        username: 'oldname',
        email: 'old@email.com',
        password_hash: 'abc',
      });
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpw');
      (UserModel.update as jest.Mock).mockResolvedValue({
        user_id: 7,
        username: 'newname',
        email: 'new@email.com',
      });

      const res = await request(app)
        .put('/api/users/7')
        .send({ username: 'newname', email: 'new@email.com', password: 'newpw' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('User updated successfully');
      expect(res.body.data.user).toEqual({
        user_id: 7,
        username: 'newname',
        email: 'new@email.com',
      });
    });

    it('should return 404 if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/users/404')
        .send({ username: 'x', email: 'y' });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });

    it('should reject if email already used by another user', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 101,
        username: 'user',
        email: 'old@email.com',
      });
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({ user_id: 999 });

      const res = await request(app)
        .put('/api/users/101')
        .send({ email: 'taken@email.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should reject if username already used by another user', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 151,
        username: 'olduser',
        email: 'old@email.com',
      });
      (UserModel.findByUsername as jest.Mock).mockResolvedValue({ user_id: 1000 });

      const res = await request(app)
        .put('/api/users/151')
        .send({ username: 'takenuser' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username already taken');
    });

    it('should handle errors', async () => {
      (UserModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));
      const res = await request(app)
        .put('/api/users/1')
        .send({ username: 'err', email: 'fail@email.com' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error updating user');
    });
  });

  describe('deleteUser', () => {
    it('should delete user if not self', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 12,
      });
      (UserModel.delete as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/users/12')
        .set('x-user', JSON.stringify({ userId: 99 }))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('should return 404 if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/users/777')
        .set('x-user', JSON.stringify({ userId: 1 }))
        .send();

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should not delete yourself', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 2,
      });

      const res = await request(app)
        .delete('/api/users/2')
        .set('x-user', JSON.stringify({ userId: 2 }))
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot delete your own account');
    });

    it('should handle errors', async () => {
      (UserModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .delete('/api/users/55')
        .set('x-user', JSON.stringify({ userId: 1 }))
        .send();

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error deleting user');
    });
  });

  describe('getUserFeatureFlags', () => {
    it('should return user feature flags', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'user1',
        feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
      });

      const res = await request(app).get('/api/users/1/feature-flags');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user_id).toBe(1);
      expect(res.body.data.feature_flags).toEqual(['DARK_MODE', 'EXPERIMENTAL_FEATURE']);
    });

    it('should return empty array when user has no feature flags', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 2,
        username: 'user2',
        feature_flags: null,
      });

      const res = await request(app).get('/api/users/2/feature-flags');

      expect(res.status).toBe(200);
      expect(res.body.data.feature_flags).toEqual([]);
    });

    it('should return 400 for invalid user id', async () => {
      const res = await request(app).get('/api/users/invalid/feature-flags');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user id');
    });

    it('should return 404 if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/users/999/feature-flags');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle errors', async () => {
      (UserModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/users/1/feature-flags');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error retrieving feature flags');
    });
  });

  describe('setUserFeatureFlags', () => {
    it('should replace all feature flags', async () => {
      (UserModel.setFlags as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'user1',
        feature_flags: ['DARK_MODE'],
      });

      const res = await request(app)
        .put('/api/users/1/feature-flags')
        .send({ flags: ['DARK_MODE'] });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Feature flags updated successfully');
      expect(res.body.data.feature_flags).toEqual(['DARK_MODE']);
    });

    it('should remove duplicates from flags array', async () => {
      (UserModel.setFlags as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'user1',
        feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
      });

      const res = await request(app)
        .put('/api/users/1/feature-flags')
        .send({ flags: ['DARK_MODE', 'DARK_MODE', 'EXPERIMENTAL_FEATURE'] });

      expect(res.status).toBe(200);
      expect(UserModel.setFlags).toHaveBeenCalledWith(1, ['DARK_MODE', 'EXPERIMENTAL_FEATURE']);
    });

    it('should return 400 for invalid user id', async () => {
      const res = await request(app)
        .put('/api/users/abc/feature-flags')
        .send({ flags: ['DARK_MODE'] });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user id');
    });

    it('should return 400 if flags is not an array', async () => {
      const res = await request(app)
        .put('/api/users/1/feature-flags')
        .send({ flags: 'not-an-array' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('flags must be an array');
    });

    it('should return 400 for invalid feature flag', async () => {
      const res = await request(app)
        .put('/api/users/1/feature-flags')
        .send({ flags: ['DARK_MODE', 'INVALID_FLAG'] });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid feature flag: INVALID_FLAG');
    });

    it('should return 404 if user not found', async () => {
      (UserModel.setFlags as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .put('/api/users/999/feature-flags')
        .send({ flags: ['DARK_MODE'] });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle errors', async () => {
      (UserModel.setFlags as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .put('/api/users/1/feature-flags')
        .send({ flags: ['DARK_MODE'] });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error updating user feature flags');
    });
  });

  describe('enableUserFeatureFlag', () => {
    it('should enable a feature flag', async () => {
      (UserModel.addFlag as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'user1',
        feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
      });

      const res = await request(app).post('/api/users/1/feature-flags/EXPERIMENTAL_FEATURE');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Feature flag enabled: EXPERIMENTAL_FEATURE');
      expect(res.body.data.feature_flags).toContain('EXPERIMENTAL_FEATURE');
    });

    it('should return message if flag already enabled', async () => {
      (UserModel.addFlag as jest.Mock).mockResolvedValue(undefined);
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'user1',
        feature_flags: ['DARK_MODE'],
      });

      const res = await request(app).post('/api/users/1/feature-flags/DARK_MODE');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Feature flag already enabled: DARK_MODE');
    });

    it('should return 400 for invalid user id', async () => {
      const res = await request(app).post('/api/users/invalid/feature-flags/DARK_MODE');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user id');
    });

    it('should return 400 for invalid feature flag', async () => {
      const res = await request(app).post('/api/users/1/feature-flags/INVALID_FLAG');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid feature flag: INVALID_FLAG');
    });

    it('should return 404 if user not found when checking already enabled', async () => {
      (UserModel.addFlag as jest.Mock).mockResolvedValue(undefined);
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/users/999/feature-flags/DARK_MODE');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle errors', async () => {
      (UserModel.addFlag as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/api/users/1/feature-flags/DARK_MODE');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error enabling user feature flag');
    });
  });

  describe('disableUserFeatureFlag', () => {
    it('should disable a feature flag', async () => {
      (UserModel.removeFlag as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'user1',
        feature_flags: ['DARK_MODE'],
      });

      const res = await request(app).delete('/api/users/1/feature-flags/EXPERIMENTAL_FEATURE');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Feature flag disabled: EXPERIMENTAL_FEATURE');
      expect(res.body.data.feature_flags).not.toContain('EXPERIMENTAL_FEATURE');
    });

    it('should return 400 for invalid user id', async () => {
      const res = await request(app).delete('/api/users/invalid/feature-flags/DARK_MODE');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user id');
    });

    it('should return 400 for invalid feature flag', async () => {
      const res = await request(app).delete('/api/users/1/feature-flags/INVALID_FLAG');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid feature flag: INVALID_FLAG');
    });

    it('should return 404 if user not found', async () => {
      (UserModel.removeFlag as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).delete('/api/users/999/feature-flags/DARK_MODE');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle errors', async () => {
      (UserModel.removeFlag as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/users/1/feature-flags/DARK_MODE');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error disabling user feature flag');
    });
  });

  describe('listFeatureFlags', () => {
    it('returns the available feature flags', async () => {
      const res = await request(app).get('/api/users/feature-flags');

      expect(res.status).toBe(200);
      expect(res.body.data.flags).toEqual([
        { key: 'EXPERIMENTAL_FEATURE', label: 'EXPERIMENTAL FEATURE' },
        { key: 'DARK_MODE', label: 'DARK MODE' },
        { key: 'ADVANCED_ANALYTICS', label: 'ADVANCED ANALYTICS' },
      ]);
    });
  });

  describe('getUsersWithFlags', () => {
    it('returns feature flag summaries for all users', async () => {
      (UserModel.findAll as jest.Mock).mockResolvedValue([
        {
          user_id: 1,
          username: 'alice',
          email: 'alice@example.com',
          created_at: 'today',
          feature_flags: ['DARK_MODE'],
        },
      ]);

      const res = await request(app).get('/api/users/feature-flags/users');

      expect(res.status).toBe(200);
      expect(res.body.data.users).toEqual([
        {
          user_id: 1,
          username: 'alice',
          email: 'alice@example.com',
          created_at: 'today',
          feature_flags: ['DARK_MODE'],
        },
      ]);
    });

    it('handles failures while loading flagged users', async () => {
      (UserModel.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/users/feature-flags/users');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error retrieving users with feature flags');
    });
  });

  describe('setFeatureFlagForAllUsers', () => {
    it('enables a flag for all users', async () => {
      (UserModel.enableFlagForAllUsers as jest.Mock).mockResolvedValue(8);

      const res = await request(app)
        .post('/api/users/feature-flags/DARK_MODE/all')
        .send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Feature flag enabled for all users: DARK_MODE');
      expect(res.body.data).toEqual({
        flag: 'DARK_MODE',
        enabled: true,
        affected_users: 8,
      });
    });

    it('disables a flag for all users', async () => {
      (UserModel.disableFlagForAllUsers as jest.Mock).mockResolvedValue(3);

      const res = await request(app)
        .post('/api/users/feature-flags/DARK_MODE/all')
        .send({ enabled: false });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Feature flag disabled for all users: DARK_MODE');
      expect(res.body.data.affected_users).toBe(3);
    });

    it('rejects invalid flags for bulk updates', async () => {
      const res = await request(app)
        .post('/api/users/feature-flags/INVALID_FLAG/all')
        .send({ enabled: true });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid feature flag: INVALID_FLAG');
    });

    it('handles failures while bulk updating', async () => {
      (UserModel.enableFlagForAllUsers as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/users/feature-flags/DARK_MODE/all')
        .send({ enabled: true });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error updating feature flag for all users');
    });
  });

  describe('setSingleUserFeatureFlag', () => {
    it('enables a single user flag through the combined route', async () => {
      (UserModel.addFlag as jest.Mock).mockResolvedValue({
        user_id: 1,
        feature_flags: ['EXPERIMENTAL_FEATURE'],
      });

      const res = await request(app)
        .post('/api/users/feature-flags/EXPERIMENTAL_FEATURE/users/1')
        .send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Feature flag enabled: EXPERIMENTAL_FEATURE');
      expect(UserModel.addFlag).toHaveBeenCalledWith(1, 'EXPERIMENTAL_FEATURE');
    });

    it('disables a single user flag through the combined route', async () => {
      (UserModel.removeFlag as jest.Mock).mockResolvedValue({
        user_id: 1,
        feature_flags: [],
      });

      const res = await request(app)
        .post('/api/users/feature-flags/EXPERIMENTAL_FEATURE/users/1')
        .send({ enabled: false });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Feature flag disabled: EXPERIMENTAL_FEATURE');
      expect(UserModel.removeFlag).toHaveBeenCalledWith(1, 'EXPERIMENTAL_FEATURE');
    });

    it('returns 404 when enabling a flag for a missing user', async () => {
      (UserModel.addFlag as jest.Mock).mockResolvedValue(undefined);
      (UserModel.findById as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/users/feature-flags/EXPERIMENTAL_FEATURE/users/999')
        .send({ enabled: true });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('rolloutFeatureFlagToPercentage', () => {
    it('applies a rollout percentage', async () => {
      (UserModel.rolloutFlagToPercentage as jest.Mock).mockResolvedValue({
        totalUsers: 10,
        selectedUsers: 4,
      });

      const res = await request(app)
        .post('/api/users/feature-flags/DARK_MODE/rollout')
        .send({ percentage: 40 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Feature flag rollout applied: DARK_MODE -> 40%');
      expect(res.body.data).toEqual({
        flag: 'DARK_MODE',
        percentage: 40,
        total_users: 10,
        selected_users: 4,
      });
    });

    it('rejects invalid rollout percentages', async () => {
      const res = await request(app)
        .post('/api/users/feature-flags/DARK_MODE/rollout')
        .send({ percentage: 140 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('percentage must be a number between 0 and 100');
    });

    it('rejects invalid flags for rollouts', async () => {
      const res = await request(app)
        .post('/api/users/feature-flags/INVALID_FLAG/rollout')
        .send({ percentage: 40 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid feature flag: INVALID_FLAG');
    });

    it('handles rollout failures', async () => {
      (UserModel.rolloutFlagToPercentage as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/users/feature-flags/DARK_MODE/rollout')
        .send({ percentage: 40 });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error applying feature flag rollout');
    });
  });
});
