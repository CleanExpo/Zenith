'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { AriaLive } from '@/components/ui/aria-live';

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The error message to display.
   */
  message?: string;
  
  /**
   * The type of error message.
   */
  type?: 'error' | 'warning' | 'info';
  
  /**
   * Whether to announce the error message to screen readers.
   */
  announce?: boolean;
  
  /**
   * The politeness level for screen readers.
   */
  politeness?: 'assertive' | 'polite';
}

/**
 * A component for displaying error messages with appropriate styling and accessibility features.
 * This component can be used to display validation errors, form errors, or other types of errors.
 */
export function ErrorMessage({
  message,
  type = 'error',
  announce = true,
  politeness = type === 'error' ? 'assertive' : 'polite',
  className,
  ...props
}: ErrorMessageProps) {
  if (!message) return null;
  
  const Icon = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[type];
  
  const colorClasses = {
    error: 'text-destructive',
    warning: 'text-yellow-600 dark:text-yellow-500',
    info: 'text-blue-600 dark:text-blue-500',
  }[type];
  
  return (
    <>
      {announce && (
        <AriaLive politeness={politeness}>
          {type === 'error' ? 'Error: ' : type === 'warning' ? 'Warning: ' : 'Info: '}
          {message}
        </AriaLive>
      )}
      
      <div
        className={cn(
          'flex items-center gap-2 text-sm font-medium',
          colorClasses,
          className
        )}
        {...props}
      >
        <Icon className="h-4 w-4" />
        <span>{message}</span>
      </div>
    </>
  );
}
