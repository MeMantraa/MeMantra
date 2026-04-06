import {
  cacheGet,
  cacheSet,
  cacheDelete,
  buildCacheKey,
} from '../../../src/services/cache.service';

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockScan = jest.fn();

let mockAvailable = true;

jest.mock('../../../src/config/redis.config', () => ({
  getRedisClient: jest.fn(() => ({
    get: mockGet,
    set: mockSet,
    del: mockDel,
    scan: mockScan,
  })),
  isRedisAvailable: jest.fn(() => mockAvailable),
}));

describe('cache.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAvailable = true;
  });

  describe('cacheGet', () => {
    it('returns parsed value when key exists', async () => {
      mockGet.mockResolvedValue(JSON.stringify({ hello: 'world' }));
      const result = await cacheGet<{ hello: string }>('my-key');
      expect(mockGet).toHaveBeenCalledWith('my-key');
      expect(result).toEqual({ hello: 'world' });
    });

    it('returns null on cache miss', async () => {
      mockGet.mockResolvedValue(null);
      expect(await cacheGet('missing-key')).toBeNull();
    });

    it('returns null when Redis is not ready', async () => {
      mockAvailable = false;
      expect(await cacheGet('key')).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('returns null when get() throws', async () => {
      mockGet.mockRejectedValue(new Error('Redis error'));
      expect(await cacheGet('key')).toBeNull();
    });
  });

  describe('cacheSet', () => {
    it('serialises the value with the default TTL of 300s', async () => {
      mockSet.mockResolvedValue('OK');
      await cacheSet('my-key', { foo: 'bar' });
      expect(mockSet).toHaveBeenCalledWith('my-key', JSON.stringify({ foo: 'bar' }), 'EX', 300);
    });

    it('uses a custom TTL when provided', async () => {
      mockSet.mockResolvedValue('OK');
      await cacheSet('my-key', 'value', 60);
      expect(mockSet).toHaveBeenCalledWith('my-key', JSON.stringify('value'), 'EX', 60);
    });

    it('does nothing when Redis is not ready', async () => {
      mockAvailable = false;
      await cacheSet('key', 'value');
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('fails silently when set() throws', async () => {
      mockSet.mockRejectedValue(new Error('Redis error'));
      await expect(cacheSet('key', 'value')).resolves.toBeUndefined();
    });
  });

  describe('cacheDelete', () => {
    it('deletes an exact key directly (no SCAN)', async () => {
      mockDel.mockResolvedValue(1);
      await cacheDelete('exact-key');
      expect(mockDel).toHaveBeenCalledWith('exact-key');
      expect(mockScan).not.toHaveBeenCalled();
    });

    it('uses SCAN + DEL for glob patterns', async () => {
      // Single iteration: cursor starts and ends at '0'
      mockScan.mockResolvedValueOnce(['0', ['key:1', 'key:2']]);
      mockDel.mockResolvedValue(2);

      await cacheDelete('cache:*');

      expect(mockScan).toHaveBeenCalledWith('0', 'MATCH', 'cache:*', 'COUNT', 100);
      expect(mockDel).toHaveBeenCalledWith('key:1', 'key:2');
    });

    it('iterates SCAN until cursor returns "0"', async () => {
      mockScan.mockResolvedValueOnce(['42', ['key:1']]).mockResolvedValueOnce(['0', ['key:2']]);
      mockDel.mockResolvedValue(1);

      await cacheDelete('cache:*');

      expect(mockScan).toHaveBeenCalledTimes(2);
      expect(mockDel).toHaveBeenCalledTimes(2);
      expect(mockDel).toHaveBeenNthCalledWith(1, 'key:1');
      expect(mockDel).toHaveBeenNthCalledWith(2, 'key:2');
    });

    it('skips DEL when SCAN returns no matched keys', async () => {
      mockScan.mockResolvedValueOnce(['0', []]);
      await cacheDelete('cache:*');
      expect(mockDel).not.toHaveBeenCalled();
    });

    it('handles multiple exact keys', async () => {
      mockDel.mockResolvedValue(1);
      await cacheDelete('key:1', 'key:2');
      expect(mockDel).toHaveBeenCalledTimes(2);
      expect(mockDel).toHaveBeenNthCalledWith(1, 'key:1');
      expect(mockDel).toHaveBeenNthCalledWith(2, 'key:2');
    });

    it('does nothing when Redis is not ready', async () => {
      mockAvailable = false;
      await cacheDelete('key');
      expect(mockDel).not.toHaveBeenCalled();
    });

    it('fails silently when an error is thrown', async () => {
      mockDel.mockRejectedValue(new Error('Redis error'));
      await expect(cacheDelete('key')).resolves.toBeUndefined();
    });
  });

  describe('buildCacheKey', () => {
    it('builds a key with only prefix', () => {
      expect(buildCacheKey('/api/mantras')).toBe('cache:/api/mantras');
    });

    it('includes userId when provided', () => {
      expect(buildCacheKey('/api/collections', 42)).toBe('cache:/api/collections:user:42');
    });

    it('includes params when provided', () => {
      expect(buildCacheKey('/api/mantras', undefined, 'limit=10')).toBe(
        'cache:/api/mantras:limit=10',
      );
    });

    it('includes both userId and params', () => {
      expect(buildCacheKey('/api/feed', 7, 'mood=calm')).toBe('cache:/api/feed:user:7:mood=calm');
    });

    it('omits userId when it is 0 (falsy)', () => {
      expect(buildCacheKey('/api/mantras', 0)).toBe('cache:/api/mantras');
    });
  });
});
