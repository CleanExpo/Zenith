import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { ResearchProject } from '@/lib/database.types';
import { CachePrefix, CacheExpiration, withCache, removeFromCache, removeByPattern } from '@/lib/utils/cacheUtils';
import { PaginationParams, PaginatedResult } from './researchProjectService';
import { enhancedResearchProjectService, FilterParams } from './enhancedResearchProjectService';

/**
 * Enhanced version of ResearchProjectService with Redis caching and filtering
 */
export class CachedEnhancedResearchProjectService {
  private supabase = createClient();

  /**
   * Get all research projects for the current user with caching and filtering
   * @param filters - Filter parameters
   */
  async getAll(filters?: FilterParams): Promise<ResearchProject[]> {
    try {
      // Create a cache key based on filters
      const filterKey = this.createFilterKey(filters);
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:all:${filterKey}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching all filtered research projects from database', { filters });
          return enhancedResearchProjectService.getAll(filters);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached filtered research projects', { 
        error: error.message,
        filters
      });
      // Fall back to non-cached version
      return enhancedResearchProjectService.getAll(filters);
    }
  }

  /**
   * Get paginated research projects for the current user with caching and filtering
   * @param pagination - Pagination parameters
   * @param filters - Filter parameters
   */
  async getPaginated(
    pagination: PaginationParams,
    filters?: FilterParams
  ): Promise<PaginatedResult<ResearchProject>> {
    try {
      const { page, pageSize } = pagination;
      
      // Create a cache key based on filters
      const filterKey = this.createFilterKey(filters);
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:paginated:${page}:${pageSize}:${filterKey}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching paginated filtered research projects from database', { 
            page, 
            pageSize,
            filters
          });
          return enhancedResearchProjectService.getPaginated(pagination, filters);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached paginated filtered research projects', { 
        error: error.message,
        page: pagination.page,
        pageSize: pagination.pageSize,
        filters
      });
      // Fall back to non-cached version
      return enhancedResearchProjectService.getPaginated(pagination, filters);
    }
  }

  /**
   * Get all unique tags from research projects with caching
   */
  async getAllTags(): Promise<string[]> {
    try {
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:all_tags`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching all unique project tags from database');
          return enhancedResearchProjectService.getAllTags();
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached project tags', { 
        error: error.message
      });
      // Fall back to non-cached version
      return enhancedResearchProjectService.getAllTags();
    }
  }

  /**
   * Get all unique categories from research projects with caching
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:all_categories`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching all unique project categories from database');
          return enhancedResearchProjectService.getAllCategories();
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached project categories', { 
        error: error.message
      });
      // Fall back to non-cached version
      return enhancedResearchProjectService.getAllCategories();
    }
  }

  /**
   * Create a new research project and invalidate caches
   * @param title - Project title
   * @param description - Project description
   */
  async create(title: string, description?: string): Promise<string> {
    try {
      const projectId = await enhancedResearchProjectService.create(title, description);
      
      if (projectId) {
        // Invalidate all projects cache
        await removeByPattern(`${CachePrefix.RESEARCH_PROJECTS}:all:*`);
        
        // Invalidate paginated caches
        await removeByPattern(`${CachePrefix.RESEARCH_PROJECTS}:paginated:*`);
        
        // Invalidate tags cache
        await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:all_tags`);
        
        // Invalidate categories cache
        await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:all_categories`);
        
        logger.info('Invalidated research projects caches after creation');
      }
      
      return projectId;
    } catch (error: any) {
      logger.error('Error creating research project', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete a research project and invalidate caches
   * @param projectId - ID of the project to delete
   */
  async delete(projectId: string): Promise<void> {
    try {
      await enhancedResearchProjectService.delete(projectId);
      
      // Invalidate all projects cache
      await removeByPattern(`${CachePrefix.RESEARCH_PROJECTS}:all:*`);
      
      // Invalidate paginated caches
      await removeByPattern(`${CachePrefix.RESEARCH_PROJECTS}:paginated:*`);
      
      // Invalidate tags cache
      await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:all_tags`);
      
      // Invalidate categories cache
      await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:all_categories`);
      
      logger.info('Invalidated research projects caches after deletion', { projectId });
    } catch (error: any) {
      logger.error('Error deleting research project', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Create a cache key suffix based on filter parameters
   * @param filters - Filter parameters
   */
  private createFilterKey(filters?: FilterParams): string {
    if (!filters) return 'no_filters';
    
    const parts = [];
    
    if (filters.searchTerm) {
      parts.push(`search:${filters.searchTerm}`);
    }
    
    if (filters.priority && filters.priority.length > 0) {
      parts.push(`priority:${filters.priority.join(',')}`);
    }
    
    if (filters.status && filters.status.length > 0) {
      parts.push(`status:${filters.status.join(',')}`);
    }
    
    if (filters.category) {
      parts.push(`category:${filters.category}`);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      parts.push(`tags:${filters.tags.join(',')}`);
    }
    
    // Due date range
    if (filters.dueDateFrom) {
      parts.push(`dueFrom:${filters.dueDateFrom.toISOString()}`);
    }
    
    if (filters.dueDateTo) {
      parts.push(`dueTo:${filters.dueDateTo.toISOString()}`);
    }
    
    // Start date range
    if (filters.startDateFrom) {
      parts.push(`startFrom:${filters.startDateFrom.toISOString()}`);
    }
    
    if (filters.startDateTo) {
      parts.push(`startTo:${filters.startDateTo.toISOString()}`);
    }
    
    // Completion date range
    if (filters.completionDateFrom) {
      parts.push(`completionFrom:${filters.completionDateFrom.toISOString()}`);
    }
    
    if (filters.completionDateTo) {
      parts.push(`completionTo:${filters.completionDateTo.toISOString()}`);
    }
    
    return parts.length > 0 ? parts.join(':') : 'no_filters';
  }
}

export const cachedEnhancedResearchProjectService = new CachedEnhancedResearchProjectService();
