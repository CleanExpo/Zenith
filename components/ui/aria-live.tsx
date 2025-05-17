'use client';

import * as React from 'react';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface AriaLiveProps {
  /**
   * The politeness level for screen readers.
   * - 'assertive': Announces immediately, interrupting current speech.
   * - 'polite': Announces when the screen reader is idle.
   * - 'off': Does not announce (but still available to screen readers).
   */
  politeness?: 'assertive' | 'polite' | 'off';
  
  /**
   * The content to be announced by screen readers.
   */
  children: React.ReactNode;
  
  /**
   * Whether to make the content visible.
   * Useful for debugging or when content should be visible in certain contexts.
   */
  visible?: boolean;
  
  /**
   * Whether to clear the content after it's announced.
   * This is useful for temporary announcements.
   */
  clearAfter?: number;
}

/**
 * A component that announces content to screen readers using ARIA live regions.
 * This is useful for dynamically changing content, notifications, and feedback.
 */
export function AriaLive({
  politeness = 'polite',
  children,
  visible = false,
  clearAfter,
}: AriaLiveProps) {
  const [content, setContent] = React.useState<React.ReactNode>(children);
  
  React.useEffect(() => {
    setContent(children);
    
    if (clearAfter && children) {
      const timer = setTimeout(() => {
        setContent(null);
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [children, clearAfter]);
  
  if (visible) {
    return (
      <div 
        aria-live={politeness} 
        role="status" 
        aria-atomic="true"
      >
        {content}
      </div>
    );
  }
  
  return (
    <VisuallyHidden>
      <div 
        aria-live={politeness} 
        role="status" 
        aria-atomic="true"
      >
        {content}
      </div>
    </VisuallyHidden>
  );
}
