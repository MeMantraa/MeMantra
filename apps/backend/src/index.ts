import 'dotenv/config';
import { createApp } from './app';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';
import { RecommendationNotificationService } from './services/recommendation-notification.service';
import { EngagementOptimizerService } from './services/engagement-optimizer.service';

const PORT = process.env.PORT || 3000;
const shouldRunSchedulers =
  process.env.NODE_ENV !== 'test' && process.env.RUN_SCHEDULERS !== 'false';

const app = createApp();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Schedulers enabled: ${shouldRunSchedulers}`);

  // Disable background schedulers in test or hosted web-service processes when requested.
  if (shouldRunSchedulers) {
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  ReminderSchedulerService.stop();
  RecommendationNotificationService.stop();
  EngagementOptimizerService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  ReminderSchedulerService.stop();
  RecommendationNotificationService.stop();
  EngagementOptimizerService.stop();
  process.exit(0);
});
