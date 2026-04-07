import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES } from '../config/queue.config';
import { ReminderSchedulerService } from '../services/reminder-scheduler.service';

export function createReminderWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.REMINDERS,
    async () => {
      await ReminderSchedulerService.processReminders();
    },
    {
      connection,
      concurrency: 1,
      lockDuration: 5 * 60 * 1000, // 5 min timeout to prevent indefinite hangs
    },
  );

  worker.on('completed', (job) => {
    console.log(`Reminder job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err.message);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Reminder job ${jobId} stalled and will be retried`);
  });

  return worker;
}
