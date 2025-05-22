import { logger } from '@/lib/logger';
import redisClient from '@/lib/redis/client';

/**
 * Cache key prefix for different types of data
 */
export const CachePrefix = {
  RESEARCH_PROJECTS: 'research_projects',
  TEAMS: 'teams',
  TEAM_MEMBERS: 'team_members',
  SEARCH: 'search',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
};

/**
 * Default cache expiration times (in seconds)
 */
export enum CacheExpiration {
  SHORT = 60,          // 1 minute
  MEDIUM = 300,        // 5 minutes
  LONG = 3600,         // 1 hour
  VERY_LONG = 86400,   // 1 day
}

export enum CacheStrategy {
  SIMPLE = 'simple',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  WRITE_THROUGH = 'write-through',
  WRITE_BEHIND = 'write-behind',
}

/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached data or null if not found
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.info('Retrieved data from cache', { key });
      return JSON.parse(data) as T;
    } else {
      logger.info('No data found in cache', { key });
      return null;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.warn('Error retrieving data from cache', { 
        error: error.message,
        key 
      });
    }
    return null;
  }
}

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param expiration Expiration time in seconds
 * @returns Success status
 */
export async function setInCache<T>(key: string, data: T, expiration: number = CacheExpiration.MEDIUM): Promise<boolean> {
  try {
    logger.info('Stored data in cache', { key, expiration });
    await redisClient.set(key, JSON.stringify(data), 'EX', expiration);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.warn('Error storing data in cache', { 
        error: error.message,
        key 
      });
    }
    return false;
  }
}

/**
 * Remove data from cache
 * @param key Cache key
 * @returns Success status
 */
export async function removeFromCache(key: string): Promise<boolean> {
  try {
    logger.info('Removed data from cache', { key });
    await redisClient.del(key);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.warn('Error removing data from cache', { 
        error: error.message,
        key 
      });
    }
    return false;
  }
}

/**
 * Remove multiple keys from cache using a pattern
 * @param pattern Key pattern to match
 * @returns Success status
 */
export async function removeByPattern(pattern: string): Promise<boolean> {
  try {
    logger.info('Removed keys by pattern from cache', { pattern });
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.warn('Error removing keys by pattern from cache', { 
        error: error.message,
        pattern 
      });
    }
    return false;
  }
}

/**
 * Cache wrapper function for async operations
 * @param cacheKey Cache key
 * @param fetchData Function to fetch data if not in cache
 * @param expiration Cache expiration time in seconds
 * @returns Data from cache or from fetchData function
 */
export async function withCache<T>(
  cacheKey: string,
  fetchData: () => Promise<T>,
  expiration: number = CacheExpiration.MEDIUM
): Promise<T> {
  try {
    // Try to get data from cache first
    const cachedData = await getFromCache<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // If not in cache, fetch the data
    const data = await fetchData();

    // Store in cache for future requests
    await setInCache(cacheKey, data, expiration);

    return data;
  } catch (error) {
    // If caching fails, just return the data
    logger.warn('Cache operation failed, returning data directly', { error, cacheKey });
    return fetchData();
  }
}
