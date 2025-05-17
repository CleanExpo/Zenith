import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserRole, Permission } from '@/lib/auth/types';
import { hasTeamPermissionServer, hasTeamRoleServer, hasAnyTeamRoleServer } from '@/lib/auth/teams';
import { logger } from '@/lib/logger';

type RouteHandler = (
  req: NextRequest,
  userId: string,
  teamId: string
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware to protect API routes based on team permissions
 * 
 * @param req - The NextRequest object
 * @param teamId - The ID of the team to check permissions for
 * @param permission - The permission to check for
 * @param handler - The route handler to execute if the user has the required permission
 * @returns A NextResponse object
 */
export async function withTeamPermission(
  req: NextRequest,
  teamId: string,
  permission: Permission,
  handler: RouteHandler
): Promise<NextResponse> {
  try {
    const supabase = createClient();
    
    // Get the user from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if the user has the required permission
    const hasPermission = await hasTeamPermissionServer(userId, teamId, permission);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Execute the route handler
    return handler(req, userId, teamId);
  } catch (error) {
    logger.error('Error in withTeamPermission middleware', { error, teamId, permission });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to protect API routes based on team roles
 * 
 * @param req - The NextRequest object
 * @param teamId - The ID of the team to check roles for
 * @param role - The role to check for
 * @param handler - The route handler to execute if the user has the required role
 * @returns A NextResponse object
 */
export async function withTeamRole(
  req: NextRequest,
  teamId: string,
  role: UserRole,
  handler: RouteHandler
): Promise<NextResponse> {
  try {
    const supabase = createClient();
    
    // Get the user from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if the user has the required role
    const hasRole = await hasTeamRoleServer(userId, teamId, role);
    
    if (!hasRole) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Execute the route handler
    return handler(req, userId, teamId);
  } catch (error) {
    logger.error('Error in withTeamRole middleware', { error, teamId, role });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to protect API routes based on team roles
 * 
 * @param req - The NextRequest object
 * @param teamId - The ID of the team to check roles for
 * @param roles - The roles to check for (user must have at least one)
 * @param handler - The route handler to execute if the user has any of the required roles
 * @returns A NextResponse object
 */
export async function withAnyTeamRole(
  req: NextRequest,
  teamId: string,
  roles: UserRole[],
  handler: RouteHandler
): Promise<NextResponse> {
  try {
    const supabase = createClient();
    
    // Get the user from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if the user has any of the required roles
    const hasAnyRole = await hasAnyTeamRoleServer(userId, teamId, roles);
    
    if (!hasAnyRole) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Execute the route handler
    return handler(req, userId, teamId);
  } catch (error) {
    logger.error('Error in withAnyTeamRole middleware', { error, teamId, roles });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to protect API routes based on team membership
 * 
 * @param req - The NextRequest object
 * @param teamId - The ID of the team to check membership for
 * @param handler - The route handler to execute if the user is a member of the team
 * @returns A NextResponse object
 */
export async function withTeamMembership(
  req: NextRequest,
  teamId: string,
  handler: RouteHandler
): Promise<NextResponse> {
  try {
    const supabase = createClient();
    
    // Get the user from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if the user is a member of the team
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Execute the route handler
    return handler(req, userId, teamId);
  } catch (error) {
    logger.error('Error in withTeamMembership middleware', { error, teamId });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Extract the team ID from the request URL
 * 
 * @param req - The NextRequest object
 * @param paramName - The name of the parameter containing the team ID (default: 'teamId')
 * @returns The team ID or null if not found
 */
export function getTeamIdFromRequest(req: NextRequest, paramName: string = 'teamId'): string | null {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  
  // Find the index of the parameter name in the path
  const paramIndex = pathParts.findIndex(part => part === paramName);
  
  // If the parameter name is found and there's a value after it, return the value
  if (paramIndex !== -1 && paramIndex < pathParts.length - 1) {
    return pathParts[paramIndex + 1];
  }
  
  // Check if the parameter is in the query string
  const queryParams = url.searchParams;
  const queryValue = queryParams.get(paramName);
  
  if (queryValue) {
    return queryValue;
  }
  
  return null;
}
