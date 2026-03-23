import * as cron from 'node-cron';
import { ReminderModel } from '../models/reminder.model';
import { NotificationService } from './notification.service';
import {
  getCurrentTimeInTimezone as _getCurrentTimeInTimezone,
  formatDateInTimezone as _formatDateInTimezone,
  formatMonthInTimezone as _formatMonthInTimezone,
  isSameWeekInTimezone as _isSameWeekInTimezone,
} from '../utils/timezone.utils';

/**
 * Reminder Scheduler Service
 *
 * Handles automatic scheduling and sending of reminder notifications.
 * Uses node-cron to periodically check for due reminders and send notifications.
 */

interface SchedulerConfig {
  /** Cron expression for how often to check for due reminders (default: every minute) */
  cronExpression?: string;
  /** Whether to run in test mode (no actual cron job, just exposes methods) */
  testMode?: boolean;
}

// Base interface for common reminder fields
interface BaseReminderDetails {
  reminder_id: number;
  user_id: number | null;
  time: string | null;
  frequency: string | null;
  status: string | null;
  last_sent_at: string | null;
  user_device_token: string | null;
  schedule_times: string[] | null;
  schedule_days: number[] | null;
  timezone: string | null;
}

interface ReminderWithDetails extends BaseReminderDetails {
  mantra_id: number | null;
  mantra_title: string | null;
  mantra_key_takeaway: string | null;
}

interface CollectionReminderWithDetails extends BaseReminderDetails {
  collection_id: number | null;
  collection_name: string | null;
  collection_description: string | null;
}

interface ProcessResult {
  reminderId: number;
  success: boolean;
  error?: string;
}

export const ReminderSchedulerService = {
  cronTask: null as cron.ScheduledTask | null,
  isRunning: false,

  /**
   * Start the reminder scheduler
   * @param config - Scheduler configuration
   */
  start(config: SchedulerConfig = {}): void {
    const { cronExpression = '* * * * *', testMode = false } = config;

    if (this.isRunning) {
      console.log('⚠️  Reminder scheduler is already running');
      return;
    }

    if (testMode) {
      console.log('🧪 Reminder scheduler started in test mode');
      this.isRunning = true;
      return;
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      console.error(`❌ Invalid cron expression: ${cronExpression}`);
      return;
    }

    console.log(`🕐 Starting reminder scheduler with cron: ${cronExpression}`);

    this.cronTask = cron.schedule(cronExpression, async () => {
      await this.processReminders();
    });

    this.isRunning = true;
    console.log('✅ Reminder scheduler started successfully');
  },

  /**
   * Stop the reminder scheduler
   */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    this.isRunning = false;
    console.log('🛑 Reminder scheduler stopped');
  },

  /**
   * Process all due reminders (both mantra-based and collection-based)
   * This is the main method that runs on each cron tick
   */
  async processReminders(): Promise<ProcessResult[]> {
    const results: ProcessResult[] = [];

    try {
      // Get all due mantra-based reminders
      const dueReminders = await ReminderModel.findDueRemindersWithDetails();
      // Get all due collection-based reminders
      const dueCollectionReminders = await ReminderModel.findDueCollectionRemindersWithDetails();

      const totalDue = dueReminders.length + dueCollectionReminders.length;

      if (totalDue === 0) {
        return results;
      }

      console.log(`📬 Processing ${totalDue} due reminder(s) (${dueReminders.length} mantra, ${dueCollectionReminders.length} collection)`);

      // Process mantra-based reminders
      for (const reminder of dueReminders) {
        const result = await this.processReminder(reminder);
        results.push(result);
      }

      // Process collection-based reminders
      for (const reminder of dueCollectionReminders) {
        const result = await this.processCollectionReminder(reminder);
        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (successCount > 0 || failCount > 0) {
        console.log(
          `📊 Processed reminders: ${successCount} sent, ${failCount} failed`
        );
      }
    } catch (error) {
      console.error('❌ Error processing reminders:', error);
    }

    return results;
  },

  /**
   * Validate common reminder requirements and return error if invalid
   * @returns Error message if validation fails, null if valid
   */
  validateReminderBase(
    reminder: BaseReminderDetails,
    reminderType: 'Reminder' | 'Collection Reminder'
  ): string | null {
    if (!reminder.user_device_token) {
      console.warn(
        `⚠️  ${reminderType} ${reminder.reminder_id}: User has no device token, skipping`
      );
      return 'No device token';
    }
    return null;
  },

  /**
   * Update reminder after successful send based on frequency
   */
  async updateReminderAfterSend(reminderId: number, frequency: string | null): Promise<void> {
    if (frequency === 'once') {
      await ReminderModel.markAsCompleted(reminderId);
    } else {
      await ReminderModel.updateLastSentAt(reminderId);
    }
  },

  /**
   * Shared processing logic for both mantra and collection reminders.
   * Handles frequency checks, base validation, content validation,
   * notification sending, and post-send updates.
   */
  async processReminderGeneric<T extends BaseReminderDetails>(
    reminder: T,
    reminderType: 'Reminder' | 'Collection Reminder',
    validateContent: (r: T) => string | null,
    sendNotification: (r: T) => Promise<void>,
  ): Promise<ProcessResult> {
    const { reminder_id, frequency, last_sent_at } = reminder;

    try {
      // Check if reminder should be sent based on frequency
      if (frequency === 'routine') {
        if (!this.shouldSendRoutineReminder(
          reminder.schedule_times,
          reminder.schedule_days,
          reminder.timezone,
          last_sent_at
        )) {
          return { reminderId: reminder_id, success: true };
        }
      } else if (!this.shouldSendReminder(frequency, last_sent_at, reminder.timezone)) {
        return { reminderId: reminder_id, success: true };
      }

      // Validate base requirements
      const baseError = this.validateReminderBase(reminder, reminderType);
      if (baseError) {
        return { reminderId: reminder_id, success: false, error: baseError };
      }

      // Validate content-specific requirements
      const contentError = validateContent(reminder);
      if (contentError) {
        return { reminderId: reminder_id, success: false, error: contentError };
      }

      // Send the notification
      await sendNotification(reminder);
      await this.updateReminderAfterSend(reminder_id, frequency);

      console.log(`✅ ${reminderType} ${reminder_id} sent successfully`);
      return { reminderId: reminder_id, success: true };
    } catch (error) {
      console.error(`❌ Error processing ${reminderType.toLowerCase()} ${reminder_id}:`, error);
      return {
        reminderId: reminder_id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Process a single reminder
   * @param reminder - Reminder with user and mantra details
   */
  async processReminder(reminder: ReminderWithDetails): Promise<ProcessResult> {
    return this.processReminderGeneric(
      reminder,
      'Reminder',
      (r) => {
        if (!r.mantra_key_takeaway) {
          console.warn(
            `⚠️  Reminder ${r.reminder_id}: Mantra has no key takeaway, skipping`
          );
          return 'No mantra content';
        }
        return null;
      },
      (r) => this.sendReminderNotification(r),
    );
  },

  /**
   * Determine if a reminder should be sent based on its frequency and last send time
   * @param frequency - Reminder frequency (once, daily, weekly, monthly, custom)
   * @param lastSentAt - ISO timestamp of when reminder was last sent
   * @param timezone - IANA timezone string for the user
   */
  shouldSendReminder(
    frequency: string | null,
    lastSentAt: string | null,
    timezone: string | null
  ): boolean {
    // One-time reminders: send if never sent
    if (frequency === 'once') {
      return lastSentAt === null;
    }

    // If never sent, send now
    if (lastSentAt === null) {
      return true;
    }

    const tz = timezone || 'UTC';
    const lastSent = new Date(lastSentAt);
    const now = new Date();

    switch (frequency) {
      case 'daily':
        // Send if last sent was on a different local day
        return this.formatDateInTimezone(lastSent, tz) !== this.formatDateInTimezone(now, tz);

      case 'weekly':
        // Send if last sent was in a different local week
        return !this.isSameWeekInTimezone(lastSent, now, tz);

      case 'monthly':
        // Send if last sent was in a different local month
        return this.formatMonthInTimezone(lastSent, tz) !== this.formatMonthInTimezone(now, tz);

      case 'custom':
        // For custom frequency, default to daily behavior
        return this.formatDateInTimezone(lastSent, tz) !== this.formatDateInTimezone(now, tz);

      default:
        // Unknown frequency, default to daily behavior
        return this.formatDateInTimezone(lastSent, tz) !== this.formatDateInTimezone(now, tz);
    }
  },

  /**
   * Get the current time components in a given IANA timezone.
   * Delegates to the shared timezone utility.
   */
  getCurrentTimeInTimezone(timezone: string): { hour: number; minute: number; dayOfWeek: number } {
    return _getCurrentTimeInTimezone(timezone);
  },

  /**
   * Check if a routine reminder should fire in the current minute
   * @param scheduleTimes - Array of "HH:MM" strings
   * @param scheduleDays - Array of day-of-week (0-6), null = every day
   * @param timezone - IANA timezone string
   * @param lastSentAt - ISO timestamp of last send
   */
  shouldSendRoutineReminder(
    scheduleTimes: string[] | null,
    scheduleDays: number[] | null,
    timezone: string | null,
    lastSentAt: string | null
  ): boolean {
    if (!scheduleTimes || scheduleTimes.length === 0) return false;

    const tz = timezone || 'UTC';
    const { hour, minute, dayOfWeek } = this.getCurrentTimeInTimezone(tz);

    // Check if today is a scheduled day (null/empty = every day)
    if (scheduleDays && scheduleDays.length > 0 && !scheduleDays.includes(dayOfWeek)) {
      return false;
    }

    // Format current time as HH:MM
    const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Check if any schedule time matches the current minute
    if (!scheduleTimes.includes(currentTimeStr)) {
      return false;
    }

    // Guard against double-sends: skip if last sent within 3 minutes
    // (wider than the 1-minute cron interval to account for slow processing)
    if (lastSentAt) {
      const lastSent = new Date(lastSentAt);
      const now = new Date();
      const diffMs = now.getTime() - lastSent.getTime();
      if (diffMs < 3 * 60 * 1000) {
        return false;
      }
    }

    return true;
  },

  /**
   * Send the actual notification for a reminder
   */
  async sendReminderNotification(reminder: ReminderWithDetails): Promise<void> {
    const { reminder_id, mantra_id, user_device_token, mantra_key_takeaway } =
      reminder;

    if (!user_device_token || !mantra_key_takeaway) {
      throw new Error('Missing required notification data');
    }

    // Use the enhanced reminder notification with dynamic content
    await NotificationService.sendEnhancedReminderNotification(
      user_device_token,
      mantra_key_takeaway,
      reminder_id,
      mantra_id ?? undefined
    );
  },

  /**
   * Process a single collection-based reminder
   * @param reminder - Collection reminder with user and collection details
   */
  async processCollectionReminder(reminder: CollectionReminderWithDetails): Promise<ProcessResult> {
    return this.processReminderGeneric(
      reminder,
      'Collection Reminder',
      (r) => {
        if (!r.collection_name) {
          console.warn(
            `⚠️  Collection Reminder ${r.reminder_id}: Collection has no name, skipping`
          );
          return 'No collection name';
        }
        return null;
      },
      (r) => this.sendCollectionReminderNotification(r),
    );
  },

  /**
   * Send the actual notification for a collection reminder
   */
  async sendCollectionReminderNotification(reminder: CollectionReminderWithDetails): Promise<void> {
    const { reminder_id, collection_id, user_device_token, collection_name } =
      reminder;

    if (!user_device_token || !collection_name || !collection_id) {
      throw new Error('Missing required notification data');
    }

    // Use the collection reminder notification
    await NotificationService.sendCollectionReminderNotification(
      user_device_token,
      collection_name,
      reminder_id,
      collection_id
    );
  },

  /**
   * Format a date as YYYY-MM-DD in the given timezone.
   * Delegates to the shared timezone utility.
   */
  formatDateInTimezone(date: Date, timezone: string): string {
    return _formatDateInTimezone(date, timezone);
  },

  /**
   * Format a date as YYYY-MM in the given timezone.
   * Delegates to the shared timezone utility.
   */
  formatMonthInTimezone(date: Date, timezone: string): string {
    return _formatMonthInTimezone(date, timezone);
  },

  /**
   * Check if two dates are in the same week (week starts on Sunday) in the given timezone.
   * Delegates to the shared timezone utility.
   */
  isSameWeekInTimezone(date1: Date, date2: Date, timezone: string): boolean {
    return _isSameWeekInTimezone(date1, date2, timezone);
  },

  /**
   * Manually trigger processing (useful for testing or admin triggers)
   */
  async triggerProcessing(): Promise<ProcessResult[]> {
    console.log('🔄 Manually triggered reminder processing');
    return await this.processReminders();
  },

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; hasCronTask: boolean } {
    return {
      isRunning: this.isRunning,
      hasCronTask: this.cronTask !== null,
    };
  },
};
