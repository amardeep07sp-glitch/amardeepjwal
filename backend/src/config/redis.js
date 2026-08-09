import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 200, 5000),
  // Redis is used as a best-effort cache (see category.service.js) - when the
  // connection is down, commands should reject immediately so callers fall
  // through to the database instead of queueing and hanging until a
  // reconnect succeeds.
  enableOfflineQueue: false,
  // Don't open a socket the moment this module is imported - connect lazily
  // on the first actual command. Merely requiring config/redis.js (e.g. via
  // app.js in a test that never hits a cached route) should never spin up a
  // background reconnect-retry loop that outlives the test.
  lazyConnect: true,
});

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (err) => logger.warn({ err: err.message }, 'Redis connection error - retrying in background'));
