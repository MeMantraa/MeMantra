import request from 'supertest';
import express from 'express';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

import { AuthController } from '../../src/controllers/auth.controller';
import { UserModel } from '../../src/models/user.model';
import * as jwtUtils from '../../src/utils/jwt.utils';
import bcrypt from 'bcryptjs';

jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/jwt.utils');
jest.mock('bcryptjs');

const app = express();
app.use(express.json());
app.post('/register', AuthController.register);
app.post('/login', AuthController.login);
app.get('/me', AuthController.getMe);
app.post('/google-auth', AuthController.googleAuth);

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

      const res = await request(app)
        .post('/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'pass1234' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            user_id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          token: 'jwt-token',
        },
      });
    });

    it('should not register if email already exists', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({ user_id: 2 });

      const res = await request(app)
        .post('/register')
        .send({ username: 'userx', email: 'taken@email.com', password: 'pass' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email already in use',
      });
    });

    it('should not register if username already exists', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserModel.findByUsername as jest.Mock).mockResolvedValue({ user_id: 3 });

      const res = await request(app)
        .post('/register')
        .send({ username: 'existinguser', email: 'new@email.com', password: 'pass' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Username already taken',
      });
    });

    it('should handle registration errors', async () => {
      (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/register')
        .send({ username: 'user', email: 'err@email.com', password: 'pass' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error registering user',
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpass',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

      const res = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'pass1234' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            user_id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          token: 'jwt-token',
        },
      });
    });

    it('should fail login with invalid credentials (no user)', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/login')
        .send({ email: 'nouser@email.com', password: 'pass' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid credentials',
      });
    });

    it('should fail login with invalid credentials (wrong password)', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 2,
        username: 'wrongpass',
        email: 'wrong@user.com',
        password_hash: 'hashedpass',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/login')
        .send({ email: 'wrong@user.com', password: 'badpass' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid credentials',
      });
    });

    it('should handle login errors', async () => {
      (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/login')
        .send({ email: 'err@user.com', password: 'pass' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error during login',
      });
    });
  });

  describe('getMe', () => {
    function setupAppWithUser(userId?: number, email?: string) {
      const app = express();
      app.use(express.json());
      app.get('/me', (req, _res, next) => {
        if (userId) req.user = { userId, email: email ?? "" };
        next();
      }, AuthController.getMe);
      return app;
    }

    it('should return user profile if authenticated', async () => {
      const user = { user_id: 1, username: 'me', email: 'me@email.com' };
      (UserModel.findById as jest.Mock).mockResolvedValue(user);

      const app = setupAppWithUser(1, 'me@email.com');
      const res = await request(app).get('/me');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { user },
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/me');
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Not authenticated',
      });
    });

    it('should return 404 if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'me@email.com');
      const res = await request(app).get('/me');
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'User not found',
      });
    });

    it('should handle errors', async () => {
      (UserModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@email.com');
      const res = await request(app).get('/me');
      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving user profile',
      });
    });
  });

  describe('googleAuth', () => {
    it('should return 400 if no idToken', async () => {
      const res = await request(app)
        .post('/google-auth')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Google ID token is required',
      });
    });

    it('should return 400 if token invalid', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      const res = await request(app)
        .post('/google-auth')
        .send({ idToken: 'badtoken' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid Google token',
      });
    });

    it('should create user if not exists and return token', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'newuser@google.com',
          name: 'New User',
          sub: 'googleid123',
        }),
      });
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpw');
      (UserModel.create as jest.Mock).mockResolvedValue({
        user_id: 5,
        username: 'newuser',
        email: 'newuser@google.com',
      });
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

      const res = await request(app)
        .post('/google-auth')
        .send({ idToken: 'validtoken' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Google authentication successful',
        data: {
          user: {
            user_id: 5,
            username: 'newuser',
            email: 'newuser@google.com',
          },
          token: 'jwt-token',
        },
      });
    });

    it('should use existing user if already exists', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'existing@google.com',
          name: 'Existing',
          sub: 'googleid456',
        }),
      });
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 6,
        username: 'existing',
        email: 'existing@google.com',
      });
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

      const res = await request(app)
        .post('/google-auth')
        .send({ idToken: 'validtoken' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Google authentication successful',
        data: {
          user: {
            user_id: 6,
            username: 'existing',
            email: 'existing@google.com',
          },
          token: 'jwt-token',
        },
      });
    });

    it('should handle errors during Google auth', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Google error'));

      const res = await request(app)
        .post('/google-auth')
        .send({ idToken: 'errortoken' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid Google token',
      });
    });
  });

  it('should handle unexpected errors during Google auth and return 500', async () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => ({ email: 'test@google.com', name: 'Test User', sub: 'googleid123' }),
  });

  (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('DB failure'));

  const res = await request(app)
    .post('/google-auth')
    .send({ idToken: 'validtoken' });

  expect(res.status).toBe(500);
  expect(res.body).toMatchObject({
    status: 'error',
    message: 'Error during Google authentication',
  });
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    'Google auth error:',
    expect.any(Error)
  );

  consoleErrorSpy.mockRestore();
});

it('should generate token with empty email if newUser.email is missing', async () => {
  (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
  (UserModel.findByUsername as jest.Mock).mockResolvedValue(null);
  (UserModel.create as jest.Mock).mockResolvedValue({
    user_id: 10,
    username: 'userNoEmail',
    email: undefined,
  });
  (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

  const res = await request(app)
    .post('/register')
    .send({ username: 'userNoEmail', email: '', password: 'pass1234' });

  expect(res.status).toBe(201);
  expect(res.body.data.token).toBe('jwt-token');

  expect(jwtUtils.generateToken).toHaveBeenCalledWith({
    userId: 10,
    email: '', 
  });
});

it('should generate username from email if name is missing', async () => {
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => ({
      email: 'testemail@domain.com',
      name: undefined,
      sub: 'googleid789',
    }),
  });
  (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
  (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpw');
  (UserModel.create as jest.Mock).mockImplementation((userData) => Promise.resolve(userData));
  (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

  const res = await request(app)
    .post('/google-auth')
    .send({ idToken: 'validtoken' });

  expect(res.status).toBe(200);

  expect(res.body.data.user.username).toBe('testemail');
});

it('should generate token with empty email if existing user has no email', async () => {
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => ({
      email: 'someemail@domain.com',
      name: 'User Name',
      sub: 'googleid999',
    }),
  });
  (UserModel.findByEmail as jest.Mock).mockResolvedValue({
    user_id: 20,
    username: 'existingUser',
    email: undefined, 
  });
  (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

  
  const res = await request(app)
    .post('/google-auth')
    .send({ idToken: 'validtoken' });

  expect(res.status).toBe(200);
  expect(jwtUtils.generateToken).toHaveBeenCalledWith({
    userId: 20,
    email: '', 
  });
});

it('should generate token with empty email if user.email is missing on login', async () => {
  (UserModel.findByEmail as jest.Mock).mockResolvedValue({
    user_id: 42,
    username: 'userNoEmail',
    email: undefined,    
    password_hash: 'hashedpass',
  });

  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  (jwtUtils.generateToken as jest.Mock).mockReturnValue('jwt-token');

  const res = await request(app)
    .post('/login')
    .send({ email: 'user@example.com', password: 'correctpass' });

  expect(res.status).toBe(200);
  expect(res.body.status).toBe('success');
  expect(res.body.message).toBe('Login successful');
  expect(res.body.data.token).toBe('jwt-token');

  expect(res.body.data.user.user_id).toBe(42);
  expect(res.body.data.user.username).toBe('userNoEmail');

  expect(jwtUtils.generateToken).toHaveBeenCalledWith({
    userId: 42,
    email: '',
  });
});

});