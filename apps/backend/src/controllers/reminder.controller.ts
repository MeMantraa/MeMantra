import { Request, Response } from 'express';
import { ReminderModel } from '../models/reminder.model';
import { CreateReminderInput, UpdateReminderInput } from '../validators/reminder.validator';

// --- Utility helpers ---
const handleError = (res: Response, message: string, error?: any, status = 500) => {
  console.error(message, error);
  return res.status(status).json({ status: 'error', message });
};

const requireAuth = (req: Request, res: Response): number | undefined => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'Authentication required' });
    return;
  }
  return userId;
};

const verifyOwnership = (res: Response, reminder: any, userId: number): boolean => {
  if (!reminder) {
    res.status(404).json({ status: 'error', message: 'Reminder not found' });
    return false;
  }

  if (reminder.user_id !== userId) {
    res.status(403).json({ status: 'error', message: 'Access denied' });
    return false;
  }

  return true;
};

const validateFutureTime = (res: Response, time: string | Date): boolean => {
  const reminderTime = new Date(time);
  if (reminderTime <= new Date()) {
    res.status(400).json({
      status: 'error',
      message: 'Reminder time must be in the future',
    });
    return false;
  }
  return true;
};

// --- Controller ---

export const ReminderController = {
  // GET /api/reminders
  async getUserReminders(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const reminders = await ReminderModel.findByUserId(userId);
      return res.status(200).json({ status: 'success', data: { reminders } });
    } catch (error) {
      return handleError(res, 'Error retrieving reminders', error);
    }
  },

  // GET /api/reminders/active
  async getActiveReminders(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const reminders = await ReminderModel.findActiveByUserId(userId);
      return res.status(200).json({ status: 'success', data: { reminders } });
    } catch (error) {
      return handleError(res, 'Error retrieving active reminders', error);
    }
  },

  // GET /api/reminders/upcoming
  async getUpcomingReminders(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const hours = Number(req.query.hours ?? 24);
      const reminders = await ReminderModel.findUpcoming(userId, hours);

      return res.status(200).json({
        status: 'success',
        data: { reminders, hoursAhead: hours },
      });
    } catch (error) {
      return handleError(res, 'Error retrieving upcoming reminders', error);
    }
  },

  // GET /api/reminders/:id
  async getReminderById(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const reminder = await ReminderModel.findById(Number(req.params.id));
      if (!verifyOwnership(res, reminder, userId)) return;

      return res.status(200).json({ status: 'success', data: { reminder } });
    } catch (error) {
      return handleError(res, 'Error retrieving reminder', error);
    }
  },

  // POST /api/reminders
  async createReminder(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const data = req.body as CreateReminderInput;
      if (!validateFutureTime(res, data.time)) return;

      const newReminder = await ReminderModel.create({
        ...data,
        user_id: userId,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Reminder created successfully',
        data: { reminder: newReminder },
      });
    } catch (error) {
      return handleError(res, 'Error creating reminder', error);
    }
  },

  // PUT /api/reminders/:id
  async updateReminder(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { id } = req.params;
      const updateData = req.body as UpdateReminderInput;
      const reminder = await ReminderModel.findById(Number(id));

      if (!verifyOwnership(res, reminder, userId)) return;
      if (updateData.time && !validateFutureTime(res, updateData.time)) return;

      const updatedReminder = await ReminderModel.update(Number(id), updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Reminder updated successfully',
        data: { reminder: updatedReminder },
      });
    } catch (error) {
      return handleError(res, 'Error updating reminder', error);
    }
  },

  // DELETE /api/reminders/:id
  async deleteReminder(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const reminder = await ReminderModel.findById(Number(req.params.id));
      if (!verifyOwnership(res, reminder, userId)) return;

      await ReminderModel.delete(Number(req.params.id));

      return res.status(200).json({
        status: 'success',
        message: 'Reminder deleted successfully',
      });
    } catch (error) {
      return handleError(res, 'Error deleting reminder', error);
    }
  },

  // GET /api/reminders/frequency
  async getRemindersByFrequency(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { frequency } = req.query;
      const reminders = await ReminderModel.findByFrequency(userId, frequency as string);
      return res.status(200).json({ status: 'success', data: { reminders } });
    } catch (error) {
      return handleError(res, 'Error retrieving reminders by frequency', error);
    }
  },
};
