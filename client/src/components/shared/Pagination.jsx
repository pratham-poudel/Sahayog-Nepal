import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Generate page numbers array
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Logic to show limited page numbers for better UI
    // Always show first and last page, and 1-2 pages around the current page
    
    // Always add page 1
    pageNumbers.push(1);
    
    // Calculate start and end of the middle range
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after page 1 if needed
    if (startPage > 2) {
      pageNumbers.push('...');
    }
    
    // Add middle range of pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Add last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Page Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentPage === 1
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#8B2325] hover:text-white transition-colors'
        }`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      
      {/* Page Numbers */}
      {pageNumbers.map((pageNumber, index) => (
        <React.Fragment key={index}>
          {pageNumber === '...' ? (
            <span className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(pageNumber)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentPage === pageNumber
                  ? 'bg-[#8B2325] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {pageNumber}
            </button>
          )}
        </React.Fragment>
      ))}
      
      {/* Next Page Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentPage === totalPages
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#8B2325] hover:text-white transition-colors'
        }`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination; 