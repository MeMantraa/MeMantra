import { Worker } from 'bullmq';
import { createEngagementOptimizerWorker } from '../../../src/workers/engagement-optimizer.worker';
import { EngagementOptimizerService } from '../../../src/services/engagement-optimizer.service';

jest.mock('bullmq');
jest.mock('../../../src/config/queue.config', () => ({
  connection: { host: 'localhost', port: 6379 },
  QUEUE_NAMES: {
    REMINDERS: 'reminders',
    RECOMMENDATIONS: 'recommendations',
    ENGAGEMENT_OPTIMIZER: 'engagement-optimizer',
  },
}));
jest.mock('../../../src/services/engagement-optimizer.service', () => ({
  EngagementOptimizerService: { processAllUsers: jest.fn() },
}));

let mockOnFn: jest.Mock;
let mockWorkerInstance: { on: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  mockOnFn = jest.fn();
  mockWorkerInstance = { on: mockOnFn };
  (Worker as unknown as jest.Mock).mockImplementation(() => mockWorkerInstance);
});

describe('createEngagementOptimizerWorker', () => {
  it('creates a Worker with the correct queue name', () => {
    createEngagementOptimizerWorker();
    expect(Worker).toHaveBeenCalledWith(
      'engagement-optimizer',
      expect.any(Function),
      expect.any(Object),
    );
  });

  it('creates a Worker with concurrency 1', () => {
    createEngagementOptimizerWorker();
    const options = (Worker as unknown as jest.Mock).mock.calls[0][2];
    expect(options.concurrency).toBe(1);
  });

  it('processor calls EngagementOptimizerService.processAllUsers()', async () => {
    createEngagementOptimizerWorker();
    const processor = (Worker as unknown as jest.Mock).mock.calls[0][1];
    await processor();
    expect(EngagementOptimizerService.processAllUsers).toHaveBeenCalled();
  });

  it('returns the worker instance', () => {
    const result = createEngagementOptimizerWorker();
    expect(result).toBe(mockWorkerInstance);
  });

  it("'completed' handler logs the job id", () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    createEngagementOptimizerWorker();
    const completedHandler = mockOnFn.mock.calls.find((c) => c[0] === 'completed')[1];
    completedHandler({ id: '123' });
    expect(consoleSpy).toHaveBeenCalledWith('Engagement optimizer job 123 completed');
    consoleSpy.mockRestore();
  });

  it("'failed' handler logs the job id and error message", () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    createEngagementOptimizerWorker();
    const failedHandler = mockOnFn.mock.calls.find((c) => c[0] === 'failed')[1];
    failedHandler({ id: '456' }, new Error('something went wrong'));
    expect(consoleSpy).toHaveBeenCalledWith(
      'Engagement optimizer job 456 failed:',
      'something went wrong',
    );
    consoleSpy.mockRestore();
  });
});
