import request from 'supertest';
import express from 'express';

import { UserController } from '../../src/controllers/user.controller';
import { UserModel } from '../../src/models/user.model';
import bcrypt from 'bcryptjs';

jest.mock('../../src/models/user.model');
jest.mock('bcryptjs');

// Setup express app with all routes
const app = express();
app.use(express.json());
app.get('/api/users', UserController.getAllUsers);
app.get('/api/users/:id', UserController.getUserById);
app.post('/api/users', UserController.createUser);
app.put('/api/users/:id', UserController.updateUser);
// For deleteUser, inject mock req.user
app.delete('/api/users/:id', (req, _res, next) => {
  req.user = req.headers['x-user'] ? JSON.parse(req.headers['x-user'] as string) : {};
  next();
}, UserController.deleteUser);

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
          auth_provider: 'google',
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
          auth_provider: 'google',
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
      expect(res.body.data.user).toEqual({
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
});