jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

let capturedParsers: Record<number, (val: string) => string> = {};
let mockPoolInstance: any;

jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => mockPoolInstance),
    types: {
      setTypeParser: jest.fn((oid: number, parser: (val: string) => string) => {
        capturedParsers[oid] = parser;
      }),
    },
  };
});

jest.mock('kysely', () => ({
  Kysely: jest.fn(() => ({})),
  PostgresDialect: jest.fn(() => ({})),
}));

jest.mock('../../src/services/performance-monitor.service', () => ({
  PerformanceMonitor: {
    trackEvent: jest.fn(),
  },
}));

describe('db/index timestamp type parser', () => {
  beforeEach(() => {
    jest.resetModules();
    capturedParsers = {};
    mockPoolInstance = {
      query: jest.fn().mockResolvedValue({ rowCount: 2 }),
    };
    process.env.DATABASE_URL = 'postgres://user:pass@host:5432/dbname';
  });

  it('registers a type parser for OID 1114 (TIMESTAMP WITHOUT TIME ZONE)', () => {
    require('../../src/db/index');
    const { types } = require('pg');

    expect(types.setTypeParser).toHaveBeenCalledWith(1114, expect.any(Function));
  });

  it('converts TIMESTAMP values to UTC ISO format', () => {
    require('../../src/db/index');

    const parser = capturedParsers[1114];
    expect(parser).toBeDefined();

    // PostgreSQL returns TIMESTAMP WITHOUT TIME ZONE as "2024-12-01 09:00:00"
    expect(parser('2024-12-01 09:00:00')).toBe('2024-12-01T09:00:00Z');
    expect(parser('2025-06-15 14:30:45.123')).toBe('2025-06-15T14:30:45.123Z');
  });

  it('handles timestamps that already have T separator', () => {
    require('../../src/db/index');

    const parser = capturedParsers[1114];
    // If somehow already has T, only the first space is replaced (none exists)
    // so it just appends Z
    expect(parser('2024-12-01T09:00:00')).toBe('2024-12-01T09:00:00Z');
  });

  it('tracks successful db queries with query type and row count', async () => {
    const { PerformanceMonitor } = require('../../src/services/performance-monitor.service');
    require('../../src/db/index');

    const result = await mockPoolInstance.query('SELECT * FROM "User"');

    expect(result).toEqual({ rowCount: 2 });
    expect(PerformanceMonitor.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'db_query',
        name: 'SELECT',
        status: 'success',
        source: 'backend',
        metadata: { row_count: 2 },
      }),
    );
  });

  it('tracks failed db queries with error metadata and rethrows', async () => {
    const errPool = {
      query: jest.fn().mockRejectedValue(new Error('db boom')),
    };
    mockPoolInstance = errPool;

    const { PerformanceMonitor } = require('../../src/services/performance-monitor.service');
    require('../../src/db/index');

    await expect(
      errPool.query({ text: 'UPDATE "User" SET username = $1', values: ['x'] }),
    ).rejects.toThrow('db boom');

    expect(PerformanceMonitor.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'db_query',
        name: 'UPDATE',
        status: 'error',
        source: 'backend',
        metadata: { error_name: 'Error' },
      }),
    );
  });

  it('does not wrap pool when query is missing', () => {
    mockPoolInstance = {};

    expect(() => require('../../src/db/index')).not.toThrow();
  });
});
