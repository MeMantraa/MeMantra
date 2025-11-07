import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createReminderSchema,
  updateReminderSchema,
  reminderIdSchema,
  upcomingQuerySchema,
  frequencyQuerySchema,
} from '../validators/reminder.validator';

const router = Router();

// All reminder routes require authentication
router.use(authenticate);

router.get('/', ReminderController.getUserReminders);

router.get('/active', ReminderController.getActiveReminders);

router.get(
  '/upcoming',
  validateRequest(upcomingQuerySchema),
  ReminderController.getUpcomingReminders
);

router.get(
  '/frequency',
  validateRequest(frequencyQuerySchema),
  ReminderController.getRemindersByFrequency
);

router.get(
  '/:id',
  validateRequest(reminderIdSchema),
  ReminderController.getReminderById
);

router.post(
  '/',
  validateRequest(createReminderSchema),
  ReminderController.createReminder
);

router.put(
  '/:id',
  validateRequest(reminderIdSchema),
  validateRequest(updateReminderSchema),
  ReminderController.updateReminder
);

router.delete(
  '/:id',
  validateRequest(reminderIdSchema),
  ReminderController.deleteReminder
);

export default router;
