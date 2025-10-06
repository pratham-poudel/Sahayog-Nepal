import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getProfilePictureUrl ,getCoverImageUrl} from '../../utils/imageUtils';

// Celebration Flowers Animation Component
const CelebrationFlowers = ({ show }) => {
  // Flower petal colors
  const petalColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#d946ef'  // fuchsia
  ];
  
  // Generate flower particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    color: petalColors[i % petalColors.length]
  }));
  
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor: particle.color,
                top: '50%',
                left: '50%'
              }}
              initial={{ scale: 0, x: '-50%', y: '-50%' }}
              animate={{
                scale: [0, 1, 0.5],
                x: `calc(-50% + ${Math.sin((particle.id / particles.length) * Math.PI * 2) * 150}px)`,
                y: `calc(-50% + ${Math.cos((particle.id / particles.length) * Math.PI * 2) * 75}px)`,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 3,
                delay: particle.id * 0.05
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

const Progress = ({ value, showValue = false }) => {
  // Goal completed animation for 100% progress
  const isGoalCompleted = value >= 100;
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Trigger celebration animation when the goal is completed
  useEffect(() => {
    if (isGoalCompleted) {
      setShowCelebration(true);
      
      // Hide celebration after some time to avoid distraction
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isGoalCompleted]);

  return (
    <div className="relative">
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
          className={`h-2 ${isGoalCompleted ? 'bg-emerald-500 dark:bg-emerald-500' : 'bg-[#8B2325] dark:bg-[#8B2325]'} rounded-full`}
          initial={{ width: "0%" }}
          animate={{ 
            width: `${value}%`,
            ...(isGoalCompleted && { 
              boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 8px rgba(16, 185, 129, 0.6)", "0 0 0px rgba(16, 185, 129, 0)"] 
            })
          }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            ...(isGoalCompleted && { 
              boxShadow: { 
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut" 
              }
            })
          }}
        />
      </div>
      
      {/* Show celebration flowers animation */}
      <CelebrationFlowers show={showCelebration} />
      
      {showValue && (
        <div className="absolute top-0 right-0 -mt-6 text-xs font-medium text-[#8B2325] dark:text-[#8B2325]">
          {value}%
        </div>
      )}
    </div>
  );
};

const TagBadge = ({ type }) => {
  const styles = {
    'Featured': 'bg-amber-500 text-white',
    'Urgent': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    'New': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    'Emotional': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
  }[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${styles}`}>
      {type}
    </span>
  );
};

const CampaignCard = ({ campaign = {} }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate days left
  const calculateDaysLeft = () => {
    if (!campaign.endDate) return 0;
    
    const today = new Date();
    const endDate = new Date(campaign.endDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    // Return negative value for ended campaigns instead of 0
    return daysDiff;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!campaign.targetAmount || campaign.targetAmount === 0) return 0;
    return Math.min(Math.round((campaign.amountRaised / campaign.targetAmount) * 100), 100);
  };

  // Default empty objects/arrays to prevent undefined errors
  const safeData = {
    id: campaign?._id || '',
    title: campaign?.title || 'Campaign',
    description: campaign?.shortDescription || 'No description available',
    thumbnail: campaign?.thumbnail || 
      (campaign?.coverImage ? getCoverImageUrl(campaign) : 'https://via.placeholder.com/400x200?text=Campaign'),
    tags: campaign?.tags || [],
    category: campaign?.category || 'Other',
    daysLeft: calculateDaysLeft(),
    raised: campaign?.amountRaised || 0,
    goal: campaign?.targetAmount || 0,
    progress: calculateProgress(),
    donors: campaign?.donors || 0,
    creator: {
      name: campaign?.creator?.name || 'Anonymous',
      image: campaign?.creator?.profilePicture 
        ? getProfilePictureUrl(campaign.creator) 
        : 'https://ui-avatars.com/api/?name=Anonymous&background=random',
      isPremiumAndVerified: campaign?.creator?.isPremiumAndVerified || false
    }
  };

  // Category style mapping
  const categoryStyles = {
    'Education': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    'Healthcare': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    'Disaster Relief': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    'Community Development': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    'Environment': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    'Water & Sanitation': 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    'Heritage Preservation': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    'Animals': 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
  };
  
  const categoryStyle = categoryStyles[safeData.category] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';

  // Time remaining formatter - properly showing Ended status
  const timeRemaining = 
    safeData.daysLeft < 0 ? 'Ended' :
    safeData.daysLeft === 0 ? 'Last day' : 
    safeData.daysLeft === 1 ? '1 day left' : 
    `${safeData.daysLeft} days left`;

  return (
    <div className="h-full">
      <Link href={`/campaign/${safeData.id}`} className="block h-full">
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Card Header - Image Area */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src={safeData.thumbnail} 
              alt={safeData.title} 
              className="w-full h-full object-cover"
              style={{ 
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.5s ease'
              }}
              loading="lazy"
              width="400"
              height="200"
            />
            
            {/* Featured Badge - "Needs Attention" Ribbon */}
            {campaign?.featured && (
              <div className="absolute top-0 left-0 z-20">
                <div className="relative">
                  {/* Main ribbon */}
                  <div className="bg-gradient-to-r from-red-700 to-red-800 text-white text-xs font-bold px-3 py-1.5 shadow-lg">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Needs Attention
                    </span>
                  </div>
                  {/* Ribbon tail */}
                  <div className="absolute left-0 top-full">
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[8px] border-t-red-900"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tags Overlay */}
            <div className={`absolute top-0 ${campaign?.featured ? 'left-32' : 'left-0'} p-3 flex flex-wrap gap-1.5`}>
              {safeData.tags.map((tag, index) => (
                <TagBadge key={index} type={tag} />
              ))}
            </div>
            
            {/* Category Badge */}
            <div className="absolute bottom-3 left-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryStyle}`}>
                {safeData.category}
              </span>
            </div>
            
            {/* Time Badge */}
            <div className="absolute top-3 right-3">
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {timeRemaining}
              </span>
            </div>
          </div>
          
          {/* Card Body - Content Area */}
          <div className="p-4 flex-grow flex flex-col">
            {/* Title */}
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1.5 line-clamp-1" style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              maxWidth: '100%'
            }}>
              {safeData.title}
            </h3>
            
            {/* Description - only show 2 lines */}
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 font-light">
              {safeData.description}
            </p>
            
            {/* Progress Section */}
            <div className="mt-auto mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Rs. {safeData.raised.toLocaleString()}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs self-end">
                  raised of Rs. {safeData.goal.toLocaleString()}
                </span>
              </div>
              <Progress value={safeData.progress} />
              
              {/* Achievement Label - always show progress percentage */}
              <div className="mt-1.5">
                <motion.span 
                  className={`text-xs font-medium ${
                    safeData.progress >= 100 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : safeData.progress >= 75 
                        ? 'text-[#8B2325] dark:text-amber-400' 
                        : 'text-gray-600 dark:text-gray-400'
                  }`}
                  animate={safeData.progress >= 100 ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={safeData.progress >= 100 ? {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  } : {}}
                >
                  {safeData.progress >= 100 
                    ? '🎉 Goal completed! 🎉' 
                    : `${safeData.progress}% towards goal`
                  }
                </motion.span>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-[#8B2325]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeRemaining}
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-[#8B2325]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {safeData.donors} donors
              </div>
            </div>
          </div>
          
          {/* Card Footer */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center">
            {/* Creator Info */}
            <div className="flex items-center space-x-2">
              <img 
                src={safeData.creator.image} 
                alt={safeData.creator.name} 
                className="h-7 w-7 rounded-full object-cover"
                width="28"
                height="28"
                loading="lazy"
              />
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-900 dark:text-white font-medium">{safeData.creator.name}</p>
                  {safeData.creator.isPremiumAndVerified && (
                    <svg 
                      className="h-3 w-3 text-blue-500 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                      title="Verified Premium User"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Organizer</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Donate Button */}
              <button 
                className="py-1.5 px-3 bg-[#8B2325] hover:bg-[#7a1f21] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                onClick={(e) => {
                  // Prevent propagation to avoid triggering the parent link
                  e.stopPropagation();
                  // We're still inside the Link component, so we don't need to navigate manually
                }}
              >
                Donate
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CampaignCard;