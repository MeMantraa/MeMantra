import { performanceService } from '../../services/performance.service';
import { apiClient } from '../../services/api.config';

jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.Mock;

describe('performanceService.getSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the performance summary endpoint with bearer token', async () => {
    const payload = {
      status: 'success',
      data: {
        enabled: true,
        sample_rate: 1,
        slow_thresholds_ms: { requestMs: 750, queryMs: 200 },
        buffer_size: 3,
        recent_stats: { p50_ms: 10, p95_ms: 25, p99_ms: 45 },
        by_metric: [],
      },
    };
    mockedGet.mockResolvedValue({ data: payload });

    const result = await performanceService.getSummary('abc123');

    expect(mockedGet).toHaveBeenCalledWith('/performance/summary', {
      headers: { Authorization: 'Bearer abc123' },
    });
    expect(result).toEqual(payload);
  });

  it('propagates API errors to caller', async () => {
    mockedGet.mockRejectedValue(new Error('unauthorized'));

    await expect(performanceService.getSummary('bad')).rejects.toThrow('unauthorized');
  });
});
