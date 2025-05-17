// Zenith/lib/services/researchProjectService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import type { Database } from '@/lib/database.types'; // Ensure this path is correct

// Define the type for a research project, aligning with your database.types.ts or schema
// This might be redundant if already defined in API routes, consider a shared types file.
type ResearchProject = Database['public']['Tables']['research_projects']['Row'];
type ResearchProjectInsert = Database['public']['Tables']['research_projects']['Insert'];
type ResearchProjectUpdate = Database['public']['Tables']['research_projects']['Update'];

/**
 * Service class for managing research projects.
 * This class encapsulates business logic related to research projects.
 */
export class ResearchProjectService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  /**
   * Creates a new research project.
   * @param projectData - The data for the new project.
   * @param userId - The ID of the user creating the project.
   * @returns The created research project.
   * @throws Error if creation fails.
   */
  async createProject(
    projectData: Pick<ResearchProjectInsert, 'title' | 'description'>,
    userId: string
  ): Promise<ResearchProject> {
    if (!projectData.title || projectData.title.trim() === '') {
      logger.warn('Create project attempt with empty title', { userId });
      throw new Error('Title is required to create a research project.');
    }

    // Add any other business validation logic here
    // For example, check title length, sanitize input, etc.

    const newProjectData: ResearchProjectInsert = {
      ...projectData,
      user_id: userId,
    };

    const { data, error } = await this.supabase
      .from('research_projects')
      .insert(newProjectData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating project in service', { error, userId, projectTitle: projectData.title });
      throw new Error(`Failed to create research project: ${error.message}`);
    }
    if (!data) {
      logger.error('No data returned after creating project in service', { userId, projectTitle: projectData.title });
      throw new Error('Failed to create research project: No data returned.');
    }
    
    logger.info('Research project created successfully', { projectId: data.id, userId });
    return data;
  }

  /**
   * Retrieves all research projects accessible to the current user (respecting RLS).
   * @returns A list of research projects.
   * @throws Error if fetching fails.
   */
  async getProjects(): Promise<ResearchProject[]> {
    const { data, error } = await this.supabase
      .from('research_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching projects in service', { error });
      throw new Error(`Failed to fetch research projects: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Retrieves a single research project by its ID.
   * RLS policies should ensure the user has access.
   * @param projectId - The ID of the project to retrieve.
   * @returns The research project or null if not found/accessible.
   * @throws Error if fetching fails.
   */
  async getProjectById(projectId: string): Promise<ResearchProject | null> {
    if (!projectId) {
      logger.warn('Get project by ID attempt with no ID');
      throw new Error('Project ID is required.');
    }
    const { data, error } = await this.supabase
      .from('research_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "Fetched result not found"
        logger.info('Project not found by ID in service', { projectId, error: error.message });
        return null;
      }
      logger.error('Error fetching project by ID in service', { projectId, error });
      throw new Error(`Failed to fetch research project by ID: ${error.message}`);
    }
    return data;
  }
  
  /**
   * Updates an existing research project.
   * @param projectId - The ID of the project to update.
   * @param projectData - The data to update.
   * @param userId - The ID of the user attempting the update (for RLS check).
   * @returns The updated research project.
   * @throws Error if update fails or user is not authorized.
   */
  async updateProject(
    projectId: string,
    projectData: ResearchProjectUpdate,
    userId: string // userId might not be strictly needed if RLS handles ownership, but good for logging/explicit checks
  ): Promise<ResearchProject> {
    if (!projectId) {
      logger.warn('Update project attempt with no ID', { userId });
      throw new Error('Project ID is required for update.');
    }

    // Ensure user_id is not being changed by this update, ownership change should be a separate, privileged operation.
    if (projectData.user_id && projectData.user_id !== userId) {
        logger.warn('Attempt to change user_id during project update', { projectId, currentUserId: userId, attemptedOwnerChange: projectData.user_id });
        // Depending on policy, either throw error or silently ignore user_id change.
        // For now, let RLS handle it, but remove it from the update payload to be safe.
        delete projectData.user_id; 
    }
    
    const { data, error } = await this.supabase
      .from('research_projects')
      .update(projectData)
      .eq('id', projectId)
      // .eq('user_id', userId) // RLS should handle this, but can be an extra check
      .select()
      .single();

    if (error) {
      logger.error('Error updating project in service', { error, projectId, userId });
      throw new Error(`Failed to update research project: ${error.message}`);
    }
    if (!data) {
      logger.error('No data returned after updating project in service', { projectId, userId });
      throw new Error('Failed to update research project: No data returned or not authorized.');
    }
    logger.info('Research project updated successfully', { projectId, userId });
    return data;
  }

  /**
   * Deletes a research project.
   * @param projectId - The ID of the project to delete.
   * @param userId - The ID of the user attempting the deletion (for RLS check).
   * @throws Error if deletion fails or user is not authorized.
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    if (!projectId) {
      logger.warn('Delete project attempt with no ID', { userId });
      throw new Error('Project ID is required for deletion.');
    }

    const { error } = await this.supabase
      .from('research_projects')
      .delete()
      .eq('id', projectId);
      // .eq('user_id', userId); // RLS should handle this

    if (error) {
      logger.error('Error deleting project in service', { error, projectId, userId });
      throw new Error(`Failed to delete research project: ${error.message}`);
    }
    logger.info('Research project deleted successfully', { projectId, userId });
  }
}

// Example of how this service might be instantiated and used in an API route:
// import { createServerClient } from '@supabase/ssr'; // or your client instance
// const supabase = createServerClient(...);
// const researchProjectService = new ResearchProjectService(supabase);
// const projects = await researchProjectService.getProjects();
