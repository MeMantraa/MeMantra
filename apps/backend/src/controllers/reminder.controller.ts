import { Request, Response } from 'express';
import { ReminderModel } from '../models/reminder.model';
import { CreateReminderInput, UpdateReminderInput } from '../validators/reminder.validator';

export const ReminderController = {
  // Get all reminders for the authenticated user
  async getUserReminders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { with_mantras } = req.query;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      let reminders;

      if (with_mantras === 'true') {
        reminders = await ReminderModel.getUserRemindersWithMantras(userId);
      } else {
        reminders = await ReminderModel.findByUserId(userId);
      }

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

  // Get active reminders for the authenticated user
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

  // Get a single reminder by ID
  async getReminderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { with_mantra } = req.query;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check ownership
      const isOwner = await ReminderModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      let reminder;

      if (with_mantra === 'true') {
        reminder = await ReminderModel.getReminderWithMantra(Number(id));
      } else {
        reminder = await ReminderModel.findById(Number(id));
      }

      if (!reminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found',
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

  // Create a new reminder
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

  // Update a reminder
  async updateReminder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateReminderInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check ownership
      const isOwner = await ReminderModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const updatedReminder = await ReminderModel.update(Number(id), updates);

      if (!updatedReminder) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found',
        });
      }

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

  // Delete a reminder
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

      // Check ownership
      const isOwner = await ReminderModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const success = await ReminderModel.delete(Number(id));

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Reminder not found',
        });
      }

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
};
