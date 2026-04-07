import { Worker } from 'bullmq';
import { createReminderWorker } from '../../../src/workers/reminder.worker';
import { ReminderSchedulerService } from '../../../src/services/reminder-scheduler.service';

jest.mock('bullmq');
jest.mock('../../../src/config/queue.config', () => ({
  connection: { host: 'localhost', port: 6379 },
  QUEUE_NAMES: {
    REMINDERS: 'reminders',
    RECOMMENDATIONS: 'recommendations',
    ENGAGEMENT_OPTIMIZER: 'engagement-optimizer',
  },
}));
jest.mock('../../../src/services/reminder-scheduler.service', () => ({
  ReminderSchedulerService: { processReminders: jest.fn() },
}));

let mockOnFn: jest.Mock;
let mockWorkerInstance: { on: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  mockOnFn = jest.fn();
  mockWorkerInstance = { on: mockOnFn };
  (Worker as unknown as jest.Mock).mockImplementation(() => mockWorkerInstance);
});

describe('createReminderWorker', () => {
  it('creates a Worker with the correct queue name', () => {
    createReminderWorker();
    expect(Worker).toHaveBeenCalledWith('reminders', expect.any(Function), expect.any(Object));
  });

  it('creates a Worker with concurrency 1 and a lockDuration', () => {
    createReminderWorker();
    const options = (Worker as unknown as jest.Mock).mock.calls[0][2];
    expect(options.concurrency).toBe(1);
    expect(options.lockDuration).toBe(5 * 60 * 1000);
  });

  it('processor calls ReminderSchedulerService.processReminders()', async () => {
    createReminderWorker();
    const processor = (Worker as unknown as jest.Mock).mock.calls[0][1];
    await processor();
    expect(ReminderSchedulerService.processReminders).toHaveBeenCalled();
  });

  it('returns the worker instance', () => {
    const result = createReminderWorker();
    expect(result).toBe(mockWorkerInstance);
  });

  it("'completed' handler logs the job id", () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    createReminderWorker();
    const completedHandler = mockOnFn.mock.calls.find((c) => c[0] === 'completed')[1];
    completedHandler({ id: '123' });
    expect(consoleSpy).toHaveBeenCalledWith('Reminder job 123 completed');
    consoleSpy.mockRestore();
  });

  it("'failed' handler logs the job id and error message", () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    createReminderWorker();
    const failedHandler = mockOnFn.mock.calls.find((c) => c[0] === 'failed')[1];
    failedHandler({ id: '456' }, new Error('something went wrong'));
    expect(consoleSpy).toHaveBeenCalledWith('Reminder job 456 failed:', 'something went wrong');
    consoleSpy.mockRestore();
  });

  it("'stalled' handler logs the job id", () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    createReminderWorker();
    const stalledHandler = mockOnFn.mock.calls.find((c) => c[0] === 'stalled')[1];
    stalledHandler('789');
    expect(consoleSpy).toHaveBeenCalledWith('Reminder job 789 stalled and will be retried');
    consoleSpy.mockRestore();
  });
});
