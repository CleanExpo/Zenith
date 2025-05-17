// Zenith/components/layout/Footer.tsx
"use client"; // If using client-side hooks or interactivity, otherwise can be server component

import Link from 'next/link';
import { logger } from '@/lib/logger';
import { useEffect } from 'react';

const Footer = () => {
  useEffect(() => {
    logger.info('Footer mounted');
  }, []);

  return (
    <footer className="bg-muted text-muted-foreground border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME || 'Zenith'}. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4">
            <Link href="/privacy-policy" className="text-sm hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-sm hover:text-primary transition-colors">
              Terms of Service
            </Link>
            {/* Add other footer links here */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
