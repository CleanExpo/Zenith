/**
 * Pagination Controls Component
 * 
 * This component provides a user interface for pagination controls.
 * It displays the current page, total pages, and navigation buttons.
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  // The current page number
  currentPage: number;
  
  // The total number of pages
  totalPages: number;
  
  // Callback when a page is selected
  onPageChange: (page: number) => void;
  
  // The maximum number of page buttons to show
  maxPageButtons?: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  maxPageButtons = 5
}: PaginationControlsProps) {
  // Don't render if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  // Calculate the range of page buttons to show
  const halfMaxButtons = Math.floor(maxPageButtons / 2);
  let startPage = Math.max(1, currentPage - halfMaxButtons);
  const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  // Generate the page buttons
  const pageButtons = [];
  for (let i = startPage; i <= endPage; i++) {
    pageButtons.push(
      <Button
        key={i}
        variant={i === currentPage ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPageChange(i)}
        aria-current={i === currentPage ? 'page' : undefined}
      >
        {i}
      </Button>
    );
  }
  
  return (
    <div className="flex items-center justify-center space-x-2">
      {/* First page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="Go to first page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      
      {/* Previous page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Show ellipsis if not starting from page 1 */}
      {startPage > 1 && (
        <Button variant="outline" size="sm" disabled>
          ...
        </Button>
      )}
      
      {/* Page buttons */}
      {pageButtons}
      
      {/* Show ellipsis if not ending at the last page */}
      {endPage < totalPages && (
        <Button variant="outline" size="sm" disabled>
          ...
        </Button>
      )}
      
      {/* Next page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {/* Last page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Go to last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
