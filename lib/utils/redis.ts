// Zenith/lib/utils/redis.ts
import Redis from 'ioredis';
import { logger } from '@/lib/logger';

let redis: Redis | null = null;

const getRedisClient = (): Redis => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.error('REDIS_URL environment variable is not set.');
      throw new Error('Redis configuration error: REDIS_URL is not set.');
    }
    try {
      redis = new Redis(redisUrl, {
        // Optional: Configure connection retry strategy, timeouts, etc.
        // maxRetriesPerRequest: 3,
        // connectTimeout: 10000, // 10 seconds
        // lazyConnect: true, // Connects only when a command is issued
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

    } catch (error: any) {
      logger.error('Failed to initialize Redis client', { error: error.message, stack: error.stack });
      throw new Error(`Failed to initialize Redis client: ${error.message}`);
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
// if (redisClient && redisClient.status === 'ready') {
//   await redisClient.quit();
// }
