import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES } from '../config/queue.config';
import { RecommendationNotificationService } from '../services/recommendation-notification.service';

export function createRecommendationWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.RECOMMENDATIONS,
    async () => {
      await RecommendationNotificationService.processAllUsers();
    },
    {
      connection,
      concurrency: 1,
      lockDuration: 10 * 60 * 1000, // 10 min timeout (processes many users)
    },
  );

  worker.on('completed', (job) => {
    console.log(`Recommendation job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Recommendation job ${job?.id} failed:`, err.message);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Recommendation job ${jobId} stalled and will be retried`);
  });

  return worker;
}
