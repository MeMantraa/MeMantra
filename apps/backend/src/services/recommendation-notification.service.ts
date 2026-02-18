import * as cron from 'node-cron';
import { UserModel } from '../models/user.model';
import { EngagementModel } from '../models/engagement.model';
import { RecommendationEngine } from './recommendation-engine.service';
import { NotificationService } from './notification.service';
import { generateNotificationContent } from '../config/notification-content.config';
import { User } from '../types/database.types';
import { getCurrentTimeInTimezone as _getCurrentTimeInTimezone } from '../utils/timezone.utils';

/** Fallback hour (in the user's local timezone) when no optimal hour is computed */
const DEFAULT_TARGET_HOUR = 9;

interface SchedulerConfig {
  /** Cron expression (default: every minute so timezone checks can fire precisely) */
  cronExpression?: string;
  /** Whether to run in test mode (no actual cron job, just exposes methods) */
  testMode?: boolean;
}

interface RecommendationNotificationResult {
  userId: number;
  success: boolean;
  error?: string;
}

export const RecommendationNotificationService = {
  cronTask: null as cron.ScheduledTask | null,
  isRunning: false,

  /**
   * Start the recommendation notification scheduler.
   *
   * Runs at the top of every hour by default. On each tick it checks which
   * users' local clock reads TARGET_HOUR and sends only to those users.
   * Running hourly (24 ticks/day) rather than every minute (1440 ticks/day)
   * keeps DB load minimal while still delivering to whole-hour UTC offsets.
   * Users in half/quarter-hour offset timezones (e.g. India UTC+5:30) receive
   * their notification within the same hour rather than at exactly 9:00 AM.
   */
  start(config: SchedulerConfig = {}): void {
    const { cronExpression = '0 * * * *', testMode = false } = config;

    if (this.isRunning) {
      console.log('⚠️  Recommendation notification scheduler is already running');
      return;
    }

    if (testMode) {
      console.log('🧪 Recommendation notification scheduler started in test mode');
      this.isRunning = true;
      return;
    }

    if (!cron.validate(cronExpression)) {
      console.error(`❌ Invalid cron expression: ${cronExpression}`);
      return;
    }

    console.log(`🔔 Starting recommendation notification scheduler with cron: ${cronExpression}`);

    this.cronTask = cron.schedule(cronExpression, async () => {
      await this.processAllUsers();
    });

    this.isRunning = true;
    console.log('✅ Recommendation notification scheduler started successfully');
  },

  /** Stop the recommendation notification scheduler. */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    this.isRunning = false;
    console.log('🛑 Recommendation notification scheduler stopped');
  },

  /**
   * Return the current hour and minute in a given IANA timezone.
   * Delegates to the shared timezone utility.
   */
  getCurrentTimeInTimezone(timezone: string): { hour: number; minute: number } {
    return _getCurrentTimeInTimezone(timezone);
  },

  /**
   * Decide whether a recommendation notification should be sent to this user
   * on the current cron tick.
   *
   * Sends when BOTH conditions are true:
   *  1. It is currently the user's target hour in their local timezone.
   *     The target hour is `optimal_send_hour` when set, otherwise falls back
   *     to DEFAULT_TARGET_HOUR (9 AM). Minute is intentionally not checked —
   *     the cron fires at :00 so any user whose local hour matches is eligible,
   *     including those in half/quarter-hour offset timezones.
   *  2. A recommendation notification has not already been sent today
   *     (compared in the user's local timezone to handle DST correctly).
   */
  shouldSendToUser(user: User): boolean {
    const tz = user.timezone || 'UTC';
    const { hour } = this.getCurrentTimeInTimezone(tz);

    const targetHour = user.optimal_send_hour ?? DEFAULT_TARGET_HOUR;
    if (hour !== targetHour) {
      return false;
    }

    // Prevent duplicate sends on the same local day
    if (user.recommendation_notif_sent_at) {
      const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz }); // en-CA → YYYY-MM-DD
      const todayStr = fmt.format(new Date());
      const lastSentStr = fmt.format(new Date(user.recommendation_notif_sent_at));
      if (todayStr === lastSentStr) {
        return false;
      }
    }

    return true;
  },

  /**
   * Check every user with a device token; those whose local clock reads
   * TARGET_HOUR:00 and who haven't received a notification yet today get a
   * personalised mantra recommendation push notification.
   */
  async processAllUsers(): Promise<RecommendationNotificationResult[]> {
    const results: RecommendationNotificationResult[] = [];

    try {
      const users = await UserModel.findAllWithDeviceTokens();
      const eligible = users.filter((u) => this.shouldSendToUser(u));

      if (eligible.length === 0) {
        return results;
      }

      console.log(`🔔 Sending recommendation notifications to ${eligible.length} user(s)`);

      for (const user of eligible) {
        const result = await this.sendToUser(user.user_id, user.device_token as string);

        if (result.success) {
          // Persist the send timestamp so the user isn't notified twice today
          await UserModel.update(user.user_id, {
            recommendation_notif_sent_at: new Date().toISOString(),
          }).catch(() => {
            // Non-critical: don't fail the whole run if the update fails
          });
        }

        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;
      console.log(`📊 Recommendation notifications: ${successCount} sent, ${failCount} failed`);
    } catch (error) {
      console.error('❌ Error processing recommendation notifications:', error);
    }

    return results;
  },

  /**
   * Generate and send a personalised mantra recommendation notification to one user.
   *
   * @param userId - The user's ID (used to run the recommendation engine)
   * @param deviceToken - The user's Expo push token
   */
  async sendToUser(
    userId: number,
    deviceToken: string,
  ): Promise<RecommendationNotificationResult> {
    try {
      const recommendations = await RecommendationEngine.generateRecommendations(userId, {
        limit: 1,
      });

      if (recommendations.length === 0) {
        return { userId, success: false, error: 'No recommendations available' };
      }

      const [topRec] = recommendations;
      const mantraText = topRec.mantra.key_takeaway || topRec.mantra.title || '';

      if (!mantraText) {
        return { userId, success: false, error: 'Recommended mantra has no displayable text' };
      }

      const primaryCategory = topRec.categories[0]?.name;
      const { title, body } = generateNotificationContent({
        mantraText,
        categoryName: primaryCategory,
      });

      await NotificationService.sendSimpleNotification(deviceToken, title, body, {
        type: 'recommendation',
        mantraId: topRec.mantra.mantra_id,
        reason: topRec.reason,
      });

      console.log(
        `✅ Recommendation notification sent to user ${userId} (mantra ${topRec.mantra.mantra_id})`,
      );
      // Track the send for tap-through rate analytics (fire-and-forget)
      EngagementModel.create(userId, 'notification_sent').catch(() => {});
      return { userId, success: true };
    } catch (error) {
      console.error(`❌ Error sending recommendation notification to user ${userId}:`, error);
      return {
        userId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /** Manually trigger processing for all users. */
  async triggerProcessing(): Promise<RecommendationNotificationResult[]> {
    console.log('🔄 Manually triggered recommendation notification processing');
    return this.processAllUsers();
  },

  getStatus(): { isRunning: boolean; hasCronTask: boolean } {
    return {
      isRunning: this.isRunning,
      hasCronTask: this.cronTask !== null,
    };
  },
};
