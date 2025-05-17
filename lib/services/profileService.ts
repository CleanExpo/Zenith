import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications: {
    projectUpdates: boolean;
    securityAlerts: boolean;
    newsletter: boolean;
    teamInvites: boolean;
  };
  displayDensity?: 'compact' | 'comfortable' | 'spacious';
  defaultDashboardView?: 'projects' | 'analytics' | 'teams';
  timezone?: string;
  language?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  preferences?: UserPreferences;
}

export class ProfileService {
  private supabase = createClient();
  private STORAGE_BUCKET = 'profile-pictures';
  
  /**
   * Get the current user's profile
   */
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user) {
        logger.error('Error fetching user:', { error: userError?.message });
        return null;
      }
      
      // Get user preferences from the database if they exist
      const { data: preferencesData, error: preferencesError } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (preferencesError && preferencesError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        logger.error('Error fetching user preferences:', { error: preferencesError.message });
      }
      
      const preferences = preferencesData?.preferences as UserPreferences | undefined;
      
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url,
        preferences
      };
    } catch (error: any) {
      logger.error('Unexpected error fetching profile:', { error: error.message });
      return null;
    }
  }
  
  /**
   * Update the user's profile information
   */
  async updateProfile(fullName: string, avatarUrl?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      });
      
      if (error) {
        logger.error('Profile update error:', { error: error.message });
        return false;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Unexpected error updating profile:', { error: error.message });
      return false;
    }
  }
  
  /**
   * Upload a profile picture to Supabase Storage
   */
  async uploadProfilePicture(file: File, userId: string): Promise<string | null> {
    try {
      // Create a unique file name to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        logger.error('Error uploading profile picture:', { error: error.message });
        return null;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error: any) {
      logger.error('Unexpected error uploading profile picture:', { error: error.message });
      return null;
    }
  }
  
  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: UserPreferences): Promise<boolean> {
    try {
      // Check if preferences record exists
      const { data: existingPrefs, error: checkError } = await this.supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        logger.error('Error checking user preferences:', { error: checkError.message });
        return false;
      }
      
      let result;
      
      if (existingPrefs) {
        // Update existing preferences
        result = await this.supabase
          .from('user_preferences')
          .update({ preferences })
          .eq('user_id', userId);
      } else {
        // Insert new preferences
        result = await this.supabase
          .from('user_preferences')
          .insert({ user_id: userId, preferences });
      }
      
      if (result.error) {
        logger.error('Error updating user preferences:', { error: result.error.message });
        return false;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Unexpected error updating user preferences:', { error: error.message });
      return false;
    }
  }
  
  /**
   * Change the user's password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user) {
        logger.error('Error fetching user for password change:', { error: userError?.message });
        return false;
      }
      
      // Verify current password by signing in
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword,
      });
      
      if (signInError) {
        logger.error('Current password verification failed:', { error: signInError.message });
        return false;
      }
      
      // Update password
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        logger.error('Password update error:', { error: error.message });
        return false;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Unexpected error changing password:', { error: error.message });
      return false;
    }
  }
}

export const profileService = new ProfileService();
