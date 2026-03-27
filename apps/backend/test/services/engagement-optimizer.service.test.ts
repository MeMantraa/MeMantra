import { EngagementOptimizerService } from '../../src/services/engagement-optimizer.service';
import { UserModel } from '../../src/models/user.model';
import { EngagementModel } from '../../src/models/engagement.model';

jest.mock('../../src/models/user.model');
jest.mock('../../src/models/engagement.model');
jest.mock('node-cron', () => {
  const mockTask = { stop: jest.fn() };
  return {
    schedule: jest.fn(() => mockTask),
    validate: jest.fn(() => true),
  };
});

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedEngagementModel = EngagementModel as jest.Mocked<typeof EngagementModel>;

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeUser = (id: number, timezone = 'UTC') => ({
  user_id: id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  device_token: 'ExponentPushToken[token]',
  password_hash: 'hash',
  auth_provider: 'local',
  first_name: null,
  last_name: null,
  created_at: new Date().toISOString(),
  timezone,
  recommendation_notif_sent_at: null,
  optimal_send_hour: null,
  theme: null,
  feature_flags: [],
  profile_photo: null,
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('EngagementOptimizerService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    EngagementOptimizerService.cronTask = null;
    EngagementOptimizerService.isRunning = false;
    mockedUserModel.update.mockResolvedValue(makeUser(1));
  });

  afterEach(() => {
    EngagementOptimizerService.stop();
  });

  // ── start ─────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('sets isRunning to true in testMode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      EngagementOptimizerService.start({ testMode: true });

      expect(EngagementOptimizerService.isRunning).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '🧪 Engagement optimizer scheduler started in test mode',
      );

      consoleSpy.mockRestore();
    });

    it('warns and does nothing if already running', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      EngagementOptimizerService.start({ testMode: true });
      EngagementOptimizerService.start({ testMode: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  Engagement optimizer scheduler is already running',
      );

      consoleSpy.mockRestore();
    });

    it('schedules the correct cron expression', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(true);

      jest.spyOn(console, 'log').mockImplementation();

      EngagementOptimizerService.start({ cronExpression: '0 3 * * *' });

      expect(cron.schedule).toHaveBeenCalledWith('0 3 * * *', expect.any(Function));
      expect(EngagementOptimizerService.isRunning).toBe(true);
    });
  });

  // ── stop / getStatus / triggerProcessing ─────────────────────────────────

  describe('stop', () => {
    it('sets isRunning to false and clears cronTask', () => {
      jest.spyOn(console, 'log').mockImplementation();
      EngagementOptimizerService.start({ testMode: true });
      expect(EngagementOptimizerService.isRunning).toBe(true);

      EngagementOptimizerService.stop();

      expect(EngagementOptimizerService.isRunning).toBe(false);
      expect(EngagementOptimizerService.cronTask).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('reflects isRunning and hasCronTask correctly when stopped', () => {
      const status = EngagementOptimizerService.getStatus();
      expect(status).toEqual({ isRunning: false, hasCronTask: false });
    });

    it('reflects isRunning=true in testMode (no cron task created)', () => {
      jest.spyOn(console, 'log').mockImplementation();
      EngagementOptimizerService.start({ testMode: true });
      const status = EngagementOptimizerService.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.hasCronTask).toBe(false);
    });
  });

  describe('triggerProcessing', () => {
    it('delegates to processAllUsers and returns its result', async () => {
      mockedUserModel.findAllWithDeviceTokensPaginated.mockResolvedValueOnce([makeUser(1)]);
      mockedEngagementModel.getOptimalHour.mockResolvedValue(10);
      jest.spyOn(console, 'log').mockImplementation();

      const results = await EngagementOptimizerService.triggerProcessing();

      expect(results).toHaveLength(1);
      expect(results[0].optimalHour).toBe(10);
    });
  });

  // ── processUser (directly) ────────────────────────────────────────────────

  describe('processUser', () => {
    it('returns computed optimalHour and calls update', async () => {
      mockedEngagementModel.getOptimalHour.mockResolvedValue(7);

      const result = await EngagementOptimizerService.processUser(42, 'Europe/Paris');

      expect(mockedEngagementModel.getOptimalHour).toHaveBeenCalledWith(42, 'Europe/Paris');
      expect(mockedUserModel.update).toHaveBeenCalledWith(42, { optimal_send_hour: 7 });
      expect(result).toEqual({ userId: 42, optimalHour: 7 });
    });

    it('returns skipped result with error message when model throws', async () => {
      mockedEngagementModel.getOptimalHour.mockRejectedValue(new Error('timeout'));
      jest.spyOn(console, 'error').mockImplementation();

      const result = await EngagementOptimizerService.processUser(99, 'UTC');

      expect(result.skipped).toBe(true);
      expect(result.error).toBe('timeout');
      expect(result.optimalHour).toBeNull();
    });
  });

  // ── processAllUsers ───────────────────────────────────────────────────────

  describe('processAllUsers', () => {
    it('calls getOptimalHour and update for each user with correct args', async () => {
      mockedUserModel.findAllWithDeviceTokensPaginated.mockResolvedValueOnce([
        makeUser(1, 'America/New_York'),
        makeUser(2, 'Europe/London'),
      ]);
      mockedEngagementModel.getOptimalHour.mockResolvedValue(8);

      jest.spyOn(console, 'log').mockImplementation();

      await EngagementOptimizerService.processAllUsers();

      expect(mockedEngagementModel.getOptimalHour).toHaveBeenCalledWith(1, 'America/New_York');
      expect(mockedEngagementModel.getOptimalHour).toHaveBeenCalledWith(2, 'Europe/London');
      expect(mockedUserModel.update).toHaveBeenCalledWith(1, { optimal_send_hour: 8 });
      expect(mockedUserModel.update).toHaveBeenCalledWith(2, { optimal_send_hour: 8 });
    });

    it('writes null for insufficient-data users', async () => {
      mockedUserModel.findAllWithDeviceTokensPaginated.mockResolvedValueOnce([makeUser(1)]);
      mockedEngagementModel.getOptimalHour.mockResolvedValue(null);

      jest.spyOn(console, 'log').mockImplementation();

      const results = await EngagementOptimizerService.processAllUsers();

      expect(mockedUserModel.update).toHaveBeenCalledWith(1, { optimal_send_hour: null });
      expect(results[0].optimalHour).toBeNull();
    });

    it('returns empty array when no users have device tokens', async () => {
      mockedUserModel.findAllWithDeviceTokensPaginated.mockResolvedValueOnce([]);
      jest.spyOn(console, 'log').mockImplementation();

      const results = await EngagementOptimizerService.processAllUsers();

      expect(results).toEqual([]);
      expect(mockedEngagementModel.getOptimalHour).not.toHaveBeenCalled();
    });

    it('returns empty array and logs error when findAllWithDeviceTokensPaginated throws', async () => {
      mockedUserModel.findAllWithDeviceTokensPaginated.mockRejectedValue(new Error('DB down'));
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();

      const results = await EngagementOptimizerService.processAllUsers();

      expect(results).toEqual([]);
    });

    it('marks a user as skipped on error and continues', async () => {
      mockedUserModel.findAllWithDeviceTokensPaginated.mockResolvedValueOnce([
        makeUser(1),
        makeUser(2),
      ]);
      mockedEngagementModel.getOptimalHour
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(7);

      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();

      const results = await EngagementOptimizerService.processAllUsers();

      expect(results[0].skipped).toBe(true);
      expect(results[0].error).toBe('DB error');
      expect(results[1].optimalHour).toBe(7);
    });
  });
});
