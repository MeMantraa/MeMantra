import * as cron from 'node-cron';

export interface SchedulerConfig {
  /** Override the cron expression at start time. */
  cronExpression?: string;
  /** Skip scheduling the cron job; useful in tests. */
  testMode?: boolean;
}

export interface CronSchedulerState {
  cronTask: cron.ScheduledTask | null;
  isRunning: boolean;
}

export function startScheduler(
  state: CronSchedulerState,
  config: SchedulerConfig,
  defaultCron: string,
  name: string,
  onTick: () => Promise<unknown>,
): void {
  const { cronExpression = defaultCron, testMode = false } = config;

  if (state.isRunning) {
    console.warn(`⚠️  ${name} is already running`);
    return;
  }

  if (testMode) {
    console.log(`🧪 ${name} started in test mode`);
    state.isRunning = true;
    return;
  }

  if (!cron.validate(cronExpression)) {
    console.error(`❌ Invalid cron expression: ${cronExpression}`);
    return;
  }

  console.log(`Starting ${name} with cron: ${cronExpression}`);
  state.cronTask = cron.schedule(cronExpression, async () => {
    await onTick();
  });
  state.isRunning = true;
  console.log(`✅ ${name} started successfully`);
}

export function stopScheduler(state: CronSchedulerState, name: string): void {
  if (state.cronTask) {
    state.cronTask.stop();
    state.cronTask = null;
  }
  state.isRunning = false;
  console.log(`🛑 ${name} stopped`);
}

export function getSchedulerStatus(state: CronSchedulerState): {
  isRunning: boolean;
  hasCronTask: boolean;
} {
  return { isRunning: state.isRunning, hasCronTask: state.cronTask !== null };
}
