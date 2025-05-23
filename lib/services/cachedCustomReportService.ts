import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { externalDataService } from './externalDataService';
import { enhancedAnalyticsService } from './enhancedAnalyticsService';
import { enhancedMlPredictionService } from './enhancedMlPredictionService';
import { CachePrefix, CacheExpiration, withCache, removeFromCache, removeByPattern } from '@/lib/utils/clientSafeCacheUtils';
import { customReportService, type ReportTemplate, type CustomReport, type ReportSection, type ReportShare } from './customReportService';

/**
 * Enhanced version of CustomReportService with Redis caching
 */
export class CachedCustomReportService {
  private supabase = createClient();

  /**
   * Get all report templates with caching
   */
  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:report_templates`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching report templates from database');
          return customReportService.getReportTemplates();
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached report templates', { error: error.message });
      // Fall back to non-cached version
      return customReportService.getReportTemplates();
    }
  }

  /**
   * Get report template by ID with caching
   */
  async getReportTemplateById(templateId: string): Promise<ReportTemplate | null> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:report_template:${templateId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching report template by ID from database', { templateId });
          return customReportService.getReportTemplateById(templateId);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached report template by ID', { error: error.message, templateId });
      // Fall back to non-cached version
      return customReportService.getReportTemplateById(templateId);
    }
  }

  /**
   * Create a new report template and invalidate cache
   */
  async createReportTemplate(template: Omit<ReportTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ReportTemplate | null> {
    try {
      const result = await customReportService.createReportTemplate(template);
      
      if (result) {
        // Invalidate templates cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report_templates`);
        logger.info('Invalidated report templates cache after creation');
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error creating report template', { error: error.message });
      return null;
    }
  }

  /**
   * Get all custom reports for a user with caching
   */
  async getUserReports(userId: string): Promise<CustomReport[]> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:user_reports:${userId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching user reports from database', { userId });
          return customReportService.getUserReports(userId);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached user reports', { error: error.message, userId });
      // Fall back to non-cached version
      return customReportService.getUserReports(userId);
    }
  }

  /**
   * Get all custom reports for a project with caching
   */
  async getProjectReports(projectId: string): Promise<CustomReport[]> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:project_reports:${projectId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching project reports from database', { projectId });
          return customReportService.getProjectReports(projectId);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached project reports', { error: error.message, projectId });
      // Fall back to non-cached version
      return customReportService.getProjectReports(projectId);
    }
  }

  /**
   * Get custom report by ID with caching
   */
  async getReportById(reportId: string): Promise<CustomReport | null> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:report:${reportId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching report by ID from database', { reportId });
          return customReportService.getReportById(reportId);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached report by ID', { error: error.message, reportId });
      // Fall back to non-cached version
      return customReportService.getReportById(reportId);
    }
  }

  /**
   * Create a new custom report and invalidate caches
   */
  async createReport(report: Omit<CustomReport, 'id' | 'data' | 'external_data_included' | 'last_generated_at' | 'created_at' | 'updated_at'>): Promise<CustomReport | null> {
    try {
      const result = await customReportService.createReport(report);
      
      if (result) {
        // Invalidate user reports cache
        if (report.user_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:user_reports:${report.user_id}`);
          logger.info('Invalidated user reports cache after creation', { userId: report.user_id });
        }
        
        // Invalidate project reports cache
        if (report.project_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:project_reports:${report.project_id}`);
          logger.info('Invalidated project reports cache after creation', { projectId: report.project_id });
        }
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error creating report', { error: error.message });
      return null;
    }
  }

  /**
   * Update a custom report and invalidate caches
   */
  async updateReport(reportId: string, updates: Partial<CustomReport>): Promise<CustomReport | null> {
    try {
      // Get the report first to know which caches to invalidate
      const existingReport = await this.getReportById(reportId);
      
      const result = await customReportService.updateReport(reportId, updates);
      
      if (result) {
        // Invalidate report cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report:${reportId}`);
        logger.info('Invalidated report cache after update', { reportId });
        
        // Invalidate user reports cache
        if (existingReport?.user_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:user_reports:${existingReport.user_id}`);
          logger.info('Invalidated user reports cache after update', { userId: existingReport.user_id });
        }
        
        // Invalidate project reports cache
        if (existingReport?.project_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:project_reports:${existingReport.project_id}`);
          logger.info('Invalidated project reports cache after update', { projectId: existingReport.project_id });
        }
        
        // If project_id changed, invalidate the new project's cache too
        if (updates.project_id && updates.project_id !== existingReport?.project_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:project_reports:${updates.project_id}`);
          logger.info('Invalidated new project reports cache after update', { projectId: updates.project_id });
        }
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error updating report', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Delete a custom report and invalidate caches
   */
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      // Get the report first to know which caches to invalidate
      const existingReport = await this.getReportById(reportId);
      
      const result = await customReportService.deleteReport(reportId);
      
      if (result) {
        // Invalidate report cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report:${reportId}`);
        logger.info('Invalidated report cache after deletion', { reportId });
        
        // Invalidate report sections cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report_sections:${reportId}`);
        logger.info('Invalidated report sections cache after deletion', { reportId });
        
        // Invalidate user reports cache
        if (existingReport?.user_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:user_reports:${existingReport.user_id}`);
          logger.info('Invalidated user reports cache after deletion', { userId: existingReport.user_id });
        }
        
        // Invalidate project reports cache
        if (existingReport?.project_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:project_reports:${existingReport.project_id}`);
          logger.info('Invalidated project reports cache after deletion', { projectId: existingReport.project_id });
        }
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error deleting report', { error: error.message, reportId });
      return false;
    }
  }

  /**
   * Get report sections with caching
   */
  async getReportSections(reportId: string): Promise<ReportSection[]> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:report_sections:${reportId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching report sections from database', { reportId });
          return customReportService.getReportSections(reportId);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached report sections', { error: error.message, reportId });
      // Fall back to non-cached version
      return customReportService.getReportSections(reportId);
    }
  }

  /**
   * Create a report section and invalidate cache
   */
  async createReportSection(section: Omit<ReportSection, 'id' | 'created_at' | 'updated_at'>): Promise<ReportSection | null> {
    try {
      const result = await customReportService.createReportSection(section);
      
      if (result) {
        // Invalidate report sections cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report_sections:${section.report_id}`);
        logger.info('Invalidated report sections cache after creation', { reportId: section.report_id });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error creating report section', { error: error.message });
      return null;
    }
  }

  /**
   * Update a report section and invalidate cache
   */
  async updateReportSection(sectionId: string, updates: Partial<ReportSection>, reportId: string): Promise<ReportSection | null> {
    try {
      const result = await customReportService.updateReportSection(sectionId, updates);
      
      if (result) {
        // Invalidate report sections cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report_sections:${reportId}`);
        logger.info('Invalidated report sections cache after update', { reportId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error updating report section', { error: error.message, sectionId });
      return null;
    }
  }

  /**
   * Delete a report section and invalidate cache
   */
  async deleteReportSection(sectionId: string, reportId: string): Promise<boolean> {
    try {
      const result = await customReportService.deleteReportSection(sectionId);
      
      if (result) {
        // Invalidate report sections cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report_sections:${reportId}`);
        logger.info('Invalidated report sections cache after deletion', { reportId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error deleting report section', { error: error.message, sectionId });
      return false;
    }
  }

  /**
   * Generate a report and invalidate caches
   */
  async generateReport(reportId: string): Promise<any> {
    try {
      const result = await customReportService.generateReport(reportId);
      
      if (result) {
        // Invalidate report cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report:${reportId}`);
        logger.info('Invalidated report cache after generation', { reportId });
        
        // Invalidate report with external data cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report_with_external_data:${reportId}`);
        logger.info('Invalidated report with external data cache after generation', { reportId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error generating report', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Export report to JSON
   */
  async exportReportToJson(reportId: string): Promise<string | null> {
    return customReportService.exportReportToJson(reportId);
  }

  /**
   * Export report to specified format
   */
  async exportReport(reportId: string, format: string): Promise<string | null> {
    return customReportService.exportReport(reportId, format);
  }

  /**
   * Share a report with a user
   */
  async shareReport(reportId: string, sharedWith: string, permissionLevel: string, expiresAt?: string): Promise<ReportShare | null> {
    return customReportService.shareReport(reportId, sharedWith, permissionLevel, expiresAt);
  }

  /**
   * Get report shares with caching
   */
  async getReportShares(reportId: string): Promise<ReportShare[]> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:report_shares:${reportId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching report shares from database', { reportId });
          return customReportService.getReportShares(reportId);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached report shares', { error: error.message, reportId });
      // Fall back to non-cached version
      return customReportService.getReportShares(reportId);
    }
  }

  /**
   * Remove a report share and invalidate cache
   */
  async removeReportShare(shareId: string, reportId: string): Promise<boolean> {
    try {
      const result = await customReportService.removeReportShare(shareId);
      
      if (result) {
        // Invalidate report shares cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:report_shares:${reportId}`);
        logger.info('Invalidated report shares cache after removal', { reportId });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error removing report share', { error: error.message, shareId });
      return false;
    }
  }

  /**
   * Create a report from template and invalidate caches
   */
  async createReportFromTemplate(templateId: string, projectId: string, title: string, description?: string): Promise<CustomReport | null> {
    try {
      const result = await customReportService.createReportFromTemplate(templateId, projectId, title, description);
      
      if (result) {
        // Invalidate project reports cache
        await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:project_reports:${projectId}`);
        logger.info('Invalidated project reports cache after creation from template', { projectId });
        
        // Invalidate user reports cache if user_id is available
        if (result.user_id) {
          await removeFromCache(`${CachePrefix.SEARCH_RESULTS}:user_reports:${result.user_id}`);
          logger.info('Invalidated user reports cache after creation from template', { userId: result.user_id });
        }
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error creating report from template', { error: error.message, templateId, projectId });
      return null;
    }
  }

  /**
   * Create a comprehensive report with all external data
   */
  async createComprehensiveReport(projectId: string, title: string): Promise<CustomReport | null> {
    return customReportService.createComprehensiveReport(projectId, title);
  }

  /**
   * Create an external data report
   */
  async createExternalDataReport(projectId: string, title: string): Promise<CustomReport | null> {
    return customReportService.createExternalDataReport(projectId, title);
  }

  /**
   * Get report data with external sources with caching
   */
  async getReportWithExternalData(reportId: string): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.SEARCH_RESULTS}:report_with_external_data:${reportId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching report with external data from database', { reportId });
          return customReportService.getReportWithExternalData(reportId);
        },
        CacheExpiration.SHORT // Use a shorter expiration time for reports with external data
      );
    } catch (error: any) {
      logger.error('Error getting cached report with external data', { error: error.message, reportId });
      // Fall back to non-cached version
      return customReportService.getReportWithExternalData(reportId);
    }
  }
}

export const cachedCustomReportService = new CachedCustomReportService();
