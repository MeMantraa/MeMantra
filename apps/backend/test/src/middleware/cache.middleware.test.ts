import { Request, Response, NextFunction } from 'express';
import { cacheResponse } from '../../../src/middleware/cache.middleware';

jest.mock('../../../src/services/cache.service');

const { cacheGet, cacheSet, buildCacheKey } = jest.requireMock(
  '../../../src/services/cache.service',
) as {
  cacheGet: jest.Mock;
  cacheSet: jest.Mock;
  buildCacheKey: jest.Mock;
};

function makeReqRes(opts: { userId?: number; originalUrl?: string } = {}) {
  const req = {
    originalUrl: opts.originalUrl ?? '/api/mantras',
    user: opts.userId != null ? { userId: opts.userId } : undefined,
  } as unknown as Request;

  let statusCode = 200;
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnThis();
  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(val: number) {
      statusCode = val;
    },
    json: jsonMock,
    status: statusMock,
  } as unknown as Response;

  const next = jest.fn() as unknown as NextFunction;

  return { req, res, next, jsonMock, statusMock };
}

describe('cacheResponse middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Default buildCacheKey implementation
    buildCacheKey.mockImplementation((prefix: string, userId?: number) => {
      const parts = ['cache', prefix];
      if (userId) parts.push(`user:${userId}`);
      return parts.join(':');
    });
    cacheSet.mockResolvedValue(undefined);
  });

  describe('cache hit', () => {
    it('returns cached response and does not call next()', async () => {
      cacheGet.mockResolvedValue({ statusCode: 200, body: { data: 'cached' } });
      const { req, res, next, jsonMock, statusMock } = makeReqRes();

      await cacheResponse()(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: 'cached' });
      expect(next).not.toHaveBeenCalled();
    });

    it('preserves the original cached status code', async () => {
      cacheGet.mockResolvedValue({ statusCode: 201, body: { id: 1 } });
      const { req, res, next, statusMock } = makeReqRes();

      await cacheResponse()(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe('cache miss', () => {
    it('calls next() when there is no cached value', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next } = makeReqRes();

      await cacheResponse()(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('caches the response when the controller calls res.json with a 2xx status', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next, jsonMock } = makeReqRes();

      await cacheResponse({ ttl: 60 })(req, res, next);
      (res.json as jest.Mock)({ mantras: [] });
      await new Promise(process.nextTick);

      expect(cacheSet).toHaveBeenCalledWith(
        'cache:/api/mantras',
        { statusCode: 200, body: { mantras: [] } },
        60,
      );
      expect(jsonMock).toHaveBeenCalledWith({ mantras: [] });
    });

    it('does not cache when the response status code is >= 300', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next } = makeReqRes();

      await cacheResponse()(req, res, next);
      (res as any).statusCode = 404;
      (res.json as jest.Mock)({ message: 'Not found' });
      await new Promise(process.nextTick);

      expect(cacheSet).not.toHaveBeenCalled();
    });

    it('uses the default TTL of 300s', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next } = makeReqRes();

      await cacheResponse()(req, res, next);
      (res.json as jest.Mock)({ ok: true });
      await new Promise(process.nextTick);

      expect(cacheSet).toHaveBeenCalledWith(expect.any(String), expect.any(Object), 300);
    });
  });

  describe('perUser option', () => {
    it('includes the userId in the cache key when perUser is true', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next } = makeReqRes({ userId: 42, originalUrl: '/api/collections' });

      await cacheResponse({ perUser: true })(req, res, next);

      expect(buildCacheKey).toHaveBeenCalledWith('/api/collections', 42);
    });

    it('skips caching entirely when perUser is true but user is not authenticated', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next } = makeReqRes({ originalUrl: '/api/collections' });
      // req.user is undefined (no auth)

      await cacheResponse({ perUser: true })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(cacheGet).not.toHaveBeenCalled();
      expect(buildCacheKey).not.toHaveBeenCalled();
    });

    it('omits userId when perUser is false (default)', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next } = makeReqRes({ userId: 42 });

      await cacheResponse()(req, res, next);

      expect(buildCacheKey).toHaveBeenCalledWith('/api/mantras', undefined);
    });
  });

  describe('keyPrefix option', () => {
    it('uses keyPrefix instead of req.originalUrl', async () => {
      cacheGet.mockResolvedValue(null);
      const { req, res, next } = makeReqRes({ originalUrl: '/api/mantras?search=love' });

      await cacheResponse({ keyPrefix: '/api/mantras' })(req, res, next);

      expect(buildCacheKey).toHaveBeenCalledWith('/api/mantras', undefined);
    });
  });
});
