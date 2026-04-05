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
    },
  );

  worker.on('completed', (job) => {
    console.log(`Engagement optimizer job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Engagement optimizer job ${job?.id} failed:`, err.message);
  });

  return worker;
}
