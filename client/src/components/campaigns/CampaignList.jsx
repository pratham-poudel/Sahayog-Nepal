import { motion } from 'framer-motion';
import CampaignCard from './CampaignCard';

const CampaignList = ({ campaigns, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            {/* Image Skeleton */}
            <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 h-48 w-full animate-pulse">
              <div className="h-full w-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
            </div>
            
            {/* Content Skeleton */}
            <div className="p-6 space-y-4">
              {/* Category Badge Skeleton */}
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
              
              {/* Title Skeleton */}
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              
              {/* Description Skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
              </div>
              
              {/* Progress Section Skeleton */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>
              
              {/* Footer Skeleton */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <motion.div 
        className="text-center py-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No Campaigns Found
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            We couldn't find any campaigns matching your criteria. Try adjusting your filters or explore different categories.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              className="px-6 py-3 bg-[#8B2325] text-white rounded-xl hover:bg-[#7a1f21] transition-colors font-medium flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </motion.button>
            
            <motion.a
              href="/start-campaign"
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Campaign
            </motion.a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign, index) => (
          <motion.div
            key={campaign._id || campaign.id || index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              ease: [0.25, 0.1, 0.25, 1.0]
            }}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            className="transform-gpu"
          >
            <CampaignCard campaign={campaign} />
          </motion.div>
        ))}
      </div>
      
      {/* Results Summary */}
      <motion.div 
        className="text-center py-6 border-t border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{campaigns.length}</span> {campaigns.length === 1 ? 'campaign' : 'campaigns'}
        </p>
      </motion.div>
    </div>
  );
};

export default CampaignList;
