import 'dotenv/config';
import { createApp } from './app';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';
import { RecommendationNotificationService } from './services/recommendation-notification.service';
import { EngagementOptimizerService } from './services/engagement-optimizer.service';
import { connectRedis, disconnectRedis } from './config/redis.config';
import {
  createReminderWorker,
  createRecommendationWorker,
  createEngagementOptimizerWorker,
} from './workers';
import type { Worker } from 'bullmq';

const PORT = process.env.PORT || 3000;
const shouldRunSchedulers =
  process.env.NODE_ENV !== 'test' && process.env.RUN_SCHEDULERS !== 'false';

const app = createApp();
const workers: Worker[] = [];

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Schedulers enabled: ${shouldRunSchedulers}`);

  // Connect to Redis
  await connectRedis().catch((err) => {
    console.warn('Redis connection failed, caching disabled:', err.message);
  });

  // Disable background schedulers in test or hosted web-service processes when requested.
  if (shouldRunSchedulers) {
    // Start BullMQ workers to process background jobs
    workers.push(
      createReminderWorker(),
      createRecommendationWorker(),
      createEngagementOptimizerWorker(),
    );
    console.log('BullMQ workers started');

    // Start cron schedulers to enqueue jobs on schedule
    ReminderSchedulerService.start({
      cronExpression: '* * * * *',
    });

    RecommendationNotificationService.start({
      cronExpression: '0 * * * *',
    });

    EngagementOptimizerService.start({
      cronExpression: '0 3 * * *',
    });
  } else {
    console.log('Background schedulers are disabled for this process');
  }
});

// Graceful shutdown with 30s timeout to prevent hanging
async function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);

  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out after 30s, forcing exit');
    process.exit(1);
  }, 30_000);

  try {
    ReminderSchedulerService.stop();
    RecommendationNotificationService.stop();
    EngagementOptimizerService.stop();
    await Promise.all(workers.map((w) => w.close()));
    await disconnectRedis();
  } catch (err) {
    console.error('Error during shutdown:', err);
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
