import { lazyLoad } from '@/lib/utils/lazy';

/**
 * Lazy-loaded version of CrossDomainMetrics component
 * This component is heavy due to chart rendering and data processing
 */
export const LazyCrossDomainMetrics = lazyLoad(
  () => import('@/components/dashboard/analytics/CrossDomainMetrics')
);

/**
 * Lazy-loaded version of UserProductivityPrediction component
 * This component is heavy due to ML model visualization
 */
export const LazyUserProductivityPrediction = lazyLoad(
  () => import('@/components/dashboard/analytics/UserProductivityPrediction')
);

/**
 * Lazy-loaded version of ProjectCompletionPrediction component
 * This component is heavy due to chart rendering and data processing
 */
export const LazyProjectCompletionPrediction = lazyLoad(
  () => import('@/components/dashboard/projects/ProjectCompletionPrediction')
);

/**
 * Lazy-loaded version of MLProjectCompletionPrediction component
 * This component is heavy due to ML model visualization
 */
export const LazyMLProjectCompletionPrediction = lazyLoad(
  () => import('@/components/dashboard/projects/MLProjectCompletionPrediction')
);

/**
 * Lazy-loaded version of MLProjectCompletionPredictionEnhanced component
 * This component is heavy due to ML model visualization and enhanced features
 */
export const LazyMLProjectCompletionPredictionEnhanced = lazyLoad(
  () => import('@/components/dashboard/projects/MLProjectCompletionPredictionEnhanced')
);
