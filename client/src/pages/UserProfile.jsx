import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { 
  Heart, 
  Users, 
  Target, 
  Calendar,
  CheckCircle,
  Grid3X3
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/index.js';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useIntersection } from '../hooks/useIntersection';
import { formatCurrencyShort, formatNumberShort } from '../utils/formatCurrency';

// Campaign Card Component - Instagram Style
const CampaignCard = ({ campaign }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link href={`/campaign/${campaign._id}`}>
      <div 
        className="relative aspect-square rounded-sm overflow-hidden cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Campaign Image */}
        <img 
          src={campaign.thumbnailUrl || campaign.thumbnail || campaign.coverImage} 
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-300">
            <div className="text-white text-center space-y-2">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span className="font-semibold text-sm">{formatNumberShort(campaign.donors || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span className="font-semibold text-sm">{formatCurrencyShort(campaign.raised || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <h3 className="text-white font-medium text-sm line-clamp-2">
            {campaign.title}
          </h3>
        </div>
      </div>
    </Link>
  );
};

// Stats Component - Instagram Style
const ProfileStats = ({ stats }) => (
  <div className="grid grid-cols-3 gap-8 py-6 text-center">
    <div>
      <div className="text-xl font-semibold text-gray-900 dark:text-white">
        {formatNumberShort(stats.campaignCount || 0)}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">campaigns</div>
    </div>
    <div>
      <div className="text-xl font-semibold text-gray-900 dark:text-white">
        {formatCurrencyShort(stats.totalRaised || 0)}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">raised</div>
    </div>
    <div>
      <div className="text-xl font-semibold text-gray-900 dark:text-white">
        {formatNumberShort(stats.totalDonors || 0)}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">donors</div>
    </div>
  </div>
);

// Skeleton Loader
const CampaignSkeleton = () => (
  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse" />
);

const UserProfile = () => {
  const { id } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Intersection observer for infinite scroll
  const { ref: intersectionRef, isIntersecting } = useIntersection({
    threshold: 0.1,
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/users/${id}/profile`);
        setUserProfile(response.data.user);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  // Infinite query for campaigns
  const {
    data: campaignsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useInfiniteQuery({
    queryKey: ['userCampaigns', id],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get(
        `${API_URL}/api/users/${id}/campaigns?page=${pageParam}&limit=12`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasNextPage ? lastPage.pagination.nextPage : undefined;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Trigger next page fetch when intersection is observed
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten campaigns data
  const campaigns = campaignsData?.pages.flatMap(page => page.campaigns) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="flex-shrink-0">
              <div className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="grid grid-cols-3 gap-8 mt-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Campaigns Skeleton */}
          <div className="border-t pt-8">
            <div className="grid grid-cols-3 gap-1">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start">
            <div className="relative">
              <div className="w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                {userProfile?.profilePictureUrl || userProfile?.profilePicture ? (
                  <img
                    src={userProfile.profilePictureUrl || userProfile.profilePicture}
                    alt={userProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <span className="text-4xl font-bold text-gray-500 dark:text-gray-400">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              

            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            {/* Username and verification */}
            <div className="mb-6">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <h1 className="text-2xl font-light text-gray-900 dark:text-white">
                  {userProfile?.name}
                </h1>
                {userProfile?.isPremiumAndVerified && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                )}
              </div>
            </div>

            {/* Stats */}
            <ProfileStats stats={userProfile?.stats || {}} />

            {/* Bio and Details */}
            <div className="mt-6">
              {userProfile?.bio ? (
                <div className="text-gray-700 dark:text-gray-300 mb-2">
                  {userProfile.bio}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 mb-2 italic">
                  Creating positive impact through meaningful campaigns
                </div>
              )}
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                <Calendar className="w-4 h-4 inline mr-1" />
                Joined {new Date(userProfile?.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <button className="flex items-center gap-2 py-4 border-t border-gray-900 dark:border-white text-gray-900 dark:text-white text-sm font-semibold">
              <Grid3X3 className="w-4 h-4" />
              CAMPAIGNS
            </button>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="mt-8">
          {campaignsLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(12)].map((_, index) => (
                <CampaignSkeleton key={index} />
              ))}
            </div>
          ) : campaignsError ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Failed to load campaigns</h3>
              <p className="text-gray-500 dark:text-gray-500">Please try again later</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-900 dark:border-white flex items-center justify-center">
                <Target className="w-12 h-12 text-gray-900 dark:text-white" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-3">
                No Campaigns Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                When {userProfile?.name} creates campaigns, they'll appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1">
                {campaigns.map((campaign, index) => (
                  <div
                    key={campaign._id}
                    ref={index === campaigns.length - 1 ? intersectionRef : undefined}
                  >
                    <CampaignCard campaign={campaign} />
                  </div>
                ))}
              </div>

              {/* Loading more indicator */}
              {isFetchingNextPage && (
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {[...Array(6)].map((_, index) => (
                    <CampaignSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* End message */}
              {!hasNextPage && campaigns.length > 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  You've seen all campaigns
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;