import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES } from '../config/queue.config';
import { EngagementOptimizerService } from '../services/engagement-optimizer.service';

export function createEngagementOptimizerWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.ENGAGEMENT_OPTIMIZER,
    async () => {
      await EngagementOptimizerService.processAllUsers();
    },
    {
      connection,
      concurrency: 1,
      lockDuration: 15 * 60 * 1000, // 15 min timeout (batch processes all users)
    },
  );

  worker.on('completed', (job) => {
    console.log(`Engagement optimizer job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Engagement optimizer job ${job?.id} failed:`, err.message);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Engagement optimizer job ${jobId} stalled and will be retried`);
  });

  return worker;
}
