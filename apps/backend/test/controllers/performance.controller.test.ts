import { Request, Response } from 'express';
import { PerformanceController } from '../../src/controllers/performance.controller';
import { PerformanceMonitor } from '../../src/services/performance-monitor.service';
import { PerformanceEventModel } from '../../src/models/performance-event.model';

jest.mock('../../src/services/performance-monitor.service', () => ({
  PerformanceMonitor: {
    trackEvent: jest.fn(),
  },
}));

jest.mock('../../src/models/performance-event.model', () => ({
  PerformanceEventModel: {
    getSummary: jest.fn(),
  },
}));

const mockedPerformanceMonitor = PerformanceMonitor as jest.Mocked<typeof PerformanceMonitor>;
const mockedPerformanceEventModel = PerformanceEventModel as jest.Mocked<
  typeof PerformanceEventModel
>;

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('PerformanceController.trackEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks a performance event and returns recorded true', async () => {
    const req = {
      body: {
        kind: 'mobile_api',
        name: 'GET /mantra',
        duration_ms: 42,
        status: 'success',
        route: '/mantra',
        method: 'GET',
      },
    } as unknown as Request;
    const res = makeRes();

    await PerformanceController.trackEvent(req, res);

    expect(mockedPerformanceMonitor.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'mobile_api',
        name: 'GET /mantra',
        duration_ms: 42,
        status: 'success',
        source: 'mobile',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { recorded: true } });
  });

  it('returns 500 when tracking throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (mockedPerformanceMonitor.trackEvent as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const req = {
      body: {
        kind: 'mobile_api',
        name: 'GET /mantra',
        duration_ms: 1,
        status: 'success',
      },
    } as unknown as Request;
    const res = makeRes();

    await PerformanceController.trackEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Internal server error' });
    consoleSpy.mockRestore();
  });
});

describe('PerformanceController.getSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns summary with default window of 24 hours', async () => {
    const summary = {
      enabled: true,
      sample_rate: 1,
      slow_thresholds_ms: { requestMs: 750, queryMs: 200 },
      buffer_size: 1,
      recent_stats: { p50_ms: 1, p95_ms: 2, p99_ms: 3 },
      by_metric: [],
    };
    mockedPerformanceEventModel.getSummary.mockResolvedValue(summary as any);

    const req = { query: {} } as unknown as Request;
    const res = makeRes();

    await PerformanceController.getSummary(req, res);

    expect(mockedPerformanceEventModel.getSummary).toHaveBeenCalledWith(24);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: summary });
  });

  it('clamps requested hours to minimum 1', async () => {
    mockedPerformanceEventModel.getSummary.mockResolvedValue({} as any);

    const req = { query: { hours: '-5' } } as unknown as Request;
    const res = makeRes();

    await PerformanceController.getSummary(req, res);

    expect(mockedPerformanceEventModel.getSummary).toHaveBeenCalledWith(1);
  });

  it('returns 500 when model throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedPerformanceEventModel.getSummary.mockRejectedValue(new Error('db failed'));

    const req = { query: {} } as unknown as Request;
    const res = makeRes();

    await PerformanceController.getSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Internal server error' });
    consoleSpy.mockRestore();
  });
});
