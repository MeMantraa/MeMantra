import 'dotenv/config';
import { createApp } from './app';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';
import { RecommendationNotificationService } from './services/recommendation-notification.service';

const PORT = process.env.PORT || 3000;

const app = createApp();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  // Start the reminder scheduler (checks every minute for due reminders)
  // Disabled in test environment
  if (process.env.NODE_ENV !== 'test') {
    ReminderSchedulerService.start({
      cronExpression: '* * * * *', // Every minute
    });

    // Start the recommendation notification scheduler (daily at 9 AM UTC)
    RecommendationNotificationService.start({
      cronExpression: '0 9 * * *', // 9:00 AM UTC every day
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  ReminderSchedulerService.stop();
  RecommendationNotificationService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  ReminderSchedulerService.stop();
  RecommendationNotificationService.stop();
  process.exit(0);
});
