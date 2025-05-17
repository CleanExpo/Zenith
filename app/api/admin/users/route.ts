import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import { UserRole, Permission } from '@/lib/auth/types';
import { createClient } from '@/lib/supabase/server';
import { updateUserRoleServer, createAuditLogServer } from '@/lib/auth/rbac';

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET(req: NextRequest) {
  return withRole(req, UserRole.ADMIN, async (req, userId) => {
    const supabase = createClient();
    
    // Get all users
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to get users' },
        { status: 500 }
      );
    }
    
    // Create audit log
    await createAuditLogServer(
      userId,
      'read',
      'user_profiles',
      undefined,
      { count: data.length }
    );
    
    return NextResponse.json({ users: data });
  });
}

/**
 * POST /api/admin/users
 * Update a user's role (admin only)
 */
export async function POST(req: NextRequest) {
  return withRole(req, UserRole.ADMIN, async (req, adminId) => {
    try {
      const { userId, role } = await req.json();
      
      if (!userId || !role) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Check if the role is valid
      if (!Object.values(UserRole).includes(role as UserRole)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      
      // Update the user's role
      const success = await updateUserRoleServer(
        adminId,
        userId,
        role as UserRole
      );
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/admin/users
 * Delete a user (admin only)
 */
export async function DELETE(req: NextRequest) {
  return withRole(req, UserRole.ADMIN, async (req, adminId) => {
    try {
      const { userId } = await req.json();
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      const supabase = createClient();
      
      // Delete the user
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 500 }
        );
      }
      
      // Create audit log
      await createAuditLogServer(
        adminId,
        'delete',
        'user',
        userId
      );
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  });
}
