import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import config from '../../config';

// Memoized components for better performance
const BackgroundElements = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Enhanced gradient backgrounds with professional touch */}
    <div className="absolute -top-96 -right-96 w-[600px] h-[600px] bg-gradient-to-br from-[#8B2325]/8 via-[#a32729]/5 to-[#D5A021]/8 rounded-full blur-3xl animate-float-balloon-1"></div>
    <div className="absolute -bottom-96 -left-96 w-[600px] h-[600px] bg-gradient-to-tr from-[#D5A021]/8 via-[#e5b43c]/5 to-[#8B2325]/8 rounded-full blur-3xl animate-float-balloon-2"></div>
    
    {/* Elegant accent elements */}
    <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-gradient-to-br from-[#8B2325]/5 to-transparent rounded-full blur-2xl animate-gentle-glow"></div>
    <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gradient-to-tr from-[#D5A021]/5 to-transparent rounded-full blur-2xl animate-gentle-glow delay-500"></div>
    
    {/* Subtle geometric patterns */}
    <div className="absolute top-10 right-20 w-2 h-2 bg-[#8B2325]/20 rounded-full animate-pulse"></div>
    <div className="absolute bottom-20 left-16 w-1 h-1 bg-[#D5A021]/30 rounded-full animate-pulse delay-1000"></div>
    <div className="absolute top-1/2 left-10 w-1.5 h-1.5 bg-[#8B2325]/15 rounded-full animate-pulse delay-2000"></div>
  </div>
));

const TitleSection = React.memo(() => (
  <motion.div 
    className="text-center mb-20"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    viewport={{ once: true }}
  >
    <div className="relative inline-block">
      {/* Premium decorative elements */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-[#8B2325] to-[#D5A021] rounded-full"></div>
          <div className="w-3 h-3 bg-gradient-to-br from-[#8B2325] to-[#D5A021] rounded-full shadow-lg"></div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-[#D5A021] via-[#8B2325] to-transparent rounded-full"></div>
        </div>
      </div>
      
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-poppins font-black mb-8 relative tracking-tight">
        <span className="bg-gradient-to-r from-[#8B2325] via-[#a32729] to-[#D5A021] bg-clip-text text-transparent drop-shadow-sm">
          Heroes of
        </span>
        <br />
        <span className="bg-gradient-to-r from-[#D5A021] via-[#e5b43c] to-[#8B2325] bg-clip-text text-transparent drop-shadow-sm">
          Change
        </span>
        
        {/* Elegant underline */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-[#8B2325] via-[#D5A021] to-[#8B2325] rounded-full shadow-md"></div>
      </h2>
    </div>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto"
    >
      <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-6 leading-relaxed font-medium">
        Discover the extraordinary individuals whose generosity is 
        <span className="text-[#8B2325] dark:text-[#e05759] font-semibold"> transforming lives </span>
        and building a stronger Nepal.
      </p>
      
      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-poppins">
        Your name could be here next. 
        <span className="text-[#D5A021] dark:text-[#e5b43c] font-semibold">Join the movement</span> 
        and become a beacon of hope for communities in need.
      </p>
    </motion.div>
    
    {/* Inspirational accent */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      viewport={{ once: true }}
      className="mt-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#8B2325]/10 to-[#D5A021]/10 border border-[#8B2325]/20 rounded-full"
    >
      <span className="text-2xl mr-3">🏆</span>
      <span className="text-[#8B2325] dark:text-[#e05759] font-semibold font-poppins">
        Recognition • Impact • Legacy
      </span>
    </motion.div>
  </motion.div>
));

const LoadingSpinner = React.memo(() => (
  <div className="flex flex-col justify-center items-center py-24">
    <div className="relative mb-6">
      {/* Main spinner rings */}
      <div className="w-20 h-20 border-4 border-[#8B2325]/20 border-t-[#8B2325] rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-[#D5A021] rounded-full animate-spin animate-reverse"></div>
      <div className="absolute inset-2 w-16 h-16 border-2 border-[#D5A021]/30 border-b-[#D5A021] rounded-full animate-spin delay-200"></div>
      
      {/* Center decoration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 bg-gradient-to-br from-[#8B2325] to-[#D5A021] rounded-full animate-pulse"></div>
      </div>
    </div>
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-center"
    >
      <p className="text-xl font-poppins font-semibold text-[#8B2325] dark:text-[#e05759] mb-2">
        Loading Heroes...
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Preparing something amazing for you
      </p>
    </motion.div>
  </div>
));

const ScrollButton = React.memo(({ direction, canScroll, onClick }) => (
  <button
    onClick={onClick}
    disabled={!canScroll}
    className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
      canScroll 
        ? 'bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#8B2325] hover:from-[#a32729] hover:via-[#8B2325] hover:to-[#a32729] text-white shadow-xl hover:shadow-2xl ring-2 ring-[#8B2325]/20 hover:ring-[#8B2325]/40'
        : 'bg-gray-200/80 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed backdrop-blur-sm'
    }`}
  >
    {canScroll && (
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    )}
    
    <svg 
      className={`w-6 h-6 relative z-10 transition-transform duration-300 ${
        direction === 'left' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
      }`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      strokeWidth={2.5}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d={direction === 'left' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} 
      />
    </svg>
    
    {canScroll && (
      <div className="absolute -inset-1 bg-gradient-to-br from-[#8B2325] to-[#D5A021] rounded-2xl opacity-20 blur-md group-hover:opacity-30 transition-opacity duration-300"></div>
    )}
  </button>
));

const DonorCard = React.memo(({ donor, index }) => {
  const formatAmount = useCallback((amount) => {
    if (amount >= 100000) return `रू ${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `रू ${(amount / 1000).toFixed(1)}K`;
    return `रू ${amount.toLocaleString()}`;
  }, []);

  const getDefaultAvatar = useCallback((name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B2325&color=fff&size=160&rounded=true&bold=true`;
  }, []);

  const getProfilePictureUrl = useCallback((profilePicture) => {
    if (!profilePicture) return null;
    return `http://127.0.0.1:9000/mybucket/profiles/${profilePicture}`;
  }, []);

  const getRankDecoration = useCallback((rank) => {
    if (rank === 1) return {
      crown: '👑',
      ringColor: 'ring-yellow-400/50',
      bgGradient: 'from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-800/20',
      accentColor: 'text-yellow-600 dark:text-yellow-400',
      badgeGradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      shadowColor: 'shadow-yellow-500/20'
    };
    if (rank === 2) return {
      crown: '🥈',
      ringColor: 'ring-gray-400/50',
      bgGradient: 'from-gray-50 via-slate-50 to-gray-100 dark:from-gray-800/20 dark:via-slate-800/20 dark:to-gray-700/20',
      accentColor: 'text-gray-600 dark:text-gray-400',
      badgeGradient: 'from-gray-400 via-slate-400 to-gray-500',
      shadowColor: 'shadow-gray-500/20'
    };
    if (rank === 3) return {
      crown: '🥉',
      ringColor: 'ring-amber-600/50',
      bgGradient: 'from-amber-50 via-orange-50 to-amber-100 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-800/20',
      accentColor: 'text-amber-700 dark:text-amber-400',
      badgeGradient: 'from-amber-600 via-orange-500 to-amber-700',
      shadowColor: 'shadow-amber-600/20'
    };
    return {
      crown: '⭐',
      ringColor: 'ring-[#8B2325]/30',
      bgGradient: 'from-rose-50 via-red-50 to-rose-100 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-800/20',
      accentColor: 'text-[#8B2325] dark:text-red-400',
      badgeGradient: 'from-[#8B2325] via-red-600 to-[#8B2325]',
      shadowColor: 'shadow-red-500/20'
    };
  }, []);

  const decoration = getRankDecoration(donor.rank);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      viewport={{ once: true }}
      className="flex-none w-96 group"
    >
      <div className={`relative h-[560px] bg-gradient-to-br ${decoration.bgGradient} backdrop-blur-xl rounded-3xl border-2 border-white/60 dark:border-gray-600/30 overflow-hidden hover:shadow-2xl ${decoration.shadowColor} hover:border-[#8B2325]/60 dark:hover:border-[#8B2325]/60 transition-all duration-500 hover:-translate-y-1 transform ring-4 ${decoration.ringColor} hover:ring-8 hover:ring-[#8B2325]/20`}>
        
        {/* Premium Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#8B2325]/10 to-[#D5A021]/10 rounded-full blur-2xl animate-float-balloon-3"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-[#D5A021]/10 to-[#8B2325]/10 rounded-full blur-2xl animate-float-balloon-4"></div>
          
          {/* Elegant pattern overlay */}
          <div className="absolute top-8 right-8 w-3 h-3 bg-[#8B2325]/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-12 left-8 w-2 h-2 bg-[#D5A021]/30 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-6 w-1.5 h-1.5 bg-[#8B2325]/15 rounded-full animate-pulse delay-1000"></div>
        </div>
          {/* Rank Crown & Badge */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1 animate-bounce">{decoration.crown}</span>
            <div className={`bg-gradient-to-r ${decoration.badgeGradient} text-white rounded-xl px-3 py-1.5 text-sm font-black shadow-xl border-2 border-white/30 backdrop-blur-sm`}>
              <span className="text-xs opacity-90">RANK</span>
              <div className="text-lg font-black leading-none">#{donor.rank}</div>
            </div>
          </div>
        </div>
        
        {/* Hero Profile Section */}
        <div className="relative h-56 bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#D5A021] p-6 text-center overflow-hidden flex flex-col justify-center mt-8">
          {/* Elegant background pattern */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/20 rounded-full"></div>
          </div>
          
          <div className="relative z-20">
            <div className="relative inline-block mb-4">
              <div className="relative">
                <img
                  src={donor.donor.profilePictureUrl || getDefaultAvatar(donor.donor.name)}
                  alt={donor.donor.name}
                  className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-2xl object-cover transition-transform duration-500 group-hover:scale-110 ring-4 ring-white/30"
                  onError={(e) => {
                    e.target.src = getDefaultAvatar(donor.donor.name);
                  }}
                  loading="lazy"
                />
                
                {/* Verification Badge */}
                <div className="absolute -bottom-2 -right-2">
                  <div className="bg-gradient-to-r from-[#D5A021] to-yellow-400 w-8 h-8 rounded-full border-3 border-white flex items-center justify-center shadow-xl">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent blur-md"></div>
              </div>
            </div>
            
            <h3 className="text-white font-black text-xl mb-2 truncate px-4 font-poppins tracking-wide">
              {donor.donor.name}
            </h3>
            
            <div className="flex items-center justify-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/30">
                <p className="text-white/95 text-sm font-semibold">
                  Pretty Human since {new Date(donor.donor.createdAt).getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Premium Stats Section */}
        <div className="flex-1 p-6 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-700/60 dark:to-gray-800/40 backdrop-blur-xl">
          
          {/* Impact Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center bg-gradient-to-br from-[#D5A021]/15 via-yellow-400/10 to-[#D5A021]/15 rounded-2xl p-4 border-2 border-[#D5A021]/30 backdrop-blur-sm group-hover:shadow-lg transition-all duration-300">
              <div className="text-2xl font-black bg-gradient-to-r from-[#D5A021] to-yellow-600 bg-clip-text text-transparent mb-1">
                {formatAmount(donor.totalDonated)}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Impact</p>
            </div>
            
            <div className="text-center bg-gradient-to-br from-[#8B2325]/15 via-red-500/10 to-[#8B2325]/15 rounded-2xl p-4 border-2 border-[#8B2325]/30 backdrop-blur-sm group-hover:shadow-lg transition-all duration-300">
              <div className="text-2xl font-black bg-gradient-to-r from-[#8B2325] to-red-600 bg-clip-text text-transparent mb-1">
                {donor.donationCount}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Donations</p>
            </div>
          </div>

          {/* Inspirational Quote/Bio */}
          <div className="mb-4">
            {donor.donor.bio ? (
              <div className="bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-2xl p-4 border border-gray-200/60 dark:border-gray-600/40 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <span className="text-[#8B2325] text-lg">"</span>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic font-medium line-clamp-3 flex-1">
                    {donor.donor.bio}
                  </p>
                  <span className="text-[#8B2325] text-lg self-end">"</span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#8B2325]/10 to-[#D5A021]/10 rounded-2xl p-4 border border-[#8B2325]/20 backdrop-blur-sm">
                <div className="text-center">
                  <span className="text-2xl mb-2 block">💫</span>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold italic">
                    "Creating waves of positive change"
                  </p>
                </div>
              </div>
            )}
          </div>          {/* Activity Status */}
          <div className="border-t-2 border-gray-200/50 dark:border-gray-600/30 pt-4">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold">
                  Active Supporter
                </span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                Last: {new Date(donor.lastDonation).toLocaleDateString()}
              </span>
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

        <div className="relative">          {/* Simplified glassmorphism background */}
          <div className="absolute inset-0 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl"></div>
          
          <div className="relative bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-8 shadow-lg">
            
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
            </div>            {/* Donors Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pt-8 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {donors.map((donor, index) => (
                <DonorCard key={donor._id} donor={donor} index={index} />
              ))}
            </div>            {/* Simplified fade effects */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/60 to-transparent dark:from-gray-800/60 pointer-events-none rounded-r-2xl"></div>
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/60 to-transparent dark:from-gray-800/60 pointer-events-none rounded-l-2xl"></div>
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
