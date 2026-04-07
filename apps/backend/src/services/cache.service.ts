import { getRedisClient, isRedisAvailable } from '../config/redis.config';

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get a cached value by key. Returns null on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) return null;
  try {
    const data = await getRedisClient().get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with optional TTL (seconds). Fails silently.
 */
export async function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await getRedisClient().set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // non-critical
  }
}

/**
 * Delete one or more cache keys. Supports glob patterns.
 */
export async function cacheDelete(...keys: string[]): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    const client = getRedisClient();
    for (const key of keys) {
      if (key.includes('*')) {
        // Pattern-based deletion using SCAN (safe for production)
        let cursor = '0';
        do {
          const [nextCursor, matchedKeys] = await client.scan(cursor, 'MATCH', key, 'COUNT', 100);
          cursor = nextCursor;
          if (matchedKeys.length > 0) {
            await client.del(...matchedKeys);
          }
        } while (cursor !== '0');
      } else {
        await client.del(key);
      }
    }
  } catch {
    // non-critical
  }
}

/**
 * Build a cache key from route path and optional user ID.
 */
export function buildCacheKey(prefix: string, userId?: number, params?: string): string {
  const parts = ['cache', prefix];
  if (userId) parts.push(`user:${userId}`);
  if (params) parts.push(params);
  return parts.join(':');
}
