import { Request, Response, NextFunction, RequestHandler } from 'express';
import { cacheGet, cacheSet, buildCacheKey } from '../services/cache.service';

interface CacheOptions {
  /** TTL in seconds (default 300 = 5 min) */
  ttl?: number;
  /** Whether the cache key should include the authenticated user's ID */
  perUser?: boolean;
  /** Custom key prefix (defaults to req.originalUrl) */
  keyPrefix?: string;
}

/**
 * Express middleware that caches JSON responses in Redis.
 *
 * Usage:
 *   router.get('/mantras', authenticate, cacheResponse({ ttl: 600 }), MantraController.getAllMantras);
 *   router.get('/collections', authenticate, cacheResponse({ perUser: true }), CollectionController.getUserCollections);
 */
export function cacheResponse(options: CacheOptions = {}): RequestHandler {
  const { ttl = 300, perUser = false } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = perUser ? req.user?.userId : undefined;
    const prefix = options.keyPrefix || req.originalUrl;
    const key = buildCacheKey(prefix, userId);

    const cached = await cacheGet<{ statusCode: number; body: unknown }>(key);
    if (cached) {
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, { statusCode: res.statusCode, body }, ttl).catch(() => {});
      }
      return originalJson(body);
    }) as Response['json'];

    next();
  };
}
