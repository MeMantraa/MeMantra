import request from 'supertest';
import express from 'express';
import { NotificationController } from '../../src/controllers/notification.controller';
import { UserModel } from '../../src/models/user.model';
import { NotificationService } from '../../src/services/notification.service';

jest.mock('../../src/models/user.model');
jest.mock('../../src/services/notification.service');

const app = express();
app.use(express.json());

// Middleware to mock authenticated user
const mockAuthMiddleware = (req: any, _res: any, next: any) => {
  req.user = { userId: 1 };
  next();
};

// Middleware to mock admin user (for testing admin-only routes)
const mockAdminMiddleware = (req: any, _res: any, next: any) => {
  req.user = { userId: 1, isAdmin: true };
  next();
};

app.post('/register-token', mockAuthMiddleware, NotificationController.registerToken);
app.post('/unregister-token', mockAuthMiddleware, NotificationController.unregisterToken);
app.post('/send', mockAuthMiddleware, NotificationController.sendNotification);
app.post('/send-bulk', mockAdminMiddleware, NotificationController.sendBulkNotification);
app.get('/test', mockAuthMiddleware, NotificationController.sendTestNotification);

describe('NotificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('should register device token successfully', async () => {
      const validToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

      (NotificationService.isExpoPushToken as jest.Mock).mockReturnValue(true);
      (UserModel.update as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: validToken,
      });

      const res = await request(app)
        .post('/register-token')
        .send({
          token: validToken,
          platform: 'ios',
          deviceName: 'iPhone 14',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Device token registered successfully',
        data: { token: validToken },
      });
      expect(UserModel.update).toHaveBeenCalledWith(1, {
        device_token: validToken,
      });
    });

    it('should also save timezone when it is provided alongside the token', async () => {
      const validToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

      (NotificationService.isExpoPushToken as jest.Mock).mockReturnValue(true);
      (UserModel.update as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: validToken,
        timezone: 'America/New_York',
      });

      const res = await request(app)
        .post('/register-token')
        .send({ token: validToken, timezone: 'America/New_York' });

      expect(res.status).toBe(200);
      expect(UserModel.update).toHaveBeenCalledWith(1, {
        device_token: validToken,
        timezone: 'America/New_York',
      });
    });

    it('should reject invalid token format', async () => {
      (NotificationService.isExpoPushToken as jest.Mock).mockReturnValue(false);

      const res = await request(app)
        .post('/register-token')
        .send({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid Expo push token format',
      });
    });

    it('should return 404 if user not found', async () => {
      (NotificationService.isExpoPushToken as jest.Mock).mockReturnValue(true);
      (UserModel.update as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/register-token')
        .send({ token: 'ExponentPushToken[xxx]' });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'User not found',
      });
    });
  });

  describe('unregisterToken', () => {
    it('should unregister device token successfully', async () => {
      (UserModel.update as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: null,
      });

      const res = await request(app).post('/unregister-token').send({});

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Device token removed successfully',
      });
      expect(UserModel.update).toHaveBeenCalledWith(1, {
        device_token: null,
      });
    });

    it('should handle errors when unregistering', async () => {
      (UserModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/unregister-token').send({});

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error unregistering device token',
      });
    });
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const mockUser = {
        user_id: 1,
        device_token: 'ExponentPushToken[xxx]',
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (NotificationService.sendSimpleNotification as jest.Mock).mockResolvedValue({
        data: [{ status: 'ok', id: 'receipt-id' }],
      });

      const res = await request(app)
        .post('/send')
        .send({
          title: 'Test Title',
          body: 'Test Body',
          data: { type: 'test' },
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Notification sent successfully',
      });
      expect(NotificationService.sendSimpleNotification).toHaveBeenCalledWith(
        'ExponentPushToken[xxx]',
        'Test Title',
        'Test Body',
        { type: 'test' }
      );
    });

    it('should return 400 if title or body missing', async () => {
      const res = await request(app)
        .post('/send')
        .send({ title: 'Only Title' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Title and body are required',
      });
    });

    it('should return 400 if user has no device token', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: null,
      });

      const res = await request(app)
        .post('/send')
        .send({ title: 'Title', body: 'Body' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'No device token registered for this user',
      });
    });

    it('should handle notification send errors', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: 'ExponentPushToken[xxx]',
      });
      (NotificationService.sendSimpleNotification as jest.Mock).mockResolvedValue({
        data: [{ status: 'error', message: 'Invalid token' }],
      });

      const res = await request(app)
        .post('/send')
        .send({ title: 'Title', body: 'Body' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Invalid token',
      });
    });
  });

  describe('sendBulkNotification', () => {
    it('should send bulk notifications successfully', async () => {
      (UserModel.findByIds as jest.Mock).mockResolvedValue([
        { user_id: 1, device_token: 'Token1' },
        { user_id: 2, device_token: 'Token2' },
      ]);

      (NotificationService.sendBulkNotification as jest.Mock).mockResolvedValue({
        data: [
          { status: 'ok', id: 'receipt1' },
          { status: 'ok', id: 'receipt2' },
        ],
      });

      const res = await request(app)
        .post('/send-bulk')
        .send({
          userIds: [1, 2],
          title: 'Bulk Title',
          body: 'Bulk Body',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Notifications sent: 2 successful, 0 failed',
        data: {
          total: 2,
          successful: 2,
          failed: 0,
        },
      });
    });

    it('should return 400 if no valid device tokens found', async () => {
      (UserModel.findByIds as jest.Mock).mockResolvedValue([
        { user_id: 1, device_token: null },
      ]);

      const res = await request(app)
        .post('/send-bulk')
        .send({
          userIds: [1],
          title: 'Title',
          body: 'Body',
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'No valid device tokens found for specified users',
      });
    });

    it('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/send-bulk')
        .send({ title: 'Only Title' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Title, body, and userIds array are required',
      });
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification successfully', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: 'ExponentPushToken[xxx]',
      });
      (NotificationService.sendSimpleNotification as jest.Mock).mockResolvedValue({
        data: [{ status: 'ok', id: 'test-receipt' }],
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Test notification sent successfully',
      });
      expect(NotificationService.sendSimpleNotification).toHaveBeenCalledWith(
        'ExponentPushToken[xxx]',
        'Test Notification',
        'This is a test notification from MeMantra',
        { type: 'test' }
      );
    });

    it('should return 400 if user has no device token', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: null,
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'No device token registered. Please enable notifications in the app.',
      });
    });

    it('should handle send errors', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        user_id: 1,
        device_token: 'ExponentPushToken[xxx]',
      });
      (NotificationService.sendSimpleNotification as jest.Mock).mockResolvedValue({
        data: [{ status: 'error', message: 'Send failed' }],
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Send failed',
      });
    });
  });
});
