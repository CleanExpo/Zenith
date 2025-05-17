// Zenith/components/layout/Navbar.tsx
"use client"; // If using client-side hooks or interactivity

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { Button } from '@/components/ui/button'; // Example shadcn/ui component
// import { UserNav } from './user-nav'; // Example user menu component
import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
// import { createClient } from '@/lib/supabase/client'; // If needing client-side Supabase

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
  // const supabase = createClient(); // Example client-side Supabase
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder for auth state

  // Placeholder: In a real app, you'd get auth state from Supabase or context
  useEffect(() => {
    // const checkAuth = async () => {
    //   const { data: { session } } = await supabase.auth.getSession();
    //   setIsLoggedIn(!!session);
    // };
    // checkAuth();
    // For now, simulate based on path or a mock value
    if (pathname?.includes('/dashboard')) {
        // setIsLoggedIn(true); // This is just a placeholder logic
    }
    logger.info('Navbar mounted', { pathname });
  }, [pathname]);

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-primary">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Zenith'}
        </Link>
        
        <div className="flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {/* Placeholder for Auth buttons or UserNav component */}
          {/* {isLoggedIn ? (
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
          )} */}
          <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-primary">Login</Link>
          <Link href="/auth/signup" className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">Sign Up</Link>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
