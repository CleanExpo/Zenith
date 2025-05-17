import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { UserRole, Permission } from './types';
import { logger } from '@/lib/logger';

/**
 * Interface for team data
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for team member data
 */
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

/**
 * Interface for team invitation data
 */
export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

/**
 * Get all teams for the current user
 */
export async function getUserTeams(): Promise<Team[]> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }
    
    // Get teams where the user is a member
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team:teams (
          id,
          name,
          description,
          owner_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);
    
    if (error) {
      logger.error('Error fetching user teams', { error });
      return [];
    }
    
    // Transform the data to get the teams
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    const teams: Team[] = [];
    
    // Safely extract team data
    for (const item of data) {
      if (item && item.team && typeof item.team === 'object') {
        // Create a new Team object with the required properties
        const teamData = item.team as any;
        const team: Team = {
          id: teamData.id,
          name: teamData.name,
          description: teamData.description,
          owner_id: teamData.owner_id,
          created_at: teamData.created_at,
          updated_at: teamData.updated_at
        };
        
        // Only add if all required fields are present
        if (team.id && team.name && team.owner_id && team.created_at && team.updated_at) {
          teams.push(team);
        }
      }
    }
    
    return teams;
  } catch (error) {
    logger.error('Error in getUserTeams', { error });
    return [];
  }
}

/**
 * Get a team by ID
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (error) {
      logger.error('Error fetching team', { error, teamId });
      return null;
    }
    
    return data as Team;
  } catch (error) {
    logger.error('Error in getTeam', { error, teamId });
    return null;
  }
}

/**
 * Create a new team
 */
export async function createTeam(name: string, description?: string): Promise<Team | null> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Create the team
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name,
        description,
        owner_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating team', { error, name });
      return null;
    }
    
    // Add the creator as a team member with ADMIN role
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: UserRole.ADMIN,
      });
    
    if (memberError) {
      logger.error('Error adding team member', { error: memberError, teamId: team.id });
      // We don't return null here because the team was created successfully
    }
    
    return team as Team;
  } catch (error) {
    logger.error('Error in createTeam', { error, name });
    return null;
  }
}

/**
 * Update a team
 */
export async function updateTeam(
  teamId: string,
  data: { name?: string; description?: string }
): Promise<Team | null> {
  try {
    const supabase = createClient();
    
    const { data: team, error } = await supabase
      .from('teams')
      .update(data)
      .eq('id', teamId)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating team', { error, teamId });
      return null;
    }
    
    return team as Team;
  } catch (error) {
    logger.error('Error in updateTeam', { error, teamId });
    return null;
  }
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
    
    if (error) {
      logger.error('Error deleting team', { error, teamId });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error in deleteTeam', { error, teamId });
    return false;
  }
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:user_profiles (
          email,
          full_name
        )
      `)
      .eq('team_id', teamId);
    
    if (error) {
      logger.error('Error fetching team members', { error, teamId });
      return [];
    }
    
    // Transform the data to include user email and name
    return data.map(member => ({
      ...member,
      user_email: member.user?.email,
      user_name: member.user?.full_name,
    })) as TeamMember[];
  } catch (error) {
    logger.error('Error in getTeamMembers', { error, teamId });
    return [];
  }
}

/**
 * Add a team member
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: UserRole
): Promise<TeamMember | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Error adding team member', { error, teamId, userId });
      return null;
    }
    
    return data as TeamMember;
  } catch (error) {
    logger.error('Error in addTeamMember', { error, teamId, userId });
    return null;
  }
}

/**
 * Update a team member's role
 */
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: UserRole
): Promise<TeamMember | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating team member role', { error, teamId, userId });
      return null;
    }
    
    return data as TeamMember;
  } catch (error) {
    logger.error('Error in updateTeamMemberRole', { error, teamId, userId });
    return null;
  }
}

/**
 * Remove a team member
 */
export async function removeTeamMember(teamId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Error removing team member', { error, teamId, userId });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error in removeTeamMember', { error, teamId, userId });
    return false;
  }
}

/**
 * Check if the current user is a member of a team
 */
export async function isTeamMember(teamId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error in isTeamMember', { error, teamId });
    return false;
  }
}

/**
 * Check if the current user has a specific role in a team
 */
export async function hasTeamRole(teamId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.role === role;
  } catch (error) {
    logger.error('Error in hasTeamRole', { error, teamId, role });
    return false;
  }
}

/**
 * Check if the current user has any of the specified roles in a team
 */
export async function hasAnyTeamRole(teamId: string, roles: UserRole[]): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return roles.includes(data.role as UserRole);
  } catch (error) {
    logger.error('Error in hasAnyTeamRole', { error, teamId, roles });
    return false;
  }
}

/**
 * Create a team invitation
 */
export async function createTeamInvitation(
  teamId: string,
  email: string,
  role: UserRole
): Promise<TeamInvitation | null> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Set expiration date to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating team invitation', { error, teamId, email });
      return null;
    }
    
    return data as TeamInvitation;
  } catch (error) {
    logger.error('Error in createTeamInvitation', { error, teamId, email });
    return null;
  }
}

/**
 * Get team invitations
 */
export async function getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId);
    
    if (error) {
      logger.error('Error fetching team invitations', { error, teamId });
      return [];
    }
    
    return data as TeamInvitation[];
  } catch (error) {
    logger.error('Error in getTeamInvitations', { error, teamId });
    return [];
  }
}

/**
 * Delete a team invitation
 */
export async function deleteTeamInvitation(invitationId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);
    
    if (error) {
      logger.error('Error deleting team invitation', { error, invitationId });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error in deleteTeamInvitation', { error, invitationId });
    return false;
  }
}

/**
 * Accept a team invitation
 */
export async function acceptTeamInvitation(token: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();
    
    if (invitationError || !invitation) {
      logger.error('Error fetching team invitation', { error: invitationError, token });
      return false;
    }
    
    // Check if the invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      logger.error('Team invitation has expired', { token });
      return false;
    }
    
    // Check if the invitation email matches the user's email
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      logger.error('Error fetching user profile', { error: profileError, userId: user.id });
      return false;
    }
    
    if (profile.email !== invitation.email) {
      logger.error('Invitation email does not match user email', { 
        invitationEmail: invitation.email, 
        userEmail: profile.email 
      });
      return false;
    }
    
    // Add the user to the team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role,
      });
    
    if (memberError) {
      logger.error('Error adding team member', { error: memberError, teamId: invitation.team_id });
      return false;
    }
    
    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitation.id);
    
    if (deleteError) {
      logger.error('Error deleting team invitation', { error: deleteError, invitationId: invitation.id });
      // We don't return false here because the user was added to the team successfully
    }
    
    return true;
  } catch (error) {
    logger.error('Error in acceptTeamInvitation', { error, token });
    return false;
  }
}

/**
 * Check if a user has a specific permission in a team
 * This function is for server-side use
 */
export async function hasTeamPermissionServer(
  userId: string,
  teamId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    // Get the user's role in the team
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (memberError || !member) {
      return false;
    }
    
    // Check if the role has the permission
    const { data: rolePermission, error: permissionError } = await supabase
      .from('role_permissions')
      .select('id')
      .eq('role', member.role)
      .eq('permission', permission)
      .single();
    
    if (permissionError || !rolePermission) {
      // Check if the user has a custom permission
      const { data: userPermission, error: userPermissionError } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('permission', permission)
        .single();
      
      if (userPermissionError || !userPermission) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error in hasTeamPermissionServer', { error, userId, teamId, permission });
    return false;
  }
}

/**
 * Check if a user has a specific role in a team
 * This function is for server-side use
 */
export async function hasTeamRoleServer(
  userId: string,
  teamId: string,
  role: UserRole
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.role === role;
  } catch (error) {
    logger.error('Error in hasTeamRoleServer', { error, userId, teamId, role });
    return false;
  }
}

/**
 * Check if a user has any of the specified roles in a team
 * This function is for server-side use
 */
export async function hasAnyTeamRoleServer(
  userId: string,
  teamId: string,
  roles: UserRole[]
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return roles.includes(data.role as UserRole);
  } catch (error) {
    logger.error('Error in hasAnyTeamRoleServer', { error, userId, teamId, roles });
    return false;
  }
}
