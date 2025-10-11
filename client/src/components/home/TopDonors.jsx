import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import config from '../../config';

const TitleSection = React.memo(() => (
  <motion.div 
    className="text-center mb-12"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 rounded-full mb-6">
      <span className="text-sm text-[#8B2325] dark:text-red-400 font-medium tracking-wide">
        Community Heroes
      </span>
    </div>
    
    <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
      Our Top Supporters
    </h2>
    
    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
      Meet the incredible people whose generosity is changing lives across Nepal.
    </p>
  </motion.div>
));
const LoadingSpinner = React.memo(() => (
  <div className="flex justify-center items-center py-16">
    <div className="w-12 h-12 border-4 border-[#8B2325] border-t-transparent rounded-full animate-spin"></div>
  </div>
));

const ScrollButton = React.memo(({ direction, canScroll, onClick }) => (
  <button
    onClick={onClick}
    disabled={!canScroll}
    className={`p-3 rounded-xl transition-all duration-300 ${
      canScroll 
        ? 'bg-[#8B2325] hover:bg-[#a32729] text-white shadow-lg hover:shadow-xl'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
    }`}
  >
    <svg 
      className="w-5 h-5" 
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
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  }, []);

  const getDefaultAvatar = useCallback((name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B2325&color=fff&size=160&rounded=true&bold=true`;
  }, []);

  const getRankBadge = useCallback((rank) => {
    if (rank === 1) return { icon: '🏆', color: 'bg-yellow-500', label: 'Top Donor' };
    if (rank === 2) return { icon: '🥈', color: 'bg-gray-400', label: 'Major Supporter' };
    if (rank === 3) return { icon: '🥉', color: 'bg-amber-600', label: 'Key Contributor' };
    return { icon: '⭐', color: 'bg-[#8B2325]', label: 'Valued Supporter' };
  }, []);

  // Handle edge case where donor data might be missing or undefined
  if (!donor || !donor.donor) {
    return null;
  }

  const donorInfo = donor.donor;
  const donorName = donorInfo.name || 'Anonymous Donor';
  const badge = getRankBadge(donor.rank);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="flex-none w-80 snap-start"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B2325] to-red-600 p-6 text-center relative">
          <div className="absolute top-3 right-3">
            <div className={`${badge.color} text-white rounded-lg px-3 py-1 text-xs font-bold shadow-lg`}>
              #{donor.rank}
            </div>
          </div>
          
          <div className="mb-3">
            <img
              src={donorInfo.profilePictureUrl || getDefaultAvatar(donorName)}
              alt={donorName}
              className="w-20 h-20 rounded-full mx-auto border-3 border-white shadow-xl object-cover"
              onError={(e) => {
                e.target.src = getDefaultAvatar(donorName);
              }}
              loading="lazy"
            />
          </div>
          
          <h3 className="text-white font-bold text-lg mb-1 truncate">
            {donorName}
          </h3>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
            <p className="text-white text-xs font-medium">
              {badge.label}
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <div className="text-xl font-black text-green-600 dark:text-green-400 mb-1">
                {formatAmount(donor.totalDonated)}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold">Donated</p>
            </div>
            
            <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mb-1">
                {donor.donationCount}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold">Contributions</p>
            </div>
          </div>

          {/* Bio */}
          {donorInfo.bio ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                {donorInfo.bio}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                Making Nepal stronger, one donation at a time
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                {donorInfo.createdAt 
                  ? `Since ${new Date(donorInfo.createdAt).getFullYear()}`
                  : 'Valued Member'
                }
              </span>
            </div>
            <span>
              {new Date(donor.lastDonation).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </span>
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
      const scrollAmount = 336; // Card width (320) + gap (16)
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
      updateScrollButtons();
      
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [updateScrollButtons, donors]);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <div className="container mx-auto">
          <TitleSection />
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <div className="container mx-auto">
          <TitleSection />
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!donors || donors.length === 0) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <div className="container mx-auto">
          <TitleSection />
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Be the first to make a difference!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#8B2325]/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <TitleSection />

        <div className="relative">
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
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-4"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch' 
            }}
          >
            {donors
              .filter(donor => donor && donor.donor) // Filter out invalid donors
              .map((donor, index) => (
                <DonorCard key={donor._id} donor={donor} index={index} />
              ))}
          </div>

          {/* Fade effects */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50/80 to-transparent dark:from-gray-800/80 pointer-events-none rounded-r-xl"></div>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50/80 to-transparent dark:from-gray-800/80 pointer-events-none rounded-l-xl"></div>
        </div>
      </div>
    </section>
  );
};

// Set display names for better debugging
TitleSection.displayName = 'TitleSection';
LoadingSpinner.displayName = 'LoadingSpinner';
ScrollButton.displayName = 'ScrollButton';
DonorCard.displayName = 'DonorCard';

export default TopDonors;
