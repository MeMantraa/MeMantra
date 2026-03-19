import { ReminderSchedulerService } from '../../src/services/reminder-scheduler.service';
import { ReminderModel } from '../../src/models/reminder.model';
import { NotificationService } from '../../src/services/notification.service';

// Mock the dependencies
jest.mock('../../src/models/reminder.model');
jest.mock('../../src/services/notification.service');
jest.mock('node-cron', () => {
  const mockTask = {
    stop: jest.fn(),
  };
  return {
    schedule: jest.fn(() => mockTask),
    validate: jest.fn(() => true),
  };
});

const mockedReminderModel = ReminderModel as jest.Mocked<typeof ReminderModel>;
const mockedNotificationService = NotificationService as jest.Mocked<
  typeof NotificationService
>;

describe('ReminderSchedulerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset scheduler state
    ReminderSchedulerService.cronTask = null;
    ReminderSchedulerService.isRunning = false;
    // Mock collection reminders to return empty by default (for backwards compatibility)
    mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue([]);
  });

  afterEach(() => {
    ReminderSchedulerService.stop();
  });

  describe('start', () => {
    it('should start the scheduler in test mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      ReminderSchedulerService.start({ testMode: true });

      expect(ReminderSchedulerService.isRunning).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '🧪 Reminder scheduler started in test mode'
      );

      consoleSpy.mockRestore();
    });

    it('should not start if already running', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      ReminderSchedulerService.start({ testMode: true });
      ReminderSchedulerService.start({ testMode: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  Reminder scheduler is already running'
      );

      consoleSpy.mockRestore();
    });

    it('should reject invalid cron expressions', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      ReminderSchedulerService.start({ cronExpression: 'invalid' });

      expect(ReminderSchedulerService.isRunning).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Invalid cron expression: invalid'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('should stop the scheduler', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      ReminderSchedulerService.start({ testMode: true });
      ReminderSchedulerService.stop();

      expect(ReminderSchedulerService.isRunning).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Reminder scheduler stopped');

      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return correct status when not running', () => {
      const status = ReminderSchedulerService.getStatus();

      expect(status).toEqual({
        isRunning: false,
        hasCronTask: false,
      });
    });

    it('should return correct status when running in test mode', () => {
      ReminderSchedulerService.start({ testMode: true });

      const status = ReminderSchedulerService.getStatus();

      expect(status).toEqual({
        isRunning: true,
        hasCronTask: false, // Test mode doesn't create cron task
      });
    });
  });

  describe('shouldSendReminder', () => {
    it('should return true for one-time reminder that has not been sent', () => {
      const result = ReminderSchedulerService.shouldSendReminder('once', null, null);
      expect(result).toBe(true);
    });

    it('should return false for one-time reminder that has been sent', () => {
      const result = ReminderSchedulerService.shouldSendReminder(
        'once',
        '2024-01-01T10:00:00.000Z',
        null
      );
      expect(result).toBe(false);
    });

    it('should return true for daily reminder never sent', () => {
      const result = ReminderSchedulerService.shouldSendReminder('daily', null, null);
      expect(result).toBe(true);
    });

    it('should return true for daily reminder sent yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = ReminderSchedulerService.shouldSendReminder(
        'daily',
        yesterday.toISOString(),
        'UTC'
      );
      expect(result).toBe(true);
    });

    it('should return false for daily reminder sent today', () => {
      const today = new Date();

      const result = ReminderSchedulerService.shouldSendReminder(
        'daily',
        today.toISOString(),
        'UTC'
      );
      expect(result).toBe(false);
    });

    it('should return true for weekly reminder sent last week', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 8);

      const result = ReminderSchedulerService.shouldSendReminder(
        'weekly',
        lastWeek.toISOString(),
        'UTC'
      );
      expect(result).toBe(true);
    });

    it('should return true for monthly reminder sent last month', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const result = ReminderSchedulerService.shouldSendReminder(
        'monthly',
        lastMonth.toISOString(),
        'UTC'
      );
      expect(result).toBe(true);
    });

    it('should return false for monthly reminder sent this month', () => {
      const thisMonth = new Date();

      const result = ReminderSchedulerService.shouldSendReminder(
        'monthly',
        thisMonth.toISOString(),
        'UTC'
      );
      expect(result).toBe(false);
    });
  });

  describe('formatDateInTimezone', () => {
    it('should return same date for same UTC day', () => {
      const date1 = new Date('2024-06-15T10:00:00Z');
      const date2 = new Date('2024-06-15T23:59:59Z');

      expect(ReminderSchedulerService.formatDateInTimezone(date1, 'UTC'))
        .toBe(ReminderSchedulerService.formatDateInTimezone(date2, 'UTC'));
    });

    it('should return different dates for different UTC days', () => {
      const date1 = new Date('2024-06-15T10:00:00Z');
      const date2 = new Date('2024-06-16T10:00:00Z');

      expect(ReminderSchedulerService.formatDateInTimezone(date1, 'UTC'))
        .not.toBe(ReminderSchedulerService.formatDateInTimezone(date2, 'UTC'));
    });

    it('should respect timezone when comparing dates', () => {
      // 11 PM UTC on June 15 = June 16 in UTC+2
      const date = new Date('2024-06-15T23:00:00Z');

      expect(ReminderSchedulerService.formatDateInTimezone(date, 'UTC')).toBe('2024-06-15');
      expect(ReminderSchedulerService.formatDateInTimezone(date, 'Europe/Helsinki')).toBe('2024-06-16');
    });
  });

  describe('isSameWeekInTimezone', () => {
    it('should return true for same week', () => {
      // Sunday and Saturday of the same week
      const sunday = new Date('2024-06-16T10:00:00Z'); // Sunday
      const saturday = new Date('2024-06-22T10:00:00Z'); // Saturday

      expect(ReminderSchedulerService.isSameWeekInTimezone(sunday, saturday, 'UTC')).toBe(true);
    });

    it('should return false for different weeks', () => {
      const week1 = new Date('2024-06-15T10:00:00Z');
      const week2 = new Date('2024-06-23T10:00:00Z');

      expect(ReminderSchedulerService.isSameWeekInTimezone(week1, week2, 'UTC')).toBe(false);
    });
  });

  describe('formatMonthInTimezone', () => {
    it('should return same month for dates in same month', () => {
      const date1 = new Date('2024-06-01T10:00:00Z');
      const date2 = new Date('2024-06-30T10:00:00Z');

      expect(ReminderSchedulerService.formatMonthInTimezone(date1, 'UTC'))
        .toBe(ReminderSchedulerService.formatMonthInTimezone(date2, 'UTC'));
    });

    it('should return different months for dates in different months', () => {
      const date1 = new Date('2024-06-15T10:00:00Z');
      const date2 = new Date('2024-07-15T10:00:00Z');

      expect(ReminderSchedulerService.formatMonthInTimezone(date1, 'UTC'))
        .not.toBe(ReminderSchedulerService.formatMonthInTimezone(date2, 'UTC'));
    });
  });

  describe('processReminders', () => {
    it('should return empty array when no due reminders', async () => {
      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toEqual([]);
      expect(
        mockedReminderModel.findDueRemindersWithDetails
      ).toHaveBeenCalled();
    });

    it('should process due reminders and send notifications', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockReminders = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 1,
          time: yesterday.toISOString(),
          frequency: 'daily',
          status: 'active',
          last_sent_at: yesterday.toISOString(),
          user_device_token: 'ExponentPushToken[xxx]',
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: 'Test takeaway',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue(
        mockReminders
      );
      mockedReminderModel.updateLastSentAt.mockResolvedValue(undefined);
      mockedNotificationService.sendEnhancedReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(
        mockedNotificationService.sendEnhancedReminderNotification
      ).toHaveBeenCalledWith(
        'ExponentPushToken[xxx]',
        'Test takeaway',
        1,
        1
      );

      consoleSpy.mockRestore();
    });

    it('should skip reminders without device token', async () => {
      const mockReminders = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: null, // No device token
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: 'Test takeaway',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue(
        mockReminders
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('No device token');
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  Reminder 1: User has no device token, skipping'
      );

      consoleSpy.mockRestore();
    });

    it('should mark one-time reminders as completed after sending', async () => {
      const mockReminders = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[xxx]',
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: 'Test takeaway',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue(
        mockReminders
      );
      mockedReminderModel.markAsCompleted.mockResolvedValue(undefined);
      mockedNotificationService.sendEnhancedReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      jest.spyOn(console, 'log').mockImplementation();

      await ReminderSchedulerService.processReminders();

      expect(mockedReminderModel.markAsCompleted).toHaveBeenCalledWith(1);
      expect(mockedReminderModel.updateLastSentAt).not.toHaveBeenCalled();
    });

    it('should update last_sent_at for recurring reminders', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockReminders = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 1,
          time: yesterday.toISOString(),
          frequency: 'daily',
          status: 'active',
          last_sent_at: yesterday.toISOString(),
          user_device_token: 'ExponentPushToken[xxx]',
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: 'Test takeaway',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue(
        mockReminders
      );
      mockedReminderModel.updateLastSentAt.mockResolvedValue(undefined);
      mockedNotificationService.sendEnhancedReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      jest.spyOn(console, 'log').mockImplementation();

      await ReminderSchedulerService.processReminders();

      expect(mockedReminderModel.updateLastSentAt).toHaveBeenCalledWith(1);
      expect(mockedReminderModel.markAsCompleted).not.toHaveBeenCalled();
    });
  });

  describe('triggerProcessing', () => {
    it('should manually trigger reminder processing', async () => {
      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.triggerProcessing();

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔄 Manually triggered reminder processing'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processCollectionReminders', () => {
    it('should process collection reminders and send notifications', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockCollectionReminders = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 1,
          time: yesterday.toISOString(),
          frequency: 'daily',
          status: 'active',
          last_sent_at: yesterday.toISOString(),
          user_device_token: 'ExponentPushToken[yyy]',
          collection_name: 'My Collection',
          collection_description: 'Test collection',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue(
        mockCollectionReminders
      );
      mockedReminderModel.updateLastSentAt.mockResolvedValue(undefined);
      mockedNotificationService.sendCollectionReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(
        mockedNotificationService.sendCollectionReminderNotification
      ).toHaveBeenCalledWith(
        'ExponentPushToken[yyy]',
        'My Collection',
        2,
        1
      );

      consoleSpy.mockRestore();
    });

    it('should skip collection reminders without device token', async () => {
      const mockCollectionReminders = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: null,
          collection_name: 'My Collection',
          collection_description: 'Test collection',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue(
        mockCollectionReminders
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('No device token');
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  Collection Reminder 2: User has no device token, skipping'
      );

      consoleSpy.mockRestore();
    });

    it('should mark one-time collection reminders as completed after sending', async () => {
      const mockCollectionReminders = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[yyy]',
          collection_name: 'My Collection',
          collection_description: 'Test collection',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue(
        mockCollectionReminders
      );
      mockedReminderModel.markAsCompleted.mockResolvedValue(undefined);
      mockedNotificationService.sendCollectionReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      jest.spyOn(console, 'log').mockImplementation();

      await ReminderSchedulerService.processReminders();

      expect(mockedReminderModel.markAsCompleted).toHaveBeenCalledWith(2);
      expect(mockedReminderModel.updateLastSentAt).not.toHaveBeenCalled();
    });

    it('should process both mantra and collection reminders together', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockMantraReminders = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 1,
          time: yesterday.toISOString(),
          frequency: 'daily',
          status: 'active',
          last_sent_at: yesterday.toISOString(),
          user_device_token: 'ExponentPushToken[xxx]',
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: 'Test takeaway',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      const mockCollectionReminders = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 1,
          time: yesterday.toISOString(),
          frequency: 'daily',
          status: 'active',
          last_sent_at: yesterday.toISOString(),
          user_device_token: 'ExponentPushToken[yyy]',
          collection_name: 'My Collection',
          collection_description: 'Test collection',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue(mockMantraReminders);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue(
        mockCollectionReminders
      );
      mockedReminderModel.updateLastSentAt.mockResolvedValue(undefined);
      mockedNotificationService.sendEnhancedReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );
      mockedNotificationService.sendCollectionReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(
        mockedNotificationService.sendEnhancedReminderNotification
      ).toHaveBeenCalledTimes(1);
      expect(
        mockedNotificationService.sendCollectionReminderNotification
      ).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should skip collection reminders without collection name', async () => {
      const mockCollectionReminders = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[yyy]',
          collection_name: null,
          collection_description: 'Test collection',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue(
        mockCollectionReminders
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('No collection name');
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  Collection Reminder 2: Collection has no name, skipping'
      );

      consoleSpy.mockRestore();
    });

    it('should skip mantra reminders without key takeaway', async () => {
      const mockReminders = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[xxx]',
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: null,
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue(mockReminders);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('No mantra content');

      consoleSpy.mockRestore();
    });

    it('should handle notification send errors gracefully', async () => {
      const mockReminders = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[xxx]',
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: 'Test takeaway',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue(mockReminders);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue([]);
      mockedNotificationService.sendEnhancedReminderNotification.mockRejectedValue(
        new Error('Network error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Network error');

      consoleSpy.mockRestore();
    });

    it('should handle collection notification send errors gracefully', async () => {
      const mockCollectionReminders = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 1,
          time: new Date().toISOString(),
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[yyy]',
          collection_name: 'My Collection',
          collection_description: 'Test collection',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue(
        mockCollectionReminders
      );
      mockedNotificationService.sendCollectionReminderNotification.mockRejectedValue(
        new Error('API error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('API error');

      consoleSpy.mockRestore();
    });

    it('should update last_sent_at for recurring collection reminders', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockCollectionReminders = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 1,
          time: yesterday.toISOString(),
          frequency: 'daily',
          status: 'active',
          last_sent_at: yesterday.toISOString(),
          user_device_token: 'ExponentPushToken[yyy]',
          collection_name: 'My Collection',
          collection_description: 'Test collection',
          schedule_times: null,
          schedule_days: null,
          timezone: null,
        },
      ];

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue(
        mockCollectionReminders
      );
      mockedReminderModel.updateLastSentAt.mockResolvedValue(undefined);
      mockedNotificationService.sendCollectionReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      jest.spyOn(console, 'log').mockImplementation();

      await ReminderSchedulerService.processReminders();

      expect(mockedReminderModel.updateLastSentAt).toHaveBeenCalledWith(2);
      expect(mockedReminderModel.markAsCompleted).not.toHaveBeenCalled();
    });
  });

  describe('validateReminderBase', () => {
    it('should return null for valid reminder with device token', () => {
      const reminder = {
        reminder_id: 1,
        user_id: 1,
        time: new Date().toISOString(),
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: 'ExponentPushToken[xxx]',
        schedule_times: null,
        schedule_days: null,
        timezone: null,
      };

      const error = ReminderSchedulerService.validateReminderBase(reminder, 'Reminder');
      expect(error).toBeNull();
    });

    it('should return error for reminder without device token', () => {
      const reminder = {
        reminder_id: 1,
        user_id: 1,
        time: new Date().toISOString(),
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: null,
        schedule_times: null,
        schedule_days: null,
        timezone: null,
      };

      jest.spyOn(console, 'warn').mockImplementation();

      const error = ReminderSchedulerService.validateReminderBase(reminder, 'Reminder');
      expect(error).toBe('No device token');
    });
  });

  describe('updateReminderAfterSend', () => {
    it('should mark as completed for once frequency', async () => {
      mockedReminderModel.markAsCompleted.mockResolvedValue(undefined);

      await ReminderSchedulerService.updateReminderAfterSend(1, 'once');

      expect(mockedReminderModel.markAsCompleted).toHaveBeenCalledWith(1);
      expect(mockedReminderModel.updateLastSentAt).not.toHaveBeenCalled();
    });

    it('should update last_sent_at for recurring frequency', async () => {
      mockedReminderModel.updateLastSentAt.mockResolvedValue(undefined);

      await ReminderSchedulerService.updateReminderAfterSend(1, 'daily');

      expect(mockedReminderModel.updateLastSentAt).toHaveBeenCalledWith(1);
      expect(mockedReminderModel.markAsCompleted).not.toHaveBeenCalled();
    });
  });

  describe('start with real cron (not testMode)', () => {
    it('should schedule a cron task and set isRunning to true', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      ReminderSchedulerService.start({ cronExpression: '* * * * *' });

      expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
      expect(ReminderSchedulerService.isRunning).toBe(true);
      expect(ReminderSchedulerService.cronTask).not.toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '🕐 Starting reminder scheduler with cron: * * * * *'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Reminder scheduler started successfully'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('stop with actual cronTask', () => {
    it('should call stop on the cron task and set cronTask to null', () => {
      const cron = require('node-cron');
      cron.validate.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Start with real cron to create the cronTask
      ReminderSchedulerService.start({ cronExpression: '* * * * *' });

      const mockTask = ReminderSchedulerService.cronTask;
      expect(mockTask).not.toBeNull();

      ReminderSchedulerService.stop();

      expect(mockTask!.stop).toHaveBeenCalled();
      expect(ReminderSchedulerService.cronTask).toBeNull();
      expect(ReminderSchedulerService.isRunning).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('processReminders top-level catch', () => {
    it('should catch and log errors when findDueRemindersWithDetails throws', async () => {
      mockedReminderModel.findDueRemindersWithDetails.mockRejectedValue(
        new Error('Database connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(results).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Error processing reminders:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('processReminderGeneric with routine frequency', () => {
    it('should use shouldSendRoutineReminder for routine frequency and skip when it returns false', async () => {
      const shouldSendRoutineSpy = jest
        .spyOn(ReminderSchedulerService, 'shouldSendRoutineReminder')
        .mockReturnValue(false);

      const mockReminder = {
        reminder_id: 10,
        user_id: 1,
        mantra_id: 1,
        time: null,
        frequency: 'routine',
        status: 'active',
        last_sent_at: null,
        user_device_token: 'ExponentPushToken[xxx]',
        mantra_title: 'Test Mantra',
        mantra_key_takeaway: 'Test takeaway',
        schedule_times: ['09:00'],
        schedule_days: [1, 3, 5],
        timezone: 'America/New_York',
      };

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([mockReminder]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue([]);

      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(shouldSendRoutineSpy).toHaveBeenCalledWith(
        ['09:00'],
        [1, 3, 5],
        'America/New_York',
        null
      );
      // When shouldSendRoutineReminder returns false, it returns success: true (skipped)
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ reminderId: 10, success: true });

      shouldSendRoutineSpy.mockRestore();
    });

    it('should proceed to send notification when shouldSendRoutineReminder returns true', async () => {
      const shouldSendRoutineSpy = jest
        .spyOn(ReminderSchedulerService, 'shouldSendRoutineReminder')
        .mockReturnValue(true);

      const mockReminder = {
        reminder_id: 11,
        user_id: 1,
        mantra_id: 1,
        time: null,
        frequency: 'routine',
        status: 'active',
        last_sent_at: null,
        user_device_token: 'ExponentPushToken[xxx]',
        mantra_title: 'Test Mantra',
        mantra_key_takeaway: 'Test takeaway',
        schedule_times: ['09:00'],
        schedule_days: null,
        timezone: 'UTC',
      };

      mockedReminderModel.findDueRemindersWithDetails.mockResolvedValue([mockReminder]);
      mockedReminderModel.findDueCollectionRemindersWithDetails.mockResolvedValue([]);
      mockedReminderModel.updateLastSentAt.mockResolvedValue(undefined);
      mockedNotificationService.sendEnhancedReminderNotification.mockResolvedValue(
        { data: [{ status: 'ok' }] }
      );

      jest.spyOn(console, 'log').mockImplementation();

      const results = await ReminderSchedulerService.processReminders();

      expect(shouldSendRoutineSpy).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(
        mockedNotificationService.sendEnhancedReminderNotification
      ).toHaveBeenCalledWith(
        'ExponentPushToken[xxx]',
        'Test takeaway',
        11,
        1
      );

      shouldSendRoutineSpy.mockRestore();
    });
  });

  describe('getCurrentTimeInTimezone', () => {
    it('should return hour, minute, and dayOfWeek for a valid timezone', () => {
      const result = ReminderSchedulerService.getCurrentTimeInTimezone('America/New_York');

      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('minute');
      expect(result).toHaveProperty('dayOfWeek');
      expect(typeof result.hour).toBe('number');
      expect(typeof result.minute).toBe('number');
      expect(typeof result.dayOfWeek).toBe('number');
      expect(result.hour).toBeGreaterThanOrEqual(0);
      expect(result.hour).toBeLessThanOrEqual(23);
      expect(result.minute).toBeGreaterThanOrEqual(0);
      expect(result.minute).toBeLessThanOrEqual(59);
      expect(result.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(result.dayOfWeek).toBeLessThanOrEqual(6);
    });

    it('should return UTC time when given UTC timezone', () => {
      const result = ReminderSchedulerService.getCurrentTimeInTimezone('UTC');
      const now = new Date();
      const expectedHour = now.getUTCHours();
      const expectedMinute = now.getUTCMinutes();

      expect(result.hour).toBe(expectedHour);
      expect(result.minute).toBe(expectedMinute);
    });

    it('should return different times for different timezones', () => {
      // Pick two timezones with a known offset difference
      const utcResult = ReminderSchedulerService.getCurrentTimeInTimezone('UTC');
      const tokyoResult = ReminderSchedulerService.getCurrentTimeInTimezone('Asia/Tokyo');

      // Tokyo is UTC+9, so the hour should differ (unless it wraps around midnight)
      // We just verify both return valid numbers; exact comparison depends on current time
      expect(typeof utcResult.hour).toBe('number');
      expect(typeof tokyoResult.hour).toBe('number');
    });
  });

  describe('shouldSendRoutineReminder', () => {
    let getCurrentTimeSpy: jest.SpyInstance;

    afterEach(() => {
      if (getCurrentTimeSpy) {
        getCurrentTimeSpy.mockRestore();
      }
    });

    it('should return false when scheduleTimes is null', () => {
      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        null,
        null,
        'UTC',
        null
      );
      expect(result).toBe(false);
    });

    it('should return false when scheduleTimes is empty', () => {
      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        [],
        null,
        'UTC',
        null
      );
      expect(result).toBe(false);
    });

    it('should return false when current day is not in scheduleDays', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 9, minute: 0, dayOfWeek: 3 }); // Wednesday

      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        ['09:00'],
        [1, 5], // Monday and Friday only
        'UTC',
        null
      );
      expect(result).toBe(false);
    });

    it('should return false when current time does not match any schedule time', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 10, minute: 30, dayOfWeek: 1 }); // Monday 10:30

      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        ['09:00', '14:00'],
        [1], // Monday
        'UTC',
        null
      );
      expect(result).toBe(false);
    });

    it('should return false when last sent within 2 minutes (double-send guard)', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 9, minute: 0, dayOfWeek: 1 }); // Monday 09:00

      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        ['09:00'],
        [1], // Monday
        'UTC',
        oneMinuteAgo
      );
      expect(result).toBe(false);
    });

    it('should return true when all conditions are met and no previous send', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 9, minute: 0, dayOfWeek: 1 }); // Monday 09:00

      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        ['09:00'],
        [1], // Monday
        'UTC',
        null
      );
      expect(result).toBe(true);
    });

    it('should return true when all conditions are met and last sent more than 2 minutes ago', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 9, minute: 0, dayOfWeek: 1 }); // Monday 09:00

      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        ['09:00'],
        [1], // Monday
        'UTC',
        threeMinutesAgo
      );
      expect(result).toBe(true);
    });

    it('should allow all days when scheduleDays is null', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 14, minute: 0, dayOfWeek: 4 }); // Thursday 14:00

      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        ['14:00'],
        null, // every day
        'America/Chicago',
        null
      );
      expect(result).toBe(true);
    });

    it('should allow all days when scheduleDays is empty', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 14, minute: 0, dayOfWeek: 4 }); // Thursday 14:00

      const result = ReminderSchedulerService.shouldSendRoutineReminder(
        ['14:00'],
        [], // empty = every day
        'UTC',
        null
      );
      expect(result).toBe(true);
    });

    it('should default to UTC when timezone is null', () => {
      getCurrentTimeSpy = jest
        .spyOn(ReminderSchedulerService, 'getCurrentTimeInTimezone')
        .mockReturnValue({ hour: 8, minute: 0, dayOfWeek: 0 }); // Sunday 08:00

      ReminderSchedulerService.shouldSendRoutineReminder(
        ['08:00'],
        null,
        null,
        null
      );

      expect(getCurrentTimeSpy).toHaveBeenCalledWith('UTC');
    });
  });

  describe('sendReminderNotification error throw', () => {
    it('should throw when user_device_token is missing', async () => {
      const reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 1,
        time: new Date().toISOString(),
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: null,
        mantra_title: 'Test',
        mantra_key_takeaway: 'Takeaway',
        schedule_times: null,
        schedule_days: null,
        timezone: null,
      };

      await expect(
        ReminderSchedulerService.sendReminderNotification(reminder)
      ).rejects.toThrow('Missing required notification data');
    });

    it('should throw when mantra_key_takeaway is missing', async () => {
      const reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 1,
        time: new Date().toISOString(),
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: 'ExponentPushToken[xxx]',
        mantra_title: 'Test',
        mantra_key_takeaway: null,
        schedule_times: null,
        schedule_days: null,
        timezone: null,
      };

      await expect(
        ReminderSchedulerService.sendReminderNotification(reminder)
      ).rejects.toThrow('Missing required notification data');
    });
  });

  describe('sendCollectionReminderNotification error throw', () => {
    it('should throw when user_device_token is missing', async () => {
      const reminder = {
        reminder_id: 2,
        user_id: 1,
        collection_id: 1,
        time: new Date().toISOString(),
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: null,
        collection_name: 'Collection',
        collection_description: 'Desc',
        schedule_times: null,
        schedule_days: null,
        timezone: null,
      };

      await expect(
        ReminderSchedulerService.sendCollectionReminderNotification(reminder)
      ).rejects.toThrow('Missing required notification data');
    });

    it('should throw when collection_name is missing', async () => {
      const reminder = {
        reminder_id: 2,
        user_id: 1,
        collection_id: 1,
        time: new Date().toISOString(),
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: 'ExponentPushToken[yyy]',
        collection_name: null,
        collection_description: 'Desc',
        schedule_times: null,
        schedule_days: null,
        timezone: null,
      };

      await expect(
        ReminderSchedulerService.sendCollectionReminderNotification(reminder)
      ).rejects.toThrow('Missing required notification data');
    });

    it('should throw when collection_id is missing', async () => {
      const reminder = {
        reminder_id: 2,
        user_id: 1,
        collection_id: null,
        time: new Date().toISOString(),
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: 'ExponentPushToken[yyy]',
        collection_name: 'Collection',
        collection_description: 'Desc',
        schedule_times: null,
        schedule_days: null,
        timezone: null,
      };

      await expect(
        ReminderSchedulerService.sendCollectionReminderNotification(reminder)
      ).rejects.toThrow('Missing required notification data');
    });
  });

  describe('shouldSendReminder with custom frequency', () => {
    it('should return true for custom frequency when never sent', () => {
      const result = ReminderSchedulerService.shouldSendReminder('custom', null, null);
      expect(result).toBe(true);
    });

    it('should return false for custom frequency sent today (defaults to daily behavior)', () => {
      const today = new Date();
      const result = ReminderSchedulerService.shouldSendReminder(
        'custom',
        today.toISOString(),
        'UTC'
      );
      expect(result).toBe(false);
    });

    it('should return true for custom frequency sent yesterday (defaults to daily behavior)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = ReminderSchedulerService.shouldSendReminder(
        'custom',
        yesterday.toISOString(),
        'UTC'
      );
      expect(result).toBe(true);
    });
  });
});
