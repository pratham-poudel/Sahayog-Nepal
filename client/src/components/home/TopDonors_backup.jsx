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
  const formatAmount = (amount) => {
    if (amount >= 100000) return `रू ${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `रू ${(amount / 1000).toFixed(1)}K`;
    return `रू ${amount.toLocaleString()}`;
  };

  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=120`;
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    return `http://127.0.0.1:9000/mybucket/profiles/${profilePicture}`;
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-[#D5A021] to-yellow-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
    return 'bg-gradient-to-r from-[#8B2325] to-red-600 text-white';
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) return '★';
    return '●';
  };

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
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#8B2325]/10 to-[#D5A021]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#D5A021]/10 to-[#8B2325]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#8B2325]/5 to-[#D5A021]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          {/* Enhanced Title Section */}
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

        {/* Enhanced Container */}
        <div className="relative">
          {/* Glassmorphism Background */}
          <div className="absolute inset-0 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-2xl"></div>
          
          <div className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-8 shadow-xl">
            {/* Enhanced Scroll Controls */}
            <div className="flex justify-end gap-3 mb-8">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`group p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  canScrollLeft 
                    ? 'bg-gradient-to-r from-[#8B2325] to-[#a32729] hover:from-[#a32729] hover:to-[#8B2325] text-white shadow-lg hover:shadow-xl' 
                    : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed backdrop-blur-sm'
                }`}
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`group p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  canScrollRight 
                    ? 'bg-gradient-to-r from-[#8B2325] to-[#a32729] hover:from-[#a32729] hover:to-[#8B2325] text-white shadow-lg hover:shadow-xl' 
                    : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed backdrop-blur-sm'
                }`}
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>            {/* Enhanced Donors Scroll Container */}
            <div 
              ref={scrollContainerRef}
              onScroll={updateScrollButtons}
              className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-6"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {donors.map((donor, index) => (                <motion.div
                  key={donor._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex-none w-80 group"
                >
                  <div className="relative h-[520px] bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-700/80 dark:to-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-600/30 overflow-hidden hover:shadow-2xl hover:border-[#8B2325]/50 dark:hover:border-[#8B2325]/50 transition-all duration-500 hover:-translate-y-2 transform flex flex-col">
                    
                    {/* Peaceful Balloon Animations */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {/* Balloon 1 - Large */}
                      <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 dark:from-white/20 dark:to-white/5 rounded-full blur-sm animate-floatBalloon1"></div>
                      
                      {/* Balloon 2 - Medium */}
                      <div className="absolute top-1/3 left-6 w-12 h-12 bg-gradient-to-br from-white/25 to-white/8 dark:from-white/15 dark:to-white/3 rounded-full blur-sm animate-floatBalloon2"></div>
                      
                      {/* Balloon 3 - Small */}
                      <div className="absolute bottom-1/4 right-8 w-8 h-8 bg-gradient-to-br from-white/35 to-white/12 dark:from-white/25 dark:to-white/8 rounded-full blur-sm animate-floatBalloon3"></div>
                      
                      {/* Balloon 4 - Medium */}
                      <div className="absolute bottom-8 left-4 w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 dark:from-white/12 dark:to-white/2 rounded-full blur-sm animate-floatBalloon4"></div>
                      
                      {/* Balloon 5 - Small */}
                      <div className="absolute top-1/2 right-2 w-6 h-6 bg-gradient-to-br from-white/40 to-white/15 dark:from-white/30 dark:to-white/10 rounded-full blur-sm animate-floatBalloon5"></div>
                      
                      {/* Gentle background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 dark:from-white/3 dark:via-transparent dark:to-white/3 animate-gentleGlow"></div>
                    </div>
                    
                    {/* Peaceful Balloon-like Floating Animations */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {/* Large peaceful balloon */}
                      <div 
                        className="absolute -top-20 -left-10 w-32 h-32 bg-gradient-to-br from-white/20 to-white/10 dark:from-white/10 dark:to-white/5 rounded-full blur-xl"
                        style={{
                          animation: 'floatBalloon1 8s ease-in-out infinite'
                        }}
                      ></div>
                      
                      {/* Medium balloon - right side */}
                      <div 
                        className="absolute top-10 -right-8 w-20 h-20 bg-gradient-to-bl from-white/15 to-white/8 dark:from-white/8 dark:to-white/3 rounded-full blur-lg"
                        style={{
                          animation: 'floatBalloon2 10s ease-in-out infinite 2s'
                        }}
                      ></div>
                      
                      {/* Small peaceful bubble - center */}
                      <div 
                        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-white/20 to-white/10 dark:from-white/12 dark:to-white/6 rounded-full blur-md"
                        style={{
                          animation: 'floatBalloon3 6s ease-in-out infinite 1s'
                        }}
                      ></div>
                      
                      {/* Tiny floating elements */}
                      <div 
                        className="absolute bottom-20 left-8 w-8 h-8 bg-gradient-to-tr from-white/25 to-white/15 dark:from-white/15 dark:to-white/8 rounded-full blur-sm"
                        style={{
                          animation: 'floatBalloon4 12s ease-in-out infinite 3s'
                        }}
                      ></div>
                      
                      <div 
                        className="absolute bottom-1/3 right-12 w-6 h-6 bg-gradient-to-bl from-white/30 to-white/20 dark:from-white/18 dark:to-white/10 rounded-full blur-sm"
                        style={{
                          animation: 'floatBalloon5 9s ease-in-out infinite 4s'
                        }}
                      ></div>
                      
                      {/* Extra subtle background glow */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/3 dark:to-transparent rounded-2xl"
                        style={{
                          animation: 'gentleGlow 15s ease-in-out infinite'
                        }}
                      ></div>
                    </div>
                    {/* Enhanced Rank Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <div className={`${getRankBadgeColor(donor.rank)} rounded-2xl px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm border border-white/20`}>
                        <span className="text-lg">{getRankIcon(donor.rank)}</span>
                        <span>#{donor.rank}</span>
                      </div>
                    </div>
                      {/* Enhanced Profile Section - Fixed Height */}
                    <div className="relative h-48 bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#8B2325] p-6 text-center overflow-hidden flex flex-col justify-center">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="relative inline-block mb-3">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#D5A021] to-yellow-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                          <img
                            src={getProfilePictureUrl(donor.donor.profilePicture) || getDefaultAvatar(donor.donor.name)}
                            alt={donor.donor.name}
                            className="relative w-20 h-20 rounded-full mx-auto border-4 border-white shadow-2xl object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.src = getDefaultAvatar(donor.donor.name);
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1">
                            <div className="bg-gradient-to-r from-[#D5A021] to-yellow-400 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          </div>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2 truncate">
                          {donor.donor.name}
                        </h4>
                        <p className="text-white/90 text-xs bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                          Member since {new Date(donor.donor.createdAt).getFullYear()}
                        </p>
                      </div>
                    </div>                    {/* Enhanced Stats Section - Fixed Height Layout */}
                    <div className="flex-1 p-6 bg-gradient-to-br from-white/60 to-white/40 dark:from-gray-700/60 dark:to-gray-800/40 backdrop-blur-sm flex flex-col">
                      {/* Stats Grid - Fixed Height */}
                      <div className="grid grid-cols-2 gap-4 h-20 mb-4">
                        <div className="text-center bg-gradient-to-br from-[#D5A021]/10 to-yellow-400/10 rounded-xl p-3 border border-[#D5A021]/20 flex flex-col justify-center">
                          <p className="text-xl font-bold bg-gradient-to-r from-[#D5A021] to-yellow-600 bg-clip-text text-transparent">
                            {formatAmount(donor.totalDonated)}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Total Donated</p>
                        </div>
                        <div className="text-center bg-gradient-to-br from-[#8B2325]/10 to-red-500/10 rounded-xl p-3 border border-[#8B2325]/20 flex flex-col justify-center">
                          <p className="text-xl font-bold bg-gradient-to-r from-[#8B2325] to-red-600 bg-clip-text text-transparent">
                            {donor.donationCount}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Donations</p>
                        </div>
                      </div>

                      {/* Bio Section - Fixed Height */}
                      <div className="h-20 mb-4 flex items-center">
                        {donor.donor.bio ? (
                          <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200/50 dark:border-gray-600/50 w-full h-full flex items-center">
                            <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed line-clamp-3 italic overflow-hidden">
                              "{donor.donor.bio}"
                            </p>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 border border-gray-200/50 dark:border-gray-600/50 w-full h-full flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400 text-xs italic">
                              "Making a difference with every donation ✨"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer - Fixed Height */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3 h-8 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Last donation: {new Date(donor.lastDonation).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Gradient Fade Effects */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 via-white/40 to-transparent dark:from-gray-800/80 dark:via-gray-800/40 pointer-events-none rounded-r-2xl"></div>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/80 via-white/40 to-transparent dark:from-gray-800/80 dark:via-gray-800/40 pointer-events-none rounded-l-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopDonors;
