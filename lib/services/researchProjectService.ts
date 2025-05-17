import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { logger } from '@/lib/logger';
import { ResearchProject } from '@/lib/database.types';
import { getMockUserId, isDevelopmentEnvironment } from '@/lib/utils/auth';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}

export const researchProjectService = {
  /**
   * Get all research projects for the current user
   */
  async getAll(): Promise<ResearchProject[]> {
    try {
      // Fetch projects directly from the table
      const { data, error } = await supabase
        .from('research_projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Error fetching research projects', { error });
        throw new Error(error.message);
      }
      
      logger.info('Successfully fetched research projects', { count: data.length });
      return data;
    } catch (error: any) {
      logger.error('Unexpected error in researchProjectService.getAll', { error: error.message });
      throw error;
    }
  },

  /**
   * Get paginated research projects for the current user
   * @param pagination - Pagination parameters
   */
  async getPaginated(pagination: PaginationParams): Promise<PaginatedResult<ResearchProject>> {
    try {
      const { page, pageSize } = pagination;
      
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // First get the count of all records
      const { count, error: countError } = await supabase
        .from('research_projects')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        logger.error('Error counting research projects', { error: countError });
        throw new Error(countError.message);
      }
      
      // Then fetch the paginated data
      const { data, error } = await supabase
        .from('research_projects')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        logger.error('Error fetching paginated research projects', { error });
        throw new Error(error.message);
      }
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      logger.info('Successfully fetched paginated research projects', { 
        page, 
        pageSize, 
        totalCount, 
        fetchedCount: data.length 
      });
      
      return {
        data,
        count: totalCount,
        totalPages,
        currentPage: page
      };
    } catch (error: any) {
      logger.error('Unexpected error in researchProjectService.getPaginated', { error: error.message });
      throw error;
    }
  },

  /**
   * Create a new research project
   * @param title - Project title
   * @param description - Project description
   */
  async create(title: string, description?: string): Promise<string> {
    try {
      // Try to use the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_research_project', {
        p_title: title,
        p_description: description,
        p_user_id: isDevelopmentEnvironment() ? getMockUserId() : undefined
      });
      
      if (!rpcError) {
        logger.info('Successfully created research project via RPC', { projectId: rpcData });
        return rpcData;
      }
      
      // If the RPC function fails, fall back to direct insert
      logger.warn('RPC function failed, falling back to direct insert', { error: rpcError.message });
      
      const now = new Date().toISOString();
      const userId = isDevelopmentEnvironment() ? getMockUserId() : undefined;
      
      const { data, error } = await supabase
        .from('research_projects')
        .insert({
          title,
          description: description || null,
          user_id: userId,
          created_at: now,
          updated_at: now
        })
        .select();
      
      if (error) {
        logger.error('Error creating research project via direct insert', { error });
        throw new Error(error.message);
      }
      
      logger.info('Successfully created research project via direct insert', { projectId: data[0].id });
      return data[0].id;
    } catch (error: any) {
      logger.error('Unexpected error in researchProjectService.create', { error: error.message });
      throw error;
    }
  },

  /**
   * Update a research project
   * @param projectId - ID of the project to update
   * @param updates - Object containing fields to update
   */
  async update(projectId: string, updates: { title: string, description?: string }): Promise<ResearchProject | null> {
    try {
      // Ensure updated_at is set
      const updatedData = {
        title: updates.title,
        description: updates.description,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('research_projects')
        .update(updatedData)
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) {
        logger.error('Error updating research project', { error, projectId });
        throw new Error(error.message);
      }
      
      logger.info('Successfully updated research project', { projectId });
      return data;
    } catch (error: any) {
      logger.error('Unexpected error in researchProjectService.update', { error: error.message, projectId });
      throw error;
    }
  },

  /**
   * Delete a research project
   * @param projectId - ID of the project to delete
   */
  async delete(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('research_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) {
        logger.error('Error deleting research project', { error, projectId });
        throw new Error(error.message);
      }
      
      logger.info('Successfully deleted research project', { projectId });
    } catch (error: any) {
      logger.error('Unexpected error in researchProjectService.delete', { error: error.message, projectId });
      throw error;
    }
  }
};
