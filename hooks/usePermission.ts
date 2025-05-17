import { useState, useEffect } from 'react';
import { Permission } from '@/lib/auth/types';
import { hasPermission, hasRole as checkRole, hasAnyRole as checkAnyRole } from '@/lib/auth/rbac';
import { UserRole } from '@/lib/auth/types';

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permission: Permission) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await hasPermission(permission);
        setHasAccess(result);
      } catch (error) {
        console.error(`Error checking permission ${permission}:`, error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPermission();
  }, [permission]);
  
  return { hasAccess, isLoading };
}

/**
 * Hook to check if the current user has a specific role
 */
export function useRole(role: UserRole) {
  const [hasRole, setHasRole] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const result = await checkRole(role);
        setHasRole(result);
      } catch (error) {
        console.error(`Error checking role ${role}:`, error);
        setHasRole(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserRole();
  }, [role]);
  
  return { hasRole, isLoading };
}

/**
 * Hook to check if the current user has any of the specified roles
 */
export function useAnyRole(roles: UserRole[]) {
  const [hasAnyRoles, setHasAnyRoles] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkUserRoles = async () => {
      try {
        const result = await checkAnyRole(roles);
        setHasAnyRoles(result);
      } catch (error) {
        console.error(`Error checking roles ${roles.join(', ')}:`, error);
        setHasAnyRoles(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserRoles();
  }, [roles]);
  
  return { hasAnyRoles, isLoading };
}
