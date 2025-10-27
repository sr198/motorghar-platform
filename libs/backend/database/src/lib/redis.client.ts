/**
 * Redis Client Singleton
 * Reference: Solution Design v1.0 § 6 (Caching Strategy)
 * Used for session management, caching, and rate limiting
 */

import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';
import {
  REDIS_MAX_RETRIES_PER_REQUEST,
  CACHE_PREFIX,
  CACHE_TTL,
} from '@motorghar-platform/constants';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Create Redis client with optimal configuration
 */
function createRedisClient(): Redis {
  const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

  const options: RedisOptions = {
    maxRetriesPerRequest: REDIS_MAX_RETRIES_PER_REQUEST,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  const client = new Redis(redisUrl, options);

  client.on('error', (err: Error) => {
    console.error('❌ Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis connected');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Gracefully disconnect Redis on process termination
 */
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

/**
 * Re-export cache constants for convenience
 */
export { CACHE_PREFIX, CACHE_TTL };
