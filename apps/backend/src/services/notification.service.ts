import axios from 'axios';

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
   * Send reminder notification
   * @param deviceToken - Expo push token
   * @param mantraText - The mantra text to include
   * @param reminderId - The reminder ID for deep linking
   */
  async sendReminderNotification(
    deviceToken: string,
    mantraText: string,
    reminderId: number
  ): Promise<ExpoPushResponse> {
    const title = 'Time for your mantra';
    const body = mantraText.length > 100 ? `${mantraText.substring(0, 97)}...` : mantraText;

    return await this.sendSimpleNotification(deviceToken, title, body, {
      type: 'reminder',
      reminderId,
      mantraText,
    });
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
