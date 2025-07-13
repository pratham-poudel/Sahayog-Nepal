import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import SEO from '../utils/seo.jsx';
import CampaignFilters from '../components/campaigns/CampaignFilters';
import CampaignList from '../components/campaigns/CampaignList';
import useCategories from '../hooks/useCategories';
import useCampaigns from '../hooks/useCampaigns';
import Pagination from '../components/ui/Pagination';

const Explore = () => {
  const [location] = useLocation();
  const { getAllCampaigns, searchCampaigns, loading } = useCampaigns();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [activeCategory, setActiveCategory] = useState('All Campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [allFeaturedCampaigns, setAllFeaturedCampaigns] = useState([]);
  const [featuredOffset, setFeaturedOffset] = useState(0);
  const [endingSoonCampaigns, setEndingSoonCampaigns] = useState([]);
  const [leastFundedCampaigns, setLeastFundedCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    urgentOnly: false,
    sortOrder: 'newest',
    displayMode: 'regular' // Changed default to 'regular' instead of 'mixed'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [loadingCurated, setLoadingCurated] = useState(false);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  
  // Parse URL query parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const pageParam = params.get('page');
    const searchParam = params.get('search');
    const urgentParam = params.get('urgent');
    const sortParam = params.get('sort');
    const displayParam = params.get('display');
    
    // Set initial state from URL parameters
    if (categoryParam && categories.includes(categoryParam)) {
      setActiveCategory(categoryParam);
    }
    
    if (pageParam) {
      setPagination(prev => ({ ...prev, page: parseInt(pageParam) || 1 }));
    }
    
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    
    if (urgentParam === 'true') {
      setFilters(prev => ({ ...prev, urgentOnly: true }));
    }
    
    if (sortParam) {
      setFilters(prev => ({ ...prev, sortOrder: sortParam }));
    }

    if (displayParam) {
      setFilters(prev => ({ ...prev, displayMode: displayParam }));
    }
    
    // Fetch featured campaigns first, then regular campaigns
    const loadInitialData = async () => {
      await fetchAllFeaturedCampaigns();
      await fetchCampaigns();
    };

    loadInitialData();
    
    // Only fetch curated content when in mixed or curated mode
    if (!displayParam || displayParam === 'mixed' || displayParam === 'curated') {
      fetchCuratedCampaigns();
    }
  }, []);
  
  // Fetch all featured campaigns and rotate them
  const fetchAllFeaturedCampaigns = async () => {
    setLoadingFeatured(true);
    try {
      // Get all featured campaigns (with a higher limit)
      const featuredResult = await getAllCampaigns({
        limit: 50, // Get more featured campaigns to rotate through
        featured: true, // Explicitly request featured campaigns
        page: 1 // Always get page 1 for featured
      });
      
      const allFeatured = featuredResult.campaigns || [];
      console.log(`Fetched ${allFeatured.length} featured campaigns`);
      setAllFeaturedCampaigns(allFeatured);
      
      // Set the initial 3 featured campaigns based on the current offset
      updateFeaturedCampaigns(allFeatured, 0);
      
      // Set an interval to rotate through featured campaigns every 24 hours
      // Use localStorage to remember the last rotation time and position
      checkAndRotateFeatured(allFeatured);
    } catch (error) {
      console.error('Error fetching featured campaigns:', error);
      setAllFeaturedCampaigns([]);
      setFeaturedCampaigns([]);
    } finally {
      setLoadingFeatured(false);
    }
  };
  
  // Check if we need to rotate featured campaigns based on time
  const checkAndRotateFeatured = (campaigns) => {
    if (!campaigns || campaigns.length <= 3) {
      // No need to rotate if we have 3 or fewer
      setFeaturedCampaigns(campaigns || []);
      return;
    }
    
    // Get current timestamp and last rotation time from localStorage
    const currentTime = Date.now();
    const lastRotationTime = localStorage.getItem('lastFeaturedRotation') 
      ? parseInt(localStorage.getItem('lastFeaturedRotation')) 
      : 0;
    
    // Get current offset from localStorage or use 0
    let offset = localStorage.getItem('featuredOffset') 
      ? parseInt(localStorage.getItem('featuredOffset')) 
      : 0;
      
    // Check if it's time to rotate (24 hours = 86400000 ms)
    // For development, we can rotate more frequently: 1 hour = 3600000 ms
    // Uncommment for faster rotation during development:
    // const rotationInterval = 3600000; // 1 hour
    
    const rotationInterval = 86400000; // 24 hours
    
    if (currentTime - lastRotationTime >= rotationInterval) {
      // Time to rotate - update the offset
      offset = (offset + 3) % campaigns.length;
      
      // Save the new offset and time to localStorage
      localStorage.setItem('featuredOffset', offset.toString());
      localStorage.setItem('lastFeaturedRotation', currentTime.toString());
    }
    
    // Update featured campaigns with current offset
    updateFeaturedCampaigns(campaigns, offset);
  };
  
  // Update the featured campaigns based on the offset
  const updateFeaturedCampaigns = (allCampaigns, offset) => {
    if (!allCampaigns || allCampaigns.length === 0) return;
    
    setFeaturedOffset(offset);
    
    // Get 3 campaigns starting from the offset, wrapping around if needed
    const featured = [];
    for (let i = 0; i < 3; i++) {
      const index = (offset + i) % allCampaigns.length;
      featured.push(allCampaigns[index]);
    }
    
    setFeaturedCampaigns(featured);
  };
  
  // Fetch campaigns with current filters
  const fetchCampaigns = async () => {
    // Clear campaigns before loading new data to avoid any potential overlap
    setCampaigns([]);
    
    try {
      let result;
      
      if (searchTerm && searchTerm.trim()) {
        console.log("Performing search with term:", searchTerm.trim());
        
        // Use search endpoint when search term is provided
        result = await searchCampaigns(searchTerm.trim(), {
          page: pagination.page,
          limit: pagination.limit,
          sortBy: getSortByValue(),
          sortOrder: getSortOrderValue(),
          category: activeCategory !== 'All Campaigns' ? activeCategory : null
        });
        
        console.log("Search results:", result ? `Found ${result.campaigns?.length || 0} campaigns` : "No results");
      } else {
        // For regular view, specifically request non-featured campaigns on first page
        const featuredParam = (filters.displayMode === 'regular' && 
                              pagination.page === 1 && 
                              !filters.urgentOnly && 
                              activeCategory === 'All Campaigns') 
                              ? false  // Explicitly request NON-featured campaigns
                              : null;  // Otherwise get all campaigns
        
        // Use regular campaigns endpoint otherwise
        result = await getAllCampaigns({
          page: pagination.page,
          limit: pagination.limit,
          sortBy: getSortByValue(),
          sortOrder: getSortOrderValue(),
          category: activeCategory !== 'All Campaigns' ? activeCategory : null,
          urgentOnly: filters.urgentOnly,
          featured: featuredParam // Use the determined featured parameter
        });
      }
      
      if (!result || !result.campaigns) {
        console.error("Invalid result format:", result);
        setCampaigns([]);
        setTotalCampaigns(0);
        return;
      }
      
      console.log('Fetched campaigns:', result.campaigns ? result.campaigns.length : 0);
      
      // Ensure we have unique campaigns based on ID
      const campaignsToDisplay = result.campaigns || [];
      
      setCampaigns(campaignsToDisplay);
      setPagination(result.pagination || {
        page: 1,
        limit: 9,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
      setTotalCampaigns(result.total || 0);
      
      // If we're in regular mode and on page 1 without filters,
      // we need to make sure the pagination counts are correct by accounting for featured campaigns
      if (filters.displayMode === 'regular' && 
          pagination.page === 1 && 
          !searchTerm && 
          !filters.urgentOnly && 
          activeCategory === 'All Campaigns') {
        
        // Adjust the total pages calculation to account for featured campaigns
        const totalItemsWithFeatured = result.total + featuredCampaigns.length;
        const totalPagesWithFeatured = Math.ceil(totalItemsWithFeatured / pagination.limit);
        
        // Only update if different to avoid unnecessary re-renders
        if (totalPagesWithFeatured !== pagination.totalPages) {
          setPagination(prev => ({
            ...prev,
            totalPages: totalPagesWithFeatured,
            hasNextPage: prev.page < totalPagesWithFeatured
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
      setTotalCampaigns(0);
    }
  };

  // Fetch curated campaigns of different types
  const fetchCuratedCampaigns = async () => {
    setLoadingCurated(true);
    try {
      // Featured campaigns already fetched separately
      
      // Campaigns ending soon
      const endingSoonResult = await getAllCampaigns({
        limit: 3,
        sortBy: 'endDate',
        sortOrder: 'asc'
      });
      setEndingSoonCampaigns(endingSoonResult.campaigns || []);
      
      // Campaigns with least funding
      const leastFundedResult = await getAllCampaigns({
        limit: 3,
        sortBy: 'amountRaised',
        sortOrder: 'asc'
      });
      setLeastFundedCampaigns(leastFundedResult.campaigns || []);
    } catch (error) {
      console.error('Error fetching curated campaigns:', error);
    } finally {
      setLoadingCurated(false);
    }
  };
  
  // Helper function to convert UI sort options to API parameters
  const getSortByValue = () => {
    switch (filters.sortOrder) {
      case 'newest':
        return 'createdAt';
      case 'oldest':
        return 'createdAt';
      case 'most-funded':
        return 'amountRaised';
      case 'least-funded':
        return 'amountRaised';
      case 'least-time':
        return 'endDate';
      default:
        return 'createdAt';
    }
  };
  
  // Helper function to determine sort direction
  const getSortOrderValue = () => {
    return ['oldest', 'least-funded'].includes(filters.sortOrder) ? 'asc' : 'desc';
  };
  
  // Update URL parameters to match current state (for bookmarking/sharing)
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    
    // Only add parameters that differ from defaults
    if (activeCategory !== 'All Campaigns') {
      params.set('category', activeCategory);
    }
    
    if (pagination.page > 1) {
      params.set('page', pagination.page);
    }
    
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    
    if (filters.urgentOnly) {
      params.set('urgent', 'true');
    }
    
    if (filters.sortOrder !== 'newest') {
      params.set('sort', filters.sortOrder);
    }

    if (filters.displayMode !== 'regular') {
      params.set('display', filters.displayMode);
    }
    
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.pushState({}, '', newUrl);
  };
  
  // Handle search and filter changes
  const handleSearch = (term, newFilters = {}) => {
    setSearchTerm(term);
    
    if (Object.keys(newFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
    
    // Reset to first page on new search
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Clear current campaigns to show loading state
    setCampaigns([]);
    
    // Log search terms for debugging
    console.log("Search initiated with term:", term);
  };
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    
    // Reset to first page on category change
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    // Clear campaigns before loading new page to avoid any potential overlap
    setCampaigns([]);
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle display mode change
  const handleDisplayModeChange = (mode) => {
    setFilters(prev => ({ ...prev, displayMode: mode }));
    
    // If switching to regular mode, make sure we have featured campaigns
    if (mode === 'regular' && allFeaturedCampaigns.length === 0) {
      fetchAllFeaturedCampaigns();
    }
    
    // Fetch curated campaigns if switching to mixed or curated mode
    if ((mode === 'mixed' || mode === 'curated') && 
        (featuredCampaigns.length === 0 && endingSoonCampaigns.length === 0 && leastFundedCampaigns.length === 0)) {
      fetchCuratedCampaigns();
    }
  };
  
  // Fetch campaigns when filters or pagination changes
  useEffect(() => {
    const fetchData = async () => {
      // Set loading to provide visual feedback when changing pages
      setCampaigns([]);
      await fetchCampaigns();
      updateUrlParams();
    };
    
    fetchData();
    
    // Log current state for debugging
    console.log('Current state:', {
      mode: filters.displayMode,
      page: pagination.page,
      hasFeatured: featuredCampaigns.length > 0,
      regularCount: campaigns.length,
      searchTerm,
      activeCategory,
      urgentOnly: filters.urgentOnly
    });
  }, [activeCategory, searchTerm, filters, pagination.page, pagination.limit]);

  // Debug function to view what campaigns should be displayed
  useEffect(() => {
    if (filters.displayMode === 'regular') {
      const combinedCampaigns = getRegularViewCampaigns();
      console.log('Combined campaigns:', {
        total: combinedCampaigns.length,
        featured: featuredCampaigns.length,
        regular: campaigns.length,
        finalTotal: combinedCampaigns.length
      });
    }
  }, [campaigns, featuredCampaigns, filters.displayMode]);

  // Render a curated section
  const renderCuratedSection = (title, description, campaigns, loading) => {
    return (
      <motion.div 
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
        </div>
        <CampaignList campaigns={campaigns} loading={loading} />
      </motion.div>
    );
  };
  
  // Combine featured campaigns with regular campaigns for the regular view
  const getRegularViewCampaigns = () => {
    // If we're searching or have filters, don't include featured campaigns at the top
    if (searchTerm || filters.urgentOnly || activeCategory !== 'All Campaigns' || pagination.page > 1) {
      console.log('Returning regular campaigns only due to filters:', campaigns.length);
      return campaigns;
    }
    
    // Filter out any campaigns that don't have an id
    const validFeaturedCampaigns = featuredCampaigns.filter(campaign => campaign && campaign.id);
    
    // If no valid featured campaigns, just return regular campaigns
    if (validFeaturedCampaigns.length === 0) {
      console.log('No valid featured campaigns, returning regular campaigns only:', campaigns.length);
      return campaigns;
    }
    
    // At this point, we want to show featured campaigns first, then regular campaigns
    console.log(`Displaying ${validFeaturedCampaigns.length} featured campaigns followed by ${campaigns.length} regular campaigns`);
    
    // Show featured campaigns at the top of page 1 only in regular view
    const combined = [...validFeaturedCampaigns, ...campaigns];
    console.log('Combined campaigns count:', combined.length);
    return combined;
  };

  // Debug info removed for cleaner UI

  return (
    <>
      <SEO 
        title="Explore Campaigns" 
        description="Discover and support various causes across Nepal. Find campaigns for education, healthcare, disaster relief, and more."
        keywords="explore campaigns Nepal, donation projects, Nepal fundraising, support Nepal causes"
      />
      
      <div className="bg-gray-50 dark:bg-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Hero Section with Background Image */}
          <div className="relative mb-12 rounded-xl overflow-hidden">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "linear-gradient(rgba(128, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url('http://127.0.0.1:9000/mybucket/uploads/flux-kontext-pro_A_highly_realistic_a.png')"
              }}
            ></div>
            
            {/* Content Overlay */}
            <motion.div 
              className="relative z-10 text-center py-16 md:py-20 px-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold mb-6 text-white">
                Explore Campaigns
              </h1>
              <p className="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed">
                Discover initiatives that are changing lives across Nepal and join the movement by supporting these causes.
              </p>
            </motion.div>
          </div>
          
          <div className="mb-6 flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm inline-flex p-2 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleDisplayModeChange('mixed')}
                className={`px-5 py-2 text-sm rounded-md font-medium ${
                  filters.displayMode === 'mixed' 
                    ? 'bg-[#800000] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Mixed View
              </button>
              <button
                onClick={() => handleDisplayModeChange('curated')}
                className={`px-5 py-2 text-sm rounded-md font-medium ${
                  filters.displayMode === 'curated' 
                    ? 'bg-[#800000] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Curated View
              </button>
              <button
                onClick={() => handleDisplayModeChange('regular')}
                className={`px-5 py-2 text-sm rounded-md font-medium ${
                  filters.displayMode === 'regular' 
                    ? 'bg-[#800000] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Regular View
              </button>
            </div>
          </div>
          
          <CampaignFilters 
            activeCategory={activeCategory} 
            setActiveCategory={handleCategoryChange} 
            onSearch={handleSearch}
            initialSearchTerm={searchTerm}
            initialFilters={filters}
            categories={categories}
            categoriesLoading={categoriesLoading}
          />
          
          {filters.displayMode === 'mixed' && !searchTerm && !filters.urgentOnly && activeCategory === 'All Campaigns' && (
            <>
              {renderCuratedSection(
                "Featured Campaigns", 
                "Campaigns that are making significant impacts and deserve special attention.",
                featuredCampaigns,
                loadingFeatured
              )}
              
              {renderCuratedSection(
                "Ending Soon", 
                "These campaigns are close to their deadline and need your support.",
                endingSoonCampaigns,
                loadingCurated
              )}
              
              {renderCuratedSection(
                "Needs More Support", 
                "Campaigns that have received the least funding and need your help.",
                leastFundedCampaigns,
                loadingCurated
              )}
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 dark:text-white">More Campaigns</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Discover other worthy causes that need your support.</p>
              </div>
            </>
          )}
          
          {filters.displayMode === 'curated' && !searchTerm && !filters.urgentOnly && activeCategory === 'All Campaigns' ? (
            <>
              {renderCuratedSection(
                "Featured Campaigns", 
                "Campaigns that are making significant impacts and deserve special attention.",
                featuredCampaigns,
                loadingFeatured
              )}
              
              {renderCuratedSection(
                "Ending Soon", 
                "These campaigns are close to their deadline and need your support.",
                endingSoonCampaigns,
                loadingCurated
              )}
              
              {renderCuratedSection(
                "Needs More Support", 
                "Campaigns that have received the least funding and need your help.",
                leastFundedCampaigns,
                loadingCurated
              )}
            </>
          ) : (
            <>
              {/* Show a featured section header on page 1 without filters in regular view */}
              {filters.displayMode === 'regular' && !searchTerm && !filters.urgentOnly && activeCategory === 'All Campaigns' && pagination.page === 1 && featuredCampaigns.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white">Featured Campaigns</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Campaigns that are making significant impacts and deserve special attention.</p>
                  {allFeaturedCampaigns.length > 3 && (
                    <p className="text-gray-500 dark:text-gray-500 text-sm mb-2">
                      Showing 3 of {allFeaturedCampaigns.length} featured campaigns. Featured campaigns rotate daily.
                    </p>
                  )}
                  <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700 mb-6"></div>
                </div>
              )}
              
              {/* Display explanation if in regular mode and no featured campaigns are showing */}
              {filters.displayMode === 'regular' && !searchTerm && !filters.urgentOnly && 
                activeCategory === 'All Campaigns' && pagination.page === 1 && 
                featuredCampaigns.length === 0 && campaigns.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-md mb-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    No featured campaigns are currently available. Showing regular campaigns instead.
                  </p>
                </div>
              )}
              
              {/* Main campaign listing */}
              <CampaignList 
                campaigns={filters.displayMode === 'regular' ? getRegularViewCampaigns() : campaigns} 
                loading={loading || (filters.displayMode === 'regular' && pagination.page === 1 && !searchTerm && !filters.urgentOnly && activeCategory === 'All Campaigns' && loadingFeatured)} 
              />
              
              {/* Show a visual separator between featured and regular campaigns */}
              {filters.displayMode === 'regular' && !searchTerm && !filters.urgentOnly && 
                activeCategory === 'All Campaigns' && pagination.page === 1 && 
                featuredCampaigns.length > 0 && campaigns.length > 0 && (
                <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700 my-8">
                  <div className="text-center bg-white dark:bg-gray-800 px-4 py-1 inline-block relative" style={{ top: '-0.75rem', left: '50%', transform: 'translateX(-50%)' }}>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Regular Campaigns</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Show pagination and campaign count */}
          {!loading && !loadingFeatured && getRegularViewCampaigns().length > 0 && filters.displayMode !== 'curated' && (
            <div className="mt-10">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Showing {getRegularViewCampaigns().length} {getRegularViewCampaigns().length === 1 ? 'campaign' : 'campaigns'} {filters.displayMode === 'regular' && !searchTerm && !filters.urgentOnly && activeCategory === 'All Campaigns' && pagination.page === 1 ? `(including ${featuredCampaigns.length} featured)` : ''} of {totalCampaigns + (pagination.page === 1 && !searchTerm && !filters.urgentOnly && activeCategory === 'All Campaigns' ? featuredCampaigns.length : 0)} total
              </p>
              
              {pagination.totalPages > 1 && (
                <Pagination 
                  currentPage={pagination.page} 
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          )}
          
          {!loading && !loadingFeatured && getRegularViewCampaigns().length === 0 && !(filters.displayMode === 'curated' && !searchTerm && !filters.urgentOnly && activeCategory === 'All Campaigns') && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">😕</div>
              <h3 className="text-xl font-medium mb-2 dark:text-white">No campaigns found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? `No results found for "${searchTerm}". Try different keywords or filters.` 
                  : `No campaigns found in this category. Check back soon or explore other categories.`}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('All Campaigns');
                  setFilters({
                    urgentOnly: false,
                    sortOrder: 'newest',
                    displayMode: 'regular'
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                View all campaigns
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Explore;
