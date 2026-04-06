jest.mock('ioredis', () => jest.fn());

describe('redis.config', () => {
  let MockRedis: jest.Mock;
  let mockInstance: {
    status: string;
    connect: jest.Mock;
    quit: jest.Mock;
    on: jest.Mock;
  };
  let eventHandlers: Record<string, (...args: any[]) => void>;

  beforeEach(() => {
    jest.resetModules();
    eventHandlers = {};
    mockInstance = {
      status: 'ready',
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn((event: string, handler: (...args: any[]) => void) => {
        eventHandlers[event] = handler;
      }),
    };
    MockRedis = require('ioredis');
    MockRedis.mockImplementation(() => mockInstance);
  });

  describe('getRedisClient', () => {
    it('creates a Redis instance with the default URL when REDIS_URL is not set', () => {
      delete process.env.REDIS_URL;
      const { getRedisClient } = require('../../../src/config/redis.config');
      getRedisClient();
      expect(MockRedis).toHaveBeenCalledWith(
        'redis://localhost:6379',
        expect.objectContaining({ lazyConnect: true, maxRetriesPerRequest: 3 }),
      );
    });

    it('creates a Redis instance using the REDIS_URL env var', () => {
      process.env.REDIS_URL = 'redis://my-host:6380';
      const { getRedisClient } = require('../../../src/config/redis.config');
      getRedisClient();
      expect(MockRedis).toHaveBeenCalledWith('redis://my-host:6380', expect.any(Object));
      delete process.env.REDIS_URL;
    });

    it('returns the same instance on subsequent calls (singleton)', () => {
      const { getRedisClient } = require('../../../src/config/redis.config');
      const first = getRedisClient();
      const second = getRedisClient();
      expect(first).toBe(second);
      expect(MockRedis).toHaveBeenCalledTimes(1);
    });

    it('registers an error event handler that logs to console.error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { getRedisClient } = require('../../../src/config/redis.config');
      getRedisClient();
      eventHandlers['error'](new Error('connection refused'));
      expect(consoleSpy).toHaveBeenCalledWith('Redis connection error:', 'connection refused');
      consoleSpy.mockRestore();
    });

    it('registers a connect event handler that logs success', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getRedisClient } = require('../../../src/config/redis.config');
      getRedisClient();
      eventHandlers['connect']();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Connected to Redis');
      consoleSpy.mockRestore();
    });

    it('retryStrategy returns null after more than 5 attempts', () => {
      const { getRedisClient } = require('../../../src/config/redis.config');
      getRedisClient();
      const { retryStrategy } = MockRedis.mock.calls[0][1];
      expect(retryStrategy(6)).toBeNull();
    });

    it('retryStrategy returns a delay proportional to attempt count (capped at 2000ms)', () => {
      const { getRedisClient } = require('../../../src/config/redis.config');
      getRedisClient();
      const { retryStrategy } = MockRedis.mock.calls[0][1];
      expect(retryStrategy(1)).toBe(200);
      expect(retryStrategy(3)).toBe(600);
      expect(retryStrategy(5)).toBe(1000);
    });
  });

  describe('connectRedis', () => {
    it('calls connect() on the Redis client', async () => {
      const { connectRedis } = require('../../../src/config/redis.config');
      await connectRedis();
      expect(mockInstance.connect).toHaveBeenCalled();
    });

    it('logs a warning and does not throw when connect() rejects', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockInstance.connect.mockRejectedValue(new Error('ECONNREFUSED'));
      const { connectRedis } = require('../../../src/config/redis.config');
      await expect(connectRedis()).resolves.toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Redis unavailable'),
        expect.stringContaining('ECONNREFUSED'),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('disconnectRedis', () => {
    it('calls quit() on the client', async () => {
      const { getRedisClient, disconnectRedis } = require('../../../src/config/redis.config');
      getRedisClient();
      await disconnectRedis();
      expect(mockInstance.quit).toHaveBeenCalled();
    });

    it('creates a new client after disconnect (singleton is nullified)', async () => {
      const { getRedisClient, disconnectRedis } = require('../../../src/config/redis.config');
      getRedisClient();
      await disconnectRedis();
      getRedisClient();
      expect(MockRedis).toHaveBeenCalledTimes(2);
    });

    it('does nothing when Redis was never connected', async () => {
      const { disconnectRedis } = require('../../../src/config/redis.config');
      await expect(disconnectRedis()).resolves.toBeUndefined();
      expect(mockInstance.quit).not.toHaveBeenCalled();
    });
  });
});
