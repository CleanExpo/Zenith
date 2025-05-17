import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface ProjectProgress {
  id: string;
  title: string;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at?: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  overdue_tasks: number;
  total_notes: number;
  total_files: number;
  total_file_size: number;
  last_activity_at?: string;
}

export interface ProjectActivity {
  activity_date: string;
  tasks_created: number;
  tasks_completed: number;
  notes_created: number;
  files_uploaded: number;
}

export class AnalyticsService {
  private supabase = createClient();

  /**
   * Get project progress data
   */
  async getProjectProgress(projectId: string): Promise<ProjectProgress | null> {
    try {
      const { data, error } = await this.supabase
        .from('project_progress')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        logger.error('Error fetching project progress', { error: error.message, projectId });
        throw new Error(`Failed to fetch project progress: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      logger.error('Error in getProjectProgress', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get project activity data over time
   */
  async getProjectActivity(projectId: string, daysBack: number = 30): Promise<ProjectActivity[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_project_activity', {
          p_id: projectId,
          days_back: daysBack
        });

      if (error) {
        logger.error('Error fetching project activity', { error: error.message, projectId });
        throw new Error(`Failed to fetch project activity: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Error in getProjectActivity', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get all projects progress for a user
   */
  async getAllProjectsProgress(userId: string): Promise<ProjectProgress[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false });

      if (error) {
        logger.error('Error fetching all projects progress', { error: error.message, userId });
        throw new Error(`Failed to fetch all projects progress: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Error in getAllProjectsProgress', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user productivity metrics
   */
  async getUserProductivityMetrics(userId: string, daysBack: number = 30): Promise<{
    total_projects: number;
    active_projects: number;
    tasks_created: number;
    tasks_completed: number;
    completion_rate: number;
    notes_created: number;
    files_uploaded: number;
    total_file_size: number;
  }> {
    try {
      // Get all projects for the user
      const { data: projects, error: projectsError } = await this.supabase
        .from('research_projects')
        .select('id')
        .eq('user_id', userId);

      if (projectsError) {
        throw projectsError;
      }

      // Get all project progress data
      const { data: progressData, error: progressError } = await this.supabase
        .from('project_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) {
        throw progressError;
      }

      // Calculate metrics
      const projectIds = projects?.map(p => p.id) || [];
      const activeProjects = progressData?.filter(p => 
        new Date(p.last_activity_at || '') > new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      ) || [];

      // Get tasks created in the last X days
      const { data: tasksCreated, error: tasksCreatedError } = await this.supabase
        .from('project_tasks')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (tasksCreatedError) {
        throw tasksCreatedError;
      }

      // Get tasks completed in the last X days
      const { data: tasksCompleted, error: tasksCompletedError } = await this.supabase
        .from('project_tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('updated_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (tasksCompletedError) {
        throw tasksCompletedError;
      }

      // Get notes created in the last X days
      const { data: notesCreated, error: notesCreatedError } = await this.supabase
        .from('project_notes')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (notesCreatedError) {
        throw notesCreatedError;
      }

      // Get files uploaded in the last X days
      const { data: filesUploaded, error: filesUploadedError } = await this.supabase
        .from('project_files')
        .select('id, file_size')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (filesUploadedError) {
        throw filesUploadedError;
      }

      // Calculate total file size
      const totalFileSize = filesUploaded?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

      // Calculate completion rate
      const completionRate = tasksCreated?.length 
        ? Math.round((tasksCompleted?.length || 0) / tasksCreated.length * 100) 
        : 0;

      return {
        total_projects: projectIds.length,
        active_projects: activeProjects.length,
        tasks_created: tasksCreated?.length || 0,
        tasks_completed: tasksCompleted?.length || 0,
        completion_rate: completionRate,
        notes_created: notesCreated?.length || 0,
        files_uploaded: filesUploaded?.length || 0,
        total_file_size: totalFileSize
      };
    } catch (error: any) {
      logger.error('Error in getUserProductivityMetrics', { error: error.message, userId });
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
