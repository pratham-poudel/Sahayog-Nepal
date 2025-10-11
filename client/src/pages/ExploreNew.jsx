import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import useExplore from '../hooks/useExplore';
import useCategories from '../hooks/useCategories';
import CampaignCard from '../components/campaigns/CampaignCard';
import { Search, Filter, X, ArrowUpDown, Loader2, ChevronDown, Heart, TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Banner data - can be fetched from API in the future
// Full control over all banner elements
const bannerSlides = [
  {
    id: 1,
    title: "Make a Difference Today",
    titleColor: "text-white", // Tailwind color class
    subtitle: "Every contribution counts towards changing lives",
    subtitleColor: "text-white/90", // Tailwind color class
    gradient: "from-emerald-600 to-teal-600",
    icon: Heart,
    iconColor: "text-white", // Icon color
    badgeText: "Featured", // Badge text
    badgeColor: "bg-white/20 text-white", // Badge background and text color
    illustration: "❤️",
    illustrationOpacity: "opacity-20 md:opacity-30", // Control illustration visibility
    bgImage: null, // Add your image URL here, e.g., "https://example.com/image.jpg"
    button: {
      show: true,
      text: "Explore Now",
      link: "/explore?tab=regular", // Can be external URL or internal path
      bgColor: "bg-black", // Button background color
      textColor: "text-red-900", // Button text color
      hoverBgColor: "hover:bg-gray-100", // Button hover background
      openInNewTab: false, // Set to true for external links
    },
  },
  {
    id: 2,
    title: "Trending Campaigns",
    titleColor: "text-white",
    subtitle: "Discover the most impactful campaigns right now",
    subtitleColor: "text-blue-100",
    gradient: "from-blue-600 to-indigo-600",
    icon: TrendingUp,
    iconColor: "text-yellow-300",
    badgeText: "Hot 🔥",
    badgeColor: "bg-yellow-400/30 text-yellow-100",
    illustration: "🚀",
    illustrationOpacity: "opacity-25",
    bgImage: null,
    button: {
      show: true,
      text: "View Trending",
      link: "/explore?sortBy=mostFunded",
      bgColor: "bg-yellow-400",
      textColor: "text-blue-900",
      hoverBgColor: "hover:bg-yellow-300",
      openInNewTab: false,
    },
  },
  {
    id: 3,
    title: "Join Our Community",
    titleColor: "text-white",
    subtitle: "Thousands of donors making the world better together",
    subtitleColor: "text-pink-100",
    gradient: "from-purple-600 to-pink-600",
    icon: Users,
    iconColor: "text-white",
    badgeText: "Community",
    badgeColor: "bg-white/20 text-white",
    illustration: "🤝",
    illustrationOpacity: "opacity-30",
    bgImage: "https://kettocdn.gumlet.io/media/banner/0/99/image/aH9Y3P69FXMtBeGO47lzuNcDYGLLYeGOGKVTHucQ.png?w=1536&dpr=1.3",
    button: {
      show: true,
      text: "Learn More",
      link: "https://example.com/about", // External link example
      bgColor: "bg-pink-500",
      textColor: "text-white",
      hoverBgColor: "hover:bg-pink-400",
      openInNewTab: true, // Opens in new tab
    },
  },
];

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

// Banner Component
const ExploreBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  return (
    <div 
      className="relative w-full h-64 rounded-2xl overflow-hidden shadow-xl mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background Image Layer */}
          {bannerSlides[currentSlide].bgImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerSlides[currentSlide].bgImage})` }}
            />
          )}
          
          {/* Gradient Overlay Layer */}
          <div 
            className={`absolute inset-0 ${
              bannerSlides[currentSlide].bgImage 
                ? `bg-gradient-to-r ${bannerSlides[currentSlide].gradient} bg-opacity-80`
                : `bg-gradient-to-r ${bannerSlides[currentSlide].gradient}`
            }`}
            style={bannerSlides[currentSlide].bgImage ? { opacity: 0.85 } : {}}
          />

          <div className="relative h-full flex items-center justify-between px-12">
            {/* Left Content */}
            <div className="flex-1 z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {/* Badge */}
                <div className={`inline-flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-full ${bannerSlides[currentSlide].badgeColor}`}>
                  {(() => {
                    const IconComponent = bannerSlides[currentSlide].icon;
                    return IconComponent ? <IconComponent className={`w-5 h-5 ${bannerSlides[currentSlide].iconColor}`} /> : null;
                  })()}
                  <span className="text-sm font-medium">{bannerSlides[currentSlide].badgeText}</span>
                </div>
                
                {/* Title */}
                <h2 className={`text-4xl md:text-5xl font-bold leading-tight ${bannerSlides[currentSlide].titleColor}`}>
                  {bannerSlides[currentSlide].title}
                </h2>
                
                {/* Subtitle */}
                <p className={`text-lg md:text-xl max-w-xl ${bannerSlides[currentSlide].subtitleColor}`}>
                  {bannerSlides[currentSlide].subtitle}
                </p>
                
                {/* Button */}
                {bannerSlides[currentSlide].button?.show && (
                  <a
                    href={bannerSlides[currentSlide].button.link}
                    target={bannerSlides[currentSlide].button.openInNewTab ? "_blank" : "_self"}
                    rel={bannerSlides[currentSlide].button.openInNewTab ? "noopener noreferrer" : undefined}
                    className={`inline-block px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg ${bannerSlides[currentSlide].button.bgColor} ${bannerSlides[currentSlide].button.textColor} ${bannerSlides[currentSlide].button.hoverBgColor}`}
                  >
                    {bannerSlides[currentSlide].button.text}
                  </a>
                )}
              </motion.div>
            </div>

            {/* Right Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`flex-shrink-0 text-9xl ${bannerSlides[currentSlide].illustrationOpacity}`}
            >
              {bannerSlides[currentSlide].illustration}
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            } h-2 rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

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
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Track infinite scroll loading
  
  // Refs for infinite scroll and debouncing
  const observerTarget = useRef(null);
  const isLoadingMoreRef = useRef(false);
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
    if (isLoadingMoreRef.current && append) return;
    
    if (append) {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
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
          // Keep skeleton visible for a brief moment to ensure smooth transition
          // Wait for React to render the new campaigns before hiding skeleton
          setTimeout(() => {
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
          }, 100);
        } else {
          setCampaigns(result.campaigns);
        }
        
        setTotalCampaigns(result.total || 0);
        setHasMore(result.pagination?.hasNextPage || false);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      if (append) {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    } finally {
      if (!append) {
        setIsInitialLoad(false);
      }
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
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMoreRef.current) {
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
         {/* Banner Section */}
        <ExploreBanner />
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-red-900 mb-2">Explore Campaigns</h1>
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
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              layout
            >
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={`${campaign._id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                  layout
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading More Indicator */}
        {!isInitialLoad && campaigns.length > 0 && (
          <div ref={observerTarget} className="mt-8">
            <AnimatePresence mode="wait">
              {hasMore && isLoadingMore && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {[...Array(3)].map((_, i) => (
                    <CampaignCardSkeleton key={`skeleton-${i}`} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
