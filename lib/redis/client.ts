import Redis from 'ioredis';
import { logger } from '@/lib/logger';

// Mock Redis client for when Redis is not available
class MockRedisClient {
  private cache: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    logger.info('MockRedisClient: get', { key });
    return this.cache.get(key) || null;
  }

  async set(key: string, value: string, expiryMode?: string, time?: number): Promise<'OK'> {
    logger.info('MockRedisClient: set', { key, expiryMode, time });
    this.cache.set(key, value);
    return 'OK';
  }

  async del(key: string | string[]): Promise<number> {
    logger.info('MockRedisClient: del', { key });
    if (Array.isArray(key)) {
      let count = 0;
      key.forEach(k => {
        if (this.cache.has(k)) {
          this.cache.delete(k);
          count++;
        }
      });
      return count;
    } else {
      const existed = this.cache.has(key);
      this.cache.delete(key);
      return existed ? 1 : 0;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    logger.info('MockRedisClient: keys', { pattern });
    // Simple pattern matching for mock client
    const allKeys = Array.from(this.cache.keys());
    if (pattern === '*') {
      return allKeys;
    }
    // Convert Redis pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return allKeys.filter(key => regex.test(key));
  }

  on(event: string, callback: Function) {
    // Mock event handling
    logger.info('MockRedisClient: event listener added', { event });
  }
}

let redisClient: Redis | MockRedisClient;

try {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logger.warn('REDIS_URL environment variable is not set. Using mock Redis client.');
    redisClient = new MockRedisClient();
  } else {
    // Only create real Redis client if URL is provided
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true, // Don't connect immediately
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', { error: err.message });
      // In case of Redis errors, we could fall back to mock client
      // but for now, we'll let the error handling in cacheUtils handle it
    });
  }
} catch (error: any) {
  logger.error('Failed to initialize Redis client, using mock client', { error: error.message });
  redisClient = new MockRedisClient();
}

export default redisClient;
