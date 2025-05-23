import { enhancedAnalyticsService, CrossDomainMetric, CombinedAnalytics, FundingEfficiency, PatentImpact } from './enhancedAnalyticsService';
import { getFromCache, setInCache, removeFromCache, CachePrefix, CacheExpiration } from '@/lib/utils/clientSafeCacheUtils';
import { logger } from '@/lib/logger';

class CachedEnhancedAnalyticsService {
  /**
   * Get cross-domain metrics for a project with caching
   */
  async getProjectCrossDomainMetrics(projectId: string): Promise<CrossDomainMetric[]> {
    const cacheKey = `${CachePrefix.ANALYTICS}:cross_domain_metrics:${projectId}`;
    
    try {
      // Try to get from cache first
      const cachedData = await getFromCache<CrossDomainMetric[]>(cacheKey);
      if (cachedData) {
        logger.info('Retrieved cross-domain metrics from cache', { projectId });
        return cachedData;
      }
      
      // If not in cache, get from service
      const metrics = await enhancedAnalyticsService.getProjectCrossDomainMetrics(projectId);
      
      // Store in cache
      await setInCache(cacheKey, metrics, CacheExpiration.MEDIUM);
      
      return metrics;
    } catch (error: any) {
      logger.error('Error in cached getProjectCrossDomainMetrics', { error: error.message, projectId });
      // Fallback to direct service call
      return enhancedAnalyticsService.getProjectCrossDomainMetrics(projectId);
    }
  }

  /**
   * Get combined analytics for a project with caching
   */
  async getProjectCombinedAnalytics(projectId: string): Promise<CombinedAnalytics[]> {
    const cacheKey = `${CachePrefix.ANALYTICS}:combined_analytics:${projectId}`;
    
    try {
      // Try to get from cache first
      const cachedData = await getFromCache<CombinedAnalytics[]>(cacheKey);
      if (cachedData) {
        logger.info('Retrieved combined analytics from cache', { projectId });
        return cachedData;
      }
      
      // If not in cache, get from service
      const analytics = await enhancedAnalyticsService.getProjectCombinedAnalytics(projectId);
      
      // Store in cache
      await setInCache(cacheKey, analytics, CacheExpiration.MEDIUM);
      
      return analytics;
    } catch (error: any) {
      logger.error('Error in cached getProjectCombinedAnalytics', { error: error.message, projectId });
      // Fallback to direct service call
      return enhancedAnalyticsService.getProjectCombinedAnalytics(projectId);
    }
  }

  /**
   * Calculate funding efficiency for a project with caching
   */
  async calculateFundingEfficiency(projectId: string): Promise<FundingEfficiency | null> {
    const cacheKey = `${CachePrefix.ANALYTICS}:funding_efficiency:${projectId}`;
    
    try {
      // Try to get from cache first
      const cachedData = await getFromCache<FundingEfficiency>(cacheKey);
      if (cachedData) {
        logger.info('Retrieved funding efficiency from cache', { projectId });
        return cachedData;
      }
      
      // If not in cache, get from service
      const efficiency = await enhancedAnalyticsService.calculateFundingEfficiency(projectId);
      
      // Store in cache
      if (efficiency) {
        await setInCache(cacheKey, efficiency, CacheExpiration.MEDIUM);
      }
      
      return efficiency;
    } catch (error: any) {
      logger.error('Error in cached calculateFundingEfficiency', { error: error.message, projectId });
      // Fallback to direct service call
      return enhancedAnalyticsService.calculateFundingEfficiency(projectId);
    }
  }

  /**
   * Get patent impact score for a project with caching
   */
  async getPatentImpactScore(projectId: string): Promise<PatentImpact | null> {
    const cacheKey = `${CachePrefix.ANALYTICS}:patent_impact:${projectId}`;
    
    try {
      // Try to get from cache first
      const cachedData = await getFromCache<PatentImpact>(cacheKey);
      if (cachedData) {
        logger.info('Retrieved patent impact score from cache', { projectId });
        return cachedData;
      }
      
      // If not in cache, get from service
      const impact = await enhancedAnalyticsService.getPatentImpactScore(projectId);
      
      // Store in cache
      if (impact) {
        await setInCache(cacheKey, impact, CacheExpiration.MEDIUM);
      }
      
      return impact;
    } catch (error: any) {
      logger.error('Error in cached getPatentImpactScore', { error: error.message, projectId });
      // Fallback to direct service call
      return enhancedAnalyticsService.getPatentImpactScore(projectId);
    }
  }

  /**
   * Refresh combined analytics materialized view (no caching)
   */
  async refreshCombinedAnalytics(): Promise<boolean> {
    // This is a write operation, so we don't cache it
    return enhancedAnalyticsService.refreshCombinedAnalytics();
  }

  /**
   * Calculate and store cross-domain metrics for a project (invalidates cache)
   */
  async calculateCrossDomainMetrics(projectId: string): Promise<CrossDomainMetric[]> {
    try {
      // This is a write operation, so we invalidate the cache first
      const cacheKey = `${CachePrefix.ANALYTICS}:cross_domain_metrics:${projectId}`;
      await removeFromCache(cacheKey);
      
      // Calculate metrics
      const metrics = await enhancedAnalyticsService.calculateCrossDomainMetrics(projectId);
      
      // Store in cache
      await setInCache(cacheKey, metrics, CacheExpiration.MEDIUM);
      
      // Also invalidate related caches
      await removeFromCache(`${CachePrefix.ANALYTICS}:combined_analytics:${projectId}`);
      await removeFromCache(`${CachePrefix.ANALYTICS}:funding_efficiency:${projectId}`);
      await removeFromCache(`${CachePrefix.ANALYTICS}:patent_impact:${projectId}`);
      await removeFromCache(`${CachePrefix.ANALYTICS}:comprehensive_analytics:${projectId}`);
      await removeFromCache(`${CachePrefix.ANALYTICS}:correlation_analysis:${projectId}`);
      
      return metrics;
    } catch (error: any) {
      logger.error('Error in cached calculateCrossDomainMetrics', { error: error.message, projectId });
      // Fallback to direct service call
      return enhancedAnalyticsService.calculateCrossDomainMetrics(projectId);
    }
  }

  /**
   * Get comprehensive analytics for a project with caching
   */
  async getComprehensiveProjectAnalytics(projectId: string): Promise<any> {
    const cacheKey = `${CachePrefix.ANALYTICS}:comprehensive_analytics:${projectId}`;
    
    try {
      // Try to get from cache first
      const cachedData = await getFromCache<any>(cacheKey);
      if (cachedData) {
        logger.info('Retrieved comprehensive project analytics from cache', { projectId });
        return cachedData;
      }
      
      // If not in cache, get from service
      const analytics = await enhancedAnalyticsService.getComprehensiveProjectAnalytics(projectId);
      
      // Store in cache
      if (analytics) {
        await setInCache(cacheKey, analytics, CacheExpiration.MEDIUM);
      }
      
      return analytics;
    } catch (error: any) {
      logger.error('Error in cached getComprehensiveProjectAnalytics', { error: error.message, projectId });
      // Fallback to direct service call
      return enhancedAnalyticsService.getComprehensiveProjectAnalytics(projectId);
    }
  }

  /**
   * Get correlation analysis between internal and external metrics with caching
   */
  async getMetricCorrelationAnalysis(projectId: string): Promise<any> {
    const cacheKey = `${CachePrefix.ANALYTICS}:correlation_analysis:${projectId}`;
    
    try {
      // Try to get from cache first
      const cachedData = await getFromCache<any>(cacheKey);
      if (cachedData) {
        logger.info('Retrieved metric correlation analysis from cache', { projectId });
        return cachedData;
      }
      
      // If not in cache, get from service
      const analysis = await enhancedAnalyticsService.getMetricCorrelationAnalysis(projectId);
      
      // Store in cache
      if (analysis) {
        await setInCache(cacheKey, analysis, CacheExpiration.MEDIUM);
      }
      
      return analysis;
    } catch (error: any) {
      logger.error('Error in cached getMetricCorrelationAnalysis', { error: error.message, projectId });
      // Fallback to direct service call
      return enhancedAnalyticsService.getMetricCorrelationAnalysis(projectId);
    }
  }
}

export const cachedEnhancedAnalyticsService = new CachedEnhancedAnalyticsService();
