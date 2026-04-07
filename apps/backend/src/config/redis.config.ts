import Redis from 'ioredis';

const REDIS_URL =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

let redis: Redis | null = null;
let redisAvailable = false;

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    let errorLogged = false;
    redis.on('error', (err) => {
      if (!errorLogged) {
        console.error('Redis connection error:', err.message);
        errorLogged = true;
      }
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
  }
  return redis;
}

export async function connectRedis(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.connect();
    redisAvailable = true;
    return true;
  } catch (err) {
    redisAvailable = false;
    console.warn(
      `⚠️  Redis connection failed (${(err as Error).message}) — falling back to regular database connection without caching.`,
    );
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    redisAvailable = false;
  }
}
