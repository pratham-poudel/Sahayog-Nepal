import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import Progress from '../ui/AnimatedProgress';
import DonationForm from './DonationForm';
import ShareableSocialCard from '../social/ShareableSocialCard';
import DonationsModal from './DonationsModal';
import { API_URL as CONFIG_API_URL, MINIO_URL } from '../../config/index.js';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious
} from "../ui/carousel";

// Component to display recent donations
const RecentDonations = ({ campaignId }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topDonor, setTopDonor] = useState(null);
  const [showAllDonations, setShowAllDonations] = useState(false);
  
  useEffect(() => {
    // Fetch top donor and recent donations
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both top donor and recent donations concurrently
        const [topDonorRes, recentDonationsRes] = await Promise.all([
          axios.get(`${CONFIG_API_URL}/api/donations/campaign/${campaignId}/top`),
          axios.get(`${CONFIG_API_URL}/api/donations/campaign/${campaignId}/recent`)
        ]);
        
        // Process top donor data
        if (topDonorRes.data && topDonorRes.data.success) {
          const topDonorData = topDonorRes.data.data;
          setTopDonor(topDonorData);
          
          // Process recent donations data
          if (recentDonationsRes.data && recentDonationsRes.data.success) {
            // Filter out top donor from recent donations to avoid duplication
            if (topDonorData) {
              const filteredDonations = recentDonationsRes.data.data.filter(
                donation => donation._id !== topDonorData._id
              );
              setDonations(filteredDonations);
            } else {
              setDonations(recentDonationsRes.data.data);
            }
          } else {
            setError('Failed to load donations');
          }
        } else {
          // If no top donor, just set the recent donations
          if (recentDonationsRes.data && recentDonationsRes.data.success) {
            setDonations(recentDonationsRes.data.data);
          } else {
            setError('Failed to load donations');
          }
        }
      } catch (err) {
        console.error('Error fetching donations data:', err);
        setError('Failed to load donations');
      } finally {
        setLoading(false);
      }
    };
    
    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);
  
  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-300 text-sm">Loading donations...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-300 text-sm">{error}</p>
      </div>
    );
  }
  
  if (!topDonor && donations.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-300 text-sm">No donations yet. Be the first to donate!</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-base mb-3 text-primary-700 dark:text-primary-400 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        Recent Supporters
      </h4>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {/* Top Donor */}
        {topDonor && (
          <div className="bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 dark:from-amber-900/80 dark:via-amber-800/90 dark:to-yellow-900/80 border border-amber-300 dark:border-amber-600/80 rounded-xl p-5 mb-6 shadow-lg relative overflow-hidden">
            {/* Premium gold gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-yellow-400/5 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-400/20 dark:bg-amber-400/30 rounded-full blur-xl"></div>
            
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-xs py-1.5 px-4 rounded-bl-xl shadow-md">
              <span className="relative z-10">TOP DONOR</span>
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 to-amber-300/30 blur-sm"></span>
            </div>
            
            <div className="flex items-start">
              {topDonor.anonymous ? (
                <div className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center mr-4 shadow-md border-2 border-amber-100 dark:border-amber-700 ring-2 ring-amber-300/50 dark:ring-amber-500/50">
                  A
                </div>
              ) : (
                topDonor.donorId && topDonor.donorId.profilePicture ? (
                  <img 
                    src={`${MINIO_URL}/profiles/${topDonor.donorId.profilePicture}`}
                    alt={topDonor.donorId.name || 'Donor'}
                    className="h-12 w-12 rounded-full object-cover mr-4 shadow-md border-2 border-amber-100 dark:border-amber-700 ring-2 ring-amber-300/50 dark:ring-amber-500/50"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${topDonor.donorId.name || 'A'}&background=amber&color=fff`;
                    }}
                  />
                ) : (
                  <div className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center mr-4 shadow-md border-2 border-amber-100 dark:border-amber-700 ring-2 ring-amber-300/50 dark:ring-amber-500/50">
                    {topDonor.donorId && topDonor.donorId.name ? topDonor.donorId.name.charAt(0) : 'A'}
                  </div>
                )
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-base text-amber-900 dark:text-amber-100 tracking-wide">
                      {topDonor.anonymous ? 'Anonymous' : (topDonor.donorId && topDonor.donorId.name ? topDonor.donorId.name : 'Anonymous')}
                    </span>
                    <span className="text-xs text-amber-700 dark:text-amber-300 block font-medium">
                      {formatDistanceToNow(new Date(topDonor.date), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="font-bold text-base text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-100 to-yellow-200 dark:from-amber-700/80 dark:to-yellow-600/80 px-4 py-1.5 rounded-lg border border-amber-300 dark:border-amber-600 shadow-sm">
                    Rs. {topDonor.amount}
                  </div>
                </div>
                {topDonor.message && (
                  <div className="mt-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-3 rounded-lg border border-amber-200 dark:border-amber-700/50 shadow-sm">
                    <p className="text-sm text-amber-800 dark:text-amber-200 italic">{`"${topDonor.message}"`}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Gold accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 dark:from-amber-600 dark:via-yellow-500 dark:to-amber-600"></div>
          </div>
        )}
        
        {/* Other Recent Donations */}
        {donations.map((donation) => (
          <div key={donation._id} className="flex items-start border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md transition duration-150">
            {donation.anonymous ? (
              <div className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold rounded-full h-9 w-9 flex items-center justify-center mr-3 shadow-sm">
                A
              </div>
            ) : (
              donation.donorId && donation.donorId.profilePicture ? (
                <img 
                  src={`${MINIO_URL}/profiles/${donation.donorId.profilePicture}`}
                  alt={donation.donorId.name || 'Donor'}
                  className="h-9 w-9 rounded-full object-cover mr-3 shadow-sm border border-primary-100 dark:border-primary-800"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${donation.donorId.name || 'A'}&background=primary&color=fff`;
                  }}
                />
              ) : (
                <div className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold rounded-full h-9 w-9 flex items-center justify-center mr-3 shadow-sm">
                  {donation.donorId && donation.donorId.name ? donation.donorId.name.charAt(0) : 'A'}
                </div>
              )
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                    {donation.anonymous ? 'Anonymous' : (donation.donorId && donation.donorId.name ? donation.donorId.name : 'Anonymous')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                    {formatDistanceToNow(new Date(donation.date), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm font-semibold text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/50 px-2 py-1 rounded-md border border-transparent dark:border-primary-800">
                  Rs. {donation.amount}
                </div>
              </div>
              {donation.message && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic bg-white dark:bg-gray-700 p-1.5 rounded-md border border-gray-100 dark:border-gray-600">"{donation.message}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-center">
        <button 
          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          onClick={() => setShowAllDonations(true)}
        >
          See all donations
        </button>
      </div>
      
      {/* Modal for all donations */}
      <DonationsModal 
        isOpen={showAllDonations} 
        onClose={() => setShowAllDonations(false)} 
        campaignId={campaignId} 
      />
    </div>
  );
};

const CampaignDetail = ({ campaign }) => {
  const [activeTab, setActiveTab] = useState('story');
  const [carouselApi, setCarouselApi] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  useEffect(() => {
    if (!carouselApi || !campaign.images || campaign.images.length === 0) return;
    
    const slideInterval = setInterval(() => {
      carouselApi.scrollNext();
    }, 4000);
    
    return () => clearInterval(slideInterval);
  }, [carouselApi, campaign.images]);
  
  if (!campaign) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-xl font-medium mb-2">Campaign not found</h3>
        <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed</p>
        <Link href="/explore">
          <a className="inline-block py-2 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
            Browse Campaigns
          </a>
        </Link>
      </div>
    );
  }

  const tabContent = {
    story: (
      <div className="space-y-8">
        {/* Main Campaign Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Story</h2>
          </div>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {campaign.longDescription ? (
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {campaign.longDescription}
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                This campaign is working to make a positive impact in the community. Every donation helps us get closer to our goal and creates meaningful change for those who need it most.
              </p>
            )}
          </div>
        </div>

        {/* How Your Donation Helps - Dynamic */}
        {campaign.donationBreakdown && campaign.donationBreakdown.length > 0 ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How Your Donation Helps</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.donationBreakdown.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700 hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                      Rs. {item.amount.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Campaign Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Progress</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {campaign.progress}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Goal Reached</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {campaign.donors}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Supporters</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {campaign.daysLeft}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Days Left</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                Rs. {Math.round(campaign.raised / campaign.donors || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg. Donation</p>
            </div>
          </div>
        </div>
        
        {/* Recent Supporters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-4">
            {/* <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div> */}
            {/* <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Supporters</h3> */}
          </div>
          <RecentDonations campaignId={campaign.id} />
        </div>
      </div>
    ),
    updates: (
      <div>
        {campaign.updates && campaign.updates.length > 0 ? (
          <div className="space-y-6">
            {campaign.updates.map((update, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-primary-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                  <h3 className="font-semibold text-lg text-gray-800">{update.title}</h3>
                  <span className="text-sm text-gray-500 mt-1 md:mt-0">
                    {new Date(update.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="text-gray-700 whitespace-pre-line">
                  {update.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-1">No updates yet</h4>
            <p className="text-gray-500">Check back soon for updates on this campaign's progress!</p>
          </div>
        )}
      </div>
    ),
    comments: (
      <div>
        <p className="text-center text-gray-500 py-8">Comments will be available soon!</p>
      </div>
    )
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 px-4 md:px-0">
      <div className="lg:col-span-2">
        <motion.div 
          className="rounded-xl overflow-hidden shadow-lg mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {campaign.images && campaign.images.length > 0 ? (
            <Carousel 
              className="w-full" 
              setApi={setCarouselApi}
              opts={{
                loop: true,
                align: "start"
              }}
            >
              <CarouselContent>
                <CarouselItem>
                  <div className="relative h-64 md:h-96 w-full">
                    <img 
                      src={campaign.thumbnail} 
                      alt={`${campaign.title} - main image`} 
                      className="h-full w-full object-cover rounded-t-xl"
                      loading="lazy"
                    />
                  </div>
                </CarouselItem>
                
                {campaign.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-64 md:h-96 w-full">
                      <img 
                        src={image} 
                        alt={`${campaign.title} - image ${index + 1}`} 
                        className="h-full w-full object-cover rounded-t-xl"
                        loading="lazy"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
              
              <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {campaign.images.length + 1} photos
              </div>
            </Carousel>
          ) : (
            <img 
              src={campaign.thumbnail} 
              alt={campaign.title} 
              className="w-full h-64 md:h-96 object-cover"
              loading="lazy"
            />
          )}
        </motion.div>

        <div className="flex border-b mb-6 overflow-x-auto">
          <button 
            className={`py-2 px-4 md:py-3 md:px-6 font-medium text-sm md:text-base whitespace-nowrap ${
              activeTab === 'story' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('story')}
          >
            Campaign Story
          </button>
          <button 
            className={`py-2 px-4 md:py-3 md:px-6 font-medium text-sm md:text-base whitespace-nowrap ${
              activeTab === 'updates' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('updates')}
          >
            Updates
          </button>
          <button 
            className={`py-2 px-4 md:py-3 md:px-6 font-medium text-sm md:text-base whitespace-nowrap ${
              activeTab === 'comments' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {tabContent[activeTab]}
        </motion.div>
      </div>

      <motion.div 
        className="lg:col-span-1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 sticky top-24">
          <h2 className="font-poppins font-bold text-xl md:text-2xl mb-4">{campaign.title}</h2>
          
          <div className="mb-6">
            <div className="flex justify-between text-xs md:text-sm mb-1">
              <span className="font-medium">Rs. {campaign.raised.toLocaleString()} raised</span>
              <span className="text-gray-600">of Rs. {campaign.goal.toLocaleString()}</span>
            </div>
            <Progress value={campaign.progress} />
            <div className="flex items-center justify-between mt-2 text-xs md:text-sm text-gray-600">
              <div>{campaign.donors} donors</div>
              <div>{campaign.daysLeft} days left</div>
            </div>
          </div>
          
          <div className="flex items-center mb-6">
            <img 
              src={campaign.creator.image} 
              alt={campaign.creator.name} 
              className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover mr-3 border-2 border-white"
            />
            <div>
              <p className="text-xs text-gray-500">Created by</p>
              <p className="font-medium text-sm md:text-base">{campaign.creator.name}</p>
            </div>
          </div>
          
          <DonationForm campaignId={campaign.id} />
          
          <div className="mt-6">
            <h3 className="font-semibold mb-2 text-sm md:text-base">Share this campaign</h3>
            <div className="mb-3">
              <button 
                onClick={() => setShowShareModal(true)}
                className="w-full py-2 px-4 bg-[#8B2325] text-white rounded-lg flex items-center justify-center hover:bg-[#7a1f21] transition-colors text-sm md:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" />
                </svg>
                Create Shareable Card
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 w-10 h-10 rounded-full flex items-center justify-center" 
                aria-label="Share on Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
              {/* Other social buttons remain the same */}
            </div>
          </div>
          
          <ShareableSocialCard
            campaign={campaign}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignDetail;