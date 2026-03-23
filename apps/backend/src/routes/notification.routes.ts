import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validateRequest } from '../middleware/validate.middleware';
import {
  registerTokenSchema,
  unregisterTokenSchema,
  sendNotificationSchema,
  sendBulkNotificationSchema,
} from '../validators/notification.validator';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// POST /api/notifications/register-token - Register device token
router.post(
  '/register-token',
  validateRequest(registerTokenSchema),
  NotificationController.registerToken,
);

// POST /api/notifications/unregister-token - Remove device token
router.post(
  '/unregister-token',
  validateRequest(unregisterTokenSchema),
  NotificationController.unregisterToken,
);

// POST /api/notifications/send - Send notification to current user
router.post(
  '/send',
  validateRequest(sendNotificationSchema),
  NotificationController.sendNotification,
);

// POST /api/notifications/send-bulk - Send bulk notifications (admin only)
router.post(
  '/send-bulk',
  requireAdmin,
  validateRequest(sendBulkNotificationSchema),
  NotificationController.sendBulkNotification,
);

// GET /api/notifications/recommend - Send a personalised recommendation notification to current user
router.get('/recommend', NotificationController.sendRecommendationNotification);

// GET /api/notifications/test - Send test notification
router.get('/test', NotificationController.sendTestNotification);

export default router;
