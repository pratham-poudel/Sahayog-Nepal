import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Tag, TrendingUp } from 'lucide-react';

const BlogFilters = ({ 
  availableTags, 
  activeFilter, 
  onFilterChange, 
  searchTerm, 
  onSearchChange, 
  onSearch,
  className = '' 
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    }
  };
  
  const popularTags = ['Technology', 'Health', 'Travel', 'Food', 'Lifestyle'];
  
  // Extract tag names from the availableTags array (which contains {tag, count} objects)
  const extractedTags = Array.isArray(availableTags) ? 
    availableTags.map(item => typeof item === 'string' ? item : item.tag || item.name) : 
    [];
  
  const displayTags = extractedTags.length > 0 ? extractedTags : popularTags;
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 ${className}`}
    >
      {/* Compact Search Bar */}
      <motion.div variants={itemVariants} className="mb-3">
        <form onSubmit={onSearch} className="relative">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-16 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
          >
            Search
          </motion.button>
        </form>
      </motion.div>

      {/* Compact Category Pills */}
      <motion.div variants={itemVariants} className="mb-3">
        <div className="flex items-center space-x-2 mb-2">
          <Filter className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </motion.button>
          
          {displayTags.slice(0, 6).map((tag, index) => (
            <motion.button
              key={`tag-${index}-${tag}`}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                activeFilter === tag
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Active Filters - Only show if there are active filters */}
      {(activeFilter !== 'all' || searchTerm) && (
        <motion.div 
          variants={itemVariants}
          className="pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Active filters
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onFilterChange('all');
                onSearchChange('');
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Clear
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BlogFilters;
