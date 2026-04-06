import axios from 'axios';
import { NotificationService } from '../../src/services/notification.service';
import { UserModel } from '../../src/models/user.model';

jest.mock('axios');
jest.mock('../../src/models/user.model');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

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
          headers: expect.objectContaining({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        },
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
        expect.any(Object),
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
        'Invalid Expo push token: InvalidToken',
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
        'Network error',
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
        { key: 'value' },
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
            channelId: 'default',
          },
        ],
        expect.any(Object),
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

      await NotificationService.sendSimpleNotification('ExponentPushToken[xxx]', 'Title', 'Body');

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
            channelId: 'default',
          },
        ],
        expect.any(Object),
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
        { type: 'bulk' },
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
            channelId: 'default',
          },
          {
            to: 'ExponentPushToken[yyy]',
            title: 'Bulk Title',
            body: 'Bulk Body',
            data: { type: 'bulk' },
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          },
        ],
        expect.any(Object),
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
      await NotificationService.sendReminderNotification('ExponentPushToken[xxx]', mantraText, 123);

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
              mantraId: undefined,
              mantraText: mantraText,
            },
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          },
        ],
        expect.any(Object),
      );
    });

    it('should include mantraId in notification data when provided', async () => {
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
        123,
        456,
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
              mantraId: 456,
              mantraText: mantraText,
            },
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          },
        ],
        expect.any(Object),
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
      await NotificationService.sendReminderNotification('ExponentPushToken[xxx]', longMantra, 123);

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
          headers: expect.objectContaining({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        },
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
        123,
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].data.type).toBe('reminder');
      expect(calledWith[0].data.reminderId).toBe(123);
      expect(calledWith[0].data.mantraText).toBe(mantraText);
    });

    it('should include mantraId in notification data when provided', async () => {
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
        123,
        456,
        { categoryName: 'confidence' },
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].data.type).toBe('reminder');
      expect(calledWith[0].data.reminderId).toBe(123);
      expect(calledWith[0].data.mantraId).toBe(456);
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
        undefined,
        { categoryName: 'confidence' },
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
        undefined,
        { ctaStyle: 'encouraging' },
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
        undefined,
        { customTitle },
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
        expect.any(Object),
      );
    });

    it('should include mantraId in bulk notification data when provided', async () => {
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
          mantraId: 101,
        },
        {
          deviceToken: 'ExponentPushToken[yyy]',
          mantraText: 'Mantra 2',
          reminderId: 2,
          mantraId: 102,
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
              mantraId: 101,
            }),
          }),
          expect.objectContaining({
            to: 'ExponentPushToken[yyy]',
            data: expect.objectContaining({
              type: 'reminder',
              reminderId: 2,
              mantraId: 102,
            }),
          }),
        ]),
        expect.any(Object),
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

    it('should send collection-based notifications with collection_reminder type', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt1' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const notifications = [
        {
          deviceToken: 'ExponentPushToken[xxx]',
          mantraText: 'Collection notification',
          reminderId: 1,
          collectionId: 10,
          collectionName: 'My Collection',
        },
      ];

      await NotificationService.sendBulkEnhancedReminders(notifications);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.arrayContaining([
          expect.objectContaining({
            to: 'ExponentPushToken[xxx]',
            data: expect.objectContaining({
              type: 'collection_reminder',
              reminderId: 1,
              collectionId: 10,
              collectionName: 'My Collection',
            }),
          }),
        ]),
        expect.any(Object),
      );
    });

    it('should handle mixed mantra and collection notifications', async () => {
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
          mantraText: 'Mantra notification',
          reminderId: 1,
          mantraId: 100,
        },
        {
          deviceToken: 'ExponentPushToken[yyy]',
          mantraText: 'Collection notification',
          reminderId: 2,
          collectionId: 10,
          collectionName: 'My Collection',
        },
      ];

      await NotificationService.sendBulkEnhancedReminders(notifications);

      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].data.type).toBe('reminder');
      expect(calledWith[0].data.mantraId).toBe(100);
      expect(calledWith[1].data.type).toBe('collection_reminder');
      expect(calledWith[1].data.collectionId).toBe(10);
    });
  });

  describe('sendCollectionReminderNotification', () => {
    it('should send collection reminder notification with correct format', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendCollectionReminderNotification(
        'ExponentPushToken[xxx]',
        'My Collection',
        123,
        456,
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].data.type).toBe('collection_reminder');
      expect(calledWith[0].data.reminderId).toBe(123);
      expect(calledWith[0].data.collectionId).toBe(456);
      expect(calledWith[0].data.collectionName).toBe('My Collection');
    });

    it('should include mantra count in body when provided', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendCollectionReminderNotification(
        'ExponentPushToken[xxx]',
        'My Collection',
        123,
        456,
        5,
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      // The body should mention the mantra count
      expect(calledWith[0].body).toContain('5 mantras');
    });

    it('should generate appropriate body without mantra count', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendCollectionReminderNotification(
        'ExponentPushToken[xxx]',
        'Morning Mantras',
        123,
        456,
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].body).toContain('Morning Mantras');
    });

    it('should accept custom options for content generation', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendCollectionReminderNotification(
        'ExponentPushToken[xxx]',
        'Confidence Collection',
        123,
        456,
        undefined,
        { ctaStyle: 'encouraging' },
      );

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('sendJournalReminderNotification', () => {
    it('should send journal reminder notification with title', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendJournalReminderNotification(
        'ExponentPushToken[xxx]',
        'My Journal Entry',
        'Some content here',
        123,
        456,
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      expect(calledWith[0].data.type).toBe('journal_reminder');
      expect(calledWith[0].data.reminderId).toBe(123);
      expect(calledWith[0].data.journalId).toBe(456);
      expect(calledWith[0].data.journalTitle).toBe('My Journal Entry');
    });

    it('should use content substring as fallback when title is null', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const longContent = 'A'.repeat(200);
      await NotificationService.sendJournalReminderNotification(
        'ExponentPushToken[xxx]',
        null,
        longContent,
        123,
        456,
      );

      expect(mockedAxios.post).toHaveBeenCalled();
      const calledWith = mockedAxios.post.mock.calls[0][1] as any[];
      // displayText should be content.substring(0, 100)
      expect(calledWith[0].data.journalTitle).toBe('A'.repeat(100));
    });

    it('should accept custom options for content generation', async () => {
      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendJournalReminderNotification(
        'ExponentPushToken[xxx]',
        'My Journal',
        'Content',
        123,
        456,
        { ctaStyle: 'encouraging' },
      );

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('Expo access token header', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should include Authorization header when EXPO_ACCESS_TOKEN is set', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token-123';

      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendPushNotification({
        to: 'ExponentPushToken[xxx]',
        title: 'Test',
        body: 'Message',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.any(Array),
        {
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        },
      );
    });

    it('should not include Authorization header when EXPO_ACCESS_TOKEN is not set', async () => {
      delete process.env.EXPO_ACCESS_TOKEN;

      const mockResponse = {
        data: {
          data: [{ status: 'ok', id: 'receipt-id' }],
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      await NotificationService.sendPushNotification({
        to: 'ExponentPushToken[xxx]',
        title: 'Test',
        body: 'Message',
      });

      const calledHeaders = mockedAxios.post.mock.calls[0][2]?.headers as Record<string, string>;
      expect(calledHeaders).not.toHaveProperty('Authorization');
    });

    it('should include Authorization header in getReceipts when EXPO_ACCESS_TOKEN is set', async () => {
      process.env.EXPO_ACCESS_TOKEN = 'test-token-456';

      mockedAxios.post.mockResolvedValue({ data: {} });

      await NotificationService.getReceipts(['receipt-1']);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/getReceipts',
        expect.any(Object),
        {
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-456',
          }),
        },
      );
    });
  });

  describe('handleTicketErrors', () => {
    it('should clear device token when DeviceNotRegistered error is received', async () => {
      const mockUser = { user_id: 42 } as any;
      mockedUserModel.findByDeviceToken.mockResolvedValue(mockUser);
      mockedUserModel.clearDeviceToken.mockResolvedValue(undefined);

      const tickets = [
        {
          status: 'error' as const,
          details: { error: 'DeviceNotRegistered' },
        },
      ];
      const messages = [{ to: 'ExponentPushToken[expired]', title: 'Test', body: 'Body' }];

      await NotificationService.handleTicketErrors(tickets, messages);

      expect(mockedUserModel.findByDeviceToken).toHaveBeenCalledWith('ExponentPushToken[expired]');
      expect(mockedUserModel.clearDeviceToken).toHaveBeenCalledWith(42);
    });

    it('should not clear token for successful tickets', async () => {
      const tickets = [{ status: 'ok' as const, id: 'receipt-1' }];
      const messages = [{ to: 'ExponentPushToken[valid]', title: 'Test', body: 'Body' }];

      await NotificationService.handleTicketErrors(tickets, messages);

      expect(mockedUserModel.findByDeviceToken).not.toHaveBeenCalled();
      expect(mockedUserModel.clearDeviceToken).not.toHaveBeenCalled();
    });

    it('should handle when no user is found for the stale token', async () => {
      mockedUserModel.findByDeviceToken.mockResolvedValue(undefined);

      const tickets = [
        {
          status: 'error' as const,
          details: { error: 'DeviceNotRegistered' },
        },
      ];
      const messages = [{ to: 'ExponentPushToken[orphan]', title: 'Test', body: 'Body' }];

      await NotificationService.handleTicketErrors(tickets, messages);

      expect(mockedUserModel.findByDeviceToken).toHaveBeenCalledWith('ExponentPushToken[orphan]');
      expect(mockedUserModel.clearDeviceToken).not.toHaveBeenCalled();
    });

    it('should handle errors during cleanup gracefully', async () => {
      mockedUserModel.findByDeviceToken.mockRejectedValue(new Error('DB error'));

      const tickets = [
        {
          status: 'error' as const,
          details: { error: 'DeviceNotRegistered' },
        },
      ];
      const messages = [{ to: 'ExponentPushToken[broken]', title: 'Test', body: 'Body' }];

      // Should not throw
      await NotificationService.handleTicketErrors(tickets, messages);
    });

    it('should handle mixed tickets and only clear DeviceNotRegistered tokens', async () => {
      const mockUser = { user_id: 7 } as any;
      mockedUserModel.findByDeviceToken.mockResolvedValue(mockUser);
      mockedUserModel.clearDeviceToken.mockResolvedValue(undefined);

      const tickets = [
        { status: 'ok' as const, id: 'receipt-1' },
        {
          status: 'error' as const,
          details: { error: 'DeviceNotRegistered' },
        },
        {
          status: 'error' as const,
          message: 'Some other error',
          details: { error: 'InvalidCredentials' },
        },
      ];
      const messages = [
        { to: 'ExponentPushToken[good]', title: 'Test', body: 'Body' },
        { to: 'ExponentPushToken[expired]', title: 'Test', body: 'Body' },
        { to: 'ExponentPushToken[other]', title: 'Test', body: 'Body' },
      ];

      await NotificationService.handleTicketErrors(tickets, messages);

      expect(mockedUserModel.findByDeviceToken).toHaveBeenCalledTimes(1);
      expect(mockedUserModel.findByDeviceToken).toHaveBeenCalledWith('ExponentPushToken[expired]');
      expect(mockedUserModel.clearDeviceToken).toHaveBeenCalledWith(7);
    });
  });
});
