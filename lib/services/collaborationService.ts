import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface Collaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by?: string;
  invitation_status: 'pending' | 'accepted' | 'declined';
  invitation_email?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string;
  project_id?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  project?: {
    id: string;
    title: string;
  };
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export class CollaborationService {
  private supabase = createClient();

  /**
   * Get collaborators for a project
   */
  async getProjectCollaborators(projectId: string): Promise<Collaborator[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_collaborators')
        .select('*, user_id')
        .eq('project_id', projectId);

      if (error) {
        throw error;
      }

      // If we have user IDs, fetch user details separately
      if (data && data.length > 0) {
        const userIds = data
          .filter(collab => collab.user_id)
          .map(collab => collab.user_id);

        if (userIds.length > 0) {
          const { data: userData, error: userError } = await this.supabase
            .from('auth.users')
            .select('id, email, raw_user_meta_data')
            .in('id', userIds);

          if (!userError && userData) {
            // Merge user data with collaborator data
            return data.map(collab => {
              const user = userData.find(u => u.id === collab.user_id);
              return {
                ...collab,
                user: user ? {
                  id: user.id,
                  email: user.email,
                  display_name: user.raw_user_meta_data?.display_name,
                  avatar_url: user.raw_user_meta_data?.avatar_url
                } : undefined
              };
            });
          }
        }
      }

      return data || [];
    } catch (error: any) {
      logger.error('Error getting project collaborators', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Invite a user to collaborate on a project
   */
  async inviteUserToProject(projectId: string, email: string, role: 'editor' | 'viewer' = 'viewer'): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('invite_user_to_project', {
        p_project_id: projectId,
        p_email: email,
        p_role: role
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error inviting user to project', { error: error.message, projectId, email });
      throw error;
    }
  }

  /**
   * Accept a project invitation
   */
  async acceptProjectInvitation(invitationToken: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('accept_project_invitation', {
        p_invitation_token: invitationToken
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error accepting project invitation', { error: error.message, invitationToken });
      throw error;
    }
  }

  /**
   * Decline a project invitation
   */
  async declineProjectInvitation(invitationToken: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('decline_project_invitation', {
        p_invitation_token: invitationToken
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error declining project invitation', { error: error.message, invitationToken });
      throw error;
    }
  }

  /**
   * Remove a collaborator from a project
   */
  async removeProjectCollaborator(projectId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('remove_project_collaborator', {
        p_project_id: projectId,
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error removing project collaborator', { error: error.message, projectId, userId });
      throw error;
    }
  }

  /**
   * Update a collaborator's role
   */
  async updateCollaboratorRole(projectId: string, userId: string, newRole: 'editor' | 'viewer'): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('update_collaborator_role', {
        p_project_id: projectId,
        p_user_id: userId,
        p_new_role: newRole
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error updating collaborator role', { error: error.message, projectId, userId, newRole });
      throw error;
    }
  }

  /**
   * Get activity logs for a project
   */
  async getProjectActivityLogs(projectId: string, limit: number = 20, offset: number = 0): Promise<ActivityLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('activity_logs')
        .select(`
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data->display_name as display_name,
            raw_user_meta_data->avatar_url as avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      logger.error('Error getting project activity logs', { error: error.message, projectId });
      throw error;
    }
  }

  /**
   * Get notifications for the current user
   */
  async getUserNotifications(limit: number = 20, offset: number = 0, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let query = this.supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id (
            id,
            email,
            raw_user_meta_data->display_name as display_name,
            raw_user_meta_data->avatar_url as avatar_url
          ),
          project:project_id (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      logger.error('Error getting user notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('Error marking notification as read', { error: error.message, notificationId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('Error marking all notifications as read', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('Error deleting notification', { error: error.message, notificationId });
      throw error;
    }
  }

  /**
   * Add a comment to an entity (project, task, note, file)
   */
  async addComment(projectId: string, entityType: string, entityId: string, content: string, parentId?: string): Promise<Comment> {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .insert({
          project_id: projectId,
          entity_type: entityType,
          entity_id: entityId,
          content,
          parent_id: parentId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error adding comment', { error: error.message, projectId, entityType, entityId });
      throw error;
    }
  }

  /**
   * Get comments for an entity
   */
  async getComments(projectId: string, entityType: string, entityId: string): Promise<Comment[]> {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data->display_name as display_name,
            raw_user_meta_data->avatar_url as avatar_url
          )
        `)
        .eq('project_id', projectId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies, error: repliesError } = await this.supabase
            .from('comments')
            .select(`
              *,
              user:user_id (
                id,
                email,
                raw_user_meta_data->display_name as display_name,
                raw_user_meta_data->avatar_url as avatar_url
              )
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          if (repliesError) {
            logger.error('Error getting comment replies', { error: repliesError.message, commentId: comment.id });
            return { ...comment, replies: [] };
          }

          return { ...comment, replies: replies || [] };
        })
      );

      return commentsWithReplies;
    } catch (error: any) {
      logger.error('Error getting comments', { error: error.message, projectId, entityType, entityId });
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error updating comment', { error: error.message, commentId });
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('Error deleting comment', { error: error.message, commentId });
      throw error;
    }
  }

  /**
   * Create a team
   */
  async createTeam(name: string, description?: string): Promise<Team> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .insert({
          name,
          description
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error creating team', { error: error.message, name });
      throw error;
    }
  }

  /**
   * Get teams for the current user
   */
  async getUserTeams(): Promise<Team[]> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .select(`
          *,
          members:team_members (
            *,
            user:user_id (
              id,
              email,
              raw_user_meta_data->display_name as display_name,
              raw_user_meta_data->avatar_url as avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      logger.error('Error getting user teams', { error: error.message });
      throw error;
    }
  }

  /**
   * Add a member to a team
   */
  async addTeamMember(teamId: string, email: string): Promise<TeamMember> {
    try {
      // First, get the user ID from the email
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) {
        throw userError;
      }

      const { data, error } = await this.supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userData.id,
          role: 'member'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      logger.error('Error adding team member', { error: error.message, teamId, email });
      throw error;
    }
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('Error removing team member', { error: error.message, teamId, userId });
      throw error;
    }
  }

  /**
   * Get pending invitations for the current user
   */
  async getPendingInvitations(): Promise<Collaborator[]> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('project_collaborators')
        .select(`
          *,
          project:project_id (
            id,
            title,
            description
          ),
          inviter:invited_by (
            id,
            email,
            raw_user_meta_data->display_name as display_name,
            raw_user_meta_data->avatar_url as avatar_url
          )
        `)
        .eq('invitation_email', user.user.email)
        .eq('invitation_status', 'pending')
        .gt('invitation_expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      logger.error('Error getting pending invitations', { error: error.message });
      throw error;
    }
  }
}

export const collaborationService = new CollaborationService();
