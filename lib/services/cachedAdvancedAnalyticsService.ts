import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { CachePrefix, CacheExpiration, withCache, removeFromCache, removeByPattern } from '@/lib/utils/clientSafeCacheUtils';
import { 
  advancedAnalyticsService, 
  type ProjectCompletionPrediction, 
  type ProjectMetric, 
  type UserProductivityMetric,
  type CustomReport,
  type ReportResult,
  type ProjectProgressReportParams,
  type UserProductivityReportParams,
  type ProjectComparisonReportParams
} from './advancedAnalyticsService';

/**
 * Enhanced version of AdvancedAnalyticsService with Redis caching
 */
export class CachedAdvancedAnalyticsService {
  private supabase = createClient();

  /**
   * Get project completion prediction with caching
   */
  async getProjectCompletionPrediction(projectId: string): Promise<ProjectCompletionPrediction | null> {
    try {
      const cacheKey = `${CachePrefix.ANALYTICS}:project_completion_prediction:${projectId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching project completion prediction from database', { projectId });
          return advancedAnalyticsService.getProjectCompletionPrediction(projectId);
        },
        CacheExpiration.SHORT // Use a short expiration time as predictions may change frequently
      );
    } catch (error: any) {
      logger.error('Error getting cached project completion prediction', { error: error.message, projectId });
      // Fall back to non-cached version
      return advancedAnalyticsService.getProjectCompletionPrediction(projectId);
    }
  }

  /**
   * Generate project metrics and invalidate cache
   */
  async generateProjectMetrics(projectId: string): Promise<boolean> {
    try {
      const result = await advancedAnalyticsService.generateProjectMetrics(projectId);
      
      if (result) {
        // Invalidate project metrics cache
        await removeByPattern(`${CachePrefix.ANALYTICS}:project_metrics:${projectId}:*`);
        logger.info('Invalidated project metrics cache after generation', { projectId });
        
        // Also invalidate project completion prediction cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:project_completion_prediction:${projectId}`);
        logger.info('Invalidated project completion prediction cache after metrics generation', { projectId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error generating project metrics', { error: error.message, projectId });
      return false;
    }
  }

  /**
   * Get project metrics with caching
   */
  async getProjectMetrics(
    projectId: string, 
    metricType?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<ProjectMetric[]> {
    try {
      // Create a cache key based on the parameters
      const startDateStr = startDate ? startDate.toISOString() : 'none';
      const endDateStr = endDate ? endDate.toISOString() : 'none';
      const cacheKey = `${CachePrefix.ANALYTICS}:project_metrics:${projectId}:${metricType || 'all'}:${startDateStr}:${endDateStr}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching project metrics from database', { projectId, metricType });
          return advancedAnalyticsService.getProjectMetrics(projectId, metricType, startDate, endDate);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached project metrics', { error: error.message, projectId });
      // Fall back to non-cached version
      return advancedAnalyticsService.getProjectMetrics(projectId, metricType, startDate, endDate);
    }
  }

  /**
   * Generate user productivity metrics and invalidate cache
   */
  async generateUserProductivityMetrics(): Promise<boolean> {
    try {
      const result = await advancedAnalyticsService.generateUserProductivityMetrics();
      
      if (result) {
        // Invalidate user productivity metrics cache
        await removeByPattern(`${CachePrefix.ANALYTICS}:user_productivity_metrics:*`);
        logger.info('Invalidated user productivity metrics cache after generation');
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error generating user productivity metrics', { error: error.message });
      return false;
    }
  }

  /**
   * Get user productivity metrics with caching
   */
  async getUserProductivityMetrics(
    metricType?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<UserProductivityMetric[]> {
    try {
      // Create a cache key based on the parameters
      const startDateStr = startDate ? startDate.toISOString() : 'none';
      const endDateStr = endDate ? endDate.toISOString() : 'none';
      const cacheKey = `${CachePrefix.ANALYTICS}:user_productivity_metrics:${metricType || 'all'}:${startDateStr}:${endDateStr}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching user productivity metrics from database', { metricType });
          return advancedAnalyticsService.getUserProductivityMetrics(metricType, startDate, endDate);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached user productivity metrics', { error: error.message });
      // Fall back to non-cached version
      return advancedAnalyticsService.getUserProductivityMetrics(metricType, startDate, endDate);
    }
  }

  /**
   * Create a custom report and invalidate cache
   */
  async createCustomReport(
    title: string,
    reportType: 'project_progress' | 'user_productivity' | 'project_comparison',
    parameters: ProjectProgressReportParams | UserProductivityReportParams | ProjectComparisonReportParams,
    description?: string,
    schedule?: string
  ): Promise<CustomReport | null> {
    try {
      const result = await advancedAnalyticsService.createCustomReport(
        title,
        reportType,
        parameters,
        description,
        schedule
      );
      
      if (result) {
        // Invalidate custom reports cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:custom_reports`);
        logger.info('Invalidated custom reports cache after creation');
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error creating custom report', { error: error.message, title });
      return null;
    }
  }

  /**
   * Get custom reports with caching
   */
  async getCustomReports(): Promise<CustomReport[]> {
    try {
      const cacheKey = `${CachePrefix.ANALYTICS}:custom_reports`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching custom reports from database');
          return advancedAnalyticsService.getCustomReports();
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached custom reports', { error: error.message });
      // Fall back to non-cached version
      return advancedAnalyticsService.getCustomReports();
    }
  }

  /**
   * Get a custom report by ID with caching
   */
  async getCustomReport(reportId: string): Promise<CustomReport | null> {
    try {
      const cacheKey = `${CachePrefix.ANALYTICS}:custom_report:${reportId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching custom report from database', { reportId });
          return advancedAnalyticsService.getCustomReport(reportId);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached custom report', { error: error.message, reportId });
      // Fall back to non-cached version
      return advancedAnalyticsService.getCustomReport(reportId);
    }
  }

  /**
   * Update a custom report and invalidate caches
   */
  async updateCustomReport(
    reportId: string,
    updates: {
      title?: string;
      description?: string;
      parameters?: any;
      schedule?: string;
    }
  ): Promise<CustomReport | null> {
    try {
      const result = await advancedAnalyticsService.updateCustomReport(reportId, updates);
      
      if (result) {
        // Invalidate custom report cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:custom_report:${reportId}`);
        logger.info('Invalidated custom report cache after update', { reportId });
        
        // Invalidate custom reports cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:custom_reports`);
        logger.info('Invalidated custom reports cache after update');
        
        // Invalidate report results cache
        await removeByPattern(`${CachePrefix.ANALYTICS}:report_results:${reportId}:*`);
        logger.info('Invalidated report results cache after update', { reportId });
        
        // Invalidate latest report result cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:latest_report_result:${reportId}`);
        logger.info('Invalidated latest report result cache after update', { reportId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error updating custom report', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Delete a custom report and invalidate caches
   */
  async deleteCustomReport(reportId: string): Promise<boolean> {
    try {
      const result = await advancedAnalyticsService.deleteCustomReport(reportId);
      
      if (result) {
        // Invalidate custom report cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:custom_report:${reportId}`);
        logger.info('Invalidated custom report cache after deletion', { reportId });
        
        // Invalidate custom reports cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:custom_reports`);
        logger.info('Invalidated custom reports cache after deletion');
        
        // Invalidate report results cache
        await removeByPattern(`${CachePrefix.ANALYTICS}:report_results:${reportId}:*`);
        logger.info('Invalidated report results cache after deletion', { reportId });
        
        // Invalidate latest report result cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:latest_report_result:${reportId}`);
        logger.info('Invalidated latest report result cache after deletion', { reportId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error deleting custom report', { error: error.message, reportId });
      return false;
    }
  }

  /**
   * Run a custom report and invalidate caches
   */
  async runCustomReport(reportId: string): Promise<any> {
    try {
      const result = await advancedAnalyticsService.runCustomReport(reportId);
      
      if (result) {
        // Invalidate report results cache
        await removeByPattern(`${CachePrefix.ANALYTICS}:report_results:${reportId}:*`);
        logger.info('Invalidated report results cache after running report', { reportId });
        
        // Invalidate latest report result cache
        await removeFromCache(`${CachePrefix.ANALYTICS}:latest_report_result:${reportId}`);
        logger.info('Invalidated latest report result cache after running report', { reportId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error running custom report', { error: error.message, reportId });
      throw error;
    }
  }

  /**
   * Get report results with caching
   */
  async getReportResults(reportId: string, limit: number = 10): Promise<ReportResult[]> {
    try {
      const cacheKey = `${CachePrefix.ANALYTICS}:report_results:${reportId}:${limit}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching report results from database', { reportId, limit });
          return advancedAnalyticsService.getReportResults(reportId, limit);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached report results', { error: error.message, reportId });
      // Fall back to non-cached version
      return advancedAnalyticsService.getReportResults(reportId, limit);
    }
  }

  /**
   * Get the latest report result with caching
   */
  async getLatestReportResult(reportId: string): Promise<ReportResult | null> {
    try {
      const cacheKey = `${CachePrefix.ANALYTICS}:latest_report_result:${reportId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching latest report result from database', { reportId });
          return advancedAnalyticsService.getLatestReportResult(reportId);
        },
        CacheExpiration.SHORT // Use a short expiration time as report results may change frequently
      );
    } catch (error: any) {
      logger.error('Error getting cached latest report result', { error: error.message, reportId });
      // Fall back to non-cached version
      return advancedAnalyticsService.getLatestReportResult(reportId);
    }
  }
}

export const cachedAdvancedAnalyticsService = new CachedAdvancedAnalyticsService();
