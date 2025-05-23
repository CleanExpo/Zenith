import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger';
import { ResearchProject } from '@/lib/database.types';
import { 
  CachePrefix, 
  CacheExpiration,
  withCache,
  removeFromCache,
  invalidateByTags,
  warmupCache
} from '@/lib/utils/clientSafeCacheUtils';

/**
 * Extended ResearchProject interface with related data
 */
export interface ResearchProjectWithDetails extends ResearchProject {
  project_notes?: any[];
  project_tasks?: any[];
  project_files?: any[];
  project_analytics?: any[];
}

/**
 * Enhanced cached service for research projects using client-safe caching
 */
export class EnhancedCachedResearchProjectService {
  /**
   * Get all research projects with caching
   * @param userId User ID to filter projects by
   * @param page Page number for pagination
   * @param pageSize Number of items per page
   * @param filters Optional filters to apply
   * @returns Research projects and total count
   */
  static async getProjects(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    filters: Record<string, any> = {}
  ): Promise<{ data: ResearchProject[]; total: number }> {
    const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:list:${userId}:${page}:${pageSize}:${JSON.stringify(filters)}`;

    return withCache(
      cacheKey,
      async () => {
        const supabase = createClient();
        
        // Calculate pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Start building the query
        let query = supabase
          .from('research_projects')
          .select('*', { count: 'exact' });
        
        // Add user filter
        query = query.eq('user_id', userId);
        
        // Add any additional filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (key === 'title' || key === 'description') {
                query = query.ilike(key, `%${value}%`);
              } else if (key === 'status' && Array.isArray(value) && value.length > 0) {
                query = query.in(key, value);
              } else if (key === 'created_at_start') {
                query = query.gte('created_at', value);
              } else if (key === 'created_at_end') {
                query = query.lte('created_at', value);
              } else {
                query = query.eq(key, value);
              }
            }
          });
        }
        
        // Add pagination
        query = query.range(from, to);
        
        // Add sorting
        query = query.order('created_at', { ascending: false });
        
        // Execute the query
        const { data, error, count } = await query;
        
        if (error) {
          logger.error('Error fetching research projects', { error });
          throw error;
        }
        
        return {
          data: data || [],
          total: count || 0
        };
      },
      CacheExpiration.MEDIUM
    );
  }

  /**
   * Get a research project by ID with caching
   * @param id Project ID
   * @param userId User ID for permission check
   * @returns Research project or null if not found
   */
  static async getProjectById(
    id: string,
    userId: string
  ): Promise<ResearchProjectWithDetails | null> {
    const cacheKey = `${CachePrefix.RESEARCH_PROJECTS}:detail:${id}`;

    return withCache(
      cacheKey,
      async () => {
        const supabase = createClient();
        
        // Get the project with all related data
        const { data, error } = await supabase
          .from('research_projects')
          .select(`
            *,
            project_notes(*),
            project_tasks(*),
            project_files(*),
            project_analytics(*)
          `)
          .eq('id', id)
          .eq('user_id', userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // PGRST116 is the error code for "no rows returned"
            return null;
          }
          
          logger.error('Error fetching research project by ID', { error, id });
          throw error;
        }
        
        return data as ResearchProjectWithDetails;
      },
      CacheExpiration.MEDIUM
    );
  }

  /**
   * Create a new research project
   * @param project Project data
   * @param userId User ID
   * @returns Created project
   */
  static async createProject(
    project: Partial<ResearchProject>,
    userId: string
  ): Promise<ResearchProject> {
    const newProject = {
      ...project,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const supabase = createClient();
    
    const { data: createdProject, error } = await supabase
      .from('research_projects')
      .insert(newProject)
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating research project', { error, project: newProject });
      throw error;
    }
    
    // Invalidate list caches for this user
    await invalidateByTags([`user:${userId}`]);
    
    return createdProject;
  }

  /**
   * Update a research project
   * @param id Project ID
   * @param updates Project updates
   * @param userId User ID for permission check
   * @returns Updated project
   */
  static async updateProject(
    id: string,
    updates: Partial<ResearchProject>,
    userId: string
  ): Promise<ResearchProject> {
    const supabase = createClient();
    
    const { data: updatedProject, error } = await supabase
      .from('research_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating research project', { error, id, updates });
      throw error;
    }
    
    // Invalidate related caches
    await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:detail:${id}`);
    await invalidateByTags([`project:${id}`, `user:${userId}`]);
    
    return updatedProject;
  }

  /**
   * Delete a research project and invalidate caches
   * @param id Project ID
   * @param userId User ID for permission check
   * @returns Success status
   */
  static async deleteProject(id: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('research_projects')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        logger.error('Error deleting research project', { error, id });
        throw error;
      }
      
      // Invalidate related caches
      await removeFromCache(`${CachePrefix.RESEARCH_PROJECTS}:detail:${id}`);
      await invalidateByTags(['research_projects', `project:${id}`, `user:${userId}`]);
      
      return true;
    } catch (error: any) {
      logger.error('Error deleting research project', { error: error.message, id });
      return false;
    }
  }

  /**
   * Warm up the cache for a user's projects
   * @param userId User ID
   * @returns Success status
   */
  static async warmupCache(userId: string): Promise<boolean> {
    try {
      // Define the cache keys and fetch functions to warm up
      const keysToWarmup = [
        {
          key: `${CachePrefix.RESEARCH_PROJECTS}:list:${userId}:1:10:{}`,
          fetch: async () => {
            const supabase = createClient();
            
            const { data, count, error } = await supabase
              .from('research_projects')
              .select('*', { count: 'exact' })
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .range(0, 9);
            
            if (error) {
              throw error;
            }
            
            return {
              data: data || [],
              total: count || 0
            };
          }
        }
      ];
      
      // Warm up the cache
      await warmupCache(keysToWarmup, {
        expiration: CacheExpiration.MEDIUM,
        tags: ['research_projects', `user:${userId}`]
      });
      
      logger.info('Cache warmed up for user projects', { userId });
      return true;
    } catch (error: any) {
      logger.error('Error warming up cache for user projects', { error: error.message, userId });
      return false;
    }
  }
}
