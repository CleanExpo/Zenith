import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { logger } from '@/lib/logger';
import { ResearchProject } from '@/lib/database.types';
import { getMockUserId, isDevelopmentEnvironment } from '@/lib/utils/auth';
import { PaginationParams, PaginatedResult, researchProjectService } from './researchProjectService';

export interface FilterParams {
  searchTerm?: string;
  priority?: string[];
  tags?: string[];
  dueDateFrom?: Date | null;
  dueDateTo?: Date | null;
  status?: string[];
  category?: string | null;
  startDateFrom?: Date | null;
  startDateTo?: Date | null;
  completionDateFrom?: Date | null;
  completionDateTo?: Date | null;
}

export class EnhancedResearchProjectService {
  /**
   * Get all research projects for the current user with filtering
   * @param filters - Filter parameters
   */
  async getAll(filters?: FilterParams): Promise<ResearchProject[]> {
    try {
      // Start with a base query
      let query = supabase
        .from('research_projects')
        .select('*');
      
      // Apply filters if provided
      query = this.applyFilters(query, filters);
      
      // Order by created_at descending
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Error fetching filtered research projects', { error, filters });
        throw new Error(error.message);
      }
      
      logger.info('Successfully fetched filtered research projects', { 
        count: data.length,
        filters
      });
      
      return data;
    } catch (error: any) {
      logger.error('Unexpected error in enhancedResearchProjectService.getAll', { 
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get paginated research projects for the current user with filtering
   * @param pagination - Pagination parameters
   * @param filters - Filter parameters
   */
  async getPaginated(
    pagination: PaginationParams,
    filters?: FilterParams
  ): Promise<PaginatedResult<ResearchProject>> {
    try {
      const { page, pageSize } = pagination;
      
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Start with a base count query
      let countQuery = supabase
        .from('research_projects')
        .select('*', { count: 'exact', head: true });
      
      // Apply filters to count query
      countQuery = this.applyFilters(countQuery, filters);
      
      // Execute count query
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error('Error counting filtered research projects', { 
          error: countError,
          filters
        });
        throw new Error(countError.message);
      }
      
      // Start with a base data query
      let dataQuery = supabase
        .from('research_projects')
        .select('*');
      
      // Apply filters to data query
      dataQuery = this.applyFilters(dataQuery, filters);
      
      // Order and paginate
      dataQuery = dataQuery
        .order('created_at', { ascending: false })
        .range(from, to);
      
      // Execute data query
      const { data, error } = await dataQuery;
      
      if (error) {
        logger.error('Error fetching paginated filtered research projects', { 
          error,
          pagination,
          filters
        });
        throw new Error(error.message);
      }
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      logger.info('Successfully fetched paginated filtered research projects', { 
        page, 
        pageSize, 
        totalCount, 
        fetchedCount: data.length,
        filters
      });
      
      return {
        data,
        count: totalCount,
        totalPages,
        currentPage: page
      };
    } catch (error: any) {
      logger.error('Unexpected error in enhancedResearchProjectService.getPaginated', { 
        error: error.message,
        pagination,
        filters
      });
      throw error;
    }
  }

  /**
   * Get all unique tags from research projects
   */
  async getAllTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('research_projects')
        .select('tags');
      
      if (error) {
        logger.error('Error fetching project tags', { error });
        throw new Error(error.message);
      }
      
      // Extract all tags from all projects and flatten the array
      const allTags = data
        .filter(project => project.tags && project.tags.length > 0)
        .flatMap(project => project.tags as string[]);
      
      // Remove duplicates
      const uniqueTags = [...new Set(allTags)];
      
      logger.info('Successfully fetched unique project tags', { count: uniqueTags.length });
      return uniqueTags;
    } catch (error: any) {
      logger.error('Unexpected error in enhancedResearchProjectService.getAllTags', { 
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get all unique categories from research projects
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('research_projects')
        .select('category');
      
      if (error) {
        logger.error('Error fetching project categories', { error });
        throw new Error(error.message);
      }
      
      // Extract all categories from all projects
      const allCategories = data
        .filter(project => project.category)
        .map(project => project.category as string);
      
      // Remove duplicates
      const uniqueCategories = [...new Set(allCategories)];
      
      logger.info('Successfully fetched unique project categories', { count: uniqueCategories.length });
      return uniqueCategories;
    } catch (error: any) {
      logger.error('Unexpected error in enhancedResearchProjectService.getAllCategories', { 
        error: error.message
      });
      return [];
    }
  }

  /**
   * Apply filters to a Supabase query
   * @param query - Supabase query to apply filters to
   * @param filters - Filter parameters
   */
  private applyFilters(query: any, filters?: FilterParams): any {
    if (!filters) return query;
    
    // Apply search term filter (search in title and description)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = `%${filters.searchTerm.trim()}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},methodology.ilike.${searchTerm}`);
    }
    
    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }
    
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    // Apply tags filter (using array overlap)
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    
    // Apply date range filters
    
    // Due date range filter
    if (filters.dueDateFrom) {
      query = query.gte('due_date', filters.dueDateFrom.toISOString());
    }
    
    if (filters.dueDateTo) {
      query = query.lte('due_date', filters.dueDateTo.toISOString());
    }
    
    // Start date range filter
    if (filters.startDateFrom) {
      query = query.gte('start_date', filters.startDateFrom.toISOString());
    }
    
    if (filters.startDateTo) {
      query = query.lte('start_date', filters.startDateTo.toISOString());
    }
    
    // Completion date range filter
    if (filters.completionDateFrom) {
      query = query.gte('completion_date', filters.completionDateFrom.toISOString());
    }
    
    if (filters.completionDateTo) {
      query = query.lte('completion_date', filters.completionDateTo.toISOString());
    }
    
    return query;
  }

  // Delegate other methods to the original service
  async create(title: string, description?: string): Promise<string> {
    return researchProjectService.create(title, description);
  }

  async delete(projectId: string): Promise<void> {
    return researchProjectService.delete(projectId);
  }
}

export const enhancedResearchProjectService = new EnhancedResearchProjectService();
