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
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { getRotatingFeaturedCampaigns } = useCampaigns();
  const { categories, loading: categoriesLoading } = useCategories();
  const rotationIntervalRef = useRef(null);
  const isAnimatingRef = useRef(false); // Reference to track animation state without re-rendering
  const isFetchingRef = useRef(false); // Reference to track fetching state
  
  // Update refs whenever state changes
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);
  
  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  // Fetch rotating featured campaigns dynamically with offset-based rotation
  const fetchFeaturedCampaigns = async (offset = 0) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('[Rotation] Fetch already in progress, skipping...');
      return false;
    }
    
    setIsFetching(true);
    isFetchingRef.current = true;
    
    try {
      console.log(`[Rotation] Fetching campaigns for category: ${activeCategory}, offset: ${offset}`);
      const result = await getRotatingFeaturedCampaigns({
        offset, // Use offset for rotation instead of page
        category: activeCategory !== 'All Campaigns' ? activeCategory : null
      });
      
      if (result.campaigns && result.campaigns.length > 0) {
        console.log(`[Rotation] Received ${result.campaigns.length} campaigns (strategy: ${result.strategy})`);
        
        // Update state with new campaigns
        setCampaigns(result.campaigns);
        setTotalCampaigns(result.total);
        setHasMore(result.hasMore);
        setCurrentOffset(result.nextOffset); // Store next offset for next rotation
        
        return true;
      } else {
        console.log(`[Rotation] No campaigns received for category ${activeCategory}`);
        setCampaigns([]);
        setHasMore(false);
        return false;
      }
    } catch (error) {
      console.error("[Rotation] Error fetching featured campaigns:", error);
      return false;
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  };
  
  // Initial fetch when category changes
  useEffect(() => {
    let isMounted = true;
    
    const initialFetch = async () => {
      setLoading(true);
      setCurrentOffset(0); // Reset offset when category changes
      
      const success = await fetchFeaturedCampaigns(0);
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initialFetch();
    
    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  // Auto-rotate featured campaigns with dynamic fetching
  useEffect(() => {
    // Clear any existing interval first
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
    
    // Don't set up auto-rotation if we don't have campaigns, are loading, or no more campaigns to rotate
    if (loading || !hasMore || campaigns.length === 0) {
      console.log('[Rotation] Skipping setup:', { loading, hasMore, campaignCount: campaigns.length });
      return;
    }
    
    console.log(`[Rotation] Setting up auto-rotation for category: ${activeCategory}`);
    
    // Set up auto-rotation with initial delay for page stabilization
    const timeoutId = setTimeout(() => {
      rotationIntervalRef.current = setInterval(async () => {
        // Check if we're already animating or fetching to prevent overlaps
        if (isAnimatingRef.current || isFetchingRef.current) {
          console.log('[Rotation] Skipping - animation or fetch in progress');
          return;
        }
        
        console.log('[Rotation] Starting rotation cycle...');
        
        // Set animation flag
        setIsAnimating(true);
        
        // Small delay before fetch to allow animation to start
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fetch next set of campaigns using stored offset
        const success = await fetchFeaturedCampaigns(currentOffset);
        
        // Reset animation flag after fetch completes and animation time passes
        setTimeout(() => {
          setIsAnimating(false);
        }, 800); // Animation cooldown
        
      }, 6000); // 6 seconds between rotations for good visibility
    }, 2000); // Initial delay for DOM stability
    
    // Cleanup timers
    return () => {
      clearTimeout(timeoutId);
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [loading, hasMore, currentOffset, activeCategory]); // Re-setup when these change

  // Manual rotation function for user interaction
  const rotateCampaigns = async () => {
    if (isAnimating || isFetching || !hasMore) {
      console.log('[Manual Rotation] Blocked:', { isAnimating, isFetching, hasMore });
      return;
    }
    
    setIsAnimating(true);
    
    // Fetch next set
    await fetchFeaturedCampaigns(currentOffset);
    
    // Reset animation flag
    setTimeout(() => {
      setIsAnimating(false);
    }, 800);
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
          
          /* Tablet and Mobile specific styles - FIXED for iPad and mobile */
          @media (max-width: 1023px) {
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
            
            .desktop-carousel {
              display: none !important;
            }
          }
          
          /* Desktop specific styles */
          @media (min-width: 1024px) {
            .mobile-carousel {
              display: none !important;
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
                <div className="desktop-carousel relative w-full hidden lg:block" style={{ height: '500px' }}>
                  <AnimatePresence mode="wait" initial={false}>
                    {campaigns.map((campaign, index) => (
                      <motion.div
                        key={`card-${campaign._id}-${currentOffset}-${index}`}
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
                
                {/* Tablet and Mobile view with responsive grid layout */}
                <div className="lg:hidden mobile-carousel">
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
