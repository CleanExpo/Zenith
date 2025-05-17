// Authentication and Authorization Types

// User Roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// Permission Types
export enum Permission {
  // Project Permissions
  CREATE_PROJECT = 'create:project',
  READ_PROJECT = 'read:project',
  UPDATE_PROJECT = 'update:project',
  DELETE_PROJECT = 'delete:project',
  
  // Report Permissions
  CREATE_REPORT = 'create:report',
  READ_REPORT = 'read:report',
  UPDATE_REPORT = 'update:report',
  DELETE_REPORT = 'delete:report',
  
  // User Management Permissions
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  
  // Team Management Permissions
  CREATE_TEAM = 'create:team',
  READ_TEAM = 'read:team',
  UPDATE_TEAM = 'update:team',
  DELETE_TEAM = 'delete:team',
  
  // Analytics Permissions
  VIEW_ANALYTICS = 'view:analytics',
  EXPORT_ANALYTICS = 'export:analytics',
  
  // System Permissions
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
}

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission), // Admins have all permissions
  
  [UserRole.MANAGER]: [
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.CREATE_REPORT,
    Permission.READ_REPORT,
    Permission.UPDATE_REPORT,
    Permission.DELETE_REPORT,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.CREATE_TEAM,
    Permission.READ_TEAM,
    Permission.UPDATE_TEAM,
    Permission.DELETE_TEAM,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
  ],
  
  [UserRole.EDITOR]: [
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.CREATE_REPORT,
    Permission.READ_REPORT,
    Permission.UPDATE_REPORT,
    Permission.READ_USER,
    Permission.READ_TEAM,
    Permission.VIEW_ANALYTICS,
  ],
  
  [UserRole.VIEWER]: [
    Permission.READ_PROJECT,
    Permission.READ_REPORT,
    Permission.READ_USER,
    Permission.READ_TEAM,
    Permission.VIEW_ANALYTICS,
  ],
  
  [UserRole.USER]: [
    Permission.READ_PROJECT,
    Permission.READ_REPORT,
    Permission.READ_USER,
    Permission.READ_TEAM,
  ],
};

// User Profile with Role
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

// Team/Organization
export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// Team Member with Role
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// User Invitation
export interface Invitation {
  id: string;
  email: string;
  team_id?: string;
  role: UserRole;
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API Key
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}
