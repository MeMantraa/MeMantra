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
jest.mock('../../src/models/password-reset-token.model', () => ({
  PasswordResetTokenModel: {
    getLastTokenTime: jest.fn(),
    create: jest.fn(),
    findValidToken: jest.fn(),
    deleteByUserId: jest.fn(),
    deleteExpired: jest.fn(),
  },
}));
jest.mock('../../src/services/email.service', () => ({
  emailService: {
    generate6DigitCode: jest.fn(),
    send6DigitCode: jest.fn(),
  },
}));

const app = express();
app.use(express.json());

// Middleware to mock authenticated user
const mockAuthMiddleware = (req: any, _res: any, next: any) => {
  req.user = { userId: 1 };
  next();
};

app.post('/register', AuthController.register);
app.post('/login', AuthController.login);
app.get('/me', AuthController.getMe);
app.post('/google-auth', AuthController.googleAuth);
app.put('/update-password', mockAuthMiddleware, AuthController.updatePassword);
app.delete('/delete-account', mockAuthMiddleware, AuthController.deleteAccount);
app.put('/update-email', mockAuthMiddleware, AuthController.updateEmail);

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

describe('updatePassword', () => {
  it('should update password successfully', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('newhashed');
    (UserModel.update as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .put('/update-password')
      .send({ password: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
      message: 'Password updated',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    expect(UserModel.update).toHaveBeenCalledWith(1, { password_hash: 'newhashed' });
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .put('/update-password')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Password required',
    });
  });

  it('should handle errors during password update', async () => {
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

    const res = await request(app)
      .put('/update-password')
      .send({ password: 'newpassword123' });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Failed to update password',
    });
  });
});

describe('deleteAccount', () => {
  it('should delete account successfully', async () => {
    (UserModel.delete as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app).delete('/delete-account');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
      message: 'Account deleted',
    });
    expect(UserModel.delete).toHaveBeenCalledWith(1);
  });

  it('should handle errors during account deletion', async () => {
    (UserModel.delete as jest.Mock).mockRejectedValue(new Error('Delete error'));

    const res = await request(app).delete('/delete-account');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Failed to delete account',
    });
  });
});

describe('updateEmail', () => {
  it('should update email successfully', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
    (UserModel.updateEmail as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .put('/update-email')
      .send({ email: 'newemail@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
      message: 'Email updated successfully',
      data: { email: 'newemail@example.com' },
    });
    expect(UserModel.updateEmail).toHaveBeenCalledWith(1, 'newemail@example.com');
  });

  it('should return 401 if user is not authenticated', async () => {
    const appNoAuth = express();
    appNoAuth.use(express.json());
    appNoAuth.put('/update-email', (req: any, _res: any, next: any) => {
      req.user = undefined;
      next();
    }, AuthController.updateEmail);

    const res = await request(appNoAuth)
      .put('/update-email')
      .send({ email: 'newemail@example.com' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Not authenticated',
    });
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .put('/update-email')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Invalid email',
    });
  });

  it('should return 400 if email is not a string', async () => {
    const res = await request(app)
      .put('/update-email')
      .send({ email: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Invalid email',
    });
  });

  it('should return 400 if email already in use by another user', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue({
      user_id: 2,
      email: 'existing@example.com',
    });

    const res = await request(app)
      .put('/update-email')
      .send({ email: 'existing@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Email already in use',
    });
  });

  it('should allow updating to the same email (current user)', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue({
      user_id: 1,
      email: 'myemail@example.com',
    });
    (UserModel.updateEmail as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .put('/update-email')
      .send({ email: 'myemail@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
      message: 'Email updated successfully',
    });
  });

  it('should handle errors during email update', async () => {
    (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .put('/update-email')
      .send({ email: 'newemail@example.com' });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'Error updating email',
    });
  });
});

describe('Password Reset Flow', () => {
  const { PasswordResetTokenModel } = require('../../src/models/password-reset-token.model');
  const { emailService } = require('../../src/services/email.service');

  // Add routes for password reset endpoints
  app.post('/forgot-password', AuthController.forgotPassword);
  app.post('/verify-reset-code', AuthController.verifyResetCode);
  app.post('/reset-password', AuthController.resetPassword);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should return error if email is missing', async () => {
      const res = await request(app)
        .post('/forgot-password')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email is required',
      });
    });

    it('should return error if email is not a string', async () => {
      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 123 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email is required',
      });
    });

    it('should return success even if user does not exist (security)', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'If an account exists with this email, a verification code has been sent',
      });
      expect(emailService.send6DigitCode).not.toHaveBeenCalled();
    });

    it('should enforce rate limiting (60 seconds)', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });

      const lastTokenTime = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      (PasswordResetTokenModel.getLastTokenTime as jest.Mock).mockResolvedValue(lastTokenTime);

      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Please wait');
      expect(res.body.waitTime).toBe(30);
    });

    it('should send verification code successfully', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.getLastTokenTime as jest.Mock).mockResolvedValue(null);
      (emailService.generate6DigitCode as jest.Mock).mockReturnValue('123456');
      (PasswordResetTokenModel.create as jest.Mock).mockResolvedValue(undefined);
      (emailService.send6DigitCode as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Verification code sent to your email',
      });
      expect(PasswordResetTokenModel.create).toHaveBeenCalledWith(1, '123456', 10);
      expect(emailService.send6DigitCode).toHaveBeenCalledWith('user@example.com', '123456');
    });

    it('should allow resend after 60 seconds', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });

      const lastTokenTime = new Date(Date.now() - 61 * 1000); // 61 seconds ago
      (PasswordResetTokenModel.getLastTokenTime as jest.Mock).mockResolvedValue(lastTokenTime);
      (emailService.generate6DigitCode as jest.Mock).mockReturnValue('654321');
      (PasswordResetTokenModel.create as jest.Mock).mockResolvedValue(undefined);
      (emailService.send6DigitCode as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Verification code sent to your email',
      });
    });

    it('should return error if email sending fails', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.getLastTokenTime as jest.Mock).mockResolvedValue(null);
      (emailService.generate6DigitCode as jest.Mock).mockReturnValue('123456');
      (PasswordResetTokenModel.create as jest.Mock).mockResolvedValue(undefined);
      (emailService.send6DigitCode as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Failed to send verification email. Please try again later',
      });
    });

    it('should handle errors gracefully', async () => {
      (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/forgot-password')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error processing password reset request',
      });
    });
  });

  describe('verifyResetCode', () => {
    it('should return error if email is missing', async () => {
      const res = await request(app)
        .post('/verify-reset-code')
        .send({ code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email and verification code are required',
      });
    });

    it('should return error if code is missing', async () => {
      const res = await request(app)
        .post('/verify-reset-code')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email and verification code are required',
      });
    });

    it('should return error if user does not exist', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/verify-reset-code')
        .send({ email: 'nonexistent@example.com', code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid or expired verification code',
      });
    });

    it('should return error if code is invalid', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.findValidToken as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/verify-reset-code')
        .send({ email: 'user@example.com', code: 'wrong' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid or expired verification code',
      });
    });

    it('should verify code successfully', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.findValidToken as jest.Mock).mockResolvedValue({
        token_id: 1,
        user_id: 1,
        code: '123456',
      });

      const res = await request(app)
        .post('/verify-reset-code')
        .send({ email: 'user@example.com', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Code verified successfully',
        data: {
          email: 'user@example.com',
        },
      });
    });

    it('should trim whitespace from email and code', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.findValidToken as jest.Mock).mockResolvedValue({
        token_id: 1,
        user_id: 1,
        code: '123456',
      });

      const res = await request(app)
        .post('/verify-reset-code')
        .send({ email: '  user@example.com  ', code: ' 123456 ' });

      expect(res.status).toBe(200);
      expect(UserModel.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(PasswordResetTokenModel.findValidToken).toHaveBeenCalledWith(1, '123456');
    });

    it('should handle errors gracefully', async () => {
      (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/verify-reset-code')
        .send({ email: 'user@example.com', code: '123456' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error verifying code',
      });
    });
  });

  describe('resetPassword', () => {
    it('should return error if email is missing', async () => {
      const res = await request(app)
        .post('/reset-password')
        .send({ code: '123456', newPassword: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email, code, and new password are required',
      });
    });

    it('should return error if code is missing', async () => {
      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'user@example.com', newPassword: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email, code, and new password are required',
      });
    });

    it('should return error if newPassword is missing', async () => {
      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'user@example.com', code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Email, code, and new password are required',
      });
    });

    it('should return error if password is too short', async () => {
      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'user@example.com', code: '123456', newPassword: 'short' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
    });

    it('should return error if user does not exist', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'nonexistent@example.com', code: '123456', newPassword: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid or expired verification code',
      });
    });

    it('should return error if code is invalid', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.findValidToken as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'user@example.com', code: 'wrong', newPassword: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid or expired verification code',
      });
    });

    it('should reset password successfully', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.findValidToken as jest.Mock).mockResolvedValue({
        token_id: 1,
        user_id: 1,
        code: '123456',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (UserModel.update as jest.Mock).mockResolvedValue(undefined);
      (PasswordResetTokenModel.deleteByUserId as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'user@example.com', code: '123456', newPassword: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Password reset successfully',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
      expect(UserModel.update).toHaveBeenCalledWith(1, { password_hash: 'hashed_password' });
      expect(PasswordResetTokenModel.deleteByUserId).toHaveBeenCalledWith(1);
    });

    it('should accept password with exactly 8 characters', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        user_id: 1,
        email: 'user@example.com',
      });
      (PasswordResetTokenModel.findValidToken as jest.Mock).mockResolvedValue({
        token_id: 1,
        user_id: 1,
        code: '123456',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (UserModel.update as jest.Mock).mockResolvedValue(undefined);
      (PasswordResetTokenModel.deleteByUserId as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'user@example.com', code: '123456', newPassword: '12345678' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Password reset successfully',
      });
    });

    it('should handle errors gracefully', async () => {
      (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/reset-password')
        .send({ email: 'user@example.com', code: '123456', newPassword: 'newpass123' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error resetting password',
      });
    });
  });
});

});