import { redisClient } from '@/lib/utils/redis';
import { logger } from '@/lib/logger';

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
export const CacheExpiration = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
};

/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached data or null if not found
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    if (!redisClient) {
      return null;
    }

    const cachedData = await redisClient.get(key);
    if (!cachedData) {
      return null;
    }

    logger.info('Retrieved data from cache', { key });
    return JSON.parse(cachedData) as T;
  } catch (error: any) {
    logger.warn('Error retrieving data from cache', { 
      error: error.message,
      key 
    });
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
export async function setInCache(key: string, data: any, expiration: number = CacheExpiration.MEDIUM): Promise<boolean> {
  try {
    if (!redisClient) {
      return false;
    }

    await redisClient.set(key, JSON.stringify(data), 'EX', expiration);
    logger.info('Stored data in cache', { key, expiration });
    return true;
  } catch (error: any) {
    logger.warn('Error storing data in cache', { 
      error: error.message,
      key 
    });
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
    if (!redisClient) {
      return false;
    }

    await redisClient.del(key);
    logger.info('Removed data from cache', { key });
    return true;
  } catch (error: any) {
    logger.warn('Error removing data from cache', { 
      error: error.message,
      key 
    });
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
    if (!redisClient) {
      return false;
    }

    // Check if redisClient is a Redis instance with scan method
    if (typeof (redisClient as any).scan !== 'function') {
      logger.warn('Redis client does not support scan operation, cannot remove by pattern', { pattern });
      return false;
    }

    // Use Redis SCAN to find keys matching the pattern
    let cursor = '0';
    let keys: string[] = [];

    do {
      const result = await (redisClient as any).scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys = keys.concat(result[1]);
    } while (cursor !== '0');

    if (keys.length > 0) {
      // Delete keys in batches to avoid issues with too many arguments
      for (let i = 0; i < keys.length; i += 100) {
        const batch = keys.slice(i, i + 100);
        // Use multi to delete multiple keys in a single operation
        const multi = (redisClient as any).multi();
        batch.forEach(key => multi.del(key));
        await multi.exec();
      }
      logger.info('Removed keys by pattern from cache', { pattern, count: keys.length });
    } else {
      logger.info('No keys found matching pattern', { pattern });
    }

    return true;
  } catch (error: any) {
    logger.warn('Error removing keys by pattern from cache', { 
      error: error.message,
      pattern 
    });
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
