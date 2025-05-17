import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export type TeamSetting = {
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
};

export type TeamSettings = Record<string, any>;

/**
 * Service for managing team settings
 */
export const teamSettingsService = {
  /**
   * Get a team setting
   * 
   * @param teamId - The ID of the team
   * @param key - The key of the setting
   * @param defaultValue - The default value to return if the setting is not found
   * @returns The value of the setting or the default value if not found
   */
  async getSetting<T = any>(
    teamId: string,
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_team_setting', {
          p_team_id: teamId,
          p_key: key,
          p_default: defaultValue as any, // Cast to any to avoid type errors
        });
      
      if (error) {
        logger.error('Error getting team setting', { error, teamId, key });
        return defaultValue;
      }
      
      return data as T;
    } catch (error) {
      logger.error('Error in getSetting', { error, teamId, key });
      return defaultValue;
    }
  },
  
  /**
   * Set a team setting
   * 
   * @param teamId - The ID of the team
   * @param key - The key of the setting
   * @param value - The value of the setting
   * @returns True if the setting was set, false if an error occurred
   */
  async setSetting(
    teamId: string,
    key: string,
    value: any
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('set_team_setting', {
          p_team_id: teamId,
          p_key: key,
          p_value: value,
        });
      
      if (error) {
        logger.error('Error setting team setting', { error, teamId, key });
        return false;
      }
      
      return data;
    } catch (error) {
      logger.error('Error in setSetting', { error, teamId, key });
      return false;
    }
  },
  
  /**
   * Delete a team setting
   * 
   * @param teamId - The ID of the team
   * @param key - The key of the setting
   * @returns True if the setting was deleted, false if an error occurred
   */
  async deleteSetting(
    teamId: string,
    key: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('delete_team_setting', {
          p_team_id: teamId,
          p_key: key,
        });
      
      if (error) {
        logger.error('Error deleting team setting', { error, teamId, key });
        return false;
      }
      
      return data;
    } catch (error) {
      logger.error('Error in deleteSetting', { error, teamId, key });
      return false;
    }
  },
  
  /**
   * Get all settings for a team
   * 
   * @param teamId - The ID of the team
   * @returns An object containing all settings for the team or null if an error occurred
   */
  async getAllSettings(teamId: string): Promise<TeamSettings | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_team_settings', {
          p_team_id: teamId,
        });
      
      if (error) {
        logger.error('Error getting all team settings', { error, teamId });
        return null;
      }
      
      // Transform the data into a key-value object
      const settings: TeamSettings = {};
      if (data) {
        for (const setting of data) {
          settings[setting.key] = setting.value;
        }
      }
      
      return settings;
    } catch (error) {
      logger.error('Error in getAllSettings', { error, teamId });
      return null;
    }
  },
};
