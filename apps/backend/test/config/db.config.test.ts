jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const poolConfigs: any[] = [];
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock('pg', () => {
  return {
    Pool: jest.fn((config) => {
      poolConfigs.push(config);
      return {
        connect: mockConnect,
      };
    }),
  };
});

describe('db.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgres://user:pass@host:5432/dbname',
    };
    poolConfigs.length = 0;
    mockRelease.mockReset();
    mockConnect.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('configures pool using DATABASE_URL and reports successful connection to Neon', async () => {
    mockConnect.mockResolvedValue({ release: mockRelease });

    const { pool, testConnection } = require('../../src/config/db.config');

    expect(pool).toBeDefined();
    expect(poolConfigs[0]).toMatchObject({
      connectionString: 'postgres://user:pass@host:5432/dbname',
      ssl: { rejectUnauthorized: false },
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await testConnection();
    expect(result).toBe(true);
    expect(mockConnect).toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Successfully connected to the Neon hosted shared database');

    consoleSpy.mockRestore();
  });

  it('returns false when connection cannot be established', async () => {
    const error = new Error('connection failed');
    mockConnect.mockRejectedValue(error);

    const { testConnection } = require('../../src/config/db.config');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await testConnection();
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Database connection error:', error);

    consoleSpy.mockRestore();
  });
});