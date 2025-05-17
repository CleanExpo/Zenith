import { useState, useCallback, useMemo } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

interface UsePaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  pageItems: number[];
}

/**
 * Hook to manage pagination state
 * @param initialPage - Initial page number (default: 1)
 * @param initialPageSize - Initial page size (default: 10)
 * @param totalItems - Total number of items (optional)
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalItems = 0,
}: UsePaginationProps = {}): UsePaginationResult {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return totalItems ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  }, [totalItems, pageSize]);

  // Ensure page is within bounds when dependencies change
  const safeSetPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  // Navigation functions
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      safeSetPage(page + 1);
    }
  }, [page, totalPages, safeSetPage]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      safeSetPage(page - 1);
    }
  }, [page, safeSetPage]);

  // Calculate page items for pagination display
  const pageItems = useMemo(() => {
    const items: number[] = [];
    
    // Always show first page
    items.push(1);
    
    // Calculate range around current page
    const rangeStart = Math.max(2, page - 1);
    const rangeEnd = Math.min(totalPages - 1, page + 1);
    
    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      items.push(-1); // -1 represents ellipsis
    }
    
    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      items.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      items.push(-2); // -2 represents ellipsis (different key from the first one)
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  }, [page, totalPages]);

  return {
    page,
    pageSize,
    totalPages,
    setPage: safeSetPage,
    setPageSize,
    nextPage,
    prevPage,
    canNextPage: page < totalPages,
    canPrevPage: page > 1,
    pageItems,
  };
}
