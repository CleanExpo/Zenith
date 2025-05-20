import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client'
import { withPermission } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/types';
import { logger } from '@/lib/logger';
import { CachePrefix, CacheExpiration, withCache, removeFromCache, removeByPattern } from '@/lib/utils/cacheUtils';

// GET /api/teams - Get all teams for the current user
export async function GET(req: NextRequest) {
  return withPermission(req, Permission.READ_TEAM, async (req, userId) => {
    try {
      // Create a cache key based on the user ID
      const cacheKey = `${CachePrefix.TEAMS}:${userId}`;
      
      // Use the withCache utility to get data from cache or fetch from database
      const teams = await withCache(
        cacheKey,
        async () => {
          logger.info('Fetching teams from database', { userId });
          const supabase = createClient();
          
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
              ),
              role
            `)
            .eq('user_id', userId);
          
          if (error) {
            logger.error('Error fetching teams', { error, userId });
            throw new Error(`Failed to fetch teams: ${error.message}`);
          }
          
          // Transform the data to get the teams with roles
          return data.map(item => ({
            ...item.team,
            role: item.role,
          }));
        },
        CacheExpiration.MEDIUM
      );
      
      return NextResponse.json({ teams });
    } catch (error) {
      logger.error('Error in GET /api/teams', { error });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}

// POST /api/teams - Create a new team
export async function POST(req: NextRequest) {
  return withPermission(req, Permission.CREATE_TEAM, async (req, userId) => {
    try {
      const supabase = createClient();
      
      // Get the request body
      const body = await req.json();
      
      // Validate the request body
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }
      
      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: body.name,
          description: body.description,
          owner_id: userId,
        })
        .select()
        .single();
      
      if (teamError) {
        logger.error('Error creating team', { error: teamError, userId });
        return NextResponse.json(
          { error: 'Failed to create team' },
          { status: 500 }
        );
      }
      
      // Add the creator as a team member with ADMIN role
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'admin',
        });
      
      if (memberError) {
        logger.error('Error adding team member', { error: memberError, teamId: team.id, userId });
        // We don't return an error here because the team was created successfully
      }
      
      // Create an audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'create',
          resource_type: 'team',
          resource_id: team.id,
          metadata: {
            team_name: team.name,
          },
        });
      
      if (auditError) {
        logger.error('Error creating audit log', { error: auditError, teamId: team.id, userId });
        // We don't return an error here because the team was created successfully
      }
      
      // Invalidate the teams cache for this user
      const cacheKey = `${CachePrefix.TEAMS}:${userId}`;
      await removeFromCache(cacheKey);
      logger.info('Invalidated teams cache after creation', { userId, teamId: team.id });
      
      return NextResponse.json({ team }, { status: 201 });
    } catch (error) {
      logger.error('Error in POST /api/teams', { error });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}

