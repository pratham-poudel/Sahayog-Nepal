import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Filter } from 'lucide-react';

const CampaignFilters = ({ 
  activeCategory, 
  setActiveCategory, 
  onSearch,
  initialSearchTerm = '',
  initialFilters = {},
  categories = [],
  categoriesLoading = false
}) => {
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    urgentOnly: initialFilters.urgentOnly || false,
    sortOrder: initialFilters.sortOrder || 'newest'
  });
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  
  // Add debounce timer ref for search-as-you-type
  const debounceTimerRef = useRef(null);
  
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determine how many categories to show based on viewport width
  const getVisibleCategories = () => {
    if (viewportWidth >= 1280) return 8; // xl
    if (viewportWidth >= 1024) return 7; // lg
    if (viewportWidth >= 768) return 5;  // md
    if (viewportWidth >= 640) return 4;  // sm
    return 3; // xs
  };
  
  const visibleCategories = getVisibleCategories();
  const mainCategories = categories.slice(0, visibleCategories);
  const moreCategories = categories.slice(visibleCategories);
  
  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to trigger search after typing stops (300ms)
    debounceTimerRef.current = setTimeout(() => {
      onSearch(value, filters);
    }, 300); // 300ms debounce time
  };
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(searchTerm, newFilters);
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div className="mb-8">
      {/* Search Bar with Filters */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            
            <button
              onClick={() => handleFilterChange('urgentOnly', !filters.urgentOnly)}
              className={`px-4 py-2 flex items-center space-x-2 rounded-md transition-colors ${
                filters.urgentOnly
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="hidden sm:inline">Urgent</span>
            </button>
          </div>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <motion.div 
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most-funded">Most Funded</option>
                  <option value="least-funded">Least Funded</option>
                  <option value="least-time">Ending Soon</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Category Tabs */}
      <motion.div 
        className="flex flex-wrap gap-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <button
          onClick={() => setActiveCategory('All Campaigns')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeCategory === 'All Campaigns'
              ? 'bg-[#800000] text-white'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          All Campaigns
        </button>
        
        {categoriesLoading ? (
          // Show skeleton loading for categories
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse h-8 w-24"
            />
          ))
        ) : (
          mainCategories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeCategory === category
                  ? 'bg-[#800000] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {category}
            </button>
          ))
        )}
        
        {!categoriesLoading && moreCategories.length > 0 && (
          <div className="relative inline-block">
            <button
              onClick={() => setShowMoreCategories(!showMoreCategories)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              More +
            </button>
            
            {showMoreCategories && (
              <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                {moreCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setShowMoreCategories(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      activeCategory === category
                        ? 'bg-[#800000] text-white font-medium'
                        : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CampaignFilters;
