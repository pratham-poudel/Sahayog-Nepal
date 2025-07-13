import React from 'react';

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  // Don't render pagination if only one page
  if (totalPages <= 1) return null;
  
  // Create array of page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis if needed before range
    if (rangeStart > 2) {
      pageNumbers.push('...');
    }
    
    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis if needed after range
    if (rangeEnd < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Always show last page if more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  // Handle page button click
  const handlePageClick = (page) => {
    if (page !== currentPage && page !== '...') {
      onPageChange(page);
    }
  };
  
  // Handle previous/next buttons
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  return (
    <div className="flex justify-center items-center space-x-1 md:space-x-2">
      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`flex items-center justify-center px-3 py-2 rounded-md ${
          currentPage === 1 
            ? 'text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed' 
            : 'text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Page numbers */}
      {pageNumbers.map((page, index) => (
        <button
          key={`page-${index}`}
          onClick={() => handlePageClick(page)}
          className={`px-3 py-1 min-w-[36px] text-sm rounded-md ${
            page === currentPage 
              ? 'bg-[#800000] text-white font-medium' 
              : page === '...'
                ? 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 cursor-default'
                : 'text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          disabled={page === '...'}
        >
          {page}
        </button>
      ))}
      
      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center px-3 py-2 rounded-md ${
          currentPage === totalPages 
            ? 'text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed' 
            : 'text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Next page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Pagination; 