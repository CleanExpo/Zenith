'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface LoadingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The size of the loading indicator.
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * The text to announce to screen readers.
   */
  ariaLabel?: string;
  
  /**
   * Whether the loading indicator is centered.
   */
  centered?: boolean;
  
  /**
   * The color variant of the loading indicator.
   */
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

/**
 * A loading indicator component that provides visual feedback during loading states.
 * This component is accessible to screen readers and can be customized in size and appearance.
 */
export function LoadingIndicator({
  size = 'md',
  ariaLabel = 'Loading',
  centered = false,
  variant = 'primary',
  className,
  ...props
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  
  const variantClasses = {
    default: 'border-muted-foreground/20 border-t-muted-foreground/60',
    primary: 'border-muted-foreground/20 border-t-primary',
    secondary: 'border-muted-foreground/20 border-t-secondary',
    accent: 'border-muted-foreground/20 border-t-accent',
  };
  
  return (
    <div 
      className={cn(
        'relative',
        centered && 'flex items-center justify-center',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <VisuallyHidden>{ariaLabel}</VisuallyHidden>
    </div>
  );
}
