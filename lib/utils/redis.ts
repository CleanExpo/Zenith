// Zenith/lib/utils/redis.ts
import Redis from 'ioredis';
import { logger } from '@/lib/logger';
import { isDevelopmentEnvironment } from '@/lib/utils/auth';

// Create a mock Redis client for development environments where Redis is not available
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

  async del(key: string): Promise<number> {
    logger.info('MockRedisClient: del', { key });
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }
}

let redis: Redis | MockRedisClient | null = null;

const getRedisClient = (): Redis | MockRedisClient => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.warn('REDIS_URL environment variable is not set. Using mock Redis client.');
      return new MockRedisClient();
    }
    
    try {
      // In development, if the Redis URL is set but Redis is not available,
      // we'll fall back to the mock client
      if (isDevelopmentEnvironment()) {
        try {
          redis = new Redis(redisUrl, {
            connectTimeout: 1000, // Short timeout for development
            maxRetriesPerRequest: 1,
          });
          
          // Test the connection
          redis.on('error', (err) => {
            logger.warn('Redis connection error in development, falling back to mock client', { 
              error: err.message 
            });
            redis = new MockRedisClient();
          });
        } catch (error: any) {
          logger.warn('Failed to initialize Redis client in development, falling back to mock client', { 
            error: error.message 
          });
          redis = new MockRedisClient();
        }
      } else {
        // In production, we want to use the real Redis client
        redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          connectTimeout: 10000, // 10 seconds
        });

        redis.on('connect', () => {
          logger.info('Successfully connected to Redis.');
        });

        redis.on('error', (err) => {
          logger.error('Redis connection error', { error: err.message, stack: err.stack });
          // Depending on the error, you might want to attempt to reconnect or handle it gracefully.
          // For now, ioredis handles reconnection attempts by default.
        });

        redis.on('reconnecting', () => {
          logger.info('Reconnecting to Redis...');
        });

        redis.on('end', () => {
          logger.info('Redis connection ended.');
          // Consider setting redis to null here if you want to force re-creation on next call
          // redis = null; 
        });
      }
    } catch (error: any) {
      logger.error('Failed to initialize Redis client', { error: error.message, stack: error.stack });
      
      if (isDevelopmentEnvironment()) {
        logger.warn('Falling back to mock Redis client in development');
        redis = new MockRedisClient();
      } else {
        throw new Error(`Failed to initialize Redis client: ${error.message}`);
      }
    }
  }
  
  return redis;
};

// Export the client instance directly or through a function
// Exporting a function ensures the client is created on first use (lazy initialization).
export const redisClient = getRedisClient();

// Example usage:
// import { redisClient } from '@/lib/utils/redis';
//
// async function exampleCacheOperation() {
//   try {
//     await redisClient.set('mykey', 'myvalue', 'EX', 3600); // Set with 1-hour expiry
//     const value = await redisClient.get('mykey');
//     logger.info('Retrieved from Redis cache', { key: 'mykey', value });
//   } catch (error) {
//     logger.error('Redis operation failed', { error });
//   }
// }
//
// To close the connection when the application shuts down (e.g., in a cleanup phase):
// if (redisClient instanceof Redis && redisClient.status === 'ready') {
//   await redisClient.quit();
// }
