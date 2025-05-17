import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { ResearchProject } from '@/lib/database.types';
import { CachePrefix, CacheExpiration, withCache, removeFromCache, removeByPattern } from '@/lib/utils/cacheUtils';
import { researchProjectService, PaginationParams, PaginatedResult } from './researchProjectService';

/**
 * Enhanced version of ResearchProjectService with Redis caching
 */
export class CachedResearchProjectService {
  private supabase = createClient();

  /**
   * Get all research projects for the current user with caching
   */
  async getAll(): Promise<ResearchProject[]> {
    try {
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:all`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching all research projects from database');
          return researchProjectService.getAll();
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached research projects', { error: error.message });
      // Fall back to non-cached version
      return researchProjectService.getAll();
    }
  }

  /**
   * Get paginated research projects for the current user with caching
   * @param pagination - Pagination parameters
   */
  async getPaginated(pagination: PaginationParams): Promise<PaginatedResult<ResearchProject>> {
    try {
      const { page, pageSize } = pagination;
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:paginated:${page}:${pageSize}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching paginated research projects from database', { page, pageSize });
          return researchProjectService.getPaginated(pagination);
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached paginated research projects', { 
        error: error.message,
        page: pagination.page,
        pageSize: pagination.pageSize
      });
      // Fall back to non-cached version
      return researchProjectService.getPaginated(pagination);
    }
  }

  /**
   * Create a new research project and invalidate caches
   * @param title - Project title
   * @param description - Project description
   */
  async create(title: string, description?: string): Promise<string> {
    try {
      const projectId = await researchProjectService.create(title, description);
      
      if (projectId) {
        // Invalidate all projects cache
        await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:all`);
        
        // Invalidate paginated caches
        await removeByPattern(`${CachePrefix.RESEARCH_PROJECTS}:paginated:*`);
        
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
      await researchProjectService.delete(projectId);
      
      // Invalidate all projects cache
      await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:all`);
      
      // Invalidate paginated caches
      await removeByPattern(`${CachePrefix.RESEARCH_PROJECTS}:paginated:*`);
      
      logger.info('Invalidated research projects caches after deletion', { projectId });
    } catch (error: any) {
      logger.error('Error deleting research project', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get a single research project by ID with caching
   * @param projectId - ID of the project to retrieve
   */
  async getById(projectId: string): Promise<ResearchProject | null> {
    try {
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:${projectId}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching research project by ID from database', { projectId });
          
          const { data, error } = await this.supabase
            .from('research_projects')
            .select('*')
            .eq('id', projectId)
            .single();
          
          if (error) {
            logger.error('Error fetching research project by ID', { error, projectId });
            return null;
          }
          
          return data;
        },
        CacheExpiration.MEDIUM
      );
    } catch (error: any) {
      logger.error('Error getting cached research project by ID', { error: error.message, projectId });
      
      // Fall back to direct database query
      const { data } = await this.supabase
        .from('research_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      return data;
    }
  }

  /**
   * Update a research project and invalidate caches
   * @param projectId - ID of the project to update
   * @param updates - Object containing fields to update
   */
  async update(projectId: string, updates: Partial<ResearchProject>): Promise<ResearchProject | null> {
    try {
      // Ensure updated_at is set
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await this.supabase
        .from('research_projects')
        .update(updatedData)
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) {
        logger.error('Error updating research project', { error, projectId });
        throw new Error(error.message);
      }
      
      // Invalidate specific project cache
      await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:${projectId}`);
      
      // Invalidate all projects cache
      await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:all`);
      
      // Invalidate paginated caches
      await removeByPattern(`${CachePrefix.RESEARCH_PROJECTS}:paginated:*`);
      
      logger.info('Invalidated research projects caches after update', { projectId });
      
      return data;
    } catch (error: any) {
      logger.error('Error updating research project', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Search research projects with caching
   * @param query - Search query
   * @param limit - Maximum number of results to return
   */
  async search(query: string, limit: number = 10): Promise<ResearchProject[]> {
    try {
      // For search queries, use a shorter cache expiration
      const cacheKey = `${CachePrefix.SEARCH}:research_projects:${query}:${limit}`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Searching research projects in database', { query, limit });
          
          const { data, error } = await this.supabase
            .from('research_projects')
            .select('*')
            .ilike('title', `%${query}%`)
            .order('created_at', { ascending: false })
            .limit(limit);
          
          if (error) {
            logger.error('Error searching research projects', { error, query });
            throw new Error(error.message);
          }
          
          return data;
        },
        CacheExpiration.SHORT // Use shorter expiration for search results
      );
    } catch (error: any) {
      logger.error('Error getting cached search results for research projects', { 
        error: error.message,
        query
      });
      
      // Fall back to direct database query
      const { data } = await this.supabase
        .from('research_projects')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return data || [];
    }
  }

  /**
   * Get research projects statistics with caching
   * Returns statistics about the user's research projects
   */
  async getStatistics(): Promise<{
    total: number;
    createdThisWeek: number;
    createdThisMonth: number;
    updatedThisWeek: number;
  }> {
    try {
      const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:statistics`;
      
      return await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching research projects statistics from database');
          
          // Get all projects first
          const projects = await this.getAll();
          
          // Calculate statistics
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          const createdThisWeek = projects.filter(p => 
            new Date(p.created_at) >= oneWeekAgo
          ).length;
          
          const createdThisMonth = projects.filter(p => 
            new Date(p.created_at) >= oneMonthAgo
          ).length;
          
          const updatedThisWeek = projects.filter(p => 
            p.updated_at && new Date(p.updated_at) >= oneWeekAgo
          ).length;
          
          return {
            total: projects.length,
            createdThisWeek,
            createdThisMonth,
            updatedThisWeek
          };
        },
        CacheExpiration.SHORT // Statistics should be relatively fresh
      );
    } catch (error: any) {
      logger.error('Error getting cached research projects statistics', { error: error.message });
      
      // Return empty statistics on error
      return {
        total: 0,
        createdThisWeek: 0,
        createdThisMonth: 0,
        updatedThisWeek: 0
      };
    }
  }
}

export const cachedResearchProjectService = new CachedResearchProjectService();
