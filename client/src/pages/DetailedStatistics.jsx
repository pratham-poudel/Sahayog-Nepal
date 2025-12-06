// filepath: c:\Users\acer\Desktop\AstraDbWala\client\src\pages\DetailedStatistics.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion, useInView } from 'framer-motion';
import { 
  TrendingUpIcon, 
  UsersIcon, 
  HeartIcon, 
  CalendarIcon,
  ArrowLeftIcon,
  EyeIcon,
  MessageSquareIcon,
  DollarSignIcon,
  TargetIcon,
  ClockIcon,
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
  TrendingDownIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  Share2Icon,
  DownloadIcon,
  XIcon,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  LinkIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';


const DetailedStatistics = () => {
  const { campaignid } = useParams();
  const [, navigate] = useLocation();
  const [statistics, setStatistics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const posterRef = useRef(null);

  // Handle back navigation
  const handleBack = () => {
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.origin)) {
      window.history.back();
    } else {
      navigate('/dashboard#campaigns');
    }
  };

  // Generate shareable URL
  const getShareableURL = () => {
    return `${window.location.origin}/campaign/${campaignid}`;
  };

  // Share handlers
  const shareToFacebook = () => {
    const url = getShareableURL();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToTwitter = () => {
    const url = getShareableURL();
    const text = `Check out this amazing campaign: ${statistics.campaign.title} - ₹${statistics.statistics.totalAmount.toLocaleString()} raised!`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = getShareableURL();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const copyLink = () => {
    const url = getShareableURL();
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  // Download poster as image
  const downloadPoster = async () => {
    setIsGeneratingPoster(true);
    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      const posterElement = posterRef.current;
      if (!posterElement) return;

      const canvas = await html2canvas(posterElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `sahayog-nepal-${statistics.campaign.title.replace(/\s+/g, '-')}-stats.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('Failed to generate poster. Please try again.');
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Chart colors
  const CHART_COLORS = {
    primary: '#8B2325',
    secondary: '#DC2626',
    accent: '#F87171',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    purple: '#8B5CF6',
    teal: '#14B8A6'
  };

  // Process trends data for charts
  const processChartData = () => {
    if (!trends) return { dailyTrends: [], hourlyData: [], pieData: [] };

    // Daily trends with formatted dates
    const dailyTrends = trends.dailyTrends.map(item => ({
      date: `${item._id.month}/${item._id.day}`,
      amount: item.dailyAmount,
      donors: item.dailyDonors,
      fullDate: new Date(item._id.year, item._id.month - 1, item._id.day)
    })).sort((a, b) => a.fullDate - b.fullDate);

    // Hourly distribution
    const hourlyData = trends.hourlyDistribution.map(item => ({
      hour: `${item._id}:00`,
      donations: item.count,
      amount: item.totalAmount
    }));

    // Pie chart data for anonymous vs public donors
    const pieData = statistics ? [
      { name: 'Public Donors', value: statistics.statistics.publicDonors, color: CHART_COLORS.primary },
      { name: 'Anonymous Donors', value: statistics.statistics.anonymousDonors, color: CHART_COLORS.secondary }
    ] : [];

    return { dailyTrends, hourlyData, pieData };
  };

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <p className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between space-x-4 mb-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {entry.name}
                </span>
              </div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                {entry.name.includes('Amount') || entry.name.includes('amount') 
                  ? `₹${entry.value.toLocaleString()}` 
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Fetch campaign statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const [statsResponse, trendsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/donations/campaign/${campaignid}/statistics`, {
            headers: getAuthHeaders()
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/donations/campaign/${campaignid}/trends?period=30`, {
            headers: getAuthHeaders()
          })
        ]);

        if (!statsResponse.ok || !trendsResponse.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const statsData = await statsResponse.json();
        const trendsData = await trendsResponse.json();

        setStatistics(statsData.data);
        setTrends(trendsData.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (campaignid) {
      fetchStatistics();
    }
  }, [campaignid]);

  // Fetch donors with pagination
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        setDonorsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/donations/campaign/${campaignid}/donors?page=${page}&limit=20`,
          {
            headers: getAuthHeaders()
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch donors');
        }

        const data = await response.json();
        
        if (page === 1) {
          setDonors(data.data);
        } else {
          setDonors(prev => [...prev, ...data.data]);
        }
        
        setHasMore(data.pagination.hasMore);
      } catch (err) {
        console.error('Error fetching donors:', err);
      } finally {
        setDonorsLoading(false);
      }
    };

    if (campaignid) {
      fetchDonors();
    }
  }, [campaignid, page]);

  // Load more donors (infinite scroll)
  const loadMoreDonors = () => {
    if (!donorsLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMoreDonors();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [donorsLoading, hasMore]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-[#8B2325] border-r-[#DC2626] absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
            <AlertCircleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Unable to Load Statistics</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">{error}</p>
          <button
            onClick={handleBack}
            className="px-8 py-3 bg-gradient-to-r from-[#8B2325] to-[#DC2626] text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
            <AlertCircleIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBack}
            className="px-8 py-3 bg-gradient-to-r from-[#8B2325] to-[#DC2626] text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const { campaign, statistics: stats, distribution } = statistics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={handleBack}
              className="group flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-[#8B2325] dark:hover:text-[#DC2626] transition-all duration-300"
            >
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-[#8B2325]/10 dark:group-hover:bg-[#DC2626]/10 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
              </div>
              <span className="font-medium hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowShareModal(true)}
                className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#8B2325] to-[#DC2626] text-white rounded-full hover:shadow-xl transition-all duration-300"
              >
                <Share2Icon className="w-4 h-4" />
                <span className="text-sm font-semibold">Share Stats</span>
              </button>
              
              <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-[#8B2325]/5 to-[#DC2626]/5 rounded-full border border-[#8B2325]/10">
                <ActivityIcon className="w-4 h-4 text-[#8B2325]" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:inline">Campaign Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">

        {/* Hero Section with Campaign Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 sm:mb-16"
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#8B2325] to-[#DC2626] rounded-full mb-4 sm:mb-6"
            >
              <TargetIcon className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
              <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">CAMPAIGN PERFORMANCE</span>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight px-4">
              {campaign.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-gray-600 dark:text-gray-400 px-4">
              <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <UsersIcon className="w-3 sm:w-4 h-3 sm:h-4 text-[#8B2325]" />
                <span className="font-medium text-sm sm:text-base">{campaign.creator.name}</span>
              </div>
              <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <CalendarIcon className="w-3 sm:w-4 h-3 sm:h-4 text-[#8B2325]" />
                <span className="font-medium text-sm sm:text-base">{new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Performance Metrics - Premium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {[
            {
              icon: DollarSignIcon,
              value: `₹${stats.totalAmount.toLocaleString()}`,
              label: 'Total Raised',
              gradient: 'from-emerald-500 to-teal-600',
              bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
              iconColor: 'text-emerald-600 dark:text-emerald-400',
              delay: 0.1
            },
            {
              icon: stats.completionPercentage >= 100 ? CheckCircleIcon : TargetIcon,
              value: `${stats.completionPercentage}%`,
              label: 'Goal Completion',
              gradient: 'from-blue-500 to-indigo-600',
              bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
              iconColor: 'text-blue-600 dark:text-blue-400',
              delay: 0.2
            },
            {
              icon: UsersIcon,
              value: stats.totalDonors.toLocaleString(),
              label: 'Total Supporters',
              gradient: 'from-purple-500 to-pink-600',
              bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
              iconColor: 'text-purple-600 dark:text-purple-400',
              delay: 0.3
            },
            {
              icon: HeartIcon,
              value: `₹${Math.round(stats.averageDonation).toLocaleString()}`,
              label: 'Average Donation',
              gradient: 'from-orange-500 to-red-600',
              bg: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
              iconColor: 'text-orange-600 dark:text-orange-400',
              delay: 0.4
            }
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: metric.delay }}
              className="group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className={`relative bg-gradient-to-br ${metric.bg} backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300`}>
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg ${metric.iconColor}`}>
                    <metric.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  {index === 1 && stats.completionPercentage >= 100 && (
                    <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                      ACHIEVED
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {metric.value}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {metric.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Donation Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Donation Trends
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">30-day performance overview</p>
                </div>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-[#8B2325] to-[#DC2626] rounded-2xl shadow-lg">
                  <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <div className="h-64 sm:h-80">
                {trends && processChartData().dailyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processChartData().dailyTrends}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        fontSize={11}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={11}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={CHART_COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                        strokeWidth={3}
                        name="Daily Amount"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center p-8">
                      <TrendingDownIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No trend data available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Data will appear as donations are received</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#8B2325] to-[#DC2626] p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white">Key Insights</h3>
                <p className="text-white/80 text-xs sm:text-sm mt-1">Campaign statistics at a glance</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {[
                  { label: 'Highest Donation', value: `₹${stats.maxDonation.toLocaleString()}`, icon: TrendingUpIcon, color: 'text-emerald-600' },
                  { label: 'Lowest Donation', value: `₹${stats.minDonation.toLocaleString()}`, icon: TrendingDownIcon, color: 'text-blue-600' },
                  { label: 'Anonymous Donors', value: stats.anonymousDonors, icon: EyeIcon, color: 'text-purple-600' },
                  { label: 'Public Donors', value: stats.publicDonors, icon: UsersIcon, color: 'text-orange-600' },
                  { label: 'Amount Remaining', value: `₹${stats.remainingAmount.toLocaleString()}`, icon: TargetIcon, color: stats.remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600' }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-800 ${stat.color} flex-shrink-0`}>
                        <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{stat.label}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg group-hover:scale-105 transition-transform flex-shrink-0 ml-2">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Analytics Deep Dive Section */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-10 px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Deep Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">Comprehensive breakdown of campaign performance</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Donor Distribution Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Donor Privacy
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Anonymous vs Public supporters</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                    <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <div className="h-64 sm:h-80">
                  {statistics && processChartData().pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processChartData().pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {processChartData().pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center p-8">
                        <PieChartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No distribution data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Hourly Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Activity Timeline
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hourly donation patterns</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <ActivityIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="h-80">
                  {trends && processChartData().hourlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processChartData().hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="opacity-30" />
                        <XAxis 
                          dataKey="hour" 
                          stroke="#6b7280"
                          fontSize={11}
                          fontWeight={500}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          fontSize={11}
                          fontWeight={500}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="donations" 
                          fill={CHART_COLORS.info} 
                          name="Number of Donations"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center p-8">
                        <ActivityIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No activity data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Donation Amount Distribution Chart */}
        {statistics && statistics.distribution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden mb-12 sm:mb-16"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Donation Distribution
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Breakdown by donation amount ranges</p>
                </div>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg">
                  <BarChart3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="opacity-30" />
                    <XAxis 
                      dataKey="_id" 
                      stroke="#6b7280"
                      fontSize={11}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={11}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
                              <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                              <p style={{ color: payload[0].color }} className="text-sm font-medium">
                                Donations: {payload[0].value}
                              </p>
                              <p style={{ color: payload[1].color }} className="text-sm font-medium">
                                Total: ₹{payload[1].value.toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Bar 
                      dataKey="count" 
                      fill={CHART_COLORS.purple} 
                      name="Number of Donations"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="totalAmount" 
                      fill={CHART_COLORS.teal} 
                      name="Total Amount (₹)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Visualization */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 }}
            className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden mb-12 sm:mb-16"
          >
            <div className="p-6 sm:p-8 lg:p-12">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#8B2325] to-[#DC2626] rounded-full mb-3 sm:mb-4">
                  <TargetIcon className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">FUNDING PROGRESS</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white px-4">
                  Campaign Goal Tracking
                </h3>
              </div>
              
              <div className="max-w-md mx-auto">
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="50%" 
                      outerRadius="90%" 
                      data={[
                        {
                          name: 'Progress',
                          value: statistics.statistics.completionPercentage,
                          fill: statistics.statistics.completionPercentage >= 100 ? CHART_COLORS.success : CHART_COLORS.primary
                        }
                      ]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={15}
                        fill="#8884d8"
                      />
                      <text 
                        x="50%" 
                        y="48%" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        className="text-4xl sm:text-5xl font-black fill-gray-900 dark:fill-white"
                      >
                        {statistics.statistics.completionPercentage}%
                      </text>
                      <text 
                        x="50%" 
                        y="58%" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        className="text-xs sm:text-sm font-medium fill-gray-500 dark:fill-gray-400 uppercase tracking-wider"
                      >
                        Complete
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Funding</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                          ₹{statistics.statistics.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Target Goal</p>
                        <p className="text-2xl sm:text-3xl font-bold text-[#8B2325] truncate">
                          ₹{statistics.campaign.targetAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {statistics.statistics.completionPercentage >= 100 ? (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-6 text-center">
                      <CheckCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white mx-auto mb-2 sm:mb-3" />
                      <p className="text-white font-bold text-base sm:text-lg">
                        🎉 Goal Achieved! Thank you to all supporters!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-center">
                      <AlertCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white mx-auto mb-2 sm:mb-3" />
                      <p className="text-white font-bold text-base sm:text-lg mb-1">
                        ₹{statistics.statistics.remainingAmount.toLocaleString()} more needed
                      </p>
                      <p className="text-white/90 text-xs sm:text-sm">to reach the campaign goal</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* All Donors Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#8B2325] to-[#DC2626] p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Campaign Supporters</h3>
                <p className="text-white/90 text-sm sm:text-base">Thank you to all {stats.totalDonors.toLocaleString()} generous donors</p>
              </div>
              <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-3 sm:space-y-4">
              {donors.map((donation, index) => (
                <motion.div
                  key={donation._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-[#8B2325] dark:hover:border-[#DC2626] hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0">
                      {donation.donor.profilePicture ? (
                        <img
                          src={donation.donor.profilePicture}
                          alt={donation.donor.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700 group-hover:ring-[#8B2325]/20 transition-all"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#8B2325] to-[#DC2626] rounded-full flex items-center justify-center ring-4 ring-gray-100 dark:ring-gray-700 group-hover:ring-[#8B2325]/20 transition-all shadow-lg">
                          <span className="text-white font-bold text-lg sm:text-xl">
                            {donation.donor.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                            {donation.donor.name}
                          </h4>
                          {donation.anonymous && (
                            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow-sm flex-shrink-0">
                              ANONYMOUS
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#8B2325] to-[#DC2626]">
                            ₹{donation.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="font-medium">
                          {new Date(donation.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {donation.message && (
                        <div className="mt-3 sm:mt-4 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#8B2325] to-[#DC2626] rounded-full"></div>
                          <div className="pl-4 sm:pl-5 pr-2 sm:pr-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-r-xl">
                            <div className="flex items-start space-x-2">
                              <MessageSquareIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#8B2325] mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed italic">
                                "{donation.message}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Loading More Indicator */}
            {donorsLoading && (
              <div className="flex justify-center mt-8">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#8B2325] absolute top-0 left-0"></div>
                </div>
              </div>
            )}

            {/* No More Data */}
            {!hasMore && donors.length > 0 && (
              <div className="text-center mt-8 pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  You've viewed all {stats.totalDonors} donors
                </p>
              </div>
            )}

            {/* Empty State */}
            {donors.length === 0 && !donorsLoading && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full mb-6">
                  <UsersIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Supporters Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  This campaign is waiting for its first donation. Be the first to support this cause!
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer Spacer */}
        <div className="h-20"></div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShareModal(false);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#8B2325] to-[#DC2626] p-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h3 className="text-2xl font-bold text-white">Share Campaign Statistics</h3>
                <p className="text-white/80 text-sm mt-1">Spread the word about this amazing campaign</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Social Share Buttons */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Share on Social Media</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button
                    onClick={shareToFacebook}
                    className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all hover:scale-105"
                  >
                    <FacebookIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">Facebook</span>
                  </button>
                  <button
                    onClick={shareToTwitter}
                    className="flex flex-col items-center justify-center p-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all hover:scale-105"
                  >
                    <TwitterIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">Twitter</span>
                  </button>
                  <button
                    onClick={shareToLinkedIn}
                    className="flex flex-col items-center justify-center p-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-all hover:scale-105"
                  >
                    <LinkedinIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">LinkedIn</span>
                  </button>
                  <button
                    onClick={copyLink}
                    className="flex flex-col items-center justify-center p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all hover:scale-105"
                  >
                    <LinkIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">Copy Link</span>
                  </button>
                </div>
              </div>

              {/* Download Poster Section */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Download Poster</h4>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6">
                  {/* Poster Preview */}
                  <div ref={posterRef} className="bg-gradient-to-br from-[#8B2325] via-[#DC2626] to-[#991b1b] p-8 sm:p-12 rounded-2xl relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full blur-3xl"></div>
                    
                    {/* Logo and Brand */}
                    <div className="relative z-10 text-center mb-6 sm:mb-8">
                      <div className="inline-block bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 border-white/30 mb-3 sm:mb-4">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          SAHAYOG NEPAL
                        </h1>
                      </div>
                      <p className="text-white/90 text-xs sm:text-sm font-semibold tracking-widest uppercase px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Empowering Communities • Transforming Lives
                      </p>
                    </div>

                    {/* Campaign Stats */}
                    <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-4 sm:mb-6 text-center leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {campaign.title}
                      </h2>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 sm:p-4 rounded-xl border-2 border-emerald-200">
                          <div className="text-emerald-600 text-xs sm:text-sm font-bold mb-1 uppercase tracking-wide">Raised</div>
                          <div className="text-2xl sm:text-3xl font-black text-gray-900">₹{stats.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl border-2 border-blue-200">
                          <div className="text-blue-600 text-xs sm:text-sm font-bold mb-1 uppercase tracking-wide">Goal</div>
                          <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats.completionPercentage}%</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 sm:p-4 rounded-xl border-2 border-purple-200">
                          <div className="text-purple-600 text-xs sm:text-sm font-bold mb-1 uppercase tracking-wide">Supporters</div>
                          <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalDonors}</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-3 sm:p-4 rounded-xl border-2 border-orange-200">
                          <div className="text-orange-600 text-xs sm:text-sm font-bold mb-1 uppercase tracking-wide">Average</div>
                          <div className="text-xl sm:text-2xl font-black text-gray-900">₹{Math.round(stats.averageDonation).toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Achievement Badge */}
                      {stats.completionPercentage >= 100 && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center py-2 sm:py-3 px-4 sm:px-6 rounded-xl font-black text-base sm:text-lg">
                          🎉 GOAL ACHIEVED!
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 text-center mt-6 sm:mt-8">
                      <p className="text-white/90 text-xs sm:text-sm font-semibold mb-2">Join us in making a difference</p>
                      <div className="text-white text-xs font-mono bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full inline-block break-all max-w-full">
                        {window.location.origin}/campaign/{campaignid}
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={downloadPoster}
                    disabled={isGeneratingPoster}
                    className="w-full mt-6 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#8B2325] to-[#DC2626] text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPoster ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Generating Poster...</span>
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="w-5 h-5" />
                        <span>Download Poster</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DetailedStatistics;
