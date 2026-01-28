import * as cron from 'node-cron';
import { ReminderModel } from '../models/reminder.model';
import { NotificationService } from './notification.service';

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

interface ReminderWithDetails {
  reminder_id: number;
  user_id: number | null;
  mantra_id: number | null;
  time: string | null;
  frequency: string | null;
  status: string | null;
  last_sent_at: string | null;
  user_device_token: string | null;
  mantra_title: string | null;
  mantra_key_takeaway: string | null;
}

interface CollectionReminderWithDetails {
  reminder_id: number;
  user_id: number | null;
  collection_id: number | null;
  time: string | null;
  frequency: string | null;
  status: string | null;
  last_sent_at: string | null;
  user_device_token: string | null;
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
   * Process a single reminder
   * @param reminder - Reminder with user and mantra details
   */
  async processReminder(reminder: ReminderWithDetails): Promise<ProcessResult> {
    const { reminder_id, frequency, last_sent_at } = reminder;

    try {
      // Check if reminder should be sent based on frequency
      if (!this.shouldSendReminder(frequency, last_sent_at)) {
        return { reminderId: reminder_id, success: true }; // Skip but don't mark as failure
      }

      // Validate required data
      if (!reminder.user_device_token) {
        console.warn(
          `⚠️  Reminder ${reminder_id}: User has no device token, skipping`
        );
        return {
          reminderId: reminder_id,
          success: false,
          error: 'No device token',
        };
      }

      if (!reminder.mantra_key_takeaway) {
        console.warn(
          `⚠️  Reminder ${reminder_id}: Mantra has no key takeaway, skipping`
        );
        return {
          reminderId: reminder_id,
          success: false,
          error: 'No mantra content',
        };
      }

      // Send the notification
      await this.sendReminderNotification(reminder);

      // Update reminder status
      if (frequency === 'once') {
        // Mark one-time reminders as completed
        await ReminderModel.markAsCompleted(reminder_id);
      } else {
        // Update last_sent_at for recurring reminders
        await ReminderModel.updateLastSentAt(reminder_id);
      }

      console.log(`✅ Reminder ${reminder_id} sent successfully`);
      return { reminderId: reminder_id, success: true };
    } catch (error) {
      console.error(`❌ Error processing reminder ${reminder_id}:`, error);
      return {
        reminderId: reminder_id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Determine if a reminder should be sent based on its frequency and last send time
   * @param frequency - Reminder frequency (once, daily, weekly, monthly, custom)
   * @param lastSentAt - ISO timestamp of when reminder was last sent
   */
  shouldSendReminder(
    frequency: string | null,
    lastSentAt: string | null
  ): boolean {
    // One-time reminders: send if never sent
    if (frequency === 'once') {
      return lastSentAt === null;
    }

    // If never sent, send now
    if (lastSentAt === null) {
      return true;
    }

    const lastSent = new Date(lastSentAt);
    const now = new Date();

    switch (frequency) {
      case 'daily':
        // Send if last sent was on a different day
        return !this.isSameDay(lastSent, now);

      case 'weekly':
        // Send if last sent was in a different week
        return !this.isSameWeek(lastSent, now);

      case 'monthly':
        // Send if last sent was in a different month
        return !this.isSameMonth(lastSent, now);

      case 'custom':
        // For custom frequency, check if enough time has passed
        // Default to daily behavior for now
        return !this.isSameDay(lastSent, now);

      default:
        // Unknown frequency, default to daily behavior
        return !this.isSameDay(lastSent, now);
    }
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
    const { reminder_id, frequency, last_sent_at } = reminder;

    try {
      // Check if reminder should be sent based on frequency
      if (!this.shouldSendReminder(frequency, last_sent_at)) {
        return { reminderId: reminder_id, success: true }; // Skip but don't mark as failure
      }

      // Validate required data
      if (!reminder.user_device_token) {
        console.warn(
          `⚠️  Collection Reminder ${reminder_id}: User has no device token, skipping`
        );
        return {
          reminderId: reminder_id,
          success: false,
          error: 'No device token',
        };
      }

      if (!reminder.collection_name) {
        console.warn(
          `⚠️  Collection Reminder ${reminder_id}: Collection has no name, skipping`
        );
        return {
          reminderId: reminder_id,
          success: false,
          error: 'No collection name',
        };
      }

      // Send the notification
      await this.sendCollectionReminderNotification(reminder);

      // Update reminder status
      if (frequency === 'once') {
        // Mark one-time reminders as completed
        await ReminderModel.markAsCompleted(reminder_id);
      } else {
        // Update last_sent_at for recurring reminders
        await ReminderModel.updateLastSentAt(reminder_id);
      }

      console.log(`✅ Collection Reminder ${reminder_id} sent successfully`);
      return { reminderId: reminder_id, success: true };
    } catch (error) {
      console.error(`❌ Error processing collection reminder ${reminder_id}:`, error);
      return {
        reminderId: reminder_id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
   * Check if two dates are on the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  },

  /**
   * Check if two dates are in the same week (week starts on Sunday)
   */
  isSameWeek(date1: Date, date2: Date): boolean {
    const startOfWeek1 = this.getStartOfWeek(date1);
    const startOfWeek2 = this.getStartOfWeek(date2);
    return startOfWeek1.getTime() === startOfWeek2.getTime();
  },

  /**
   * Get the start of the week for a given date (Sunday at midnight)
   */
  getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() - result.getDay());
    return result;
  },

  /**
   * Check if two dates are in the same month
   */
  isSameMonth(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
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
