import { UserModel } from '../models/user.model';
import { EngagementModel } from '../models/engagement.model';
import {
  SchedulerConfig,
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
} from '../utils/cron-scheduler';
import * as cron from 'node-cron';

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
    startScheduler(this, config, '0 3 * * *', 'Engagement optimizer scheduler', () =>
      this.processAllUsers(),
    );
  },

  /** Stop the engagement optimizer scheduler. */
  stop(): void {
    stopScheduler(this, 'Engagement optimizer scheduler');
  },

  /**
   * Compute and persist the optimal send hour for every user with a device
   * token. Users without sufficient engagement data get null (clears stale
   * values so the recommendation service falls back to the default hour).
   */
  async processAllUsers(): Promise<ProcessUserResult[]> {
    const results: ProcessUserResult[] = [];
    const PAGE_SIZE = 100;

    try {
      let offset = 0;
      let batch: Awaited<ReturnType<typeof UserModel.findAllWithDeviceTokensPaginated>>;

      do {
        batch = await UserModel.findAllWithDeviceTokensPaginated(PAGE_SIZE, offset);

        for (const user of batch) {
          const result = await this.processUser(user.user_id, user.timezone ?? 'UTC');
          results.push(result);
        }

        offset += PAGE_SIZE;
      } while (batch.length === PAGE_SIZE);

      const updated = results.filter((r) => !r.skipped && !r.error).length;
      const errors = results.filter((r) => r.error).length;
      console.log(
        `Engagement optimizer: ${updated} updated, ${errors} errors out of ${results.length} users`,
      );
    } catch (error) {
      console.error('Error in EngagementOptimizerService.processAllUsers:', error);
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
    return getSchedulerStatus(this);
  },
};
