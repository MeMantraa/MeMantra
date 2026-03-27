const sqlMock = jest.fn();

jest.mock('kysely', () => ({
  sql: (...args: any[]) => sqlMock(...args),
}));

jest.mock('../../src/db', () => ({
  db: {},
}));

import { PerformanceEventModel } from '../../src/models/performance-event.model';

describe('PerformanceEventModel.getSummary', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('maps percentile and metric rows into response shape', async () => {
    sqlMock
      .mockImplementationOnce(() => ({
        execute: jest.fn().mockResolvedValue({
          rows: [{ p50: 12.345, p95: 22.225, p99: 50.126, count: 4 }],
        }),
      }))
      .mockImplementationOnce(() => ({
        execute: jest.fn().mockResolvedValue({
          rows: [
            {
              key: 'api_request|GET /health|GET|/health',
              count: 4,
              error_count: 1,
              slow_count: 2,
              avg_duration_ms: 12.987,
              max_duration_ms: 88.889,
            },
          ],
        }),
      }));

    process.env.MONITORING_ENABLED = 'true';
    process.env.MONITORING_SAMPLE_RATE = '0.4';
    process.env.SLOW_REQUEST_MS = '900';
    process.env.SLOW_QUERY_MS = '150';

    const summary = await PerformanceEventModel.getSummary(24);

    expect(summary.enabled).toBe(true);
    expect(summary.sample_rate).toBe(0.4);
    expect(summary.slow_thresholds_ms).toEqual({ requestMs: 900, queryMs: 150 });
    expect(summary.buffer_size).toBe(4);
    expect(summary.recent_stats).toEqual({ p50_ms: 12.35, p95_ms: 22.23, p99_ms: 50.13 });
    expect(summary.by_metric).toEqual([
      {
        key: 'api_request|GET /health|GET|/health',
        count: 4,
        error_count: 1,
        error_rate: 0.25,
        slow_count: 2,
        avg_duration_ms: 12.99,
        max_duration_ms: 88.89,
      },
    ]);
  });

  it('uses safe defaults and handles empty rows', async () => {
    sqlMock
      .mockImplementationOnce(() => ({
        execute: jest.fn().mockResolvedValue({ rows: [] }),
      }))
      .mockImplementationOnce(() => ({
        execute: jest.fn().mockResolvedValue({ rows: [] }),
      }));

    process.env.MONITORING_ENABLED = 'false';
    process.env.MONITORING_SAMPLE_RATE = '10';
    delete process.env.SLOW_REQUEST_MS;
    delete process.env.SLOW_QUERY_MS;

    const summary = await PerformanceEventModel.getSummary(0);

    expect(summary.enabled).toBe(false);
    expect(summary.sample_rate).toBe(1);
    expect(summary.slow_thresholds_ms).toEqual({ requestMs: 750, queryMs: 200 });
    expect(summary.buffer_size).toBe(0);
    expect(summary.recent_stats).toEqual({ p50_ms: 0, p95_ms: 0, p99_ms: 0 });
    expect(summary.by_metric).toEqual([]);
  });

  it('caps sample rate lower bound at 0', async () => {
    sqlMock
      .mockImplementationOnce(() => ({ execute: jest.fn().mockResolvedValue({ rows: [] }) }))
      .mockImplementationOnce(() => ({ execute: jest.fn().mockResolvedValue({ rows: [] }) }));

    process.env.MONITORING_SAMPLE_RATE = '-3';

    const summary = await PerformanceEventModel.getSummary(48);

    expect(summary.sample_rate).toBe(0);
  });
});
