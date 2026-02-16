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
      const result = ReminderSchedulerService.shouldSendReminder('once', null);
      expect(result).toBe(true);
    });

    it('should return false for one-time reminder that has been sent', () => {
      const result = ReminderSchedulerService.shouldSendReminder(
        'once',
        '2024-01-01T10:00:00.000Z'
      );
      expect(result).toBe(false);
    });

    it('should return true for daily reminder never sent', () => {
      const result = ReminderSchedulerService.shouldSendReminder('daily', null);
      expect(result).toBe(true);
    });

    it('should return true for daily reminder sent yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = ReminderSchedulerService.shouldSendReminder(
        'daily',
        yesterday.toISOString()
      );
      expect(result).toBe(true);
    });

    it('should return false for daily reminder sent today', () => {
      const today = new Date();

      const result = ReminderSchedulerService.shouldSendReminder(
        'daily',
        today.toISOString()
      );
      expect(result).toBe(false);
    });

    it('should return true for weekly reminder sent last week', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 8);

      const result = ReminderSchedulerService.shouldSendReminder(
        'weekly',
        lastWeek.toISOString()
      );
      expect(result).toBe(true);
    });

    it('should return true for monthly reminder sent last month', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const result = ReminderSchedulerService.shouldSendReminder(
        'monthly',
        lastMonth.toISOString()
      );
      expect(result).toBe(true);
    });

    it('should return false for monthly reminder sent this month', () => {
      const thisMonth = new Date();

      const result = ReminderSchedulerService.shouldSendReminder(
        'monthly',
        thisMonth.toISOString()
      );
      expect(result).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-06-15T10:00:00Z');
      const date2 = new Date('2024-06-15T23:59:59Z');

      expect(ReminderSchedulerService.isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-06-15T10:00:00Z');
      const date2 = new Date('2024-06-16T10:00:00Z');

      expect(ReminderSchedulerService.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isSameWeek', () => {
    it('should return true for same week', () => {
      // Sunday and Saturday of the same week
      const sunday = new Date('2024-06-16T10:00:00Z'); // Sunday
      const saturday = new Date('2024-06-22T10:00:00Z'); // Saturday

      expect(ReminderSchedulerService.isSameWeek(sunday, saturday)).toBe(true);
    });

    it('should return false for different weeks', () => {
      const week1 = new Date('2024-06-15T10:00:00Z');
      const week2 = new Date('2024-06-23T10:00:00Z');

      expect(ReminderSchedulerService.isSameWeek(week1, week2)).toBe(false);
    });
  });

  describe('isSameMonth', () => {
    it('should return true for same month', () => {
      const date1 = new Date('2024-06-01T10:00:00Z');
      const date2 = new Date('2024-06-30T10:00:00Z');

      expect(ReminderSchedulerService.isSameMonth(date1, date2)).toBe(true);
    });

    it('should return false for different months', () => {
      const date1 = new Date('2024-06-15T10:00:00Z');
      const date2 = new Date('2024-07-15T10:00:00Z');

      expect(ReminderSchedulerService.isSameMonth(date1, date2)).toBe(false);
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
});
