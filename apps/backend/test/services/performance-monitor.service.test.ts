describe('PerformanceMonitorService', () => {
  const envBackup = { ...process.env };

  const loadMonitor = (envOverrides: Record<string, string | undefined> = {}) => {
    jest.resetModules();

    const queryMock = jest.fn().mockResolvedValue({});

    jest.doMock('pg', () => ({
      Pool: jest.fn(() => ({ query: queryMock })),
    }));

    process.env = {
      ...envBackup,
      MONITORING_ENABLED: 'true',
      MONITORING_SAMPLE_RATE: '1',
      MONITORING_PERSIST_ENABLED: 'false',
      SLOW_REQUEST_MS: '100',
      SLOW_QUERY_MS: '50',
      NODE_ENV: 'test',
      ...envOverrides,
    };

    let PerformanceMonitor: any;
    jest.isolateModules(() => {
      ({ PerformanceMonitor } = require('../../src/services/performance-monitor.service'));
    });

    return { PerformanceMonitor, queryMock };
  };

  afterAll(() => {
    process.env = envBackup;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not track events when monitoring is disabled', () => {
    const { PerformanceMonitor } = loadMonitor({ MONITORING_ENABLED: 'false' });

    PerformanceMonitor.trackEvent({
      kind: 'api_request',
      name: 'GET /health',
      duration_ms: 10,
      status: 'success',
      source: 'backend',
      route: '/health',
      method: 'GET',
    });

    const summary = PerformanceMonitor.getSummary();
    expect(summary.buffer_size).toBe(0);
    expect(summary.by_metric).toEqual([]);
  });

  it('samples mobile events and always keeps backend events', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.8);
    const { PerformanceMonitor } = loadMonitor({ MONITORING_SAMPLE_RATE: '0.5' });

    PerformanceMonitor.trackEvent({
      kind: 'mobile_api',
      name: 'GET /mobile',
      duration_ms: 20,
      status: 'success',
      source: 'mobile',
    });

    PerformanceMonitor.trackEvent({
      kind: 'api_request',
      name: 'GET /backend',
      duration_ms: 20,
      status: 'success',
      source: 'backend',
      route: '/backend',
      method: 'GET',
    });

    const summary = PerformanceMonitor.getSummary();
    expect(summary.buffer_size).toBe(1);
    expect(summary.by_metric[0].key).toContain('api_request|GET /backend');

    randomSpy.mockRestore();
  });

  it('aggregates error and slow counts using configured thresholds', () => {
    const { PerformanceMonitor } = loadMonitor({ SLOW_REQUEST_MS: '100', SLOW_QUERY_MS: '50' });

    PerformanceMonitor.trackEvent({
      kind: 'db_query',
      name: 'SELECT',
      duration_ms: 60,
      status: 'error',
      source: 'backend',
    });

    PerformanceMonitor.trackEvent({
      kind: 'api_request',
      name: 'GET /slow',
      duration_ms: 150,
      status: 'success',
      source: 'backend',
      route: '/slow',
      method: 'GET',
    });

    const summary = PerformanceMonitor.getSummary();
    const dbMetric = summary.by_metric.find((m: any) => m.key.startsWith('db_query|SELECT'));
    const apiMetric = summary.by_metric.find((m: any) => m.key.startsWith('api_request|GET /slow'));

    expect(dbMetric).toEqual(
      expect.objectContaining({ count: 1, error_count: 1, slow_count: 1, error_rate: 1 }),
    );
    expect(apiMetric).toEqual(
      expect.objectContaining({ count: 1, error_count: 0, slow_count: 1, error_rate: 0 }),
    );
    expect(summary.recent_stats.p95_ms).toBeGreaterThanOrEqual(60);
  });

  it('measureAsync tracks success and returns operation result', async () => {
    const { PerformanceMonitor } = loadMonitor();

    const result = await PerformanceMonitor.measureAsync(
      'recommendation.build_profile',
      async () => 'ok',
      {
        kind: 'service_operation',
        source: 'backend',
        metadata: { user_id: 1 },
      },
    );

    expect(result).toBe('ok');

    const summary = PerformanceMonitor.getSummary();
    expect(summary.buffer_size).toBe(1);
    expect(summary.by_metric[0].key).toContain('service_operation|recommendation.build_profile');
  });

  it('measureAsync tracks errors and rethrows', async () => {
    const { PerformanceMonitor } = loadMonitor();

    await expect(
      PerformanceMonitor.measureAsync(
        'recommendation.log_results',
        async () => {
          throw new TypeError('failed');
        },
        {
          kind: 'service_operation',
          source: 'backend',
          metadata: { user_id: 9 },
        },
      ),
    ).rejects.toThrow('failed');

    const summary = PerformanceMonitor.getSummary();
    expect(summary.buffer_size).toBe(1);
    expect(summary.by_metric[0].error_count).toBe(1);
  });

  it('persists events when persistence is enabled outside test env', async () => {
    const { PerformanceMonitor, queryMock } = loadMonitor({
      NODE_ENV: 'development',
      MONITORING_PERSIST_ENABLED: 'true',
    });

    PerformanceMonitor.trackEvent({
      kind: 'api_request',
      name: 'POST /journal',
      duration_ms: 35,
      status: 'success',
      source: 'backend',
      route: '/journal',
      method: 'POST',
      metadata: { foo: 'bar' },
    });

    await Promise.resolve();

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "PerformanceEvent"'),
      expect.arrayContaining(['api_request', 'POST /journal', 35, 'success', 'backend']),
    );
  });
});
