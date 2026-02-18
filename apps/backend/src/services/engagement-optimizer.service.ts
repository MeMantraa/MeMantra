import * as cron from 'node-cron';
import { UserModel } from '../models/user.model';
import { EngagementModel } from '../models/engagement.model';

interface SchedulerConfig {
  /** Cron expression (default: nightly at 3 AM UTC) */
  cronExpression?: string;
  /** Whether to run in test mode (no actual cron job, just exposes methods) */
  testMode?: boolean;
}

interface ProcessUserResult {
  userId: number;
  optimalHour: number | null;
  skipped?: boolean;
  error?: string;
}

export const EngagementOptimizerService = {
  cronTask: null as cron.ScheduledTask | null,
  isRunning: false,

  /** Start the engagement optimizer scheduler. */
  start(config: SchedulerConfig = {}): void {
    const { cronExpression = '0 3 * * *', testMode = false } = config;

    if (this.isRunning) {
      console.warn('⚠️  Engagement optimizer scheduler is already running');
      return;
    }

    if (testMode) {
      console.log('🧪 Engagement optimizer scheduler started in test mode');
      this.isRunning = true;
      return;
    }

    if (!cron.validate(cronExpression)) {
      console.error(`❌ Invalid cron expression: ${cronExpression}`);
      return;
    }

    console.log(`📊 Starting engagement optimizer scheduler with cron: ${cronExpression}`);

    this.cronTask = cron.schedule(cronExpression, async () => {
      await this.processAllUsers();
    });

    this.isRunning = true;
    console.log('✅ Engagement optimizer scheduler started successfully');
  },

  /** Stop the engagement optimizer scheduler. */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    this.isRunning = false;
    console.log('🛑 Engagement optimizer scheduler stopped');
  },

  /**
   * Compute and persist the optimal send hour for every user with a device
   * token. Users without sufficient engagement data get null (clears stale
   * values so the recommendation service falls back to the default hour).
   */
  async processAllUsers(): Promise<ProcessUserResult[]> {
    const results: ProcessUserResult[] = [];

    try {
      const users = await UserModel.findAllWithDeviceTokens();
      console.log(`📊 Computing optimal send hours for ${users.length} user(s)`);

      for (const user of users) {
        const result = await this.processUser(user.user_id, user.timezone ?? 'UTC');
        results.push(result);
      }

      const updated = results.filter((r) => !r.skipped && !r.error).length;
      const errors = results.filter((r) => r.error).length;
      console.log(`✅ Engagement optimizer: ${updated} updated, ${errors} errors`);
    } catch (error) {
      console.error('❌ Error in EngagementOptimizerService.processAllUsers:', error);
    }

    return results;
  },

  /**
   * Compute the optimal send hour for a single user and persist it.
   * Writes null when data is insufficient (clearing any stale value).
   */
  async processUser(userId: number, timezone: string): Promise<ProcessUserResult> {
    try {
      const optimalHour = await EngagementModel.getOptimalHour(userId, timezone);
      await UserModel.update(userId, { optimal_send_hour: optimalHour });
      return { userId, optimalHour };
    } catch (error) {
      console.error(`❌ Error processing engagement for user ${userId}:`, error);
      return {
        userId,
        optimalHour: null,
        skipped: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /** Manually trigger processing for all users. */
  async triggerProcessing(): Promise<ProcessUserResult[]> {
    console.log('🔄 Manually triggered engagement optimizer processing');
    return this.processAllUsers();
  },

  getStatus(): { isRunning: boolean; hasCronTask: boolean } {
    return {
      isRunning: this.isRunning,
      hasCronTask: this.cronTask !== null,
    };
  },
};
