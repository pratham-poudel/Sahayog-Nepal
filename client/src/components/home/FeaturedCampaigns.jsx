import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import CampaignCard from '../campaigns/CampaignCard';
import useCampaigns from '../../hooks/useCampaigns';
import useCategories from '../../hooks/useCategories';

const FeaturedCampaigns = () => {
  const [activeCategory, setActiveCategory] = useState('All Campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { getRotatingFeaturedCampaigns } = useCampaigns();
  const { categories, loading: categoriesLoading } = useCategories();
  const rotationIntervalRef = useRef(null);
  const isAnimatingRef = useRef(false); // Reference to track animation state without re-rendering
  const allCampaignsRef = useRef([]);
  const totalFetchedRef = useRef(0);
  
  // Update ref whenever isAnimating changes
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  // Fetch rotating featured campaigns from our dedicated endpoint
  useEffect(() => {
    let isMounted = true; // Track component mounted state
    const fetchFeaturedCampaigns = async () => {
      setLoading(true);
      // Reset pagination when category changes
      setCurrentPage(1);
      setHasMore(true);
      totalFetchedRef.current = 0;
      
      try {
        console.log(`Fetching campaigns for category ${activeCategory}`);
        const result = await getRotatingFeaturedCampaigns({
          count: 9, // Get 9 campaigns at once to rotate through
          page: 1,  // Start with page 1
          category: activeCategory !== 'All Campaigns' ? activeCategory : null
        });
        
        if (!isMounted) return; // Don't update state if unmounted
        
        if (result.campaigns && result.campaigns.length > 0) {
          console.log(`Received ${result.campaigns.length} campaigns (fallback: ${result.isFallback || false})`);
          // Store all campaigns in ref and display first 3
          allCampaignsRef.current = result.campaigns;
          totalFetchedRef.current = result.campaigns.length;
          const initialCampaigns = result.campaigns.slice(0, 3);
          setCampaigns(initialCampaigns);
          
          // Check if there might be more campaigns to fetch later
          setHasMore(result.campaigns.length >= 9 || (result.pagination && result.pagination.hasNextPage));
        } else {
          console.log(`No campaigns received for category ${activeCategory}`);
          setCampaigns([]);
          allCampaignsRef.current = [];
          setHasMore(false);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching featured campaigns:", error);
        setCampaigns([]);
        allCampaignsRef.current = [];
        setHasMore(false);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedCampaigns();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [activeCategory]); // Only re-fetch when category changes

  // Function to fetch more campaigns when needed
  const fetchMoreCampaigns = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      console.log(`Fetching more campaigns for page ${nextPage}`);
      const result = await getRotatingFeaturedCampaigns({
        count: 9,
        page: nextPage,
        category: activeCategory !== 'All Campaigns' ? activeCategory : null
      });
      
      if (result.campaigns && result.campaigns.length > 0) {
        console.log(`Received ${result.campaigns.length} additional campaigns`);
        // Append new campaigns to existing ones
        allCampaignsRef.current = [...allCampaignsRef.current, ...result.campaigns];
        totalFetchedRef.current += result.campaigns.length;
        
        // Check if there might be more campaigns based on pagination
        setHasMore(result.pagination ? result.pagination.hasNextPage : result.campaigns.length >= 9);
        setCurrentPage(nextPage);
      } else {
        console.log('No more campaigns available');
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching more campaigns:", error);
      setHasMore(false); // Stop trying to fetch more on error
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Auto-rotate featured campaigns with smoother animation and debouncing
  useEffect(() => {
    // Clear any existing interval first
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
    
    // Don't set up auto-rotation if we don't have enough campaigns or are loading
    if (!allCampaignsRef.current || allCampaignsRef.current.length <= 3 || loading) {
      console.log('Skipping rotation setup:', {
        campaignCount: allCampaignsRef.current?.length || 0,
        loading,
        hasEnoughCampaigns: allCampaignsRef.current?.length > 3
      });
      return;
    }
    
    console.log(`Setting up auto-rotation for ${allCampaignsRef.current.length} campaigns`);
    
    // Set up auto-rotation with a delay to allow for initial page stabilization
    const timeoutId = setTimeout(() => {
      // Use a longer interval for better readability
      rotationIntervalRef.current = setInterval(() => {
        // Check if we're already in an animation to prevent overlapping animations
        if (!isAnimatingRef.current && allCampaignsRef.current.length > 3) {
          console.log('Auto-rotating campaigns...');
          // Set animation flag before any state changes to prevent race conditions
          setIsAnimating(true);
          
          // Calculate next index and prepare next campaigns set
          setCurrentIndex(prevIndex => {
            const totalCampaigns = allCampaignsRef.current.length;
            // Ensure we have valid range even if total campaigns change
            const nextIndex = totalCampaigns > 3 
              ? (prevIndex + 1) % (totalCampaigns - 2)
              : 0;
            
            console.log(`Rotating from index ${prevIndex} to ${nextIndex} (total: ${totalCampaigns})`);
            
            // Check if we need to fetch more campaigns
            // If we're more than 70% through our already fetched campaigns
            if (hasMore && !isLoadingMore && nextIndex > totalCampaigns * 0.7) {
              console.log('Triggering background fetch for more campaigns');
              // Fetch more campaigns in background without blocking the rotation
              fetchMoreCampaigns();
            }
            
            // Create a fresh array to trigger proper re-renders
            const nextCampaigns = [];
            for (let i = 0; i < 3; i++) {
              const idx = (nextIndex + i) % totalCampaigns;
              nextCampaigns.push({...allCampaignsRef.current[idx]}); // Clone for immutability
            }
            
            // Update campaigns state with next batch
            setCampaigns(nextCampaigns);
            return nextIndex;
          });
          
          // Add a longer animation cooldown period to ensure smooth transitions
          // This ensures animations complete fully before the next rotation
          setTimeout(() => {
            setIsAnimating(false);
          }, 1200); // Even longer cooldown for smoother experience
        } else if (isAnimatingRef.current) {
          console.log('Skipping rotation - animation in progress');
        } else {
          console.log('Skipping rotation - not enough campaigns');
        }
      }, 6000); // 6 seconds for better visibility of each campaign set
    }, 2000); // Longer initial delay to ensure DOM is fully rendered and stable
    
    // Cleanup all timers to prevent memory leaks
    return () => {
      clearTimeout(timeoutId);
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [loading, hasMore, isLoadingMore]); // Added dependencies related to fetch-more functionality

  // Reset rotation when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  // Manual rotation function (in case you want to manually trigger it)
  const rotateCampaigns = () => {
    if (isAnimating || loading || allCampaignsRef.current.length <= 3) return;
    
    // Set animation flag to prevent overlapping animations
    setIsAnimating(true);
    
    // Optimized rotation logic with proper cloning for state updates
    setCurrentIndex(prevIndex => {
      const totalCampaigns = allCampaignsRef.current.length;
      const nextIndex = (prevIndex + 1) % (totalCampaigns - 2);
      
      // Check if we need to fetch more campaigns
      // If we're more than 70% through our already fetched campaigns
      if (hasMore && !isLoadingMore && nextIndex > totalCampaigns * 0.7) {
        // Fetch more campaigns in background without blocking the rotation
        fetchMoreCampaigns();
      }
      
      // Create a fresh array with cloned objects for proper reactivity
      const nextCampaigns = [];
      for (let i = 0; i < 3; i++) {
        const idx = (nextIndex + i) % totalCampaigns;
        // Clone objects to ensure React detects the changes
        nextCampaigns.push({...allCampaignsRef.current[idx]});
      }
      
      setCampaigns(nextCampaigns);
      return nextIndex;
    });
    
    // Extended animation cooldown with a safety buffer
    setTimeout(() => {
      setIsAnimating(false);
    }, 1200); // Match the auto-rotation cooldown for consistency
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
      <style>
        {`
          .carousel-container {
            position: relative;
            overflow: hidden;
            min-height: 500px;
          }
          
          .carousel-card {
            transition: opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1.0), transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.0), box-shadow 0.5s cubic-bezier(0.25, 0.1, 0.25, 1.0);
            will-change: opacity, transform;
          }
          
          .carousel-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(139, 35, 37, 0.15);
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
          
          /* Mobile specific styles - FIXED for full card display */
          @media (max-width: 768px) {
            .carousel-container {
              min-height: auto;
            }
            
            .mobile-carousel {
              display: flex;
              flex-direction: column;
              gap: 20px;
              padding: 8px 0;
            }
            
            .mobile-card {
              width: 100%;
              margin: 0;
              height: auto;
              position: relative !important; 
              left: auto !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
        `}
      </style>
      <div className="container mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 rounded-full mb-6">
            <span className="text-sm text-[#8B2325] dark:text-red-400 font-medium tracking-wide">
              Stories That Need You
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Lives Waiting to Change
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Behind every campaign is a family with hope, a child with dreams, or a community seeking a better tomorrow.
          </p>
        </motion.div>

        <div className="relative mb-10">
          {/* Left shadow indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
          
          {/* Right shadow indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex overflow-x-auto py-4 space-x-3 px-2 md:px-4 scrollbar-hide no-scrollbar md:justify-center">
            <div className="flex space-x-3 px-2 md:px-0">
              {categories.map((category, index) => (
                <motion.button
                  key={index}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full font-medium text-sm ${
                    activeCategory === category 
                      ? 'bg-[#8B2325] text-white shadow-lg' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#8B2325]/30'
                  } flex-shrink-0 transition-all duration-300`}
                  onClick={() => setActiveCategory(category)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-12 h-12 border-4 border-[#8B2325] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {campaigns.length > 0 ? (
              <div className="carousel-container relative mb-8">
                {/* No navigation buttons for minimalist design */}
                
                {/* Campaign cards - smoother minimalist animation */}
                {/* Desktop view with fixed positioning for smooth animations */}
                <div className="relative w-full hidden md:block" style={{ height: '500px' }}>
                  <AnimatePresence mode="wait" initial={false}>
                    {campaigns.map((campaign, index) => (
                      <motion.div
                        key={`card-${campaign._id}-${currentIndex}-${index}`}
                        className="carousel-card bg-white p-3 rounded-xl shadow-lg overflow-hidden"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: index === 0 ? '0' : index === 1 ? 'calc(33.33% + 8px)' : 'calc(66.66% + 16px)',
                          width: 'calc(33.33% - 16px)',
                          height: '480px' // Fixed height slightly less than container for padding
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1,
                          transition: { 
                            duration: 0.8,
                            ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier for smoother transition
                          }
                        }}
                        exit={{ 
                          opacity: 0,
                          transition: { 
                            duration: 0.5,
                            ease: 'easeOut'
                          }
                        }}
                      >
                        {/* Removed display reason tag as requested */}
                        <CampaignCard campaign={campaign} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Mobile view with responsive grid layout */}
                <div className="md:hidden mobile-carousel">
                  <AnimatePresence initial={false}>
                    {campaigns.map((campaign, index) => (
                      <motion.div
                        key={`mobile-${campaign._id}-${index}`}
                        className="mobile-card carousel-card bg-white p-3 rounded-xl shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { 
                            duration: 0.5,
                            delay: index * 0.1 
                          }
                        }}
                      >
                        {/* Removed display reason tag as requested */}
                        <CampaignCard campaign={campaign} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Visual indicator for animation in progress */}
                {isAnimating && (
                  <div className="absolute inset-0 bg-black bg-opacity-5 z-5 pointer-events-none"></div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">No campaigns found for this category.</p>
              </div>
            )}
          </>
        )}

        {/* No pagination dots for minimalist design */}
      </div>
    </section>
  );
};

export default FeaturedCampaigns;
