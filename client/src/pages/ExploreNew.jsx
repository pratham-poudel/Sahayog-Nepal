import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import useExplore from '../hooks/useExplore';
import useCategories from '../hooks/useCategories';
import CampaignCard from '../components/campaigns/CampaignCard';
import { Search, Filter, X, ArrowUpDown, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton loader for campaigns
const CampaignCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-300"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded w-full"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-8 bg-gray-300 rounded w-1/3"></div>
        <div className="h-6 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

const Explore = () => {
  const [location] = useLocation();
  const { getRegularCampaigns, getUrgentCampaigns, loading } = useExplore();
  const { categories, loading: categoriesLoading } = useCategories();
  
  // State management
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'urgent'
  const [activeCategory, setActiveCategory] = useState('All Campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('smart'); // smart, newest, endingSoon, leastFunded, mostFunded
  const [campaigns, setCampaigns] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // For debounced search loading
  
  // Refs for infinite scroll and debouncing
  const observerTarget = useRef(null);
  const isLoadingMore = useRef(false);
  const searchDebounceTimer = useRef(null);
  const sortDropdownRef = useRef(null);

  // Parse URL query parameters on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlTab = searchParams.get('tab');
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    const urlSortBy = searchParams.get('sortBy');

    if (urlTab && ['regular', 'urgent'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
    if (urlCategory) {
      setActiveCategory(urlCategory);
    }
    if (urlSearch) {
      setSearchTerm(urlSearch);
      setSearchInput(urlSearch);
    }
    if (urlSortBy && ['smart', 'newest', 'endingSoon', 'leastFunded', 'mostFunded'].includes(urlSortBy)) {
      setSortBy(urlSortBy);
    }
  }, []);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'regular') params.append('tab', activeTab);
    if (activeCategory !== 'All Campaigns') params.append('category', activeCategory);
    if (searchTerm) params.append('search', searchTerm);
    if (sortBy !== 'smart') params.append('sortBy', sortBy);
    
    const newURL = `/explore${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newURL);
  }, [activeTab, activeCategory, searchTerm, sortBy]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async (pageNum, append = false) => {
    if (isLoadingMore.current && append) return;
    
    if (append) {
      isLoadingMore.current = true;
    }

    try {
      const options = {
        page: pageNum,
        limit: 12,
        category: activeCategory !== 'All Campaigns' ? activeCategory : null,
        search: searchTerm || null,
        sortBy: sortBy
      };

      const result = activeTab === 'urgent' 
        ? await getUrgentCampaigns(options)
        : await getRegularCampaigns(options);

      if (result.campaigns) {
        if (append) {
          setCampaigns(prev => [...prev, ...result.campaigns]);
        } else {
          setCampaigns(result.campaigns);
        }
        
        setTotalCampaigns(result.total || 0);
        setHasMore(result.pagination?.hasNextPage || false);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      if (append) {
        isLoadingMore.current = false;
      }
      setIsInitialLoad(false);
    }
  }, [activeTab, activeCategory, searchTerm, sortBy, getRegularCampaigns, getUrgentCampaigns]);

  // Reset and fetch when filters change
  useEffect(() => {
    setCampaigns([]);
    setPage(1);
    setHasMore(true);
    fetchCampaigns(1, false);
    updateURL();
  }, [activeTab, activeCategory, searchTerm, sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCampaigns(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, fetchCampaigns]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input with debounce (trigger search after 2 seconds of no typing)
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Show searching indicator
    setIsSearching(true);
    
    // Clear existing timeout
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    // If empty, clear immediately
    if (!value.trim()) {
      setIsSearching(false);
      setSearchTerm('');
      return;
    }
    
    // Set new timeout - search after 2 seconds of no typing
    searchDebounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
      setIsSearching(false);
    }, 2000);
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchInput('');
    setSearchTerm('');
    setIsSearching(false);
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  // Handle sort change
  const handleSortChange = (sort) => {
    setSortBy(sort);
    setShowSortDropdown(false);
  };

  // Get sort label
  const getSortLabel = () => {
    switch (sortBy) {
      case 'smart':
        return 'Smart Mix';
      case 'newest':
        return 'Newest First';
      case 'endingSoon':
        return 'Ending Soon';
      case 'leastFunded':
        return 'Least Funded';
      case 'mostFunded':
        return 'Most Funded';
      default:
        return 'Sort By';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Campaigns</h1>
          <p className="text-gray-600">
            Discover campaigns that need your support
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('regular')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'regular'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Regular
            </button>
            <button
              onClick={() => handleTabChange('urgent')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'urgent'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Urgent
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* Search and Sort Row */}
          <div className="flex gap-3">
            {/* Search Box */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchInput}
                onChange={handleSearchInput}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 w-5 h-5 animate-spin" />
              )}
              {searchInput && !isSearching && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{getSortLabel()}</span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Sort Dropdown Menu */}
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleSortChange('smart')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === 'smart' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Smart Mix
                    </button>
                    <button
                      onClick={() => handleSortChange('newest')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === 'newest' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => handleSortChange('endingSoon')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === 'endingSoon' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Ending Soon
                    </button>
                    <button
                      onClick={() => handleSortChange('leastFunded')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === 'leastFunded' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Least Funded
                    </button>
                    <button
                      onClick={() => handleSortChange('mostFunded')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === 'mostFunded' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Most Funded
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Debounce Info */}
          {searchInput && isSearching && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter className="text-gray-500 w-5 h-5 flex-shrink-0" />
            <button
              onClick={() => handleCategoryChange('All Campaigns')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'All Campaigns'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Campaigns
            </button>
            {!categoriesLoading && categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        {!isInitialLoad && (
          <div className="mb-4 text-sm text-gray-600">
            {searchTerm && (
              <span>
                Search results for "{searchTerm}" •{' '}
              </span>
            )}
            <span>{totalCampaigns} campaign{totalCampaigns !== 1 ? 's' : ''} found</span>
          </div>
        )}

        {/* Campaigns Grid */}
        <AnimatePresence mode="wait">
          {isInitialLoad && loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CampaignCardSkeleton key={i} />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No campaigns found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search or filters'
                  : 'No campaigns available at the moment'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={`${campaign._id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Loading More Indicator */}
        {!isInitialLoad && campaigns.length > 0 && (
          <div ref={observerTarget} className="mt-8">
            {hasMore && loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <CampaignCardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            )}
            {!hasMore && (
              <div className="text-center py-8 text-gray-500">
                <p>You've reached the end of the list</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
