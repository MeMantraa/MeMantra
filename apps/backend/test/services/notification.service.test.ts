import axios from 'axios';
import { NotificationService } from '../../src/services/notification.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPushNotification', () => {
    it('should send a single push notification successfully', async () => {
      const mockMessage = {
        to: 'ExponentPushToken[xxx]',
        title: 'Test',
        body: 'Message',
      };

      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await NotificationService.sendPushNotification(mockMessage);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        [mockMessage],
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should send multiple push notifications successfully', async () => {
      const mockMessages = [
        { to: 'ExponentPushToken[xxx]', title: 'Test1', body: 'Message1' },
        { to: 'ExponentPushToken[yyy]', title: 'Test2', body: 'Message2' },
      ];

      const mockResponse = {
        data: {
          data: [
            { status: 'ok', id: 'receipt1' },
            { status: 'ok', id: 'receipt2' },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await NotificationService.sendPushNotification(mockMessages);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        mockMessages,
        expect.any(Object)
      );
      expect(result.data).toHaveLength(2);
    });

    it('should throw error for invalid token format', async () => {
      const mockMessage = {
        to: 'InvalidToken',
        title: 'Test',
        body: 'Message',
      };

      await expect(NotificationService.sendPushNotification(mockMessage)).rejects.toThrow(
        'Invalid Expo push token: InvalidToken'
      );
    });

    it('should handle API errors', async () => {
      const mockMessage = {
        to: 'ExponentPushToken[xxx]',
        title: 'Test',
        body: 'Message',
      };

      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(NotificationService.sendPushNotification(mockMessage)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('sendSimpleNotification', () => {
    it('should send a simple notification with default settings', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await NotificationService.sendSimpleNotification(
        'ExponentPushToken[xxx]',
        'Title',
        'Body',
        { key: 'value' }
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        [
          {
            to: 'ExponentPushToken[xxx]',
            title: 'Title',
            body: 'Body',
            data: { key: 'value' },
            sound: 'default',
            priority: 'high',
          },
        ],
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle missing data parameter', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendSimpleNotification(
        'ExponentPushToken[xxx]',
        'Title',
        'Body'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        [
          {
            to: 'ExponentPushToken[xxx]',
            title: 'Title',
            body: 'Body',
            data: {},
            sound: 'default',
            priority: 'high',
          },
        ],
        expect.any(Object)
      );
    });
  });

  describe('sendBulkNotification', () => {
    it('should send notifications to multiple devices', async () => {
      const mockTokens = ['ExponentPushToken[xxx]', 'ExponentPushToken[yyy]'];
      const mockResponse = {
        data: {
          data: [
            { status: 'ok', id: 'receipt1' },
            { status: 'ok', id: 'receipt2' },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await NotificationService.sendBulkNotification(
        mockTokens,
        'Bulk Title',
        'Bulk Body',
        { type: 'bulk' }
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        [
          {
            to: 'ExponentPushToken[xxx]',
            title: 'Bulk Title',
            body: 'Bulk Body',
            data: { type: 'bulk' },
            sound: 'default',
            priority: 'high',
          },
          {
            to: 'ExponentPushToken[yyy]',
            title: 'Bulk Title',
            body: 'Bulk Body',
            data: { type: 'bulk' },
            sound: 'default',
            priority: 'high',
          },
        ],
        expect.any(Object)
      );
      expect(result.data).toHaveLength(2);
    });
  });

  describe('sendReminderNotification', () => {
    it('should send reminder notification with correct format', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const mantraText = 'I am strong and capable';
      await NotificationService.sendReminderNotification(
        'ExponentPushToken[xxx]',
        mantraText,
        123
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        [
          {
            to: 'ExponentPushToken[xxx]',
            title: 'Time for your mantra',
            body: mantraText,
            data: {
              type: 'reminder',
              reminderId: 123,
              mantraText: mantraText,
            },
            sound: 'default',
            priority: 'high',
          },
        ],
        expect.any(Object)
      );
    });

    it('should truncate long mantra text to 100 characters', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const longMantra = 'A'.repeat(150);
      await NotificationService.sendReminderNotification(
        'ExponentPushToken[xxx]',
        longMantra,
        123
      );

      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].body).toBe('A'.repeat(97) + '...');
      expect(calledWith[0].data.mantraText).toBe(longMantra); // Full text in data
    });
  });

  describe('isExpoPushToken', () => {
    it('should validate ExponentPushToken format', () => {
      expect(NotificationService.isExpoPushToken('ExponentPushToken[xxx]')).toBe(true);
    });

    it('should validate ExpoPushToken format', () => {
      expect(NotificationService.isExpoPushToken('ExpoPushToken[yyy]')).toBe(true);
    });

    it('should reject invalid token formats', () => {
      expect(NotificationService.isExpoPushToken('InvalidToken')).toBe(false);
      expect(NotificationService.isExpoPushToken('PushToken[xxx]')).toBe(false);
      expect(NotificationService.isExpoPushToken('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(NotificationService.isExpoPushToken(null as any)).toBe(false);
      expect(NotificationService.isExpoPushToken(undefined as any)).toBe(false);
      expect(NotificationService.isExpoPushToken(123 as any)).toBe(false);
    });
  });

  describe('getReceipts', () => {
    it('should fetch receipts successfully', async () => {
      const mockReceipts = {
        data: {
          'receipt-id-1': { status: 'ok' },
          'receipt-id-2': { status: 'error', message: 'DeviceNotRegistered' },
        },
      };

      mockedAxios.post.mockResolvedValue(mockReceipts);

      const result = await NotificationService.getReceipts(['receipt-id-1', 'receipt-id-2']);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/getReceipts',
        { ids: ['receipt-id-1', 'receipt-id-2'] },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockReceipts.data);
    });

    it('should handle receipt fetch errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API error'));

      await expect(NotificationService.getReceipts(['receipt-id'])).rejects.toThrow('API error');
    });
  });

  describe('createMessage', () => {
    it('should create message with all options', () => {
      const message = NotificationService.createMessage({
        to: 'ExponentPushToken[xxx]',
        title: 'Custom Title',
        body: 'Custom Body',
        data: { key: 'value' },
        badge: 5,
        sound: null,
        priority: 'normal',
        ttl: 3600,
        channelId: 'custom-channel',
      });

      expect(message).toEqual({
        to: 'ExponentPushToken[xxx]',
        title: 'Custom Title',
        body: 'Custom Body',
        data: { key: 'value' },
        badge: 5,
        sound: null,
        priority: 'normal',
        ttl: 3600,
        channelId: 'custom-channel',
      });
    });

    it('should use default values for optional fields', () => {
      const message = NotificationService.createMessage({
        to: 'ExponentPushToken[xxx]',
        title: 'Title',
        body: 'Body',
      });

      expect(message).toEqual({
        to: 'ExponentPushToken[xxx]',
        title: 'Title',
        body: 'Body',
        data: {},
        sound: 'default',
        priority: 'default',
        ttl: undefined,
        badge: undefined,
        channelId: undefined,
      });
    });

    it('should handle multiple recipients', () => {
      const message = NotificationService.createMessage({
        to: ['ExponentPushToken[xxx]', 'ExponentPushToken[yyy]'],
        title: 'Title',
        body: 'Body',
      });

      expect(message.to).toEqual(['ExponentPushToken[xxx]', 'ExponentPushToken[yyy]']);
    });
  });

  describe('sendEnhancedReminderNotification', () => {
    it('should send enhanced notification with generated content', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const mantraText = 'I am strong and capable';
      await NotificationService.sendEnhancedReminderNotification(
        'ExponentPushToken[xxx]',
        mantraText,
        123
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].data.type).toBe('reminder');
      expect(calledWith[0].data.reminderId).toBe(123);
      expect(calledWith[0].data.mantraText).toBe(mantraText);
    });

    it('should accept custom category for content generation', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendEnhancedReminderNotification(
        'ExponentPushToken[xxx]',
        'I am confident',
        123,
        { categoryName: 'confidence' }
      );

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should accept custom CTA style', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendEnhancedReminderNotification(
        'ExponentPushToken[xxx]',
        'Test mantra',
        123,
        { ctaStyle: 'encouraging' }
      );

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should use custom title when provided', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const customTitle = 'My Custom Title';
      await NotificationService.sendEnhancedReminderNotification(
        'ExponentPushToken[xxx]',
        'Test',
        123,
        { customTitle }
      );

      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].title).toBe(customTitle);
    });
  });

  describe('sendBulkEnhancedReminders', () => {
    it('should send bulk enhanced notifications', async () => {
      const mockResponse = {
        data: {
          data: [
            { status: 'ok', id: 'receipt1' },
            { status: 'ok', id: 'receipt2' },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const notifications = [
        {
          deviceToken: 'ExponentPushToken[xxx]',
          mantraText: 'Mantra 1',
          reminderId: 1,
        },
        {
          deviceToken: 'ExponentPushToken[yyy]',
          mantraText: 'Mantra 2',
          reminderId: 2,
          categoryName: 'confidence',
        },
      ];

      await NotificationService.sendBulkEnhancedReminders(notifications);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.arrayContaining([
          expect.objectContaining({
            to: 'ExponentPushToken[xxx]',
            data: expect.objectContaining({
              type: 'reminder',
              reminderId: 1,
            }),
          }),
          expect.objectContaining({
            to: 'ExponentPushToken[yyy]',
            data: expect.objectContaining({
              type: 'reminder',
              reminderId: 2,
            }),
          }),
        ]),
        expect.any(Object)
      );
    });

    it('should apply different CTA styles to different notifications', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt1' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const notifications = [
        {
          deviceToken: 'ExponentPushToken[xxx]',
          mantraText: 'Mantra',
          reminderId: 1,
          ctaStyle: 'encouraging' as const,
        },
      ];

      await NotificationService.sendBulkEnhancedReminders(notifications);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });
});
