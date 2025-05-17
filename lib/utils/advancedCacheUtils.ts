import { redisClient } from '@/lib/utils/redis';
import { logger } from '@/lib/logger';
import { 
  CachePrefix, 
  CacheExpiration, 
  getFromCache, 
  setInCache, 
  removeFromCache, 
  removeByPattern,
  withCache
} from '@/lib/utils/cacheUtils';

/**
 * Cache strategies for different types of data
 */
export enum CacheStrategy {
  SIMPLE = 'simple',           // Basic caching with TTL
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate', // Return stale data while fetching fresh data
  WRITE_THROUGH = 'write-through', // Write to cache and database simultaneously
  WRITE_BEHIND = 'write-behind',   // Write to cache and asynchronously to database
  CACHE_ASIDE = 'cache-aside',     // Application manages cache and database separately
}

/**
 * Cache tags for grouping related cache entries
 */
export interface CacheTags {
  [key: string]: string[];
}

/**
 * Cache metadata for tracking cache statistics
 */
export interface CacheMetadata {
  createdAt: number;
  accessCount: number;
  lastAccessedAt: number;
  hitRate: number;
  size: number;
}

/**
 * Cache options for advanced caching
 */
export interface CacheOptions {
  strategy?: CacheStrategy;
  expiration?: number;
  tags?: string[];
  staleWhileRevalidateWindow?: number;
}

const METADATA_PREFIX = 'metadata:';
const TAGS_PREFIX = 'tags:';

/**
 * Get cache key with prefix
 * @param prefix Cache prefix
 * @param id Identifier
 * @returns Formatted cache key
 */
export function getCacheKey(prefix: string, id: string | number): string {
  return `${prefix}:${id}`;
}

/**
 * Get metadata key for a cache entry
 * @param cacheKey Original cache key
 * @returns Metadata cache key
 */
function getMetadataKey(cacheKey: string): string {
  return `${METADATA_PREFIX}${cacheKey}`;
}

/**
 * Get tag key for a tag
 * @param tag Tag name
 * @returns Tag cache key
 */
function getTagKey(tag: string): string {
  return `${TAGS_PREFIX}${tag}`;
}

/**
 * Initialize or update cache metadata
 * @param key Cache key
 * @param size Size of cached data in bytes
 * @returns Success status
 */
async function updateMetadata(key: string, size: number): Promise<boolean> {
  try {
    if (!redisClient) {
      return false;
    }

    const metadataKey = getMetadataKey(key);
    const existingMetadata = await getFromCache<CacheMetadata>(metadataKey);
    
    const now = Date.now();
    
    if (existingMetadata) {
      const updatedMetadata: CacheMetadata = {
        createdAt: existingMetadata.createdAt,
        accessCount: existingMetadata.accessCount + 1,
        lastAccessedAt: now,
        hitRate: existingMetadata.hitRate,
        size: size
      };
      
      await setInCache(metadataKey, updatedMetadata, CacheExpiration.LONG);
      return true;
    } else {
      const newMetadata: CacheMetadata = {
        createdAt: now,
        accessCount: 1,
        lastAccessedAt: now,
        hitRate: 0,
        size: size
      };
      
      await setInCache(metadataKey, newMetadata, CacheExpiration.LONG);
      return true;
    }
  } catch (error: any) {
    logger.warn('Error updating cache metadata', { 
      error: error.message,
      key 
    });
    return false;
  }
}

/**
 * Associate a cache key with tags
 * @param key Cache key
 * @param tags Tags to associate
 * @returns Success status
 */
async function associateWithTags(key: string, tags: string[]): Promise<boolean> {
  try {
    if (!redisClient || !tags.length) {
      return false;
    }

    // For each tag, add this key to the tag's set
    for (const tag of tags) {
      const tagKey = getTagKey(tag);
      
      // Check if redisClient is a Redis instance with sadd method
      if (typeof (redisClient as any).sadd === 'function') {
        await (redisClient as any).sadd(tagKey, key);
        // Set expiration on tag key to avoid orphaned tags
        await (redisClient as any).expire(tagKey, CacheExpiration.LONG);
      } else {
        // For mock client, we'll use a simple approach
        const tagSet = await getFromCache<string[]>(tagKey) || [];
        if (!tagSet.includes(key)) {
          tagSet.push(key);
          await setInCache(tagKey, tagSet, CacheExpiration.LONG);
        }
      }
    }
    
    return true;
  } catch (error: any) {
    logger.warn('Error associating cache key with tags', { 
      error: error.message,
      key,
      tags 
    });
    return false;
  }
}

/**
 * Get all keys associated with a tag
 * @param tag Tag name
 * @returns Array of cache keys
 */
async function getKeysByTag(tag: string): Promise<string[]> {
  try {
    if (!redisClient) {
      return [];
    }

    const tagKey = getTagKey(tag);
    
    // Check if redisClient is a Redis instance with smembers method
    if (typeof (redisClient as any).smembers === 'function') {
      return await (redisClient as any).smembers(tagKey) || [];
    } else {
      // For mock client
      return await getFromCache<string[]>(tagKey) || [];
    }
  } catch (error: any) {
    logger.warn('Error getting keys by tag', { 
      error: error.message,
      tag 
    });
    return [];
  }
}

/**
 * Invalidate all cache entries associated with tags
 * @param tags Tags to invalidate
 * @returns Success status
 */
export async function invalidateByTags(tags: string[]): Promise<boolean> {
  try {
    if (!redisClient || !tags.length) {
      return false;
    }

    let success = true;
    
    for (const tag of tags) {
      const keys = await getKeysByTag(tag);
      
      if (keys.length > 0) {
        // Delete all keys associated with this tag
        for (const key of keys) {
          const metadataKey = getMetadataKey(key);
          
          // Delete both the data and its metadata
          const dataDeleted = await removeFromCache(key);
          const metadataDeleted = await removeFromCache(metadataKey);
          
          if (!dataDeleted || !metadataDeleted) {
            success = false;
          }
        }
        
        // Delete the tag itself
        const tagKey = getTagKey(tag);
        await removeFromCache(tagKey);
      }
    }
    
    return success;
  } catch (error: any) {
    logger.warn('Error invalidating cache by tags', { 
      error: error.message,
      tags 
    });
    return false;
  }
}

/**
 * Advanced cache retrieval with support for stale-while-revalidate
 * @param key Cache key
 * @param fetchData Function to fetch fresh data
 * @param options Cache options
 * @returns Data from cache or from fetchData function
 */
export async function getWithAdvancedCache<T>(
  key: string,
  fetchData: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const {
    strategy = CacheStrategy.SIMPLE,
    expiration = CacheExpiration.MEDIUM,
    tags = [],
    staleWhileRevalidateWindow = 300 // 5 minutes
  } = options;

  try {
    // Try to get data from cache first
    const cachedData = await getFromCache<T>(key);
    
    // If we have cached data, update metadata and return it
    if (cachedData) {
      const metadataKey = getMetadataKey(key);
      const metadata = await getFromCache<CacheMetadata>(metadataKey);
      
      // Update access count and last accessed time
      if (metadata) {
        await updateMetadata(key, JSON.stringify(cachedData).length);
        
        // For stale-while-revalidate strategy, check if we need to refresh in background
        if (strategy === CacheStrategy.STALE_WHILE_REVALIDATE) {
          const now = Date.now();
          const dataAge = now - metadata.lastAccessedAt;
          
          // If data is stale but within the revalidate window, refresh in background
          if (dataAge > expiration * 1000 && dataAge < (expiration + staleWhileRevalidateWindow) * 1000) {
            logger.info('Refreshing stale cache data in background', { key });
            
            // Don't await this - let it happen in the background
            fetchData().then(freshData => {
              setInCache(key, freshData, expiration);
              updateMetadata(key, JSON.stringify(freshData).length);
              if (tags.length > 0) {
                associateWithTags(key, tags);
              }
            }).catch(error => {
              logger.warn('Background cache refresh failed', { 
                error: error.message,
                key 
              });
            });
          }
        }
      }
      
      return cachedData;
    }

    // If not in cache, fetch the data
    const data = await fetchData();

    // Store in cache for future requests
    await setInCache(key, data, expiration);
    await updateMetadata(key, JSON.stringify(data).length);
    
    // Associate with tags if provided
    if (tags.length > 0) {
      await associateWithTags(key, tags);
    }

    return data;
  } catch (error) {
    // If caching fails, just return the data
    logger.warn('Advanced cache operation failed, returning data directly', { error, key });
    return fetchData();
  }
}

/**
 * Warm up cache by pre-fetching data
 * @param keys Array of cache keys and their fetch functions
 * @param options Cache options
 */
export async function warmupCache<T>(
  keys: Array<{ key: string, fetch: () => Promise<T> }>,
  options: CacheOptions = {}
): Promise<void> {
  const {
    expiration = CacheExpiration.MEDIUM,
    tags = []
  } = options;

  try {
    logger.info('Starting cache warmup', { count: keys.length });
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.all(batch.map(async ({ key, fetch }) => {
        try {
          // Check if already in cache
          const existing = await getFromCache(key);
          if (existing) {
            logger.info('Cache entry already exists, skipping warmup', { key });
            return;
          }
          
          // Fetch and cache the data
          const data = await fetch();
          await setInCache(key, data, expiration);
          await updateMetadata(key, JSON.stringify(data).length);
          
          // Associate with tags if provided
          if (tags.length > 0) {
            await associateWithTags(key, tags);
          }
          
          logger.info('Cache warmed up successfully', { key });
        } catch (error: any) {
          logger.warn('Failed to warm up cache entry', { 
            error: error.message,
            key 
          });
        }
      }));
    }
    
    logger.info('Cache warmup completed');
  } catch (error: any) {
    logger.error('Cache warmup failed', { 
      error: error.message,
      stack: error.stack 
    });
  }
}

/**
 * Get cache statistics
 * @returns Cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  avgAccessCount: number;
  tagStats: { [tag: string]: number };
}> {
  try {
    if (!redisClient) {
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        avgAccessCount: 0,
        tagStats: {}
      };
    }

    // Get all metadata keys
    let cursor = '0';
    let metadataKeys: string[] = [];
    
    // Check if redisClient is a Redis instance with scan method
    if (typeof (redisClient as any).scan === 'function') {
      do {
        const result = await (redisClient as any).scan(cursor, 'MATCH', `${METADATA_PREFIX}*`, 'COUNT', 100);
        cursor = result[0];
        metadataKeys = metadataKeys.concat(result[1]);
      } while (cursor !== '0');
    } else {
      // For mock client, we can't get all keys easily
      // This is a simplified approach for development
      logger.warn('Cannot get complete cache stats with mock Redis client');
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        avgAccessCount: 0,
        tagStats: {}
      };
    }
    
    // Get all tag keys
    let tagKeys: string[] = [];
    cursor = '0';
    
    if (typeof (redisClient as any).scan === 'function') {
      do {
        const result = await (redisClient as any).scan(cursor, 'MATCH', `${TAGS_PREFIX}*`, 'COUNT', 100);
        cursor = result[0];
        tagKeys = tagKeys.concat(result[1]);
      } while (cursor !== '0');
    }
    
    // Process metadata
    let totalSize = 0;
    let totalAccessCount = 0;
    let totalHitRate = 0;
    
    // Get metadata for all keys
    const metadataPromises = metadataKeys.map(key => getFromCache<CacheMetadata>(key));
    const metadataResults = await Promise.all(metadataPromises);
    
    // Filter out null results
    const metadataEntries = metadataResults.filter(Boolean) as CacheMetadata[];
    
    // Calculate statistics
    for (const metadata of metadataEntries) {
      totalSize += metadata.size || 0;
      totalAccessCount += metadata.accessCount || 0;
      totalHitRate += metadata.hitRate || 0;
    }
    
    // Process tags
    const tagStats: { [tag: string]: number } = {};
    
    for (const tagKey of tagKeys) {
      const tag = tagKey.replace(TAGS_PREFIX, '');
      const keys = await getKeysByTag(tag);
      tagStats[tag] = keys.length;
    }
    
    return {
      totalEntries: metadataEntries.length,
      totalSize,
      hitRate: metadataEntries.length > 0 ? totalHitRate / metadataEntries.length : 0,
      avgAccessCount: metadataEntries.length > 0 ? totalAccessCount / metadataEntries.length : 0,
      tagStats
    };
  } catch (error: any) {
    logger.error('Error getting cache statistics', { 
      error: error.message,
      stack: error.stack 
    });
    
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      avgAccessCount: 0,
      tagStats: {}
    };
  }
}

/**
 * Clear all cache entries
 * @returns Success status
 */
export async function clearAllCache(): Promise<boolean> {
  try {
    if (!redisClient) {
      return false;
    }

    // Check if redisClient is a Redis instance with flushdb method
    if (typeof (redisClient as any).flushdb === 'function') {
      await (redisClient as any).flushdb();
      logger.info('Cache cleared successfully');
      return true;
    } else {
      // For mock client, we can't clear all keys easily
      logger.warn('Cannot clear all cache with mock Redis client');
      return false;
    }
  } catch (error: any) {
    logger.error('Error clearing cache', { 
      error: error.message,
      stack: error.stack 
    });
    return false;
  }
}

/**
 * Set cache entry with write-through strategy (write to cache and database simultaneously)
 * @param key Cache key
 * @param data Data to cache
 * @param writeToDb Function to write data to database
 * @param options Cache options
 * @returns Success status
 */
export async function setWithWriteThrough<T>(
  key: string,
  data: T,
  writeToDb: (data: T) => Promise<void>,
  options: CacheOptions = {}
): Promise<boolean> {
  const {
    expiration = CacheExpiration.MEDIUM,
    tags = []
  } = options;

  try {
    // Write to database first
    await writeToDb(data);
    
    // Then write to cache
    await setInCache(key, data, expiration);
    await updateMetadata(key, JSON.stringify(data).length);
    
    // Associate with tags if provided
    if (tags.length > 0) {
      await associateWithTags(key, tags);
    }
    
    return true;
  } catch (error: any) {
    logger.error('Write-through cache operation failed', { 
      error: error.message,
      key 
    });
    return false;
  }
}

/**
 * Set cache entry with write-behind strategy (write to cache and asynchronously to database)
 * @param key Cache key
 * @param data Data to cache
 * @param writeToDb Function to write data to database
 * @param options Cache options
 * @returns Success status
 */
export async function setWithWriteBehind<T>(
  key: string,
  data: T,
  writeToDb: (data: T) => Promise<void>,
  options: CacheOptions = {}
): Promise<boolean> {
  const {
    expiration = CacheExpiration.MEDIUM,
    tags = []
  } = options;

  try {
    // Write to cache immediately
    await setInCache(key, data, expiration);
    await updateMetadata(key, JSON.stringify(data).length);
    
    // Associate with tags if provided
    if (tags.length > 0) {
      await associateWithTags(key, tags);
    }
    
    // Write to database asynchronously
    writeToDb(data).catch(error => {
      logger.error('Async database write failed in write-behind strategy', { 
        error: error.message,
        key 
      });
    });
    
    return true;
  } catch (error: any) {
    logger.error('Write-behind cache operation failed', { 
      error: error.message,
      key 
    });
    return false;
  }
}

// Export basic cache utilities for convenience
export {
  CachePrefix,
  CacheExpiration,
  getFromCache,
  setInCache,
  removeFromCache,
  removeByPattern,
  withCache
};
