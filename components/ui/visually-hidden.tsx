'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * If `true`, the content will be visible to all users.
   * Useful for debugging or when content should be visible in certain contexts.
   */
  visible?: boolean;
}

/**
 * A component that visually hides content while keeping it accessible to screen readers.
 * This is useful for providing additional context to screen reader users
 * without affecting the visual layout.
 */
export function VisuallyHidden({
  children,
  visible = false,
  className,
  ...props
}: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        !visible && 'sr-only',
        visible && 'relative',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
