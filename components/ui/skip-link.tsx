'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  contentId?: string;
}

/**
 * A skip link component that allows keyboard users to bypass navigation
 * and jump directly to the main content.
 * 
 * This component is hidden by default and becomes visible when focused,
 * making it accessible to keyboard and screen reader users while remaining
 * invisible to mouse users.
 */
export function SkipLink({
  className,
  contentId = 'main-content',
  children = 'Skip to content',
  ...props
}: SkipLinkProps) {
  return (
    <a
      href={`#${contentId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:h-auto focus:w-auto',
        'bg-background text-foreground px-4 py-2 rounded-md shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
