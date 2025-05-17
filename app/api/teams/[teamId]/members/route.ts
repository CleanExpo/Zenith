import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withTeamPermission, withTeamRole } from '@/lib/auth/teamMiddleware';
import { Permission, UserRole } from '@/lib/auth/types';
import { logger } from '@/lib/logger';
import { CachePrefix, CacheExpiration, withCache, removeFromCache } from '@/lib/utils/cacheUtils';

// GET /api/teams/[teamId]/members - Get all members of a team
export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params;
  
  return withTeamPermission(req, teamId, Permission.READ_TEAM, async (req, userId, teamId) => {
    try {
      // Create a cache key based on the team ID
      const cacheKey = `${CachePrefix.TEAM_MEMBERS}:${teamId}`;
      
      // Use the withCache utility to get data from cache or fetch from database
      const members = await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching team members from database', { teamId });
          const supabase = createClient();
          
          // Get team members
          const { data, error } = await supabase
            .from('team_members')
            .select(`
              id,
              user_id,
              role,
              created_at,
              updated_at,
              user:user_profiles (
                email,
                full_name,
                avatar_url
              )
            `)
            .eq('team_id', teamId);
          
          if (error) {
            logger.error('Error fetching team members', { error, teamId });
            throw new Error(`Failed to fetch team members: ${error.message}`);
          }
          
          // Transform the data to include user information
          return data.map(member => {
            const user = member.user as { email?: string; full_name?: string; avatar_url?: string } | null;
            return {
              id: member.id,
              user_id: member.user_id,
              role: member.role,
              created_at: member.created_at,
              updated_at: member.updated_at,
              email: user?.email,
              full_name: user?.full_name,
              avatar_url: user?.avatar_url,
            };
          });
        },
        CacheExpiration.MEDIUM
      );
      
      return NextResponse.json({ members });
    } catch (error) {
      logger.error('Error in GET /api/teams/[teamId]/members', { error, teamId });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}

// POST /api/teams/[teamId]/members - Add a new member to a team
export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params;
  
  return withTeamRole(req, teamId, UserRole.ADMIN, async (req, userId, teamId) => {
    try {
      const supabase = createClient();
      
      // Get the request body
      const body = await req.json();
      
      // Validate the request body
      if (!body.user_id || typeof body.user_id !== 'string') {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }
      
      if (!body.role || !Object.values(UserRole).includes(body.role)) {
        return NextResponse.json(
          { error: 'Valid role is required' },
          { status: 400 }
        );
      }
      
      // Check if the user exists
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', body.user_id)
        .single();
      
      if (userError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Check if the user is already a member of the team
      const { data: existingMember, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', body.user_id)
        .single();
      
      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of the team' },
          { status: 409 }
        );
      }
      
      // Add the user to the team
      const { data: member, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: body.user_id,
          role: body.role,
        })
        .select()
        .single();
      
      if (error) {
        logger.error('Error adding team member', { error, teamId, userId: body.user_id });
        return NextResponse.json(
          { error: 'Failed to add team member' },
          { status: 500 }
        );
      }
      
      // Create an audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'add_member',
          resource_type: 'team',
          resource_id: teamId,
          metadata: {
            member_id: body.user_id,
            role: body.role,
          },
        });
      
      if (auditError) {
        logger.error('Error creating audit log', { error: auditError, teamId, userId });
        // We don't return an error here because the member was added successfully
      }
      
      // Invalidate the team members cache
      const cacheKey = `${CachePrefix.TEAM_MEMBERS}:${teamId}`;
      await removeFromCache(cacheKey);
      logger.info('Invalidated team members cache after adding member', { teamId, memberId: member.id });
      
      return NextResponse.json({ member }, { status: 201 });
    } catch (error) {
      logger.error('Error in POST /api/teams/[teamId]/members', { error, teamId });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/teams/[teamId]/members/[memberId] - Remove a member from a team
export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  const { teamId } = params;
  const url = new URL(req.url);
  const memberId = url.pathname.split('/').pop();
  
  if (!memberId) {
    return NextResponse.json(
      { error: 'Member ID is required' },
      { status: 400 }
    );
  }
  
  return withTeamRole(req, teamId, UserRole.ADMIN, async (req, userId, teamId) => {
    try {
      const supabase = createClient();
      
      // Get the member to be removed
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', memberId)
        .eq('team_id', teamId)
        .single();
      
      if (memberError || !member) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }
      
      // Check if the member is the team owner
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('owner_id')
        .eq('id', teamId)
        .single();
      
      if (teamError || !team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      if (member.user_id === team.owner_id) {
        return NextResponse.json(
          { error: 'Cannot remove the team owner' },
          { status: 403 }
        );
      }
      
      // Remove the member from the team
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', teamId);
      
      if (error) {
        logger.error('Error removing team member', { error, teamId, memberId });
        return NextResponse.json(
          { error: 'Failed to remove team member' },
          { status: 500 }
        );
      }
      
      // Create an audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'remove_member',
          resource_type: 'team',
          resource_id: teamId,
          metadata: {
            member_id: member.user_id,
          },
        });
      
      if (auditError) {
        logger.error('Error creating audit log', { error: auditError, teamId, userId });
        // We don't return an error here because the member was removed successfully
      }
      
      // Invalidate the team members cache
      const cacheKey = `${CachePrefix.TEAM_MEMBERS}:${teamId}`;
      await removeFromCache(cacheKey);
      logger.info('Invalidated team members cache after removing member', { teamId, memberId });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Error in DELETE /api/teams/[teamId]/members/[memberId]', { error, teamId, memberId });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}

// PATCH /api/teams/[teamId]/members/[memberId] - Update a team member's role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  const { teamId } = params;
  const url = new URL(req.url);
  const memberId = url.pathname.split('/').pop();
  
  if (!memberId) {
    return NextResponse.json(
      { error: 'Member ID is required' },
      { status: 400 }
    );
  }
  
  return withTeamRole(req, teamId, UserRole.ADMIN, async (req, userId, teamId) => {
    try {
      const supabase = createClient();
      
      // Get the request body
      const body = await req.json();
      
      // Validate the request body
      if (!body.role || !Object.values(UserRole).includes(body.role)) {
        return NextResponse.json(
          { error: 'Valid role is required' },
          { status: 400 }
        );
      }
      
      // Get the member to be updated
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', memberId)
        .eq('team_id', teamId)
        .single();
      
      if (memberError || !member) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }
      
      // Check if the member is the team owner
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('owner_id')
        .eq('id', teamId)
        .single();
      
      if (teamError || !team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      if (member.user_id === team.owner_id && body.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Cannot change the role of the team owner' },
          { status: 403 }
        );
      }
      
      // Update the member's role
      const { data: updatedMember, error } = await supabase
        .from('team_members')
        .update({ role: body.role })
        .eq('id', memberId)
        .eq('team_id', teamId)
        .select()
        .single();
      
      if (error) {
        logger.error('Error updating team member role', { error, teamId, memberId });
        return NextResponse.json(
          { error: 'Failed to update team member role' },
          { status: 500 }
        );
      }
      
      // Create an audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'update_member_role',
          resource_type: 'team',
          resource_id: teamId,
          metadata: {
            member_id: member.user_id,
            role: body.role,
          },
        });
      
      if (auditError) {
        logger.error('Error creating audit log', { error: auditError, teamId, userId });
        // We don't return an error here because the member was updated successfully
      }
      
      // Invalidate the team members cache
      const cacheKey = `${CachePrefix.TEAM_MEMBERS}:${teamId}`;
      await removeFromCache(cacheKey);
      logger.info('Invalidated team members cache after updating member role', { teamId, memberId });
      
      return NextResponse.json({ member: updatedMember });
    } catch (error) {
      logger.error('Error in PATCH /api/teams/[teamId]/members/[memberId]', { error, teamId, memberId });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}
