import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Cache duration in milliseconds
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// In-memory cache for stats
let statsCache = {
  homeStats: null,
  liveImpact: null,
  timestamp: {
    homeStats: null,
    liveImpact: null
  }
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheType) => {
  if (!statsCache[cacheType] || !statsCache.timestamp[cacheType]) {
    return false;
  }
  return Date.now() - statsCache.timestamp[cacheType] < CACHE_DURATION;
};

/**
 * Get homepage statistics with caching
 * @returns {Promise<Object>} Homepage stats object
 */
export const getHomeStats = async () => {
  try {
    // Return cached data if valid
    if (isCacheValid('homeStats')) {
      console.log('📊 Using cached homepage stats');
      return statsCache.homeStats;
    }

    console.log('📊 Fetching fresh homepage stats from API...');
    const response = await axios.get(`${API_BASE_URL}/api/stats/home`, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.success) {
      // Cache the response
      statsCache.homeStats = response.data.data;
      statsCache.timestamp.homeStats = Date.now();
      
      console.log('✅ Homepage stats fetched successfully');
      return response.data.data;
    } else {
      throw new Error('Failed to fetch homepage stats');
    }
  } catch (error) {
    console.error('❌ Error fetching homepage stats:', error);
    
    // Return cached data even if stale, or fallback data
    if (statsCache.homeStats) {
      console.log('⚠️ Using stale cached data due to API error');
      return statsCache.homeStats;
    }
    
    // Fallback to default stats if no cache available
    return getFallbackHomeStats();
  }
};

/**
 * Get live impact statistics with more frequent updates
 * @returns {Promise<Object>} Live impact stats object
 */
export const getLiveImpactStats = async () => {
  try {
    // Return cached data if valid
    if (isCacheValid('liveImpact')) {
      console.log('⚡ Using cached live impact stats');
      return statsCache.liveImpact;
    }

    console.log('⚡ Fetching fresh live impact stats from API...');
    const response = await axios.get(`${API_BASE_URL}/api/stats/live-impact`, {
      timeout: 8000, // 8 second timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.success) {
      // Cache the response
      statsCache.liveImpact = response.data.data;
      statsCache.timestamp.liveImpact = Date.now();
      
      console.log('✅ Live impact stats fetched successfully');
      return response.data.data;
    } else {
      throw new Error('Failed to fetch live impact stats');
    }
  } catch (error) {
    console.error('❌ Error fetching live impact stats:', error);
    
    // Return cached data even if stale, or fallback data
    if (statsCache.liveImpact) {
      console.log('⚠️ Using stale cached live impact data due to API error');
      return statsCache.liveImpact;
    }
    
    // Fallback to default stats if no cache available
    return getFallbackLiveImpactStats();
  }
};

/**
 * Clear stats cache (useful for forcing fresh data)
 */
export const clearStatsCache = () => {
  statsCache = {
    homeStats: null,
    liveImpact: null,
    timestamp: {
      homeStats: null,
      liveImpact: null
    }
  };
  console.log('🗑️ Stats cache cleared');
};

/**
 * Prefetch stats data (useful for optimizing load times)
 */
export const prefetchStats = async () => {
  try {
    await Promise.all([
      getHomeStats(),
      getLiveImpactStats()
    ]);
    console.log('🚀 Stats prefetched successfully');
  } catch (error) {
    console.error('❌ Error prefetching stats:', error);
  }
};

/**
 * Get formatted stats for display components
 * @param {Object} rawStats - Raw stats object from API
 * @returns {Object} Formatted stats ready for display
 */
export const formatStatsForDisplay = (rawStats) => {
  if (!rawStats) return null;

  return {
    totalUsers: {
      value: rawStats.totalUsers || 0,
      formatted: rawStats.formatted?.totalUsers || formatNumber(rawStats.totalUsers || 0),
      label: "Kind Souls",
      description: "Ordinary people doing extraordinary things together",
      icon: "❤️",
      suffix: "+"
    },
    totalFunds: {
      value: rawStats.totalFunds || 0,
      formatted: rawStats.formatted?.totalFunds || formatCurrency(rawStats.totalFunds || 0),
      label: "Lives Touched",
      description: "Dreams funded, families helped, futures brightened",
      icon: "💰",
      suffix: ""
    },
    activeCampaigns: {
      value: rawStats.activeCampaigns || 0,
      formatted: rawStats.formatted?.activeCampaigns || (rawStats.activeCampaigns || 0).toString(),
      label: "Stories Unfolding", 
      description: "Families hoping, communities building, change happening",
      icon: "🎯",
      suffix: ""
    },
    totalCampaigns: {
      value: rawStats.totalCampaigns || 0,
      formatted: rawStats.formatted?.totalCampaigns || (rawStats.totalCampaigns || 0).toString(),
      label: "Dreams Started",
      description: "Every journey begins with a single step of courage",
      icon: "📊",
      suffix: ""
    },
    totalDonors: {
      value: rawStats.totalDonors || 0,
      formatted: rawStats.formatted?.totalDonors || formatNumber(rawStats.totalDonors || 0),
      label: "Generous Hearts",
      description: "Strangers becoming family through kindness",
      icon: "🤝",
      suffix: "+"
    },
    districtsReached: {
      value: rawStats.districtsReached || 0,
      formatted: rawStats.formatted?.districtsReached || (rawStats.districtsReached || 0).toString(),
      label: "Communities Connected",
      description: "From mountains to valleys, hope knows no boundaries",
      icon: "🗺️",
      suffix: ""
    }
  };
};

/**
 * Get formatted live impact stats
 * @param {Object} rawStats - Raw live impact stats from API
 * @returns {Object} Formatted live impact stats
 */
export const formatLiveImpactStats = (rawStats) => {
  if (!rawStats) return null;

  return {
    activeCampaigns: rawStats.activeCampaigns || 0,
    totalRaised: rawStats.totalRaised || 0,
    recentDonations: rawStats.recentDonations || 0,
    formatted: {
      activeCampaigns: rawStats.formatted?.activeCampaigns || (rawStats.activeCampaigns || 0).toString(),
      totalRaised: rawStats.formatted?.totalRaised || formatCurrency(rawStats.totalRaised || 0),
      recentDonations: rawStats.formatted?.recentDonations || (rawStats.recentDonations || 0).toString()
    },
    lastUpdated: rawStats.lastUpdated || new Date()
  };
};

// Utility formatting functions
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatCurrency(amount) {
  if (amount >= 1000000) {
    return '₹' + (amount / 1000000).toFixed(1) + 'M';
  } else if (amount >= 1000) {
    return '₹' + (amount / 1000).toFixed(1) + 'K';
  }
  return '₹' + amount.toString();
}

// Fallback data when API is unavailable
function getFallbackHomeStats() {
  return {
    totalUsers: 1250,
    totalFunds: 2500000,
    activeCampaigns: 42,
    totalDonors: 1300,
    districtsReached: 12,
    formatted: {
      totalUsers: "1.3K",
      totalFunds: "₹2.5M",
      activeCampaigns: "42",
      totalDonors: "1.3K",
      districtsReached: "12"
    },
    lastUpdated: new Date(),
    fallback: true
  };
}

function getFallbackLiveImpactStats() {
  return {
    activeCampaigns: 42,
    totalRaised: 2500000,
    recentDonations: 5,
    formatted: {
      activeCampaigns: "42",
      totalRaised: "₹2.5M",
      recentDonations: "5"
    },
    lastUpdated: new Date(),
    fallback: true
  };
}

export default {
  getHomeStats,
  getLiveImpactStats,
  clearStatsCache,
  prefetchStats,
  formatStatsForDisplay,
  formatLiveImpactStats
};