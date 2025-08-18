import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  expandedPages?: boolean;
  onToggleExpandedPages?: () => void;
  className?: string;
}

export default function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  expandedPages = false,
  onToggleExpandedPages,
  className = "mt-4",
}: TablePaginationProps) {
  const handleEllipsisClick = () => {
    if (onToggleExpandedPages) {
      onToggleExpandedPages();
    }
  };

  return (
    <div className={className}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={currentPage === 1 ? undefined : () => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Forrige
            </PaginationPrevious>
          </PaginationItem>

          {[...Array(totalPages).keys()].map((pageIndex) => {
            const pageNumber = pageIndex + 1;

            // Show all pages if expanded, otherwise limit to 5 pages around the current page
            if (
              expandedPages ||
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
            ) {
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink isActive={currentPage === pageNumber} onClick={() => onPageChange(pageNumber)}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            return null;
          })}

          {!expandedPages && totalPages > 5 && currentPage < totalPages - 2 && onToggleExpandedPages && (
            <PaginationItem>
              <PaginationEllipsis onClick={handleEllipsisClick} />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={currentPage === totalPages ? undefined : () => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Neste
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
