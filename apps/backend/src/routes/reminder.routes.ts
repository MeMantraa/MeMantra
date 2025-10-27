import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createReminderSchema,
  updateReminderSchema,
  getReminderByIdSchema,
} from '../validators/reminder.validator';

const router = Router();

// All reminder routes require authentication
router.use(authenticate);

// Get all reminders for the authenticated user
router.get(
  '/',
  ReminderController.getUserReminders
);

// Get active reminders for the authenticated user
router.get(
  '/active',
  ReminderController.getActiveReminders
);

// Get a single reminder by ID
router.get(
  '/:id',
  validateRequest(getReminderByIdSchema),
  ReminderController.getReminderById
);

// Create a new reminder
router.post(
  '/',
  validateRequest(createReminderSchema),
  ReminderController.createReminder
);

// Update a reminder
router.patch(
  '/:id',
  validateRequest(updateReminderSchema),
  ReminderController.updateReminder
);

// Delete a reminder
router.delete(
  '/:id',
  validateRequest(getReminderByIdSchema),
  ReminderController.deleteReminder
);

export default router;
