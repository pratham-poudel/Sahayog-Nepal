import { createContext, useContext, useState, useEffect } from 'react';
import { getHomeStats, getLiveImpactStats, formatStatsForDisplay, formatLiveImpactStats } from '../services/statsService';

const StatsContext = createContext();

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

export const StatsProvider = ({ children }) => {
  const [homeStats, setHomeStats] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [formattedHomeStats, setFormattedHomeStats] = useState(null);
  const [formattedLiveStats, setFormattedLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats once when the provider mounts
  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both home stats and live stats in parallel
        const [rawHomeStats, rawLiveStats] = await Promise.all([
          getHomeStats(),
          getLiveImpactStats()
        ]);

        // Format the stats
        const formattedHome = formatStatsForDisplay(rawHomeStats);
        const formattedLive = formatLiveImpactStats(rawLiveStats);

        // Update all state
        setHomeStats(rawHomeStats);
        setLiveStats(rawLiveStats);
        setFormattedHomeStats(formattedHome);
        setFormattedLiveStats(formattedLive);

        console.log('✅ Stats fetched and cached in context');

      } catch (err) {
        console.error('❌ Error fetching stats in context:', err);
        setError(err.message);
        
        // Set fallback data
        const fallbackHomeStats = {
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
          fallback: true
        };

        const fallbackLiveStats = {
          activeCampaigns: 42,
          totalRaised: 2500000,
          recentDonations: 5,
          formatted: {
            activeCampaigns: "42",
            totalRaised: "₹2.5M",
            recentDonations: "5"
          },
          fallback: true
        };

        setHomeStats(fallbackHomeStats);
        setLiveStats(fallbackLiveStats);
        setFormattedHomeStats(formatStatsForDisplay(fallbackHomeStats));
        setFormattedLiveStats(formatLiveImpactStats(fallbackLiveStats));
        
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  // Method to refresh stats if needed
  const refreshStats = async () => {
    try {
      setLoading(true);
      const [rawHomeStats, rawLiveStats] = await Promise.all([
        getHomeStats(),
        getLiveImpactStats()
      ]);

      const formattedHome = formatStatsForDisplay(rawHomeStats);
      const formattedLive = formatLiveImpactStats(rawLiveStats);

      setHomeStats(rawHomeStats);
      setLiveStats(rawLiveStats);
      setFormattedHomeStats(formattedHome);
      setFormattedLiveStats(formattedLive);
      setError(null);
      
    } catch (err) {
      console.error('Error refreshing stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Raw stats
    homeStats,
    liveStats,
    
    // Formatted stats (ready to use)
    formattedHomeStats,
    formattedLiveStats,
    
    // State
    loading,
    error,
    
    // Actions
    refreshStats,
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
};

export default StatsProvider;