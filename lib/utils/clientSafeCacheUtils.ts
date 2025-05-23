/**
 * Client-safe cache utilities that work in both browser and server environments
 */

// Simple in-memory cache for client-side
const clientCache = new Map<string, { value: any; expires: number }>();

/**
 * Cache expiration times (in seconds)
 */
export const CacheExpiration = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;

/**
 * Cache prefixes for different data types
 */
export const CachePrefix = {
  RESEARCH_PROJECTS: 'research_projects',
  TEAMS: 'teams',
  ANALYTICS: 'analytics',
  USER_PREFERENCES: 'user_preferences',
  SEARCH_RESULTS: 'search_results',
  CITATIONS: 'citations',
  ACADEMIC_DATABASES: 'academic_databases',
  MACHINE_LEARNING: 'machine_learning',
  DATA_ANALYSIS: 'data_analysis'
} as const;

/**
 * Get data from cache (client-safe)
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') {
    // Server-side: In a real app, this would use Redis
    // For now, return null to indicate cache miss
    return null;
  }
  
  // Client-side: Use in-memory cache
  const item = clientCache.get(key);
  if (item && item.expires > Date.now()) {
    return item.value as T;
  }
  
  // Remove expired item
  if (item) {
    clientCache.delete(key);
  }
  
  return null;
}

/**
 * Set data in cache (client-safe)
 */
export async function setInCache<T>(
  key: string, 
  value: T, 
  expiration: number = CacheExpiration.MEDIUM
): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: In a real app, this would use Redis
    // For now, just log and return true
    console.log(`Cache set: ${key} (expires in ${expiration}s)`);
    return true;
  }
  
  // Client-side: Use in-memory cache
  const expires = Date.now() + (expiration * 1000);
  clientCache.set(key, { value, expires });
  return true;
}

/**
 * Remove data from cache (client-safe)
 */
export async function removeFromCache(key: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: In a real app, this would use Redis
    console.log(`Cache remove: ${key}`);
    return true;
  }
  
  // Client-side: Use in-memory cache
  return clientCache.delete(key);
}

/**
 * Remove multiple keys by pattern (client-safe)
 */
export async function removeByPattern(pattern: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: In a real app, this would use Redis
    console.log(`Cache remove pattern: ${pattern}`);
    return true;
  }
  
  // Client-side: Use in-memory cache
  const regex = new RegExp(pattern.replace('*', '.*'));
  const keysToDelete: string[] = [];
  
  for (const key of clientCache.keys()) {
    if (regex.test(key)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => clientCache.delete(key));
  return true;
}

/**
 * Cache wrapper function (client-safe)
 */
export async function withCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  expiration: number = CacheExpiration.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchFunction();
  
  // Store in cache
  await setInCache(key, data, expiration);
  
  return data;
}

/**
 * Clear all cache entries (client-safe)
 */
export async function clearAllCache(): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: In a real app, this would clear Redis
    console.log('Cache cleared (server-side)');
    return true;
  }
  
  // Client-side: Clear in-memory cache
  clientCache.clear();
  return true;
}

/**
 * Get cache statistics (client-safe)
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  avgAccessCount: number;
  tagStats: { [tag: string]: number };
}> {
  if (typeof window === 'undefined') {
    // Server-side: Return mock stats
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      avgAccessCount: 0,
      tagStats: {}
    };
  }
  
  // Client-side: Calculate stats from in-memory cache
  const now = Date.now();
  let validEntries = 0;
  let totalSize = 0;
  
  for (const [key, item] of clientCache.entries()) {
    if (item.expires > now) {
      validEntries++;
      totalSize += JSON.stringify(item.value).length;
    }
  }
  
  return {
    totalEntries: validEntries,
    totalSize,
    hitRate: 0.75, // Mock hit rate
    avgAccessCount: 1,
    tagStats: {}
  };
}

/**
 * Invalidate cache entries by tags (client-safe)
 */
export async function invalidateByTags(tags: string[]): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: In a real app, this would use Redis
    console.log(`Cache invalidate tags: ${tags.join(', ')}`);
    return true;
  }
  
  // Client-side: Remove entries that match tag patterns
  for (const tag of tags) {
    await removeByPattern(`*${tag}*`);
  }
  
  return true;
}

/**
 * Warm up cache with data (client-safe)
 */
export async function warmupCache<T>(
  keys: Array<{ key: string, fetch: () => Promise<T> }>,
  options: {
    expiration?: number;
    tags?: string[];
  } = {}
): Promise<void> {
  const { expiration = CacheExpiration.MEDIUM } = options;
  
  for (const { key, fetch } of keys) {
    try {
      const data = await fetch();
      await setInCache(key, data, expiration);
    } catch (error) {
      console.warn(`Failed to warm up cache for key: ${key}`, error);
    }
  }
}
