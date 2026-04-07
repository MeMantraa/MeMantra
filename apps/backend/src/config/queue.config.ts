import { Queue, QueueOptions } from 'bullmq';

const REDIS_URL =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: parsed.password } : {}),
  };
}

export const connection = parseRedisUrl(REDIS_URL);

const defaultOpts: Omit<QueueOptions, 'connection'> = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
};

export const QUEUE_NAMES = {
  REMINDERS: 'reminders',
  RECOMMENDATIONS: 'recommendations',
  ENGAGEMENT_OPTIMIZER: 'engagement-optimizer',
} as const;

// Lazy-initialized queues — only created when first accessed so the app
// can start even when Redis is unavailable (caching simply stays disabled).
let _reminderQueue: Queue | null = null;
let _recommendationQueue: Queue | null = null;
let _engagementOptimizerQueue: Queue | null = null;

export function getReminderQueue(): Queue {
  if (!_reminderQueue) {
    _reminderQueue = new Queue(QUEUE_NAMES.REMINDERS, { connection, ...defaultOpts });
  }
  return _reminderQueue;
}

export function getRecommendationQueue(): Queue {
  if (!_recommendationQueue) {
    _recommendationQueue = new Queue(QUEUE_NAMES.RECOMMENDATIONS, { connection, ...defaultOpts });
  }
  return _recommendationQueue;
}

export function getEngagementOptimizerQueue(): Queue {
  if (!_engagementOptimizerQueue) {
    _engagementOptimizerQueue = new Queue(QUEUE_NAMES.ENGAGEMENT_OPTIMIZER, {
      connection,
      ...defaultOpts,
    });
  }
  return _engagementOptimizerQueue;
}
