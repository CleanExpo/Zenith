// Zenith/components/layout/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import UserNav from './user-nav';
import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isDevelopmentEnvironment } from '@/lib/utils/auth';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { SearchInput } from '@/components/ui/search-input';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  // Add other navigation items here
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const isDev = isDevelopmentEnvironment();

  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // In development, always show as logged in for easier testing
        if (isDev) {
          setIsLoggedIn(true);
          logger.info('Development mode: User shown as logged in');
          return;
        }
        
        setIsLoggedIn(!!session);
        logger.info('Auth state updated', { isLoggedIn: !!session });
      } catch (error) {
        logger.error('Error checking auth in Navbar', { error });
        // In development, default to logged in even on error
        if (isDev) {
          setIsLoggedIn(true);
        }
      }
    };
    
    checkAuth();
  }, [pathname, supabase, isDev]);

  return (
    <nav className="bg-background border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl text-primary mr-8">
            {process.env.NEXT_PUBLIC_APP_NAME || 'Zenith'}
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`) 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <SearchInput 
            placeholder="Search..." 
            onSearch={(query) => {
              if (query) {
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
          />
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          {mounted && <ModeToggle />}
          
          {/* Notifications */}
          {(isLoggedIn || isDev) && (
            <NotificationsPopover />
          )}
          
          {/* Auth buttons or UserNav component */}
          {isLoggedIn || isDev ? (
            <UserNav />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
