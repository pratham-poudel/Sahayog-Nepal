import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { CATEGORY_STRUCTURE, getMainCategories, getSubcategories } from '../../config/categories';

const HierarchicalCategorySelector = ({ 
  selectedCategory, 
  selectedSubcategory, 
  onCategoryChange, 
  onSubcategoryChange,
  loading = false,
  error = null,
  mode = 'full' // 'full', 'compact', 'dropdown'
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);

  const mainCategories = getMainCategories();

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleCategorySelect = (category) => {
    onCategoryChange(category);
    // Clear subcategory when main category changes
    if (onSubcategoryChange) {
      onSubcategoryChange(null);
    }
    
    // Auto-expand the selected category
    setExpandedCategories(prev => ({
      ...prev,
      [category]: true
    }));
  };

  const handleSubcategorySelect = (subcategory) => {
    if (onSubcategoryChange) {
      onSubcategoryChange(subcategory);
    }
  };

  // Auto-expand selected category
  useEffect(() => {
    if (selectedCategory) {
      setExpandedCategories(prev => ({
        ...prev,
        [selectedCategory]: true
      }));
    }
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        Error loading categories: {error}
      </div>
    );
  }

  // Dropdown mode for forms
  if (mode === 'dropdown') {
    return (
      <div className="space-y-4">
        {/* Main Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Main Category*
          </label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="">Choose a main category</option>
            {mainCategories.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_STRUCTURE[category]?.icon} {category}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Dropdown */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subcategory (Optional)
            </label>
            <select
              value={selectedSubcategory || ''}
              onChange={(e) => handleSubcategorySelect(e.target.value || null)}
              className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
            >
              <option value="">Select a subcategory (optional)</option>
              {getSubcategories(selectedCategory).map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </div>
    );
  }

  // Full hierarchical view for explore pages
  return (
    <div className="space-y-2">
      {mainCategories.map((category) => {
        const isExpanded = expandedCategories[category];
        const isSelected = selectedCategory === category;
        const subcategories = getSubcategories(category);
        const categoryData = CATEGORY_STRUCTURE[category];

        return (
          <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Main Category */}
            <button
              onClick={() => {
                if (subcategories.length > 0) {
                  toggleCategory(category);
                } else {
                  handleCategorySelect(category);
                }
              }}
              className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{categoryData?.icon}</span>
                <span className="font-medium">{category}</span>
                {subcategories.length > 0 && (
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {subcategories.length}
                  </span>
                )}
              </div>
              
              {subcategories.length > 0 && (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </button>

            {/* Subcategories */}
            <AnimatePresence>
              {isExpanded && subcategories.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="p-2 space-y-1">
                    {subcategories.map((subcategory) => {
                      const isSubSelected = selectedSubcategory === subcategory;
                      
                      return (
                        <button
                          key={subcategory}
                          onClick={() => {
                            handleCategorySelect(category);
                            handleSubcategorySelect(subcategory);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm rounded-md transition-all duration-200 ${
                            isSubSelected
                              ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          {subcategory}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default HierarchicalCategorySelector;
