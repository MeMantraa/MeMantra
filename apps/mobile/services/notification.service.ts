import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from './api.config';
import { notificationSettingsService } from './notification-settings.service';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface RegisterTokenResponse {
  status: string;
  message: string;
  data?: {
    token: string;
  };
}

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Request notification permissions from the user
   * @returns Permission status object
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only ask if permissions have not already been determined
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return {
      granted: finalStatus === 'granted',
      canAskAgain: finalStatus === 'undetermined',
      status: finalStatus as 'granted' | 'denied' | 'undetermined',
    };
  },

  /**
   * Get the Expo Push Token for this device
   * @returns Expo push token string or null if unable to get
   */
  async getExpoPushToken(): Promise<string | null> {
    // Check if running on a physical device (required for push notifications)
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices, not simulators/emulators');
      return null;
    }

    try {
      // Get project ID from app configuration
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.error('Expo project ID not found in app configuration');
        return null;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  },

  /**
   * Register device token with backend
   * @param expoPushToken - The Expo push token to register
   * @returns Response from backend
   */
  async registerDeviceToken(expoPushToken: string): Promise<RegisterTokenResponse> {
    try {
      const deviceInfo = {
        token: expoPushToken,
        platform: Platform.OS,
        deviceName: Device.deviceName || `${Platform.OS} Device`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const response = await apiClient.post<RegisterTokenResponse>(
        '/notifications/register-token',
        deviceInfo,
      );

      return response.data;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  },

  /**
   * Unregister device token from backend
   * @param expoPushToken - The Expo push token to unregister
   */
  async unregisterDeviceToken(expoPushToken: string): Promise<void> {
    try {
      await apiClient.post('/notifications/unregister-token', {
        token: expoPushToken,
      });
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  },

  /**
   * Complete notification setup flow:
   * 1. Request permissions
   * 2. Get Expo push token
   * 3. Register token with backend
   * @returns The registered push token or null if setup failed
   */
  async setupNotifications(): Promise<string | null> {
    try {
      // Step 1: Request permissions
      const permissionStatus = await this.requestPermissions();

      if (!permissionStatus.granted) {
        console.warn('Notification permission not granted');
        return null;
      }

      // Step 2: Create Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8E9A86',
          sound: 'default',
        });
      }

      // Step 3: Get Expo push token
      const expoPushToken = await this.getExpoPushToken();

      if (!expoPushToken) {
        console.warn('Unable to get Expo push token');
        return null;
      }

      // Step 4: Register token with backend
      await this.registerDeviceToken(expoPushToken);

      console.log('Notification setup completed successfully');
      return expoPushToken;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return null;
    }
  },

  /**
   * Get current permission status without requesting
   * @returns Current permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();

    return {
      granted: status === 'granted',
      canAskAgain: status === 'undetermined',
      status: status as 'granted' | 'denied' | 'undetermined',
    };
  },

  /**
   * Check if notifications should be sent based on user settings
   * @returns True if notifications should be sent, false otherwise
   */
  async shouldSendNotification(): Promise<boolean> {
    try {
      const settings = await notificationSettingsService.getSettings();

      // Check if notifications are disabled
      if (!settings.enabled) {
        console.log('Notifications are disabled in settings');
        return false;
      }

      // Check if we're within quiet hours
      if (notificationSettingsService.isWithinQuietHours(settings)) {
        console.log('Currently within quiet hours');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking notification settings:', error);
      // Default to allowing notifications if we can't read settings
      return true;
    }
  },

  /**
   * Schedule a local notification
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional data payload
   * @param trigger - When to show notification (null = immediate)
   * @param respectSettings - Whether to check user settings before scheduling (default: true)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger: Notifications.NotificationTriggerInput | null = null,
    respectSettings: boolean = true,
  ): Promise<string | null> {
    // Check user settings if requested
    if (respectSettings) {
      const shouldSend = await this.shouldSendNotification();
      if (!shouldSend) {
        console.log('Notification not scheduled due to user settings');
        return null;
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger,
    });

    return notificationId;
  },

  /**
   * Cancel a scheduled notification by ID
   * @param notificationId - The notification ID to cancel
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Get all scheduled notifications
   * @returns Array of scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  /**
   * Set notification badge count (iOS)
   * @param count - Badge count number
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Get notification badge count (iOS)
   * @returns Current badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  },
};
