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
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'testuser',
      DB_PASSWORD: 'testpass',
      DB_NAME: 'testdb',
    };
    poolConfigs.length = 0;
    mockRelease.mockReset();
    mockConnect.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('configures pool using env variables and reports successful connection', async () => {
    mockConnect.mockResolvedValue({ release: mockRelease });

    const { pool, testConnection } = require('../../src/config/db.config');

    expect(pool).toBeDefined();
    expect(poolConfigs[0]).toMatchObject({
      host: 'localhost',
      port: 5432,
      user: 'testuser',
      password: 'testpass',
      database: 'testdb',
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await testConnection();
    expect(result).toBe(true);
    expect(mockConnect).toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Successfully connected to the database');

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
