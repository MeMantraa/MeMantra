import * as cron from 'node-cron';
import { UserModel } from '../models/user.model';
import { RecommendationEngine } from './recommendation-engine.service';
import { NotificationService } from './notification.service';
import { generateNotificationContent } from '../config/notification-content.config';

interface SchedulerConfig {
  /** Cron expression for when to send recommendation notifications (default: 9 AM UTC daily) */
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
   * By default fires once per day at 9:00 AM UTC.
   */
  start(config: SchedulerConfig = {}): void {
    const { cronExpression = '0 9 * * *', testMode = false } = config;

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

  /**
   * Stop the recommendation notification scheduler.
   */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    this.isRunning = false;
    console.log('🛑 Recommendation notification scheduler stopped');
  },

  /**
   * Fetch all users who have a registered device token, generate a personalised
   * mantra recommendation for each one, and send them a push notification.
   */
  async processAllUsers(): Promise<RecommendationNotificationResult[]> {
    const results: RecommendationNotificationResult[] = [];

    try {
      const users = await UserModel.findAllWithDeviceTokens();

      if (users.length === 0) {
        return results;
      }

      console.log(`🔔 Sending recommendation notifications to ${users.length} user(s)`);

      for (const user of users) {
        // device_token is guaranteed non-null by findAllWithDeviceTokens
        const result = await this.sendToUser(user.user_id, user.device_token as string);
        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
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
   * @returns Result indicating success or failure
   */
  async sendToUser(
    userId: number,
    deviceToken: string,
  ): Promise<RecommendationNotificationResult> {
    try {
      // Get the single best recommendation for this user
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

      // Build rich notification content using the mantra's primary category
      const primaryCategory = topRec.categories[0]?.name;
      const { title, body } = generateNotificationContent({
        mantraText,
        categoryName: primaryCategory,
      });

      // Send the push notification
      await NotificationService.sendSimpleNotification(deviceToken, title, body, {
        type: 'recommendation',
        mantraId: topRec.mantra.mantra_id,
        reason: topRec.reason,
      });

      console.log(`✅ Recommendation notification sent to user ${userId} (mantra ${topRec.mantra.mantra_id})`);
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

  /**
   * Manually trigger processing for all users.
   * Useful for admin-triggered sends or testing.
   */
  async triggerProcessing(): Promise<RecommendationNotificationResult[]> {
    console.log('🔄 Manually triggered recommendation notification processing');
    return this.processAllUsers();
  },

  /**
   * Get scheduler status.
   */
  getStatus(): { isRunning: boolean; hasCronTask: boolean } {
    return {
      isRunning: this.isRunning,
      hasCronTask: this.cronTask !== null,
    };
  },
};
