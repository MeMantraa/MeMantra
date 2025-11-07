import { Request, Response } from 'express';
import { ReminderModel } from '../models/reminder.model';
import { CreateReminderInput, UpdateReminderInput } from '../validators/reminder.validator';

export const ReminderController = {
  // GET /api/reminders - Get all user's reminders
  async getUserReminders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const reminders = await ReminderModel.findByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data: { reminders },
      });
    } catch (error) {
      console.error('Get user reminders error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving reminders',
      });
    }
  },

  // GET /api/reminders/active - Get active reminders
  async getActiveReminders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const reminders = await ReminderModel.findActiveByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data: { reminders },
      });
    } catch (error) {
      console.error('Get active reminders error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving active reminders',
      });
    }
  },

  // GET /api/reminders/upcoming - Get upcoming reminders
  async getUpcomingReminders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { hours = '24' } = req.query;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const reminders = await ReminderModel.findUpcoming(userId, Number(hours));

      return res.status(200).json({
        status: 'success',
        data: { reminders, hoursAhead: Number(hours) },
      });
    } catch (error) {
      console.error('Get upcoming reminders error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving upcoming reminders',
      });
    }
  },

  // GET /api/reminders/:id - Get single reminder
  async getReminderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const reminder = await ReminderModel.findById(Number(id));

      if (!reminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found',
        });
      }

      // Check if reminder belongs to user
      if (reminder.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { reminder },
      });
    } catch (error) {
      console.error('Get reminder by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving reminder',
      });
    }
  },

  // POST /api/reminders - Create new reminder
  async createReminder(req: Request, res: Response) {
    try {
      const reminderData = req.body as CreateReminderInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Validate that the time is in the future
      const reminderTime = new Date(reminderData.time);
      if (reminderTime <= new Date()) {
        return res.status(400).json({
          status: 'error',
          message: 'Reminder time must be in the future',
        });
      }

      const newReminder = await ReminderModel.create({
        ...reminderData,
        user_id: userId,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Reminder created successfully',
        data: { reminder: newReminder },
      });
    } catch (error) {
      console.error('Create reminder error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating reminder',
      });
    }
  },

  // PUT /api/reminders/:id - Update reminder
  async updateReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateReminderInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const existingReminder = await ReminderModel.findById(Number(id));

      if (!existingReminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found',
        });
      }

      // Check if reminder belongs to user
      if (existingReminder.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      // Validate that the new time is in the future if provided
      if (updateData.time) {
        const reminderTime = new Date(updateData.time);
        if (reminderTime <= new Date()) {
          return res.status(400).json({
            status: 'error',
            message: 'Reminder time must be in the future',
          });
        }
      }

      const updatedReminder = await ReminderModel.update(Number(id), updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Reminder updated successfully',
        data: { reminder: updatedReminder },
      });
    } catch (error) {
      console.error('Update reminder error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating reminder',
      });
    }
  },

  // DELETE /api/reminders/:id - Delete reminder
  async deleteReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const existingReminder = await ReminderModel.findById(Number(id));

      if (!existingReminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found',
        });
      }

      // Check if reminder belongs to user
      if (existingReminder.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      await ReminderModel.delete(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Reminder deleted successfully',
      });
    } catch (error) {
      console.error('Delete reminder error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting reminder',
      });
    }
  },

  // GET /api/reminders/frequency/:frequency - Get reminders by frequency
  async getRemindersByFrequency(req: Request, res: Response) {
    try {
      const { frequency } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const reminders = await ReminderModel.findByFrequency(userId, frequency as string);

      return res.status(200).json({
        status: 'success',
        data: { reminders },
      });
    } catch (error) {
      console.error('Get reminders by frequency error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving reminders by frequency',
      });
    }
  },
};
