import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { NotificationService } from '../services/notification.service';

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

// --- Controller ---

export const NotificationController = {
  /**
   * POST /api/notifications/register-token
   * Register or update a device token for push notifications
   */
  async registerToken(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { token, platform, deviceName } = req.body;

      // Validate token format
      if (!token || !NotificationService.isExpoPushToken(token)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid Expo push token format',
        });
      }

      // Update user's device token
      const updatedUser = await UserModel.update(userId, {
        device_token: token,
      });

      if (!updatedUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      console.log(`Device token registered for user ${userId}: ${platform} - ${deviceName}`);

      return res.status(200).json({
        status: 'success',
        message: 'Device token registered successfully',
        data: { token },
      });
    } catch (error) {
      return handleError(res, 'Error registering device token', error);
    }
  },

  /**
   * POST /api/notifications/unregister-token
   * Remove device token (e.g., on logout)
   */
  async unregisterToken(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      await UserModel.update(userId, {
        device_token: null,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Device token removed successfully',
      });
    } catch (error) {
      return handleError(res, 'Error unregistering device token', error);
    }
  },

  /**
   * POST /api/notifications/send
   * Send a test notification (for testing/admin use)
   */
  async sendNotification(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { title, body, data } = req.body;

      if (!title || !body) {
        return res.status(400).json({
          status: 'error',
          message: 'Title and body are required',
        });
      }

      // Get user's device token
      const user = await UserModel.findById(userId);

      if (!user || !user.device_token) {
        return res.status(400).json({
          status: 'error',
          message: 'No device token registered for this user',
        });
      }

      // Send notification
      const result = await NotificationService.sendSimpleNotification(
        user.device_token,
        title,
        body,
        data
      );

      // Check if notification was sent successfully
      const ticket = result.data[0];
      if (ticket.status === 'error') {
        return res.status(500).json({
          status: 'error',
          message: ticket.message || 'Failed to send notification',
          details: ticket.details,
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Notification sent successfully',
        data: { ticket },
      });
    } catch (error) {
      return handleError(res, 'Error sending notification', error);
    }
  },

  /**
   * POST /api/notifications/send-bulk
   * Send notification to multiple users (admin only)
   */
  async sendBulkNotification(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { userIds, title, body, data } = req.body;

      if (!title || !body || !Array.isArray(userIds)) {
        return res.status(400).json({
          status: 'error',
          message: 'Title, body, and userIds array are required',
        });
      }

      // Get device tokens for all users
      const deviceTokens: string[] = [];
      for (const targetUserId of userIds) {
        const user = await UserModel.findById(targetUserId);
        if (user && user.device_token) {
          deviceTokens.push(user.device_token);
        }
      }

      if (deviceTokens.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No valid device tokens found for specified users',
        });
      }

      // Send bulk notification
      const result = await NotificationService.sendBulkNotification(
        deviceTokens,
        title,
        body,
        data
      );

      const successful = result.data.filter((ticket) => ticket.status === 'ok').length;
      const failed = result.data.filter((ticket) => ticket.status === 'error').length;

      return res.status(200).json({
        status: 'success',
        message: `Notifications sent: ${successful} successful, ${failed} failed`,
        data: {
          total: deviceTokens.length,
          successful,
          failed,
          tickets: result.data,
        },
      });
    } catch (error) {
      return handleError(res, 'Error sending bulk notifications', error);
    }
  },

  /**
   * GET /api/notifications/test
   * Send a test notification to the authenticated user
   */
  async sendTestNotification(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const user = await UserModel.findById(userId);

      if (!user || !user.device_token) {
        return res.status(400).json({
          status: 'error',
          message: 'No device token registered. Please enable notifications in the app.',
        });
      }

      const result = await NotificationService.sendSimpleNotification(
        user.device_token,
        'Test Notification',
        'This is a test notification from MeMantra',
        { type: 'test' }
      );

      const ticket = result.data[0];
      if (ticket.status === 'error') {
        return res.status(500).json({
          status: 'error',
          message: ticket.message || 'Failed to send test notification',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Test notification sent successfully',
      });
    } catch (error) {
      return handleError(res, 'Error sending test notification', error);
    }
  },
};
