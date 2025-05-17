import { logger } from '@/lib/logger';
import { getFromCache, setInCache, CachePrefix, CacheExpiration } from '@/lib/utils/cacheUtils';

/**
 * Interface for batch request item
 */
export interface BatchRequestItem<T> {
  id: string;
  endpoint: string;
  params?: Record<string, any>;
  transform?: (data: any) => T;
  cacheKey?: string;
  cacheExpiration?: number;
}

/**
 * Interface for batch response item
 */
export interface BatchResponseItem<T> {
  id: string;
  data: T | null;
  error: Error | null;
  fromCache: boolean;
}

/**
 * Batch multiple API requests into a single operation
 * @param requests Array of request items
 * @returns Array of response items in the same order
 */
export async function batchRequests<T>(
  requests: BatchRequestItem<T>[]
): Promise<BatchResponseItem<T>[]> {
  if (!requests.length) {
    return [];
  }

  logger.info('Batching requests', { count: requests.length });

  // Check cache first for each request
  const cachedResults: Record<string, any> = {};
  const requestsToFetch: BatchRequestItem<T>[] = [];

  for (const request of requests) {
    if (request.cacheKey) {
      const cachedData = await getFromCache(request.cacheKey);
      if (cachedData) {
        cachedResults[request.id] = cachedData;
      } else {
        requestsToFetch.push(request);
      }
    } else {
      requestsToFetch.push(request);
    }
  }

  // Group requests by endpoint to reduce number of network calls
  const endpointGroups: Record<string, BatchRequestItem<T>[]> = {};
  
  for (const request of requestsToFetch) {
    if (!endpointGroups[request.endpoint]) {
      endpointGroups[request.endpoint] = [];
    }
    endpointGroups[request.endpoint].push(request);
  }

  // Process each endpoint group
  const fetchPromises: Promise<void>[] = [];
  const results: Record<string, any> = {};
  const errors: Record<string, Error> = {};

  for (const [endpoint, groupRequests] of Object.entries(endpointGroups)) {
    const promise = (async () => {
      try {
        // Combine parameters for batch endpoint if supported
        const batchParams = {
          ids: groupRequests.map(req => req.params?.id).filter(Boolean),
          // Add other common parameters as needed
        };

        // Make the batch request
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchParams),
        });

        if (!response.ok) {
          throw new Error(`Batch request failed: ${response.statusText}`);
        }

        const batchData = await response.json();

        // Process each request in the group
        for (const request of groupRequests) {
          try {
            // Extract individual result from batch response
            // This depends on your API's batch response format
            let individualData;
            
            if (request.params?.id && batchData.results) {
              // If the API returns results keyed by ID
              individualData = batchData.results[request.params.id];
            } else {
              // If we need to filter the results manually
              individualData = batchData.items?.find((item: any) => 
                item.id === request.params?.id
              );
            }

            // Apply transformation if provided
            if (request.transform && individualData) {
              individualData = request.transform(individualData);
            }

            // Store in results
            results[request.id] = individualData;

            // Cache the result if cacheKey is provided
            if (request.cacheKey && individualData) {
              await setInCache(
                request.cacheKey,
                individualData,
                request.cacheExpiration || CacheExpiration.MEDIUM
              );
            }
          } catch (error: any) {
            logger.error('Error processing individual result in batch', {
              error: error.message,
              requestId: request.id,
              endpoint
            });
            errors[request.id] = error;
          }
        }
      } catch (error: any) {
        logger.error('Batch request failed', {
          error: error.message,
          endpoint,
          requestCount: groupRequests.length
        });
        
        // Mark all requests in this group as failed
        for (const request of groupRequests) {
          errors[request.id] = error;
        }
      }
    })();

    fetchPromises.push(promise);
  }

  // Wait for all fetch operations to complete
  await Promise.all(fetchPromises);

  // Combine cached results and fetched results
  return requests.map(request => {
    if (cachedResults[request.id]) {
      return {
        id: request.id,
        data: cachedResults[request.id],
        error: null,
        fromCache: true
      };
    } else if (errors[request.id]) {
      return {
        id: request.id,
        data: null,
        error: errors[request.id],
        fromCache: false
      };
    } else {
      return {
        id: request.id,
        data: results[request.id] || null,
        error: results[request.id] ? null : new Error('Data not found in batch response'),
        fromCache: false
      };
    }
  });
}

/**
 * Prefetch data that will likely be needed soon
 * @param requests Array of request items to prefetch
 */
export async function prefetchData<T>(requests: BatchRequestItem<T>[]): Promise<void> {
  if (!requests.length) {
    return;
  }

  logger.info('Prefetching data', { count: requests.length });

  // Filter out requests that are already in cache
  const requestsToFetch: BatchRequestItem<T>[] = [];
  
  for (const request of requests) {
    if (request.cacheKey) {
      const cachedData = await getFromCache(request.cacheKey);
      if (!cachedData) {
        requestsToFetch.push(request);
      }
    } else {
      requestsToFetch.push(request);
    }
  }

  if (!requestsToFetch.length) {
    logger.info('All prefetch requests already in cache');
    return;
  }

  // Use batchRequests to fetch the data
  // We don't need to process the results since this is just prefetching
  try {
    await batchRequests(requestsToFetch);
    logger.info('Prefetch completed successfully', { count: requestsToFetch.length });
  } catch (error: any) {
    logger.warn('Prefetch operation encountered errors', { error: error.message });
    // We don't throw errors for prefetch operations since they're not critical
  }
}

/**
 * Create a prefetch function for a specific data type
 * @param getRelatedIds Function that returns IDs of related items to prefetch
 * @param createRequestItem Function that creates a request item for an ID
 * @returns Prefetch function
 */
export function createPrefetchFunction<T, U>(
  getRelatedIds: (data: T) => string[],
  createRequestItem: (id: string) => BatchRequestItem<U>
): (data: T) => Promise<void> {
  return async (data: T) => {
    const relatedIds = getRelatedIds(data);
    if (!relatedIds.length) {
      return;
    }
    
    const requests = relatedIds.map(createRequestItem);
    await prefetchData(requests);
  };
}

/**
 * Hook to prefetch data when a component mounts
 * @param createRequests Function that returns requests to prefetch
 */
export function usePrefetch<T>(createRequests: () => BatchRequestItem<T>[]): void {
  // This would be implemented as a React hook in a real application
  // For this example, we'll just provide the implementation pattern
  
  // useEffect(() => {
  //   const requests = createRequests();
  //   prefetchData(requests);
  // }, []);
}
