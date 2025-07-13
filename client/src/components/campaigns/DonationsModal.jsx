import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { API_URL as CONFIG_API_URL, MINIO_URL } from '../../config/index.js';

const DonationsModal = ({ isOpen, onClose, campaignId }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [topDonor, setTopDonor] = useState(null);
  const observer = useRef();
  const modalRef = useRef();
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original styles
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
      
      // Calculate scrollbar width
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply styles to prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalStyle;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Close modal with ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  // Fetch top donor only once when modal opens
  useEffect(() => {
    const fetchTopDonor = async () => {
      try {
        const response = await axios.get(`${CONFIG_API_URL}/api/donations/campaign/${campaignId}/top`);
        if (response.data && response.data.success) {
          setTopDonor(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching top donor:', error);
      }
    };
    
    if (isOpen && campaignId) {
      fetchTopDonor();
    }
  }, [isOpen, campaignId]);
  
  // Fetch donations
  const fetchDonations = useCallback(async () => {
    try {
      if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const response = await axios.get(`${CONFIG_API_URL}/api/donations/campaign/${campaignId}`, {
        params: { page, limit: 10 }
      });
      
      if (response.data && response.data.success) {
        setDonations(prev => [...prev, ...response.data.data]);
        setHasMore(response.data.pagination.hasMore);
      } else {
        setError('Failed to load donations');
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError('Failed to load donations');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [campaignId, page]);
  
  useEffect(() => {
    if (isOpen && campaignId) {
      setDonations([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      setInitialLoading(false);
      fetchDonations();
    } else if (!isOpen) {
      // Reset states when modal closes
      setDonations([]);
      setInitialLoading(false);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, campaignId, fetchDonations]);
  
  // Setup intersection observer for infinite scroll
  const lastDonationElementRef = useCallback(node => {
    if (loading || initialLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, initialLoading, hasMore]);
  
  // Load more donations when page changes
  useEffect(() => {
    if (page > 1) {
      fetchDonations();
    }
  }, [page, fetchDonations]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                duration: 0.3,
                type: "spring",
                damping: 25,
                stiffness: 400 
              }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl h-full max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] lg:max-h-[75vh] overflow-hidden border border-gray-200 dark:border-gray-700"
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  All Donations
                </h3>
                <button 
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div 
                className="overflow-y-auto p-3 sm:p-4 md:p-6 pb-6 sm:pb-8 md:pb-10 space-y-3 sm:space-y-4 dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800" 
                style={{ 
                  maxHeight: 'calc(85vh - 100px)',
                  minHeight: '200px',
                  WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
                }}
              >
                {/* Initial Loading Animation */}
                {initialLoading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative">
                      {/* Main spinning circle */}
                      <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                      {/* Inner spinning circle */}
                      <div className="absolute inset-2 w-12 h-12 border-4 border-transparent border-b-amber-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                      {/* Center dot */}
                      <div className="absolute inset-6 w-4 h-4 bg-gradient-to-br from-primary-500 to-amber-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Loading donations...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the donation data</p>
                    </div>
                  </div>
                )}

                {/* Content when not loading */}
                {!initialLoading && (
                  <>
                    {/* Top Donor */}
                    {topDonor && (
                  <div className="bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 dark:from-amber-900/80 dark:via-amber-800/90 dark:to-yellow-900/80 border border-amber-300 dark:border-amber-600/80 rounded-xl p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 md:mb-8 shadow-lg relative overflow-hidden">
                    {/* Premium gold gradient accent */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-yellow-400/5 to-transparent pointer-events-none"></div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-400/20 dark:bg-amber-400/30 rounded-full blur-xl"></div>
                    
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-xs py-1 sm:py-1.5 px-2 sm:px-4 rounded-bl-xl shadow-md">
                      <span className="relative z-10">TOP DONOR</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 to-amber-300/30 blur-sm"></span>
                    </div>
                    
                    <div className="flex items-start flex-col sm:flex-row">
                      <div className="flex items-center mb-3 sm:mb-0 sm:mr-4">
                        {topDonor.anonymous ? (
                          <div className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-bold rounded-full h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-md border-2 border-amber-100 dark:border-amber-700 ring-2 ring-amber-300/50 dark:ring-amber-500/50">
                            A
                          </div>
                        ) : (
                          topDonor.donorId && topDonor.donorId.profilePicture ? (
                            <img 
                              src={`${MINIO_URL}/profiles/${topDonor.donorId.profilePicture}`}
                              alt={topDonor.donorId.name || 'Donor'}
                              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover shadow-md border-2 border-amber-100 dark:border-amber-700 ring-2 ring-amber-300/50 dark:ring-amber-500/50"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${topDonor.donorId.name || 'A'}&background=amber&color=fff`;
                              }}
                            />
                          ) : (
                            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-bold rounded-full h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-md border-2 border-amber-100 dark:border-amber-700 ring-2 ring-amber-300/50 dark:ring-amber-500/50">
                              {topDonor.donorId && topDonor.donorId.name ? topDonor.donorId.name.charAt(0) : 'A'}
                            </div>
                          )
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <span className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-100 tracking-wide block">
                              {topDonor.anonymous ? 'Anonymous' : (topDonor.donorId && topDonor.donorId.name ? topDonor.donorId.name : 'Anonymous')}
                            </span>
                            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                              {formatDistanceToNow(new Date(topDonor.date), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-100 to-yellow-200 dark:from-amber-700/80 dark:to-yellow-600/80 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg border border-amber-300 dark:border-amber-600 shadow-sm whitespace-nowrap">
                            Rs. {topDonor.amount}
                          </div>
                        </div>
                        {topDonor.message && (
                          <div className="mt-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-amber-200 dark:border-amber-700/50 shadow-sm">
                            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 italic break-words">{`"${topDonor.message}"`}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Gold accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 dark:from-amber-600 dark:via-yellow-500 dark:to-amber-600"></div>
                  </div>
                )}
                
                {/* All other donations */}
                <div className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 md:pb-8">
                  {donations.map((donation, index) => (
                    <div
                      ref={index === donations.length - 1 ? lastDonationElementRef : null}
                      key={donation._id}
                      className={`flex items-start border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-md transition-colors duration-200 ${index === donations.length - 1 ? 'mb-4' : ''}`}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {donation.anonymous ? (
                          <div className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center shadow-sm">
                            A
                          </div>
                        ) : (
                          donation.donorId && donation.donorId.profilePicture ? (
                            <img 
                              src={`${MINIO_URL}/profiles/${donation.donorId.profilePicture}`}
                              alt={donation.donorId.name || 'Donor'}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover shadow-sm border border-gray-100 dark:border-gray-700"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${donation.donorId.name || 'A'}&background=primary&color=fff`;
                              }}
                            />
                          ) : (
                            <div className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center shadow-sm">
                              {donation.donorId && donation.donorId.name ? donation.donorId.name.charAt(0) : 'A'}
                            </div>
                          )
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-1 sm:space-y-0">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-gray-800 dark:text-gray-200 block truncate">
                              {donation.anonymous ? 'Anonymous' : (donation.donorId && donation.donorId.name ? donation.donorId.name : 'Anonymous')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(donation.date), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/50 px-2 py-1 rounded-md border border-transparent dark:border-primary-800 whitespace-nowrap flex-shrink-0">
                            Rs. {donation.amount}
                          </div>
                        </div>
                        {donation.message && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 italic bg-white dark:bg-gray-700 p-1.5 rounded-md border border-gray-100 dark:border-gray-600 break-words">"{donation.message}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {loading && page > 1 && (
                    <div className="flex justify-center py-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading more donations...</span>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="text-center py-4 mb-4 text-red-500 dark:text-red-400 text-sm">{error}</div>
                  )}
                  
                  {!hasMore && donations.length > 0 && (
                    <div className="text-center py-4 mb-4 text-gray-500 dark:text-gray-400 text-sm">
                      No more donations to load
                    </div>
                  )}
                  
                  {!loading && !error && donations.length === 0 && !topDonor && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <p className="text-base font-medium">No donations yet</p>
                      <p className="text-sm">Be the first to support this campaign!</p>
                    </div>
                  )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DonationsModal;