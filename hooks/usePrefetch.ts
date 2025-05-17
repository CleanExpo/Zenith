import { useEffect, useRef } from 'react';
import { BatchRequestItem, prefetchData } from '@/lib/utils/dataFetching';
import { logger } from '@/lib/logger';

/**
 * Hook to prefetch data when a component mounts or when dependencies change
 * @param createRequests Function that returns requests to prefetch
 * @param deps Dependencies array that triggers prefetching when changed
 */
export function usePrefetch<T>(
  createRequests: () => BatchRequestItem<T>[],
  deps: any[] = []
): void {
  // Use a ref to track if prefetching has been done
  const hasPrefetched = useRef<boolean>(false);

  useEffect(() => {
    // Skip if already prefetched and deps haven't changed
    if (hasPrefetched.current && deps.length === 0) {
      return;
    }

    const requests = createRequests();
    if (requests.length === 0) {
      return;
    }

    logger.info('Prefetching data on component mount', { count: requests.length });
    
    // Don't await this - let it happen in the background
    prefetchData(requests).catch(error => {
      logger.warn('Error during prefetch', { error: error.message });
    });

    // Mark as prefetched
    hasPrefetched.current = true;
  }, deps); // Re-run when dependencies change
}

/**
 * Hook to prefetch data when hovering over an element
 * @param createRequests Function that returns requests to prefetch
 * @returns Object with event handlers to attach to the element
 */
export function usePrefetchOnHover<T>(
  createRequests: () => BatchRequestItem<T>[]
): {
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  // Use a ref to track if prefetching has been done
  const hasPrefetched = useRef<boolean>(false);

  const prefetchOnInteraction = () => {
    // Skip if already prefetched
    if (hasPrefetched.current) {
      return;
    }

    const requests = createRequests();
    if (requests.length === 0) {
      return;
    }

    logger.info('Prefetching data on hover/focus', { count: requests.length });
    
    // Don't await this - let it happen in the background
    prefetchData(requests).catch(error => {
      logger.warn('Error during prefetch on hover', { error: error.message });
    });

    // Mark as prefetched
    hasPrefetched.current = true;
  };

  return {
    onMouseEnter: prefetchOnInteraction,
    onFocus: prefetchOnInteraction,
  };
}

/**
 * Hook to prefetch data when scrolling near an element
 * @param createRequests Function that returns requests to prefetch
 * @param threshold Distance in pixels from the element to trigger prefetching
 * @returns Ref to attach to the element
 */
export function usePrefetchOnScroll<T>(
  createRequests: () => BatchRequestItem<T>[],
  threshold: number = 300
): React.RefObject<HTMLElement | null> {
  // Use a ref to track if prefetching has been done
  const hasPrefetched = useRef<boolean>(false);
  // Ref to attach to the element
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // If element is intersecting and we haven't prefetched yet
        if (entries[0].isIntersecting && !hasPrefetched.current) {
          const requests = createRequests();
          if (requests.length === 0) {
            return;
          }

          logger.info('Prefetching data on scroll', { count: requests.length });
          
          // Don't await this - let it happen in the background
          prefetchData(requests).catch(error => {
            logger.warn('Error during prefetch on scroll', { error: error.message });
          });

          // Mark as prefetched
          hasPrefetched.current = true;
          
          // Disconnect observer after prefetching
          observer.disconnect();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [createRequests, threshold]);

  return elementRef;
}

/**
 * Hook to prefetch data for a list of items
 * @param items Array of items
 * @param createRequestForItem Function that creates a request for an item
 * @param batchSize Number of items to prefetch at once
 */
export function usePrefetchList<T, U>(
  items: T[],
  createRequestForItem: (item: T) => BatchRequestItem<U>,
  batchSize: number = 10
): void {
  useEffect(() => {
    if (!items.length) {
      return;
    }

    // Only prefetch the first batch
    const itemsToFetch = items.slice(0, batchSize);
    const requests = itemsToFetch.map(createRequestForItem);

    logger.info('Prefetching data for list', { count: requests.length });
    
    // Don't await this - let it happen in the background
    prefetchData(requests).catch(error => {
      logger.warn('Error during list prefetch', { error: error.message });
    });
  }, [items, createRequestForItem, batchSize]);
}
