import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface ProjectCompletionPrediction {
  id: string;
  project_id: string;
  predicted_completion_date: string;
  confidence_score: number;
  factors: {
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    avg_completion_time_days: number;
    first_task_created: string;
    last_task_completed: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProjectMetric {
  id: string;
  project_id: string;
  metric_type: string;
  metric_name: string;
  metric_value?: number;
  metric_data?: any;
  time_period_start: string;
  time_period_end: string;
  created_at: string;
}

export interface UserProductivityMetric {
  id: string;
  user_id: string;
  metric_type: string;
  metric_name: string;
  metric_value?: number;
  metric_data?: any;
  time_period_start: string;
  time_period_end: string;
  created_at: string;
}

export interface CustomReport {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  report_type: 'project_progress' | 'user_productivity' | 'project_comparison';
  parameters: any;
  schedule?: string;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportResult {
  id: string;
  report_id: string;
  result_data: any;
  created_at: string;
}

export interface ProjectProgressReportParams {
  project_id: string;
}

export interface UserProductivityReportParams {
  start_date: string;
  end_date: string;
}

export interface ProjectComparisonReportParams {
  project_ids: string[];
}

export class AdvancedAnalyticsService {
  private supabase = createClient();

  /**
   * Get project completion prediction
   */
  async getProjectCompletionPrediction(projectId: string): Promise<ProjectCompletionPrediction | null> {
    try {
      // First, trigger a recalculation to ensure the prediction is up-to-date
      await this.supabase.rpc('calculate_project_completion_prediction', {
        p_project_id: projectId
      });

      // Then fetch the latest prediction
      const { data, error } = await this.supabase
        .from('project_completion_predictions')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error getting project completion prediction', { error: error.message, projectId });
      return null;
    }
  }

  /**
   * Generate project metrics
   */
  async generateProjectMetrics(projectId: string): Promise<boolean> {
    try {
      await this.supabase.rpc('generate_project_metrics', {
        p_project_id: projectId
      });
      
      logger.info('Generated project metrics', { projectId });
      return true;
    } catch (error: any) {
      logger.error('Error generating project metrics', { error: error.message, projectId });
      return false;
    }
  }

  /**
   * Get project metrics
   */
  async getProjectMetrics(
    projectId: string, 
    metricType?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<ProjectMetric[]> {
    try {
      let query = this.supabase
        .from('project_metrics')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (metricType) {
        query = query.eq('metric_type', metricType);
      }
      
      if (startDate) {
        query = query.gte('time_period_end', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('time_period_start', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting project metrics', { error: error.message, projectId });
      return [];
    }
  }

  /**
   * Generate user productivity metrics
   */
  async generateUserProductivityMetrics(): Promise<boolean> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }
      
      await this.supabase.rpc('generate_user_productivity_metrics', {
        p_user_id: user.user.id
      });
      
      logger.info('Generated user productivity metrics');
      return true;
    } catch (error: any) {
      logger.error('Error generating user productivity metrics', { error: error.message });
      return false;
    }
  }

  /**
   * Get user productivity metrics
   */
  async getUserProductivityMetrics(
    metricType?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<UserProductivityMetric[]> {
    try {
      let query = this.supabase
        .from('user_productivity_metrics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (metricType) {
        query = query.eq('metric_type', metricType);
      }
      
      if (startDate) {
        query = query.gte('time_period_end', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('time_period_start', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting user productivity metrics', { error: error.message });
      return [];
    }
  }

  /**
   * Create a custom report
   */
  async createCustomReport(
    title: string,
    reportType: 'project_progress' | 'user_productivity' | 'project_comparison',
    parameters: ProjectProgressReportParams | UserProductivityReportParams | ProjectComparisonReportParams,
    description?: string,
    schedule?: string
  ): Promise<CustomReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .insert({
          title,
          description,
          report_type: reportType,
          parameters,
          schedule
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      logger.info('Created custom report', { reportId: data.id, title });
      return data;
    } catch (error: any) {
      logger.error('Error creating custom report', { error: error.message, title });
      return null;
    }
  }

  /**
   * Get custom reports
   */
  async getCustomReports(): Promise<CustomReport[]> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting custom reports', { error: error.message });
      return [];
    }
  }

  /**
   * Get a custom report by ID
   */
  async getCustomReport(reportId: string): Promise<CustomReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('custom_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting custom report', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Update a custom report
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
      const { data, error } = await this.supabase
        .from('custom_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      logger.info('Updated custom report', { reportId });
      return data;
    } catch (error: any) {
      logger.error('Error updating custom report', { error: error.message, reportId });
      return null;
    }
  }

  /**
   * Delete a custom report
   */
  async deleteCustomReport(reportId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('custom_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) {
        throw error;
      }
      
      logger.info('Deleted custom report', { reportId });
      return true;
    } catch (error: any) {
      logger.error('Error deleting custom report', { error: error.message, reportId });
      return false;
    }
  }

  /**
   * Run a custom report
   */
  async runCustomReport(reportId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .rpc('run_custom_report', {
          p_report_id: reportId
        });
      
      if (error) {
        throw error;
      }
      
      logger.info('Ran custom report', { reportId });
      return data;
    } catch (error: any) {
      logger.error('Error running custom report', { error: error.message, reportId });
      throw error;
    }
  }

  /**
   * Get report results
   */
  async getReportResults(reportId: string, limit: number = 10): Promise<ReportResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('report_results')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Error getting report results', { error: error.message, reportId });
      return [];
    }
  }

  /**
   * Get the latest report result
   */
  async getLatestReportResult(reportId: string): Promise<ReportResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('report_results')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      logger.error('Error getting latest report result', { error: error.message, reportId });
      return null;
    }
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
