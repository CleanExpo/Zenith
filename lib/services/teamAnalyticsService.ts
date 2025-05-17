import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export type TeamAnalytics = {
  date: string;
  metrics: any;
  created_at: string;
  updated_at: string;
};

export type TeamActivityLog = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
};

export type TeamMemberActivity = {
  user_id: string;
  user_email: string;
  user_name: string;
  activity_count: number;
  last_active: string;
  actions: Record<string, number>;
};

export type TeamAnalyticsSummary = {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  activity: {
    total_logs: number;
    unique_users: number;
    actions: Record<string, number>;
  };
};

/**
 * Service for managing team analytics
 */
export const teamAnalyticsService = {
  /**
   * Get team analytics for a specific date range
   * 
   * @param teamId - The ID of the team
   * @param startDate - The start date of the range
   * @param endDate - The end date of the range
   * @returns An array of team analytics or null if an error occurred
   */
  async getAnalytics(
    teamId: string,
    startDate: string,
    endDate: string
  ): Promise<TeamAnalytics[] | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_team_analytics', {
          p_team_id: teamId,
          p_start_date: startDate,
          p_end_date: endDate,
        });
      
      if (error) {
        logger.error('Error getting team analytics', { error, teamId, startDate, endDate });
        return null;
      }
      
      return data as TeamAnalytics[];
    } catch (error) {
      logger.error('Error in getAnalytics', { error, teamId, startDate, endDate });
      return null;
    }
  },
  
  /**
   * Get team analytics summary for a specific date range
   * 
   * @param teamId - The ID of the team
   * @param startDate - The start date of the range
   * @param endDate - The end date of the range
   * @returns A summary of team analytics or null if an error occurred
   */
  async getAnalyticsSummary(
    teamId: string,
    startDate: string,
    endDate: string
  ): Promise<TeamAnalyticsSummary | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_team_analytics_summary', {
          p_team_id: teamId,
          p_start_date: startDate,
          p_end_date: endDate,
        });
      
      if (error) {
        logger.error('Error getting team analytics summary', { error, teamId, startDate, endDate });
        return null;
      }
      
      return data as TeamAnalyticsSummary;
    } catch (error) {
      logger.error('Error in getAnalyticsSummary', { error, teamId, startDate, endDate });
      return null;
    }
  },
  
  /**
   * Get team activity logs
   * 
   * @param teamId - The ID of the team
   * @param options - Options for filtering and pagination
   * @returns An array of team activity logs or null if an error occurred
   */
  async getActivityLogs(
    teamId: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
      userId?: string;
      entityType?: string;
      entityId?: string;
      action?: string;
    } = {}
  ): Promise<TeamActivityLog[] | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_team_activity_logs', {
          p_team_id: teamId,
          p_start_date: options.startDate || null,
          p_end_date: options.endDate || null,
          p_limit: options.limit || 100,
          p_offset: options.offset || 0,
          p_user_id: options.userId || null,
          p_entity_type: options.entityType || null,
          p_entity_id: options.entityId || null,
          p_action: options.action || null,
        });
      
      if (error) {
        logger.error('Error getting team activity logs', { error, teamId, options });
        return null;
      }
      
      return data as TeamActivityLog[];
    } catch (error) {
      logger.error('Error in getActivityLogs', { error, teamId, options });
      return null;
    }
  },
  
  /**
   * Get team member activity summary
   * 
   * @param teamId - The ID of the team
   * @param startDate - The start date of the range
   * @param endDate - The end date of the range
   * @returns An array of team member activity summaries or null if an error occurred
   */
  async getMemberActivitySummary(
    teamId: string,
    startDate: string,
    endDate: string
  ): Promise<TeamMemberActivity[] | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_team_member_activity_summary', {
          p_team_id: teamId,
          p_start_date: startDate,
          p_end_date: endDate,
        });
      
      if (error) {
        logger.error('Error getting team member activity summary', { error, teamId, startDate, endDate });
        return null;
      }
      
      return data as TeamMemberActivity[];
    } catch (error) {
      logger.error('Error in getMemberActivitySummary', { error, teamId, startDate, endDate });
      return null;
    }
  },
  
  /**
   * Update or insert team analytics for a specific date
   * 
   * @param teamId - The ID of the team
   * @param date - The date of the analytics
   * @param metrics - The metrics to store
   * @returns True if the analytics were updated, false if an error occurred
   */
  async upsertAnalytics(
    teamId: string,
    date: string,
    metrics: any
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('upsert_team_analytics', {
          p_team_id: teamId,
          p_date: date,
          p_metrics: metrics,
        });
      
      if (error) {
        logger.error('Error upserting team analytics', { error, teamId, date });
        return false;
      }
      
      return data;
    } catch (error) {
      logger.error('Error in upsertAnalytics', { error, teamId, date });
      return false;
    }
  },
  
  /**
   * Log team activity
   * 
   * @param teamId - The ID of the team
   * @param action - The action performed
   * @param entityType - The type of entity the action was performed on
   * @param entityId - The ID of the entity the action was performed on (optional)
   * @param details - Additional details about the action (optional)
   * @returns The ID of the created log or null if an error occurred
   */
  async logActivity(
    teamId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ): Promise<string | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('log_team_activity', {
          p_team_id: teamId,
          p_action: action,
          p_entity_type: entityType,
          p_entity_id: entityId || null,
          p_details: details || null,
        });
      
      if (error) {
        logger.error('Error logging team activity', { error, teamId, action, entityType });
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error('Error in logActivity', { error, teamId, action, entityType });
      return null;
    }
  },
};
