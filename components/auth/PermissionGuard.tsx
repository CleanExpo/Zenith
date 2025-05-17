'use client';

import { ReactNode } from 'react';
import { Permission, UserRole } from '@/lib/auth/types';
import { usePermission, useRole, useAnyRole } from '@/hooks/usePermission';

interface PermissionGuardProps {
  permission?: Permission;
  role?: UserRole;
  anyRole?: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions or roles.
 * 
 * @example
 * // Only render if user has CREATE_PROJECT permission
 * <PermissionGuard permission={Permission.CREATE_PROJECT}>
 *   <CreateProjectButton />
 * </PermissionGuard>
 * 
 * @example
 * // Only render if user has ADMIN role
 * <PermissionGuard role={UserRole.ADMIN}>
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Only render if user has ADMIN or MANAGER role
 * <PermissionGuard anyRole={[UserRole.ADMIN, UserRole.MANAGER]}>
 *   <ManagementPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Render fallback if user doesn't have permission
 * <PermissionGuard 
 *   permission={Permission.CREATE_PROJECT}
 *   fallback={<p>You don't have permission to create projects</p>}
 * >
 *   <CreateProjectButton />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  role,
  anyRole,
  fallback = null,
  children,
}: PermissionGuardProps) {
  // Check if user has permission
  const permissionCheck = permission
    ? usePermission(permission)
    : { hasAccess: true, isLoading: false };
  
  // Check if user has role
  const roleCheck = role
    ? useRole(role)
    : { hasRole: true, isLoading: false };
  
  // Check if user has any of the specified roles
  const anyRoleCheck = anyRole
    ? useAnyRole(anyRole)
    : { hasAnyRoles: true, isLoading: false };
  
  // Show loading state
  if (permissionCheck.isLoading || roleCheck.isLoading || anyRoleCheck.isLoading) {
    return null;
  }
  
  // Check if user has access
  const hasAccess = permissionCheck.hasAccess && roleCheck.hasRole && anyRoleCheck.hasAnyRoles;
  
  // Render children if user has access, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
