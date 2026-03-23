import { Request, Response } from 'express';
import { ReminderModel } from '../models/reminder.model';
import {
  CreateReminderInput,
  UpdateReminderInput,
  SchedulePreviewInput,
} from '../validators/reminder.validator';
import { UserCategoryScoreModel } from '../models/user-category-score.model';
import type { Reminder } from '../types/database.types';
import { sanitizeForLog } from '../utils/sanitize.utils';

// --- Utility helpers ---
const handleError = (res: Response, message: string, error?: unknown, status = 500) => {
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

const verifyOwnership = (
  res: Response,
  reminder: Reminder | undefined,
  userId: number,
): boolean => {
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

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// --- Controller ---

export const ReminderController = {
  // GET /api/reminders
  async getUserReminders(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const reminders = await ReminderModel.findByUserIdWithNames(userId);
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

      // Only validate future time for non-routine reminders
      if (data.frequency !== 'routine') {
        if (!data.time || !validateFutureTime(res, data.time)) return;
      }

      const newReminder = await ReminderModel.create({
        ...data,
        user_id: userId,
        // Routine reminders use schedule_times instead of time
        time: data.frequency === 'routine' ? null : (data.time ?? null),
      });

      // Update algorithm: +5 points for all categories of this mantra
      if (data.mantra_id) {
        await UserCategoryScoreModel.addScoreForMantra(userId, data.mantra_id, 5).catch((err) => {
          console.error(
            'Failed to update category score for user:',
            sanitizeForLog(userId),
            'mantra:',
            sanitizeForLog(data.mantra_id),
            err,
          );
        });
      }

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

  // POST /api/reminders/preview-schedule
  async getSchedulePreview(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { schedule_times, schedule_days, timezone } = req.body as SchedulePreviewInput;

      const preview: Array<{ day: string; date: string; times: string[] }> = [];
      const now = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);

        // Get day-of-week in the user's timezone
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
        });
        const dayStr = dayFormatter.format(date);
        const dayOfWeek = DAY_MAP[dayStr] ?? 0;

        // Check if this day is scheduled
        const isDayActive =
          !schedule_days || schedule_days.length === 0 || schedule_days.includes(dayOfWeek);

        if (isDayActive) {
          const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });

          preview.push({
            day: dateFormatter.format(date),
            date: date.toISOString().split('T')[0],
            times: schedule_times,
          });
        }
      }

      return res.status(200).json({
        status: 'success',
        data: {
          timezone,
          preview,
          total_notifications_per_week: preview.length * schedule_times.length,
        },
      });
    } catch (error) {
      return handleError(res, 'Error generating schedule preview', error);
    }
  },

  // GET /api/reminders/suggestions
  async getSuggestions(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const suggestions = {
        templates: [
          {
            name: 'Morning',
            icon: 'sunny-outline',
            times: ['07:00'],
            description: 'Start your day mindfully',
          },
          {
            name: 'Lunch',
            icon: 'restaurant-outline',
            times: ['12:00'],
            description: 'Midday mindfulness break',
          },
          {
            name: 'Bedtime',
            icon: 'moon-outline',
            times: ['22:00'],
            description: 'End your day with intention',
          },
        ],
        recommended_times: ['07:00', '12:00', '18:00', '22:00'],
        day_presets: [
          { name: 'Every Day', days: [0, 1, 2, 3, 4, 5, 6] },
          { name: 'Weekdays', days: [1, 2, 3, 4, 5] },
          { name: 'Weekends', days: [0, 6] },
        ],
      };

      return res.status(200).json({
        status: 'success',
        data: { suggestions },
      });
    } catch (error) {
      return handleError(res, 'Error getting suggestions', error);
    }
  },
};
