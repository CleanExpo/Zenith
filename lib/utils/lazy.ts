import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Configuration options for lazy loading components
 */
export interface LazyLoadOptions {
  /**
   * Whether to suspend loading (for use with Suspense)
   * @default false
   */
  ssr?: boolean;
}

/**
 * Create a lazy-loaded version of a component
 * @param importFn - Function that imports the component
 * @param options - Lazy loading options
 * @returns Lazy-loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const { ssr = false } = options;
  
  return dynamic(importFn, {
    ssr,
  });
}
