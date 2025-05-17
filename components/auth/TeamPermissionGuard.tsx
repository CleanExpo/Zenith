'use client';

import { ReactNode } from 'react';
import { UserRole, Permission } from '@/lib/auth/types';
import { useTeamPermission, useTeamRole, useAnyTeamRole, useTeamMembership } from '@/hooks/useTeamPermission';
import { Loader2 } from 'lucide-react';

interface TeamPermissionGuardProps {
  teamId: string;
  children: ReactNode;
  fallback?: ReactNode;
  permission?: Permission;
  role?: UserRole;
  anyRole?: UserRole[];
  memberOnly?: boolean;
  loadingFallback?: ReactNode;
}

/**
 * A component that conditionally renders its children based on team permissions
 * 
 * @param teamId - The ID of the team to check permissions for
 * @param children - The content to render if the user has the required permissions
 * @param fallback - The content to render if the user does not have the required permissions
 * @param permission - The permission to check for
 * @param role - The role to check for
 * @param anyRole - An array of roles to check for (user must have at least one)
 * @param memberOnly - If true, only check if the user is a member of the team
 * @param loadingFallback - The content to render while checking permissions
 */
export default function TeamPermissionGuard({
  teamId,
  children,
  fallback = null,
  permission,
  role,
  anyRole,
  memberOnly = false,
  loadingFallback = <DefaultLoadingFallback />,
}: TeamPermissionGuardProps) {
  // Check if the user is a member of the team
  const { isMember, isLoading: isMemberLoading } = useTeamMembership(teamId);
  
  // Check if the user has the specified permission
  const { hasAccess, isLoading: hasPermissionLoading } = permission
    ? useTeamPermission(teamId, permission)
    : { hasAccess: false, isLoading: false };
  
  // Check if the user has the specified role
  const { hasRole, isLoading: hasRoleLoading } = role
    ? useTeamRole(teamId, role)
    : { hasRole: false, isLoading: false };
  
  // Check if the user has any of the specified roles
  const { hasAnyRoles, isLoading: hasAnyRolesLoading } = anyRole
    ? useAnyTeamRole(teamId, anyRole)
    : { hasAnyRoles: false, isLoading: false };
  
  // Determine if we're still loading
  const isLoading = isMemberLoading || 
                   (permission && hasPermissionLoading) || 
                   (role && hasRoleLoading) || 
                   (anyRole && hasAnyRolesLoading);
  
  // If we're still loading, show the loading fallback
  if (isLoading) {
    return <>{loadingFallback}</>;
  }
  
  // If the user is not a member of the team, show the fallback
  if (!isMember) {
    return <>{fallback}</>;
  }
  
  // If we're only checking for membership, show the children
  if (memberOnly) {
    return <>{children}</>;
  }
  
  // Check if the user has the required permission or role
  const hasPermission = permission ? hasAccess : true;
  const hasRequiredRole = role ? hasRole : true;
  const hasRequiredAnyRole = anyRole ? hasAnyRoles : true;
  
  // If the user has the required permission and role, show the children
  if (hasPermission && hasRequiredRole && hasRequiredAnyRole) {
    return <>{children}</>;
  }
  
  // Otherwise, show the fallback
  return <>{fallback}</>;
}

function DefaultLoadingFallback() {
  return (
    <div className="flex justify-center items-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
