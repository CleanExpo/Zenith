import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/client'
import { Permission, UserRole, ROLE_PERMISSIONS } from './types';
import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * Check if a user has a specific permission (client-side)
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Error getting user:', error);
    return false;
  }
  
  // Call the RPC function to check if the user has the permission
  const { data, error: rpcError } = await supabase.rpc('user_has_permission', {
    p_user_id: user.id,
    p_permission: permission,
  });
  
  if (rpcError) {
    console.error('Error checking permission:', rpcError);
    return false;
  }
  
  return data;
}

/**
 * Check if a user has a specific permission (server-side)
 */
export async function hasPermissionServer(userId: string, permission: Permission): Promise<boolean> {
  const supabase = createServerClient();
  
  // Call the RPC function to check if the user has the permission
  const { data, error } = await supabase.rpc('user_has_permission', {
    p_user_id: userId,
    p_permission: permission,
  });
  
  if (error) {
    console.error('Error checking permission:', error);
    return false;
  }
  
  return data;
}

/**
 * Get all permissions for a user (client-side)
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Error getting user:', error);
    return [];
  }
  
  // Call the RPC function to get all permissions for the user
  const { data, error: rpcError } = await supabase.rpc('get_user_permissions', {
    p_user_id: user.id,
  });
  
  if (rpcError) {
    console.error('Error getting permissions:', rpcError);
    return [];
  }
  
  return data as Permission[];
}

/**
 * Get all permissions for a user (server-side)
 */
export async function getUserPermissionsServer(userId: string): Promise<Permission[]> {
  const supabase = createServerClient();
  
  // Call the RPC function to get all permissions for the user
  const { data, error } = await supabase.rpc('get_user_permissions', {
    p_user_id: userId,
  });
  
  if (error) {
    console.error('Error getting permissions:', error);
    return [];
  }
  
  return data as Permission[];
}

/**
 * Get the user's role (client-side)
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Error getting user:', error);
    return null;
  }
  
  // Get the user's profile
  const { data, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('Error getting user profile:', profileError);
    return null;
  }
  
  return data.role as UserRole;
}

/**
 * Get the user's role (server-side)
 */
export const getUserRoleServer = cache(async (userId: string): Promise<UserRole | null> => {
  const supabase = createServerClient();
  
  // Get the user's profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
  
  return data.role as UserRole;
});

/**
 * Check if a user has a specific role (client-side)
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === role;
}

/**
 * Check if a user has a specific role (server-side)
 */
export async function hasRoleServer(userId: string, role: UserRole): Promise<boolean> {
  const userRole = await getUserRoleServer(userId);
  return userRole === role;
}

/**
 * Check if a user has any of the specified roles (client-side)
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Check if a user has any of the specified roles (server-side)
 */
export async function hasAnyRoleServer(userId: string, roles: UserRole[]): Promise<boolean> {
  const userRole = await getUserRoleServer(userId);
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Create an audit log entry (client-side)
 */
export async function createAuditLog(
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createClient();
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Error getting user:', error);
    return;
  }
  
  // Create the audit log entry
  const { error: insertError } = await supabase
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  
  if (insertError) {
    console.error('Error creating audit log:', insertError);
  }
}

/**
 * Create an audit log entry (server-side)
 */
export async function createAuditLogServer(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createServerClient();
  
  // Create the audit log entry
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  
  if (error) {
    console.error('Error creating audit log:', error);
  }
}

/**
 * Update a user's role (client-side, admin only)
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  // Check if the current user has permission to update users
  const canUpdateUser = await hasPermission(Permission.UPDATE_USER);
  
  if (!canUpdateUser) {
    console.error('Permission denied: Cannot update user role');
    return false;
  }
  
  const supabase = createClient();
  
  // Update the user's role
  const { error } = await supabase
    .from('user_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user role:', error);
    return false;
  }
  
  // Create an audit log entry
  await createAuditLog(
    'update',
    'user_profile',
    userId,
    { role }
  );
  
  return true;
}

/**
 * Update a user's role (server-side, admin only)
 */
export async function updateUserRoleServer(
  adminId: string,
  userId: string,
  role: UserRole
): Promise<boolean> {
  // Check if the admin has permission to update users
  const canUpdateUser = await hasPermissionServer(adminId, Permission.UPDATE_USER);
  
  if (!canUpdateUser) {
    console.error('Permission denied: Cannot update user role');
    return false;
  }
  
  const supabase = createServerClient();
  
  // Update the user's role
  const { error } = await supabase
    .from('user_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user role:', error);
    return false;
  }
  
  // Create an audit log entry
  await createAuditLogServer(
    adminId,
    'update',
    'user_profile',
    userId,
    { role }
  );
  
  return true;
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission);
}
