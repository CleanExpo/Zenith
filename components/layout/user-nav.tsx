// Zenith/components/layout/user-nav.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@/lib/auth/types';
import PermissionGuard from '@/components/auth/PermissionGuard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getMockUserId } from '@/lib/utils/auth';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function UserNav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // For development, use mock user if no session
        if (!session) {
          const mockEmail = process.env.NEXT_PUBLIC_AUTHORITY_EMAIL || 'user@example.com';
          setUserEmail(mockEmail);
          setUserName(mockEmail.split('@')[0]);
          logger.info('Using mock user for UserNav', { email: mockEmail });
          return;
        }
        
        setUserEmail(session.user?.email || null);
        setUserName(session.user?.email?.split('@')[0] || 'User');
      } catch (error) {
        logger.error('Error getting user session in UserNav', { error });
        // Fallback to mock user
        const mockEmail = process.env.NEXT_PUBLIC_AUTHORITY_EMAIL || 'user@example.com';
        setUserEmail(mockEmail);
        setUserName(mockEmail.split('@')[0]);
      }
    };
    
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logger.info('User logged out');
      window.location.href = '/'; // Redirect to home page
    } catch (error) {
      logger.error('Error signing out', { error });
    }
  };

  // Always show the user nav in development, even without a session
  const userInitials = userName ? userName.substring(0, 2).toUpperCase() : 'U';
  const displayName = userName || 'User';
  const displayEmail = userEmail || 'user@example.com';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt={displayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/analytics">Analytics</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/teams">Teams</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/projects/new">New Project</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          
          {/* Admin section - only visible to admins */}
          <PermissionGuard role={UserRole.ADMIN}>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/users">User Management</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/audit-logs">Audit Logs</Link>
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
