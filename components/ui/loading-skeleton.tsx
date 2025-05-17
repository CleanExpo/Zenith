'use client';

import React from 'react';

export interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse p-4 rounded-md bg-gray-100 dark:bg-gray-800 ${className}`}>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    </div>
  );
}
