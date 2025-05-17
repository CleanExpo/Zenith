# Role-Based Access Control (RBAC) System

This directory contains the implementation of the Role-Based Access Control (RBAC) system for the Zenith application. The RBAC system provides a flexible and powerful way to manage permissions and access control throughout the application.

## Overview

The RBAC system is built on the following components:

1. **Roles**: Predefined user roles (Admin, Manager, Editor, Viewer, User)
2. **Permissions**: Fine-grained permissions for specific actions
3. **Database Schema**: Tables and relationships for storing roles, permissions, and audit logs
4. **Utility Functions**: Helper functions for checking permissions and roles
5. **React Hooks**: Hooks for using the RBAC system in React components
6. **Components**: React components for conditional rendering based on permissions
7. **Middleware**: Server-side middleware for protecting API routes and pages

## Files

- `types.ts`: Defines the types for roles, permissions, and related entities
- `rbac.ts`: Contains utility functions for checking permissions and roles
- `middleware.ts`: Server-side middleware for protecting API routes
- `README.md`: This documentation file

## Database Schema

The RBAC system uses the following database tables:

- `user_profiles`: Stores user information including their role
- `teams`: Stores team/organization information
- `team_members`: Stores team memberships and roles
- `invitations`: Stores user invitations
- `audit_logs`: Stores audit logs for authentication and authorization events
- `api_keys`: Stores API keys for programmatic access
- `permissions`: Stores custom permissions
- `role_permissions`: Stores role-permission mappings
- `user_permissions`: Stores user-specific permissions
- `team_permissions`: Stores team-specific permissions

The schema is defined in `scripts/supabase/auth/005_create_rbac_schema.sql`.

## Roles and Permissions

The system defines the following roles:

- `ADMIN`: Has all permissions
- `MANAGER`: Can manage projects, reports, teams, and view analytics
- `EDITOR`: Can edit projects, create and edit reports, and view analytics
- `VIEWER`: Can view projects, reports, and analytics
- `USER`: Basic user with limited permissions

Permissions are defined for various actions such as creating, reading, updating, and deleting resources. Each role has a predefined set of permissions, but these can be customized for specific users or teams.

## Usage

### Client-Side

#### React Hooks

```tsx
import { usePermission, useRole, useAnyRole } from '@/hooks/usePermission';
import { Permission, UserRole } from '@/lib/auth/types';

// Check if the user has a specific permission
const { hasAccess, isLoading } = usePermission(Permission.CREATE_PROJECT);

// Check if the user has a specific role
const { hasRole, isLoading } = useRole(UserRole.ADMIN);

// Check if the user has any of the specified roles
const { hasAnyRoles, isLoading } = useAnyRole([UserRole.ADMIN, UserRole.MANAGER]);
```

#### PermissionGuard Component

```tsx
import PermissionGuard from '@/components/auth/PermissionGuard';
import { Permission, UserRole } from '@/lib/auth/types';

// Only render if user has CREATE_PROJECT permission
<PermissionGuard permission={Permission.CREATE_PROJECT}>
  <CreateProjectButton />
</PermissionGuard>

// Only render if user has ADMIN role
<PermissionGuard role={UserRole.ADMIN}>
  <AdminPanel />
</PermissionGuard>

// Only render if user has ADMIN or MANAGER role
<PermissionGuard anyRole={[UserRole.ADMIN, UserRole.MANAGER]}>
  <ManagementPanel />
</PermissionGuard>

// Render fallback if user doesn't have permission
<PermissionGuard 
  permission={Permission.CREATE_PROJECT}
  fallback={<p>You don't have permission to create projects</p>}
>
  <CreateProjectButton />
</PermissionGuard>
```

### Server-Side

#### API Route Protection

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, withRole, withAnyRole } from '@/lib/auth/middleware';
import { Permission, UserRole } from '@/lib/auth/types';

// Protect route with permission
export async function GET(req: NextRequest) {
  return withPermission(req, Permission.READ_PROJECT, async (req, userId) => {
    // Route handler code here
    return NextResponse.json({ success: true });
  });
}

// Protect route with role
export async function POST(req: NextRequest) {
  return withRole(req, UserRole.ADMIN, async (req, userId) => {
    // Route handler code here
    return NextResponse.json({ success: true });
  });
}

// Protect route with any role
export async function PUT(req: NextRequest) {
  return withAnyRole(req, [UserRole.ADMIN, UserRole.MANAGER], async (req, userId) => {
    // Route handler code here
    return NextResponse.json({ success: true });
  });
}
```

#### Audit Logging

```tsx
import { createAuditLogServer } from '@/lib/auth/rbac';

// Create an audit log entry
await createAuditLogServer(
  userId,
  'create',
  'project',
  projectId,
  { name: projectName }
);
```

## Extending the System

### Adding New Roles

To add a new role:

1. Add the role to the `UserRole` enum in `types.ts`
2. Define the permissions for the role in the `ROLE_PERMISSIONS` object in `types.ts`
3. Update the database schema to include the new role in the `user_role` enum

### Adding New Permissions

To add a new permission:

1. Add the permission to the `Permission` enum in `types.ts`
2. Add the permission to the appropriate roles in the `ROLE_PERMISSIONS` object in `types.ts`
3. Insert the permission into the `permissions` table in the database

## Security Considerations

- The RBAC system uses Row-Level Security (RLS) policies to enforce access control at the database level
- Audit logging is used to track authentication and authorization events
- API routes are protected with middleware to ensure proper authorization
- Client-side checks are supplemented with server-side validation to prevent unauthorized access
