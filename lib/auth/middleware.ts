import { NextRequest, NextResponse } from 'next/server';
import { Permission, UserRole } from './types';
import { hasPermissionServer, hasRoleServer, hasAnyRoleServer } from './rbac';
import { createClient } from '@/lib/supabase/client'

/**
 * Middleware to check if a user has a specific permission
 */
export async function withPermission(
  req: NextRequest,
  permission: Permission,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check if the user has the permission
  const hasPermission = await hasPermissionServer(user.id, permission);
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Call the handler
  return handler(req, user.id);
}

/**
 * Middleware to check if a user has a specific role
 */
export async function withRole(
  req: NextRequest,
  role: UserRole,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check if the user has the role
  const hasRole = await hasRoleServer(user.id, role);
  
  if (!hasRole) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Call the handler
  return handler(req, user.id);
}

/**
 * Middleware to check if a user has any of the specified roles
 */
export async function withAnyRole(
  req: NextRequest,
  roles: UserRole[],
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check if the user has any of the roles
  const hasAnyRole = await hasAnyRoleServer(user.id, roles);
  
  if (!hasAnyRole) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Call the handler
  return handler(req, user.id);
}

/**
 * Middleware to check if a user is authenticated
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Call the handler
  return handler(req, user.id);
}

/**
 * Create an audit log entry for an API request
 */
export async function createApiAuditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createClient();
  
  // Create the audit log entry
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
}
