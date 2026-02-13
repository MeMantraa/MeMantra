jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

let capturedParsers: Record<number, (val: string) => string> = {};

jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => ({})),
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

describe('db/index timestamp type parser', () => {
  beforeEach(() => {
    jest.resetModules();
    capturedParsers = {};
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
});
