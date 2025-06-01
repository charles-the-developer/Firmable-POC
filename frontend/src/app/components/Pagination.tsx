interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }
  
  const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
    const handlePrevious = () => {
      if (page > 1) onPageChange(page - 1);
    };
  
    const handleNext = () => {
      if (page < totalPages) onPageChange(page + 1);
    };
  
    return (
      <div className="flex justify-center items-center mt-6 space-x-4">
        <button
          onClick={handlePrevious}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-blue-50 transition-colors ${
            page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'
          }`}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-gray-800 font-medium">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-blue-50 transition-colors ${
            page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'
          }`}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    );
  };
  
  export default Pagination;