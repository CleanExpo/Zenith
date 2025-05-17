import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRole, Permission } from '@/lib/auth/types';
import { isTeamMember, hasTeamRole, hasAnyTeamRole } from '@/lib/auth/teams';
import { logger } from '@/lib/logger';

/**
 * Hook to check if the current user has a specific permission in a team
 */
export function useTeamPermission(teamId: string, permission: Permission) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setIsLoading(true);
        
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setHasAccess(false);
          return;
        }
        
        // First check if the user is a member of the team
        const isMember = await isTeamMember(teamId);
        
        if (!isMember) {
          setHasAccess(false);
          return;
        }
        
        // Check if the user has the ADMIN role, which has all permissions
        const isAdmin = await hasTeamRole(teamId, UserRole.ADMIN);
        
        if (isAdmin) {
          setHasAccess(true);
          return;
        }
        
        // Check if the user has a role that has the permission
        // This is a simplified implementation. In a real application,
        // you would check the role_permissions table in the database.
        const { data: userProfile } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();
        
        if (!userProfile) {
          setHasAccess(false);
          return;
        }
        
        const role = userProfile.role as UserRole;
        
        // Check if the role has the permission
        // This is a simplified implementation. In a real application,
        // you would check the role_permissions table in the database.
        switch (role) {
          case UserRole.ADMIN:
            // Admin has all permissions
            setHasAccess(true);
            break;
          case UserRole.MANAGER:
            // Manager has most permissions except some admin-only ones
            setHasAccess(permission !== Permission.MANAGE_SETTINGS && 
                         permission !== Permission.VIEW_AUDIT_LOGS);
            break;
          case UserRole.EDITOR:
            // Editor has edit permissions but not management permissions
            setHasAccess(permission === Permission.CREATE_PROJECT || 
                         permission === Permission.READ_PROJECT || 
                         permission === Permission.UPDATE_PROJECT || 
                         permission === Permission.CREATE_REPORT || 
                         permission === Permission.READ_REPORT || 
                         permission === Permission.UPDATE_REPORT);
            break;
          case UserRole.VIEWER:
            // Viewer has only read permissions
            setHasAccess(permission === Permission.READ_PROJECT || 
                         permission === Permission.READ_REPORT);
            break;
          default:
            setHasAccess(false);
        }
      } catch (err) {
        logger.error('Error checking team permission', { error: err, teamId, permission });
        setError(err as Error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPermission();
  }, [teamId, permission]);

  return { hasAccess, isLoading, error };
}

/**
 * Hook to check if the current user has a specific role in a team
 */
export function useTeamRole(teamId: string, role: UserRole) {
  const [hasRole, setHasRole] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        setIsLoading(true);
        const result = await hasTeamRole(teamId, role);
        setHasRole(result);
      } catch (err) {
        logger.error('Error checking team role', { error: err, teamId, role });
        setError(err as Error);
        setHasRole(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkRole();
  }, [teamId, role]);

  return { hasRole, isLoading, error };
}

/**
 * Hook to check if the current user has any of the specified roles in a team
 */
export function useAnyTeamRole(teamId: string, roles: UserRole[]) {
  const [hasAnyRoles, setHasAnyRoles] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkRoles = async () => {
      try {
        setIsLoading(true);
        const result = await hasAnyTeamRole(teamId, roles);
        setHasAnyRoles(result);
      } catch (err) {
        logger.error('Error checking team roles', { error: err, teamId, roles });
        setError(err as Error);
        setHasAnyRoles(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkRoles();
  }, [teamId, roles]);

  return { hasAnyRoles, isLoading, error };
}

/**
 * Hook to check if the current user is a member of a team
 */
export function useTeamMembership(teamId: string) {
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        setIsLoading(true);
        const result = await isTeamMember(teamId);
        setIsMember(result);
      } catch (err) {
        logger.error('Error checking team membership', { error: err, teamId });
        setError(err as Error);
        setIsMember(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkMembership();
  }, [teamId]);

  return { isMember, isLoading, error };
}
