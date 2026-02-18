import { RecommendationNotificationService } from '../../src/services/recommendation-notification.service';
import { UserModel } from '../../src/models/user.model';
import { RecommendationEngine } from '../../src/services/recommendation-engine.service';
import { NotificationService } from '../../src/services/notification.service';
import * as NotificationContentConfig from '../../src/config/notification-content.config';

jest.mock('../../src/models/user.model');
jest.mock('../../src/services/recommendation-engine.service');
jest.mock('../../src/services/notification.service');
jest.mock('../../src/config/notification-content.config');
jest.mock('node-cron', () => {
  const mockTask = { stop: jest.fn() };
  return {
    schedule: jest.fn(() => mockTask),
    validate: jest.fn(() => true),
  };
});

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedRecommendationEngine = RecommendationEngine as jest.Mocked<typeof RecommendationEngine>;
const mockedNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockedGenerateNotificationContent =
  NotificationContentConfig.generateNotificationContent as jest.Mock;

// ─── helpers ─────────────────────────────────────────────────────────────────

const DEVICE_TOKEN = 'ExponentPushToken[testToken]';

const mockMantra = (id: number) => ({
  mantra_id: id,
  title: `Mantra ${id}` as string | null,
  key_takeaway: `Takeaway ${id}` as string | null,
  background_author: null as string | null,
  background_description: null as string | null,
  jamie_take: null as string | null,
  when_where: null as string | null,
  negative_thoughts: null as string | null,
  cbt_principles: null as string | null,
  references: null as string | null,
  created_by: null as number | null,
  is_active: true as boolean | null,
  created_at: new Date().toISOString() as string | null,
});

const mockUser = (id: number, token: string = DEVICE_TOKEN) => ({
  user_id: id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  device_token: token,
  password_hash: 'hash',
  auth_provider: 'local' as const,
  first_name: null,
  last_name: null,
  created_at: new Date().toISOString(),
});

const mockRecommendation = (mantraId: number, categoryName?: string) => ({
  mantra: mockMantra(mantraId),
  score: 0.85,
  categories: categoryName ? [{ category_id: 100, name: categoryName }] : [],
  reason: 'matches your preferred categories',
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('RecommendationNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RecommendationNotificationService.cronTask = null;
    RecommendationNotificationService.isRunning = false;
    mockedGenerateNotificationContent.mockReturnValue({
      title: 'Your daily mantra',
      body: '"Takeaway"\n\nTap to read',
    });
  });

  afterEach(() => {
    RecommendationNotificationService.stop();
  });

  // ── start ──────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('should start in test mode and set isRunning to true', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RecommendationNotificationService.start({ testMode: true });

      expect(RecommendationNotificationService.isRunning).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '🧪 Recommendation notification scheduler started in test mode',
      );

      consoleSpy.mockRestore();
    });

    it('should warn and do nothing if already running', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RecommendationNotificationService.start({ testMode: true });
      RecommendationNotificationService.start({ testMode: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  Recommendation notification scheduler is already running',
      );

      consoleSpy.mockRestore();
    });

    it('should reject an invalid cron expression and not start', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      RecommendationNotificationService.start({ cronExpression: 'not-a-cron' });

      expect(RecommendationNotificationService.isRunning).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Invalid cron expression: not-a-cron');

      consoleSpy.mockRestore();
    });

    it('should schedule a cron task and set isRunning when expression is valid', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RecommendationNotificationService.start({ cronExpression: '0 9 * * *' });

      expect(cron.schedule).toHaveBeenCalledWith('0 9 * * *', expect.any(Function));
      expect(RecommendationNotificationService.isRunning).toBe(true);
      expect(RecommendationNotificationService.cronTask).not.toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Recommendation notification scheduler started successfully',
      );

      consoleSpy.mockRestore();
    });
  });

  // ── stop ───────────────────────────────────────────────────────────────────

  describe('stop', () => {
    it('should set isRunning to false and log the stop message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RecommendationNotificationService.start({ testMode: true });
      RecommendationNotificationService.stop();

      expect(RecommendationNotificationService.isRunning).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '🛑 Recommendation notification scheduler stopped',
      );

      consoleSpy.mockRestore();
    });

    it('should call stop on the cron task and clear cronTask', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RecommendationNotificationService.start({ cronExpression: '0 9 * * *' });
      const task = RecommendationNotificationService.cronTask;
      expect(task).not.toBeNull();

      RecommendationNotificationService.stop();

      expect(task!.stop).toHaveBeenCalled();
      expect(RecommendationNotificationService.cronTask).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  // ── getStatus ──────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('should report not running before start is called', () => {
      expect(RecommendationNotificationService.getStatus()).toEqual({
        isRunning: false,
        hasCronTask: false,
      });
    });

    it('should report running without a cron task in test mode', () => {
      RecommendationNotificationService.start({ testMode: true });

      expect(RecommendationNotificationService.getStatus()).toEqual({
        isRunning: true,
        hasCronTask: false,
      });
    });
  });

  // ── sendToUser ─────────────────────────────────────────────────────────────

  describe('sendToUser', () => {
    it('should generate a recommendation and send a notification with the correct args', async () => {
      const rec = mockRecommendation(42, 'Mindfulness');
      mockedRecommendationEngine.generateRecommendations.mockResolvedValue([rec]);
      mockedNotificationService.sendSimpleNotification.mockResolvedValue({
        data: [{ status: 'ok', id: 'ticket-1' }],
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(mockedRecommendationEngine.generateRecommendations).toHaveBeenCalledWith(1, { limit: 1 });
      expect(mockedGenerateNotificationContent).toHaveBeenCalledWith({
        mantraText: 'Takeaway 42',
        categoryName: 'Mindfulness',
      });
      expect(mockedNotificationService.sendSimpleNotification).toHaveBeenCalledWith(
        DEVICE_TOKEN,
        'Your daily mantra',
        '"Takeaway"\n\nTap to read',
        {
          type: 'recommendation',
          mantraId: 42,
          reason: 'matches your preferred categories',
        },
      );
      expect(result).toEqual({ userId: 1, success: true });

      consoleSpy.mockRestore();
    });

    it('should fall back to title when key_takeaway is null', async () => {
      const rec = mockRecommendation(7, 'Calm');
      rec.mantra.key_takeaway = null;
      rec.mantra.title = 'Be at peace';

      mockedRecommendationEngine.generateRecommendations.mockResolvedValue([rec]);
      mockedNotificationService.sendSimpleNotification.mockResolvedValue({
        data: [{ status: 'ok' }],
      });

      jest.spyOn(console, 'log').mockImplementation();

      await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(mockedGenerateNotificationContent).toHaveBeenCalledWith(
        expect.objectContaining({ mantraText: 'Be at peace' }),
      );
    });

    it('should pass undefined as categoryName when mantra has no categories', async () => {
      const rec = mockRecommendation(5);
      rec.categories = [];

      mockedRecommendationEngine.generateRecommendations.mockResolvedValue([rec]);
      mockedNotificationService.sendSimpleNotification.mockResolvedValue({
        data: [{ status: 'ok' }],
      });

      jest.spyOn(console, 'log').mockImplementation();

      await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(mockedGenerateNotificationContent).toHaveBeenCalledWith({
        mantraText: 'Takeaway 5',
        categoryName: undefined,
      });
    });

    it('should return failure when no recommendations are available', async () => {
      mockedRecommendationEngine.generateRecommendations.mockResolvedValue([]);

      const result = await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(result).toEqual({
        userId: 1,
        success: false,
        error: 'No recommendations available',
      });
      expect(mockedNotificationService.sendSimpleNotification).not.toHaveBeenCalled();
    });

    it('should return failure when the recommended mantra has no displayable text', async () => {
      const rec = mockRecommendation(3);
      rec.mantra.key_takeaway = null;
      rec.mantra.title = null;

      mockedRecommendationEngine.generateRecommendations.mockResolvedValue([rec]);

      const result = await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(result).toEqual({
        userId: 1,
        success: false,
        error: 'Recommended mantra has no displayable text',
      });
      expect(mockedNotificationService.sendSimpleNotification).not.toHaveBeenCalled();
    });

    it('should return failure when the recommendation engine throws', async () => {
      mockedRecommendationEngine.generateRecommendations.mockRejectedValue(
        new Error('DB connection failed'),
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(result).toEqual({
        userId: 1,
        success: false,
        error: 'DB connection failed',
      });

      consoleSpy.mockRestore();
    });

    it('should return failure when the notification service throws', async () => {
      mockedRecommendationEngine.generateRecommendations.mockResolvedValue([
        mockRecommendation(10, 'Motivation'),
      ]);
      mockedNotificationService.sendSimpleNotification.mockRejectedValue(
        new Error('Expo API error'),
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(result).toEqual({
        userId: 1,
        success: false,
        error: 'Expo API error',
      });

      consoleSpy.mockRestore();
    });

    it('should return a generic error message when a non-Error value is thrown', async () => {
      mockedRecommendationEngine.generateRecommendations.mockRejectedValue('string error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await RecommendationNotificationService.sendToUser(1, DEVICE_TOKEN);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');

      consoleSpy.mockRestore();
    });
  });

  // ── processAllUsers ────────────────────────────────────────────────────────

  describe('processAllUsers', () => {
    it('should return an empty array when no users have device tokens', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([]);

      const results = await RecommendationNotificationService.processAllUsers();

      expect(results).toEqual([]);
      expect(mockedRecommendationEngine.generateRecommendations).not.toHaveBeenCalled();
    });

    it('should send a notification to every user and return success results', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([
        mockUser(1, 'ExponentPushToken[aaa]'),
        mockUser(2, 'ExponentPushToken[bbb]'),
      ]);
      mockedRecommendationEngine.generateRecommendations.mockResolvedValue([
        mockRecommendation(10, 'Gratitude'),
      ]);
      mockedNotificationService.sendSimpleNotification.mockResolvedValue({
        data: [{ status: 'ok' }],
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const results = await RecommendationNotificationService.processAllUsers();

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockedRecommendationEngine.generateRecommendations).toHaveBeenCalledTimes(2);
      expect(mockedRecommendationEngine.generateRecommendations).toHaveBeenCalledWith(
        1, { limit: 1 },
      );
      expect(mockedRecommendationEngine.generateRecommendations).toHaveBeenCalledWith(
        2, { limit: 1 },
      );

      consoleSpy.mockRestore();
    });

    it('should continue processing remaining users when one fails', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([
        mockUser(1, 'ExponentPushToken[aaa]'),
        mockUser(2, 'ExponentPushToken[bbb]'),
        mockUser(3, 'ExponentPushToken[ccc]'),
      ]);
      mockedRecommendationEngine.generateRecommendations
        .mockResolvedValueOnce([])                               // user 1: no results
        .mockResolvedValueOnce([mockRecommendation(20, 'Calm')]) // user 2: success
        .mockRejectedValueOnce(new Error('Engine error'));        // user 3: throws

      mockedNotificationService.sendSimpleNotification.mockResolvedValue({
        data: [{ status: 'ok' }],
      });

      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();

      const results = await RecommendationNotificationService.processAllUsers();

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ userId: 1, success: false, error: 'No recommendations available' });
      expect(results[1]).toEqual({ userId: 2, success: true });
      expect(results[2]).toEqual({ userId: 3, success: false, error: 'Engine error' });
    });

    it('should log summary counts after processing', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([
        mockUser(1),
        mockUser(2),
      ]);
      mockedRecommendationEngine.generateRecommendations
        .mockResolvedValueOnce([mockRecommendation(1)]) // user 1: success
        .mockResolvedValueOnce([]);                      // user 2: no results → failure

      mockedNotificationService.sendSimpleNotification.mockResolvedValue({
        data: [{ status: 'ok' }],
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await RecommendationNotificationService.processAllUsers();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 sent, 1 failed'),
      );

      consoleSpy.mockRestore();
    });

    it('should catch and log a top-level error without throwing', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockRejectedValue(new Error('Database down'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const results = await RecommendationNotificationService.processAllUsers();

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error processing recommendation notifications:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  // ── triggerProcessing ──────────────────────────────────────────────────────

  describe('triggerProcessing', () => {
    it('should manually delegate to processAllUsers', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const results = await RecommendationNotificationService.triggerProcessing();

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔄 Manually triggered recommendation notification processing',
      );

      consoleSpy.mockRestore();
    });
  });
});
