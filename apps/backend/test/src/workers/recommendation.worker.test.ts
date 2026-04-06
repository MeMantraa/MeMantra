import { Worker } from 'bullmq';
import { createRecommendationWorker } from '../../../src/workers/recommendation.worker';
import { RecommendationNotificationService } from '../../../src/services/recommendation-notification.service';

jest.mock('bullmq');
jest.mock('../../../src/config/queue.config', () => ({
  connection: { host: 'localhost', port: 6379 },
  QUEUE_NAMES: {
    REMINDERS: 'reminders',
    RECOMMENDATIONS: 'recommendations',
    ENGAGEMENT_OPTIMIZER: 'engagement-optimizer',
  },
}));
jest.mock('../../../src/services/recommendation-notification.service', () => ({
  RecommendationNotificationService: { processAllUsers: jest.fn() },
}));

let mockOnFn: jest.Mock;
let mockWorkerInstance: { on: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  mockOnFn = jest.fn();
  mockWorkerInstance = { on: mockOnFn };
  (Worker as unknown as jest.Mock).mockImplementation(() => mockWorkerInstance);
});

describe('createRecommendationWorker', () => {
  it('creates a Worker with the correct queue name', () => {
    createRecommendationWorker();
    expect(Worker).toHaveBeenCalledWith(
      'recommendations',
      expect.any(Function),
      expect.any(Object),
    );
  });

  it('creates a Worker with concurrency 1 and a lockDuration', () => {
    createRecommendationWorker();
    const options = (Worker as unknown as jest.Mock).mock.calls[0][2];
    expect(options.concurrency).toBe(1);
    expect(options.lockDuration).toBe(10 * 60 * 1000);
  });

  it('processor calls RecommendationNotificationService.processAllUsers()', async () => {
    createRecommendationWorker();
    const processor = (Worker as unknown as jest.Mock).mock.calls[0][1];
    await processor();
    expect(RecommendationNotificationService.processAllUsers).toHaveBeenCalled();
  });

  it('returns the worker instance', () => {
    const result = createRecommendationWorker();
    expect(result).toBe(mockWorkerInstance);
  });

  it("'completed' handler logs the job id", () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    createRecommendationWorker();
    const completedHandler = mockOnFn.mock.calls.find((c) => c[0] === 'completed')[1];
    completedHandler({ id: '123' });
    expect(consoleSpy).toHaveBeenCalledWith('Recommendation job 123 completed');
    consoleSpy.mockRestore();
  });

  it("'failed' handler logs the job id and error message", () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    createRecommendationWorker();
    const failedHandler = mockOnFn.mock.calls.find((c) => c[0] === 'failed')[1];
    failedHandler({ id: '456' }, new Error('something went wrong'));
    expect(consoleSpy).toHaveBeenCalledWith(
      'Recommendation job 456 failed:',
      'something went wrong',
    );
    consoleSpy.mockRestore();
  });

  it("'stalled' handler logs the job id", () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    createRecommendationWorker();
    const stalledHandler = mockOnFn.mock.calls.find((c) => c[0] === 'stalled')[1];
    stalledHandler('789');
    expect(consoleSpy).toHaveBeenCalledWith('Recommendation job 789 stalled and will be retried');
    consoleSpy.mockRestore();
  });
});
