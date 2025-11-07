import request from 'supertest';
import express from 'express';
import { ReminderController } from '../../src/controllers/reminder.controller';
import { ReminderModel } from '../../src/models/reminder.model';

jest.mock('../../src/models/reminder.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });
  app.get('/reminders', ReminderController.getUserReminders);
  app.get('/reminders/active', ReminderController.getActiveReminders);
  app.get('/reminders/upcoming', ReminderController.getUpcomingReminders);
  app.get('/reminders/frequency', ReminderController.getRemindersByFrequency);
  app.get('/reminders/:id', ReminderController.getReminderById);
  app.post('/reminders', ReminderController.createReminder);
  app.put('/reminders/:id', ReminderController.updateReminder);
  app.delete('/reminders/:id', ReminderController.deleteReminder);
  return app;
}

describe('ReminderController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserReminders', () => {
    it('should get user reminders', async () => {
      const mockReminders = [
        { reminder_id: 1, user_id: 1, mantra_id: 5, time: '2025-01-20T10:00:00Z' },
        { reminder_id: 2, user_id: 1, mantra_id: 6, time: '2025-01-21T10:00:00Z' },
      ];
      (ReminderModel.findByUserId as jest.Mock).mockResolvedValue(mockReminders);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { reminders: mockReminders },
      });
      expect(ReminderModel.findByUserId).toHaveBeenCalledWith(1);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/reminders');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (ReminderModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving reminders',
      });
    });
  });

  describe('getActiveReminders', () => {
    it('should get active reminders', async () => {
      const mockReminders = [{ reminder_id: 1, status: 'active' }];
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue(mockReminders);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/active');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { reminders: mockReminders },
      });
      expect(ReminderModel.findActiveByUserId).toHaveBeenCalledWith(1);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/reminders/active');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/active');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving active reminders',
      });
    });
  });

  describe('getUpcomingReminders', () => {
    it('should get upcoming reminders with default hours', async () => {
      const mockReminders = [{ reminder_id: 1 }];
      (ReminderModel.findUpcoming as jest.Mock).mockResolvedValue(mockReminders);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/upcoming');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          reminders: mockReminders,
          hoursAhead: 24,
        },
      });
      expect(ReminderModel.findUpcoming).toHaveBeenCalledWith(1, 24);
    });

    it('should get upcoming reminders with custom hours', async () => {
      const mockReminders = [{ reminder_id: 1 }];
      (ReminderModel.findUpcoming as jest.Mock).mockResolvedValue(mockReminders);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/upcoming?hours=48');

      expect(res.status).toBe(200);
      expect(res.body.data.hoursAhead).toBe(48);
      expect(ReminderModel.findUpcoming).toHaveBeenCalledWith(1, 48);
    });

    it('should handle errors', async () => {
      (ReminderModel.findUpcoming as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/upcoming');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving upcoming reminders',
      });
    });
  });

  describe('getReminderById', () => {
    it('should get reminder by id', async () => {
      const mockReminder = { reminder_id: 1, user_id: 1, mantra_id: 5 };
      (ReminderModel.findById as jest.Mock).mockResolvedValue(mockReminder);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { reminder: mockReminder },
      });
      expect(ReminderModel.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 if reminder not found', async () => {
      (ReminderModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Reminder not found',
      });
    });

    it('should return 403 if reminder belongs to different user', async () => {
      const mockReminder = { reminder_id: 1, user_id: 2, mantra_id: 5 };
      (ReminderModel.findById as jest.Mock).mockResolvedValue(mockReminder);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/1');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should handle errors', async () => {
      (ReminderModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving reminder',
      });
    });
  });

  describe('createReminder', () => {
    it('should create reminder', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const newReminder = {
        mantra_id: 5,
        time: futureDate,
        frequency: 'daily',
        status: 'active',
      };
      const createdReminder = { reminder_id: 1, user_id: 1, ...newReminder };
      (ReminderModel.create as jest.Mock).mockResolvedValue(createdReminder);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/reminders')
        .send(newReminder);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Reminder created successfully',
        data: { reminder: createdReminder },
      });
    });

    it('should return 400 if time is in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const newReminder = {
        mantra_id: 5,
        time: pastDate,
        frequency: 'daily',
      };

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/reminders')
        .send(newReminder);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Reminder time must be in the future',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app)
        .post('/reminders')
        .send({ mantra_id: 5, time: new Date().toISOString(), frequency: 'daily' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (ReminderModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/reminders')
        .send({ mantra_id: 5, time: futureDate, frequency: 'daily' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error creating reminder',
      });
    });
  });

  describe('updateReminder', () => {
    it('should update reminder', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const existingReminder = { reminder_id: 1, user_id: 1 };
      const updatedReminder = { ...existingReminder, time: futureDate };
      (ReminderModel.findById as jest.Mock).mockResolvedValue(existingReminder);
      (ReminderModel.update as jest.Mock).mockResolvedValue(updatedReminder);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/reminders/1')
        .send({ time: futureDate });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Reminder updated successfully',
        data: { reminder: updatedReminder },
      });
    });

    it('should return 400 if new time is in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const existingReminder = { reminder_id: 1, user_id: 1 };
      (ReminderModel.findById as jest.Mock).mockResolvedValue(existingReminder);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/reminders/1')
        .send({ time: pastDate });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Reminder time must be in the future',
      });
    });

    it('should return 404 if reminder not found', async () => {
      (ReminderModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/reminders/999')
        .send({ frequency: 'weekly' });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Reminder not found',
      });
    });

    it('should return 403 if reminder belongs to different user', async () => {
      const existingReminder = { reminder_id: 1, user_id: 2 };
      (ReminderModel.findById as jest.Mock).mockResolvedValue(existingReminder);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/reminders/1')
        .send({ frequency: 'weekly' });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should handle errors', async () => {
      (ReminderModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/reminders/1')
        .send({ frequency: 'weekly' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error updating reminder',
      });
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder', async () => {
      const existingReminder = { reminder_id: 1, user_id: 1 };
      (ReminderModel.findById as jest.Mock).mockResolvedValue(existingReminder);
      (ReminderModel.delete as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/reminders/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Reminder deleted successfully',
      });
      expect(ReminderModel.delete).toHaveBeenCalledWith(1);
    });

    it('should return 404 if reminder not found', async () => {
      (ReminderModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/reminders/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Reminder not found',
      });
    });

    it('should return 403 if reminder belongs to different user', async () => {
      const existingReminder = { reminder_id: 1, user_id: 2 };
      (ReminderModel.findById as jest.Mock).mockResolvedValue(existingReminder);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/reminders/1');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should handle errors', async () => {
      (ReminderModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/reminders/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error deleting reminder',
      });
    });
  });

  describe('getRemindersByFrequency', () => {
    it('should get reminders by frequency', async () => {
      const mockReminders = [{ reminder_id: 1, frequency: 'daily' }];
      (ReminderModel.findByFrequency as jest.Mock).mockResolvedValue(mockReminders);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/frequency?frequency=daily');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { reminders: mockReminders },
      });
      expect(ReminderModel.findByFrequency).toHaveBeenCalledWith(1, 'daily');
    });

    it('should handle errors', async () => {
      (ReminderModel.findByFrequency as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/reminders/frequency?frequency=daily');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving reminders by frequency',
      });
    });
  });
});
