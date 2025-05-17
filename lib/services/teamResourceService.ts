import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export type TeamResource = {
  id: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  created_at: string;
  updated_at: string;
};

export type ResourceType = 'project' | 'report';

/**
 * Service for managing team resources
 */
export const teamResourceService = {
  /**
   * Add a resource to a team
   * 
   * @param teamId - The ID of the team
   * @param resourceType - The type of resource ('project', 'report', etc.)
   * @param resourceId - The ID of the resource
   * @returns The ID of the team resource or null if an error occurred
   */
  async addResourceToTeam(
    teamId: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<string | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('add_resource_to_team', {
          p_team_id: teamId,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
        });
      
      if (error) {
        logger.error('Error adding resource to team', { error, teamId, resourceType, resourceId });
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error('Error in addResourceToTeam', { error, teamId, resourceType, resourceId });
      return null;
    }
  },
  
  /**
   * Remove a resource from a team
   * 
   * @param teamId - The ID of the team
   * @param resourceType - The type of resource ('project', 'report', etc.)
   * @param resourceId - The ID of the resource
   * @returns True if the resource was removed, false if an error occurred
   */
  async removeResourceFromTeam(
    teamId: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('remove_resource_from_team', {
          p_team_id: teamId,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
        });
      
      if (error) {
        logger.error('Error removing resource from team', { error, teamId, resourceType, resourceId });
        return false;
      }
      
      return data;
    } catch (error) {
      logger.error('Error in removeResourceFromTeam', { error, teamId, resourceType, resourceId });
      return false;
    }
  },
  
  /**
   * Get all resources for a team
   * 
   * @param teamId - The ID of the team
   * @returns An array of team resources or null if an error occurred
   */
  async getTeamResources(teamId: string): Promise<TeamResource[] | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_team_resources', {
          p_team_id: teamId,
        });
      
      if (error) {
        logger.error('Error getting team resources', { error, teamId });
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error('Error in getTeamResources', { error, teamId });
      return null;
    }
  },
  
  /**
   * Get all resources of a specific type for a team
   * 
   * @param teamId - The ID of the team
   * @param resourceType - The type of resource ('project', 'report', etc.)
   * @returns An array of team resources or null if an error occurred
   */
  async getTeamResourcesByType(
    teamId: string,
    resourceType: ResourceType
  ): Promise<TeamResource[] | null> {
    try {
      const resources = await this.getTeamResources(teamId);
      
      if (!resources) {
        return null;
      }
      
      return resources.filter(resource => resource.resource_type === resourceType);
    } catch (error) {
      logger.error('Error in getTeamResourcesByType', { error, teamId, resourceType });
      return null;
    }
  },
  
  /**
   * Check if a resource belongs to a team
   * 
   * @param teamId - The ID of the team
   * @param resourceType - The type of resource ('project', 'report', etc.)
   * @param resourceId - The ID of the resource
   * @returns True if the resource belongs to the team, false otherwise
   */
  async isResourceInTeam(
    teamId: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('team_resources')
        .select('id')
        .eq('team_id', teamId)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return false;
        }
        
        logger.error('Error checking if resource is in team', { error, teamId, resourceType, resourceId });
        return false;
      }
      
      return !!data;
    } catch (error) {
      logger.error('Error in isResourceInTeam', { error, teamId, resourceType, resourceId });
      return false;
    }
  },
  
  /**
   * Get all projects for a team
   * 
   * @param teamId - The ID of the team
   * @returns An array of team resources or null if an error occurred
   */
  async getTeamProjects(teamId: string): Promise<TeamResource[] | null> {
    return this.getTeamResourcesByType(teamId, 'project');
  },
  
  /**
   * Get all reports for a team
   * 
   * @param teamId - The ID of the team
   * @returns An array of team resources or null if an error occurred
   */
  async getTeamReports(teamId: string): Promise<TeamResource[] | null> {
    return this.getTeamResourcesByType(teamId, 'report');
  },
};
