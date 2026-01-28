import axios from 'axios';
import {
  generateNotificationContent,
  NotificationContentOptions,
  CTAStyle,
} from '../config/notification-content.config';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: object;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: object;
}

export interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

export const NotificationService = {
  /**
   * Send a push notification via Expo Push Notification Service
   * @param messages - Single message or array of messages to send
   * @returns Response from Expo Push API
   */
  async sendPushNotification(
    messages: ExpoPushMessage | ExpoPushMessage[]
  ): Promise<ExpoPushResponse> {
    try {
      const messagesArray = Array.isArray(messages) ? messages : [messages];

      // Validate Expo push tokens
      messagesArray.forEach((message) => {
        const tokens = Array.isArray(message.to) ? message.to : [message.to];
        tokens.forEach((token) => {
          if (!this.isExpoPushToken(token)) {
            throw new Error(`Invalid Expo push token: ${token}`);
          }
        });
      });

      const response = await axios.post<ExpoPushResponse>(
        EXPO_PUSH_URL,
        messagesArray,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  },

  /**
   * Send a simple notification to a single device
   * @param deviceToken - Expo push token
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional data payload
   */
  async sendSimpleNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: object
  ): Promise<ExpoPushResponse> {
    const message: ExpoPushMessage = {
      to: deviceToken,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
    };

    return await this.sendPushNotification(message);
  },

  /**
   * Send notification to multiple devices
   * @param deviceTokens - Array of Expo push tokens
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional data payload
   */
  async sendBulkNotification(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: object
  ): Promise<ExpoPushResponse> {
    const messages: ExpoPushMessage[] = deviceTokens.map((token) => ({
      to: token,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
    }));

    return await this.sendPushNotification(messages);
  },

  /**
   * Send reminder notification (basic version - kept for backward compatibility)
   * @param deviceToken - Expo push token
   * @param mantraText - The mantra text to include
   * @param reminderId - The reminder ID for deep linking
   * @param mantraId - The mantra ID for deep linking to mantra detail
   * @deprecated Use sendEnhancedReminderNotification for better content
   */
  async sendReminderNotification(
    deviceToken: string,
    mantraText: string,
    reminderId: number,
    mantraId?: number
  ): Promise<ExpoPushResponse> {
    const title = 'Time for your mantra';
    const body = mantraText.length > 100 ? `${mantraText.substring(0, 97)}...` : mantraText;

    return await this.sendSimpleNotification(deviceToken, title, body, {
      type: 'reminder',
      reminderId,
      mantraId,
      mantraText,
    });
  },

  /**
   * Send enhanced reminder notification with motivational content and CTAs
   * @param deviceToken - Expo push token
   * @param mantraText - The mantra text to include
   * @param reminderId - The reminder ID for deep linking
   * @param mantraId - The mantra ID for deep linking to mantra detail
   * @param options - Optional notification content customization
   * @returns Expo push response
   */
  async sendEnhancedReminderNotification(
    deviceToken: string,
    mantraText: string,
    reminderId: number,
    mantraId?: number,
    options?: Partial<NotificationContentOptions>
  ): Promise<ExpoPushResponse> {
    // Generate notification content using templates
    const { title, body } = generateNotificationContent({
      mantraText,
      ...options,
    });

    return await this.sendSimpleNotification(deviceToken, title, body, {
      type: 'reminder',
      reminderId,
      mantraId,
      mantraText,
    });
  },

  /**
   * Send collection reminder notification
   * Deep links to a collection instead of a single mantra
   * @param deviceToken - Expo push token
   * @param collectionName - The collection name for notification content
   * @param reminderId - The reminder ID for deep linking
   * @param collectionId - The collection ID for deep linking to collection detail
   * @param mantraCount - Optional count of mantras in collection for context
   * @param options - Optional notification content customization
   * @returns Expo push response
   */
  async sendCollectionReminderNotification(
    deviceToken: string,
    collectionName: string,
    reminderId: number,
    collectionId: number,
    mantraCount?: number,
    options?: Partial<NotificationContentOptions>
  ): Promise<ExpoPushResponse> {
    // Generate notification content with collection context
    const collectionText = mantraCount
      ? `Explore your "${collectionName}" collection with ${mantraCount} mantras`
      : `Time to explore your "${collectionName}" collection`;

    const { title, body } = generateNotificationContent({
      mantraText: collectionText,
      ...options,
    });

    return await this.sendSimpleNotification(deviceToken, title, body, {
      type: 'collection_reminder',
      reminderId,
      collectionId,
      collectionName,
    });
  },

  /**
   * Send bulk reminder notifications with enhanced content
   * Supports both mantra-based and collection-based reminders
   * @param notifications - Array of notification details
   * @returns Expo push response
   */
  async sendBulkEnhancedReminders(
    notifications: Array<{
      deviceToken: string;
      mantraText: string;
      reminderId: number;
      mantraId?: number;
      collectionId?: number;
      collectionName?: string;
      categoryName?: string;
      ctaStyle?: CTAStyle;
    }>
  ): Promise<ExpoPushResponse> {
    const messages: ExpoPushMessage[] = notifications.map((notif) => {
      const { title, body } = generateNotificationContent({
        mantraText: notif.mantraText,
        categoryName: notif.categoryName,
        ctaStyle: notif.ctaStyle,
      });

      // Determine notification type based on whether it's collection-based
      const isCollectionReminder = notif.collectionId !== undefined;

      return {
        to: notif.deviceToken,
        title,
        body,
        data: isCollectionReminder
          ? {
              type: 'collection_reminder',
              reminderId: notif.reminderId,
              collectionId: notif.collectionId,
              collectionName: notif.collectionName,
            }
          : {
              type: 'reminder',
              reminderId: notif.reminderId,
              mantraId: notif.mantraId,
              mantraText: notif.mantraText,
            },
        sound: 'default',
        priority: 'high',
      };
    });

    return await this.sendPushNotification(messages);
  },

  /**
   * Validate if a string is a valid Expo push token
   * @param token - Token to validate
   * @returns True if valid Expo push token
   */
  isExpoPushToken(token: string): boolean {
    return (
      typeof token === 'string' &&
      (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
    );
  },

  /**
   * Check receipt status for sent notifications
   * Expo provides receipt IDs after sending, which can be used to check delivery status
   * @param receiptIds - Array of receipt IDs from previous send operations
   */
  async getReceipts(receiptIds: string[]): Promise<any> {
    try {
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/getReceipts',
        { ids: receiptIds },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching push receipts:', error);
      throw error;
    }
  },

  /**
   * Create a notification message with custom options
   * @param options - Notification options
   * @returns Formatted message object
   */
  createMessage(options: {
    to: string | string[];
    title: string;
    body: string;
    data?: object;
    badge?: number;
    sound?: 'default' | null;
    priority?: 'default' | 'normal' | 'high';
    ttl?: number;
    channelId?: string;
  }): ExpoPushMessage {
    return {
      to: options.to,
      title: options.title,
      body: options.body,
      data: options.data || {},
      sound: options.sound !== undefined ? options.sound : 'default',
      badge: options.badge,
      priority: options.priority || 'default',
      ttl: options.ttl,
      channelId: options.channelId,
    };
  },
};
