import Redis from 'ioredis';
import { Logger } from '@zenith/agents';

const logger = new Logger('CacheService');

export interface CacheConfig {
  ttl: number;
  keyPrefix: string;
  compression?: boolean;
  invalidationPattern?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  keyCount: number;
}

/**
 * Multi-Layer Caching Service
 * L1: Memory Cache (fastest, smallest)
 * L2: Redis Cache (fast, shared across instances)
 * L3: Database Cache (persistent, largest)
 */
export class AdvancedCacheService {
  private redis: Redis;
  private memoryCache = new Map<string, { data: any; expiry: number; hits: number }>();
  private stats = { hits: 0, misses: 0, l1Hits: 0, l2Hits: 0, l3Hits: 0 };
  private maxMemoryItems = 1000;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keyPrefix: 'zenith:',
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    // Cleanup memory cache every 5 minutes
    setInterval(() => this.cleanupMemoryCache(), 300000);
  }

  /**
   * Get value with multi-layer fallback
   */
  async get<T = any>(key: string, fallbackFn?: () => Promise<T>, ttl?: number): Promise<T | null> {
    const normalizedKey = this.normalizeKey(key);

    try {
      // L1: Memory Cache
      const memoryResult = this.getFromMemory<T>(normalizedKey);
      if (memoryResult !== null) {
        this.stats.hits++;
        this.stats.l1Hits++;
        logger.debug('Cache L1 hit', { key: normalizedKey });
        return memoryResult;
      }

      // L2: Redis Cache
      const redisResult = await this.getFromRedis<T>(normalizedKey);
      if (redisResult !== null) {
        this.stats.hits++;
        this.stats.l2Hits++;
        // Promote to L1 cache
        this.setInMemory(normalizedKey, redisResult, ttl || this.defaultTTL);
        logger.debug('Cache L2 hit', { key: normalizedKey });
        return redisResult;
      }

      // L3: Fallback function (database, API, etc.)
      if (fallbackFn) {
        logger.debug('Cache miss, executing fallback', { key: normalizedKey });
        const result = await fallbackFn();
        if (result !== null && result !== undefined) {
          // Store in both layers
          await this.set(normalizedKey, result, ttl);
          this.stats.l3Hits++;
        }
        this.stats.misses++;
        return result;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error('Cache get error', { key: normalizedKey, error: error instanceof Error ? error.message : 'Unknown' });
      
      // If cache fails, try fallback
      if (fallbackFn) {
        return await fallbackFn();
      }
      return null;
    }
  }

  /**
   * Set value in both cache layers
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    const normalizedKey = this.normalizeKey(key);

    try {
      // Store in memory cache
      this.setInMemory(normalizedKey, value, ttl);

      // Store in Redis cache
      await this.setInRedis(normalizedKey, value, ttl);

      logger.debug('Cache set success', { key: normalizedKey, ttl });
    } catch (error) {
      logger.error('Cache set error', { 
        key: normalizedKey, 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<void> {
    const normalizedKey = this.normalizeKey(key);

    try {
      // Delete from memory
      this.memoryCache.delete(normalizedKey);

      // Delete from Redis
      await this.redis.del(normalizedKey);

      logger.debug('Cache delete success', { key: normalizedKey });
    } catch (error) {
      logger.error('Cache delete error', { 
        key: normalizedKey, 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(`zenith:${pattern}`);
      if (keys.length === 0) return 0;

      // Delete from Redis
      const deleted = await this.redis.del(...keys);

      // Delete matching keys from memory cache
      const memoryKeys = Array.from(this.memoryCache.keys()).filter(key => 
        key.match(pattern.replace('*', '.*'))
      );
      memoryKeys.forEach(key => this.memoryCache.delete(key));

      logger.info('Cache pattern invalidation', { pattern, deleted, memoryKeys: memoryKeys.length });
      return deleted;
    } catch (error) {
      logger.error('Cache invalidation error', { 
        pattern, 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      return 0;
    }
  }

  /**
   * Cache with tags for group invalidation
   */
  async setWithTags(key: string, value: any, tags: string[], ttl: number = this.defaultTTL): Promise<void> {
    const normalizedKey = this.normalizeKey(key);

    try {
      // Set the main value
      await this.set(normalizedKey, value, ttl);

      // Associate with tags
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await this.redis.sadd(tagKey, normalizedKey);
        await this.redis.expire(tagKey, ttl + 300); // Tag TTL slightly longer
      }

      logger.debug('Cache set with tags', { key: normalizedKey, tags, ttl });
    } catch (error) {
      logger.error('Cache set with tags error', { 
        key: normalizedKey, 
        tags,
        error: error instanceof Error ? error.message : 'Unknown' 
      });
    }
  }

  /**
   * Invalidate all keys with specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.redis.smembers(tagKey);
      
      if (keys.length === 0) return 0;

      // Delete all keys with this tag
      const deleted = await this.redis.del(...keys);
      
      // Remove from memory cache
      keys.forEach(key => this.memoryCache.delete(key.replace('zenith:', '')));
      
      // Delete the tag set
      await this.redis.del(tagKey);

      logger.info('Cache tag invalidation', { tag, deleted });
      return deleted;
    } catch (error) {
      logger.error('Cache tag invalidation error', { 
        tag, 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const redisInfo = await this.redis.info('memory');
      const memoryUsage = this.extractMemoryUsage(redisInfo);
      const keyCount = await this.redis.dbsize();

      const hitRate = this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0;

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: Math.round(hitRate * 100) / 100,
        memoryUsage,
        keyCount
      };
    } catch (error) {
      logger.error('Cache stats error', { error: error instanceof Error ? error.message : 'Unknown' });
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: 0,
        memoryUsage: 0,
        keyCount: 0
      };
    }
  }

  /**
   * Warm cache with predictive data loading
   */
  async warmCache(warmupFunctions: Array<{ key: string; fn: () => Promise<any>; ttl?: number }>): Promise<void> {
    logger.info('Starting cache warmup', { functions: warmupFunctions.length });

    const promises = warmupFunctions.map(async ({ key, fn, ttl }) => {
      try {
        const result = await fn();
        await this.set(key, result, ttl);
        logger.debug('Cache warmup success', { key });
      } catch (error) {
        logger.error('Cache warmup error', { 
          key, 
          error: error instanceof Error ? error.message : 'Unknown' 
        });
      }
    });

    await Promise.allSettled(promises);
    logger.info('Cache warmup completed');
  }

  /**
   * Private helper methods
   */
  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    cached.hits++;
    return cached.data;
  }

  private setInMemory(key: string, value: any, ttl: number): void {
    // Cleanup if approaching memory limit
    if (this.memoryCache.size >= this.maxMemoryItems) {
      this.cleanupMemoryCache();
    }

    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + (ttl * 1000),
      hits: 0
    });
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached);
    } catch (error) {
      logger.error('Redis get error', { key, error: error instanceof Error ? error.message : 'Unknown' });
      return null;
    }
  }

  private async setInRedis(key: string, value: any, ttl: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      logger.error('Redis set error', { key, error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    // Remove expired entries
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expiry) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // If still too many, remove least recently used
    if (this.memoryCache.size > this.maxMemoryItems * 0.8) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].hits - b[1].hits)
        .slice(0, Math.floor(this.maxMemoryItems * 0.2));

      entries.forEach(([key]) => {
        this.memoryCache.delete(key);
        cleaned++;
      });
    }

    if (cleaned > 0) {
      logger.debug('Memory cache cleanup', { cleaned, remaining: this.memoryCache.size });
    }
  }

  private normalizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9:_-]/g, '_').toLowerCase();
  }

  private extractMemoryUsage(redisInfo: string): number {
    const match = redisInfo.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      this.memoryCache.clear();
      logger.info('Cache service shutdown completed');
    } catch (error) {
      logger.error('Cache shutdown error', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }
}

// Singleton instance
export const cacheService = new AdvancedCacheService();