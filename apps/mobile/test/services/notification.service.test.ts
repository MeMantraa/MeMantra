import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationService } from '../../services/notification.service';

const mockPost = jest.fn();

jest.mock('../../services/api.config', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  deviceName: 'Test Device',
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should return granted status when permission already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await notificationService.requestPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: false,
        status: 'granted',
      });
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should request permissions when not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await notificationService.requestPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: true,
        status: 'granted',
      });
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle denied permissions', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await notificationService.requestPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: true,
        status: 'denied',
      });
    });
  });

  describe('getExpoPushToken', () => {
    it('should return push token on physical device', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      });

      const result = await notificationService.getExpoPushToken();

      expect(result).toBe('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
        projectId: '072863e5-efd5-4b9c-8f68-7edfca4409d0',
      });
    });

    it('should return null on simulator/emulator', async () => {
      (Device.isDevice as any) = false;

      const result = await notificationService.getExpoPushToken();

      expect(result).toBeNull();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });

    it('should handle token fetch errors', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
        new Error('Token fetch failed'),
      );

      const result = await notificationService.getExpoPushToken();

      expect(result).toBeNull();
    });
  });

  describe('registerDeviceToken', () => {
    it('should register token with backend', async () => {
      const mockToken = 'ExponentPushToken[xxx]';
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Token registered',
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await notificationService.registerDeviceToken(mockToken);

      expect(mockPost).toHaveBeenCalledWith('/notifications/register-token', {
        token: mockToken,
        platform: 'ios',
        deviceName: 'Test Device',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle registration errors', async () => {
      const mockToken = 'ExponentPushToken[xxx]';
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(notificationService.registerDeviceToken(mockToken)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('unregisterDeviceToken', () => {
    it('should unregister token from backend', async () => {
      const mockToken = 'ExponentPushToken[xxx]';
      mockPost.mockResolvedValue({ data: { status: 'success' } });

      await notificationService.unregisterDeviceToken(mockToken);

      expect(mockPost).toHaveBeenCalledWith('/notifications/unregister-token', {
        token: mockToken,
      });
    });

    it('should handle unregistration errors', async () => {
      const mockToken = 'ExponentPushToken[xxx]';
      mockPost.mockRejectedValue(new Error('API error'));

      await expect(notificationService.unregisterDeviceToken(mockToken)).rejects.toThrow(
        'API error',
      );
    });
  });

  describe('setupNotifications', () => {
    it('should complete full setup flow successfully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Device.isDevice as any) = true;
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxx]',
      });
      mockPost.mockResolvedValue({ data: { status: 'success' } });

      const result = await notificationService.setupNotifications();

      expect(result).toBe('ExponentPushToken[xxx]');
      expect(mockPost).toHaveBeenCalledWith(
        '/notifications/register-token',
        expect.objectContaining({
          token: 'ExponentPushToken[xxx]',
        }),
      );
    });

    it('should return null when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await notificationService.setupNotifications();

      expect(result).toBeNull();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });

    it('should return null when token fetch fails', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Device.isDevice as any) = false;

      const result = await notificationService.setupNotifications();

      expect(result).toBeNull();
    });

    it('should return null when registration fails', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Device.isDevice as any) = true;
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxx]',
      });
      mockPost.mockRejectedValue(new Error('Registration failed'));

      const result = await notificationService.setupNotifications();

      expect(result).toBeNull();
    });
  });

  describe('getPermissionStatus', () => {
    it('should return current permission status without requesting', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await notificationService.getPermissionStatus();

      expect(result).toEqual({
        granted: true,
        canAskAgain: false,
        status: 'granted',
      });
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should return undetermined status', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });

      const result = await notificationService.getPermissionStatus();

      expect(result).toEqual({
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      });
    });
  });

  describe('scheduleLocalNotification', () => {
    it('should schedule notification successfully', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        'notification-id-123',
      );

      const trigger = { seconds: 60 };
      const result = await notificationService.scheduleLocalNotification(
        'Title',
        'Body',
        { key: 'value' },
        trigger as any,
      );

      expect(result).toBe('notification-id-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Title',
          body: 'Body',
          data: { key: 'value' },
          sound: true,
        },
        trigger,
      });
    });

    it('should schedule immediate notification when trigger is null', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        'notification-id-456',
      );

      await notificationService.scheduleLocalNotification('Title', 'Body');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Title',
          body: 'Body',
          data: {},
          sound: true,
        },
        trigger: null,
      });
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification by ID', async () => {
      await notificationService.cancelNotification('notification-id-123');

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'notification-id-123',
      );
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all scheduled notifications', async () => {
      await notificationService.cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('getScheduledNotifications', () => {
    it('should return all scheduled notifications', async () => {
      const mockNotifications = [
        { identifier: 'notif-1', content: { title: 'Test' } },
        { identifier: 'notif-2', content: { title: 'Test 2' } },
      ];

      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
        mockNotifications,
      );

      const result = await notificationService.getScheduledNotifications();

      expect(result).toEqual(mockNotifications);
    });
  });

  describe('setBadgeCount', () => {
    it('should set badge count', async () => {
      await notificationService.setBadgeCount(5);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
    });
  });

  describe('getBadgeCount', () => {
    it('should get current badge count', async () => {
      (Notifications.getBadgeCountAsync as jest.Mock).mockResolvedValue(3);

      const result = await notificationService.getBadgeCount();

      expect(result).toBe(3);
    });
  });
});
