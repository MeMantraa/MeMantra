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
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('EngagementOptimizerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  // ── processAllUsers ───────────────────────────────────────────────────────

  describe('processAllUsers', () => {
    it('calls getOptimalHour and update for each user with correct args', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([
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
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([makeUser(1)]);
      mockedEngagementModel.getOptimalHour.mockResolvedValue(null);

      jest.spyOn(console, 'log').mockImplementation();

      const results = await EngagementOptimizerService.processAllUsers();

      expect(mockedUserModel.update).toHaveBeenCalledWith(1, { optimal_send_hour: null });
      expect(results[0].optimalHour).toBeNull();
    });

    it('marks a user as skipped on error and continues', async () => {
      mockedUserModel.findAllWithDeviceTokens.mockResolvedValue([makeUser(1), makeUser(2)]);
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
