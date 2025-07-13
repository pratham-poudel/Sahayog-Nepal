import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import config from '../../config';

// Memoized components for better performance
const BackgroundElements = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#8B2325]/10 to-[#D5A021]/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#D5A021]/10 to-[#8B2325]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
  </div>
));

const TitleSection = React.memo(() => (
  <motion.div 
    className="text-center mb-16"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <div className="relative inline-block">
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gradient-to-r from-[#8B2325] to-[#D5A021] rounded-full shadow-lg"></div>
      <h2 className="text-4xl md:text-5xl font-poppins font-bold mb-6 relative">
        <span className="bg-gradient-to-r from-[#8B2325] via-[#a32729] to-[#D5A021] bg-clip-text text-transparent">
          Top Donors
        </span>
        <span className="absolute -bottom-3 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#8B2325] to-transparent rounded-full"></span>
      </h2>
    </div>
    <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed">
      Meet the amazing people who are making a real difference in communities across Nepal.
    </p>
  </motion.div>
));

const LoadingSpinner = React.memo(() => (
  <div className="flex justify-center items-center py-20">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-[#8B2325]/20 border-t-[#8B2325] rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-[#D5A021] rounded-full animate-spin animate-reverse"></div>
    </div>
  </div>
));

const ScrollButton = React.memo(({ direction, canScroll, onClick }) => (
  <button
    onClick={onClick}
    disabled={!canScroll}
    className={`group p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
      canScroll 
        ? 'bg-gradient-to-r from-[#8B2325] to-[#a32729] hover:from-[#a32729] hover:to-[#8B2325] text-white shadow-lg hover:shadow-xl'
        : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed backdrop-blur-sm'
    }`}
  >
    <svg 
      className={`w-5 h-5 transition-transform duration-300 ${
        direction === 'left' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
      }`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d={direction === 'left' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} 
      />
    </svg>
  </button>
));

const DonorCard = React.memo(({ donor, index }) => {
  const formatAmount = useCallback((amount) => {
    if (amount >= 100000) return `रू ${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `रू ${(amount / 1000).toFixed(1)}K`;
    return `रू ${amount.toLocaleString()}`;
  }, []);

  const getDefaultAvatar = useCallback((name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=120`;
  }, []);

  const getProfilePictureUrl = useCallback((profilePicture) => {
    if (!profilePicture) return null;
    return `http://127.0.0.1:9000/mybucket/profiles/${profilePicture}`;
  }, []);

  const getRankBadgeColor = useCallback((rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-[#D5A021] to-yellow-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
    return 'bg-gradient-to-r from-[#8B2325] to-red-600 text-white';
  }, []);

  const getRankIcon = useCallback((rank) => {
    if (rank <= 3) return '★';
    return '●';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="flex-none w-80 group"
    >
      <div className="relative h-[480px] bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-700/80 dark:to-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-600/30 overflow-hidden hover:shadow-2xl hover:border-[#8B2325]/50 dark:hover:border-[#8B2325]/50 transition-all duration-300 hover:-translate-y-1 transform flex flex-col">
        
        {/* Simplified Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-white/40 to-white/20 dark:from-white/30 dark:to-white/10 rounded-full blur-sm"></div>
          <div className="absolute bottom-8 left-4 w-8 h-8 bg-gradient-to-br from-white/30 to-white/15 dark:from-white/20 dark:to-white/8 rounded-full blur-sm"></div>
        </div>
        
        {/* Rank Badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`${getRankBadgeColor(donor.rank)} rounded-xl px-3 py-1.5 text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm border border-white/20`}>
            <span className="text-sm">{getRankIcon(donor.rank)}</span>
            <span>#{donor.rank}</span>
          </div>
        </div>
        
        {/* Profile Section */}
        <div className="relative h-40 bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#8B2325] p-4 text-center overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-8 -translate-x-8"></div>
          </div>
          
          <div className="relative z-10">
            <div className="relative inline-block mb-2">
              <img
                src={getProfilePictureUrl(donor.donor.profilePicture) || getDefaultAvatar(donor.donor.name)}
                alt={donor.donor.name}
                className="w-16 h-16 rounded-full mx-auto border-3 border-white shadow-xl object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = getDefaultAvatar(donor.donor.name);
                }}
                loading="lazy"
              />
              <div className="absolute -bottom-1 -right-1">
                <div className="bg-gradient-to-r from-[#D5A021] to-yellow-400 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            </div>
            <h4 className="text-white font-bold text-base mb-1 truncate px-2">
              {donor.donor.name}
            </h4>
            <p className="text-white/90 text-xs bg-white/10 backdrop-blur-sm rounded-full px-2 py-1 inline-block">
              Since {new Date(donor.donor.createdAt).getFullYear()}
            </p>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="flex-1 p-4 bg-gradient-to-br from-white/60 to-white/40 dark:from-gray-700/60 dark:to-gray-800/40 backdrop-blur-sm flex flex-col">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center bg-gradient-to-br from-[#D5A021]/10 to-yellow-400/10 rounded-lg p-2.5 border border-[#D5A021]/20">
              <p className="text-lg font-bold bg-gradient-to-r from-[#D5A021] to-yellow-600 bg-clip-text text-transparent">
                {formatAmount(donor.totalDonated)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Total</p>
            </div>
            <div className="text-center bg-gradient-to-br from-[#8B2325]/10 to-red-500/10 rounded-lg p-2.5 border border-[#8B2325]/20">
              <p className="text-lg font-bold bg-gradient-to-r from-[#8B2325] to-red-600 bg-clip-text text-transparent">
                {donor.donationCount}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Donations</p>
            </div>
          </div>

          {/* Bio Section */}
          <div className="flex-1 mb-3 flex items-center">
            {donor.donor.bio ? (
              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-lg p-3 border border-gray-200/50 dark:border-gray-600/50 w-full">
                <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed line-clamp-3 italic">
                  "{donor.donor.bio}"
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-gray-200/50 dark:border-gray-600/50 w-full">
                <p className="text-gray-500 dark:text-gray-400 text-xs italic text-center">
                  "Making a difference ✨"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 text-xs">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>Last: {new Date(donor.lastDonation).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const TopDonors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const fetchTopDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${config.API_BASE_URL}/api/donors/top?limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setDonors(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch top donors');
      }
    } catch (err) {
      console.error('Error fetching top donors:', err);
      setError('Failed to fetch top donors');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const scroll = useCallback((direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Card width + gap
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    fetchTopDonors();
  }, [fetchTopDonors]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleScroll = () => updateScrollButtons();
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      updateScrollButtons(); // Initial check
      
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [updateScrollButtons, donors]);

  // Memoized error state component
  const errorState = useMemo(() => (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <BackgroundElements />
      <div className="container mx-auto px-4 relative z-10">
        <TitleSection />
        <div className="text-center py-20">
          <div className="text-6xl mb-6">⚠️</div>
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-700/50 p-6 max-w-md mx-auto">
            <p className="text-[#8B2325] dark:text-red-400 text-lg font-medium">{error}</p>
          </div>
        </div>
      </div>
    </section>
  ), [error]);

  // Memoized empty state component
  const emptyState = useMemo(() => (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <BackgroundElements />
      <div className="container mx-auto px-4 relative z-10">
        <TitleSection />
        <div className="text-center py-20">
          <div className="text-8xl mb-8">💝</div>
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl border border-pink-200/50 dark:border-pink-700/50 p-8 max-w-lg mx-auto">
            <p className="text-gray-600 dark:text-gray-400 text-xl font-medium">Be the first to make a difference!</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Your contribution can inspire others to join this noble cause.</p>
          </div>
        </div>
      </div>
    </section>
  ), []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        <BackgroundElements />
        <div className="container mx-auto px-4 relative z-10">
          <TitleSection />
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (error) {
    return errorState;
  }

  if (!donors || donors.length === 0) {
    return emptyState;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <BackgroundElements />
      
      <div className="container mx-auto px-4 relative z-10">
        <TitleSection />

        <div className="relative">
          {/* Simplified glassmorphism background */}
          <div className="absolute inset-0 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl"></div>
          
          <div className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
            
            {/* Scroll Controls */}
            <div className="flex justify-end gap-3 mb-6">
              <ScrollButton 
                direction="left" 
                canScroll={canScrollLeft} 
                onClick={() => scroll('left')} 
              />
              <ScrollButton 
                direction="right" 
                canScroll={canScrollRight} 
                onClick={() => scroll('right')} 
              />
            </div>
            
            {/* Donors Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {donors.map((donor, index) => (
                <DonorCard key={donor._id} donor={donor} index={index} />
              ))}
            </div>

            {/* Simplified fade effects */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/60 to-transparent dark:from-gray-800/60 pointer-events-none rounded-r-2xl"></div>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/60 to-transparent dark:from-gray-800/60 pointer-events-none rounded-l-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Set display names for better debugging
BackgroundElements.displayName = 'BackgroundElements';
TitleSection.displayName = 'TitleSection';
LoadingSpinner.displayName = 'LoadingSpinner';
ScrollButton.displayName = 'ScrollButton';
DonorCard.displayName = 'DonorCard';

export default TopDonors;
