// filepath: c:\Users\acer\Desktop\AstraDbWala\client\src\pages\DetailedStatistics.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
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
  ActivityIcon
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
  const [statistics, setStatistics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name.includes('Amount') || entry.name.includes('amount') 
                ? `₹${entry.value.toLocaleString()}` 
                : entry.value}
            </p>
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
          fetch(`http://localhost:5000/api/donations/campaign/${campaignid}/statistics`),
          fetch(`http://localhost:5000/api/donations/campaign/${campaignid}/trends?period=30`)
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
          `http://localhost:5000/api/donations/campaign/${campaignid}/donors?page=${page}&limit=20`
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B2325]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Statistics</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/explore" className="text-[#8B2325] hover:text-[#7a1f21] font-medium">
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign Not Found</h2>
          <Link href="/explore" className="text-[#8B2325] hover:text-[#7a1f21] font-medium">
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const { campaign, statistics: stats, distribution } = statistics;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href={`/campaign/${campaignid}`}
            className="flex items-center text-[#8B2325] hover:text-[#7a1f21] font-medium transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Campaign
          </Link>
          <div className="flex items-center space-x-2">
            <EyeIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Campaign Analytics</span>
          </div>
        </div>

        {/* Campaign Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {campaign.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <UsersIcon className="w-4 h-4 mr-1" />
                  by {campaign.creator.name}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Started {new Date(campaign.startDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                <DollarSignIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{stats.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Raised</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                <TargetIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completionPercentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Goal Completed</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                <UsersIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDonors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Donors</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-lg">
                <HeartIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{Math.round(stats.averageDonation).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Donation</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donation Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUpIcon className="w-6 h-6 mr-2 text-[#8B2325]" />
              Donation Trends (Last 30 Days)
            </h3>
            <div className="h-80">
              {trends && processChartData().dailyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processChartData().dailyTrends}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <YAxis 
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                      tickFormatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke={CHART_COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                      strokeWidth={2}
                      name="Daily Amount"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No donation trends data available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Highest Donation</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{stats.maxDonation.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Lowest Donation</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{stats.minDonation.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Anonymous Donors</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.anonymousDonors}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Public Donors</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.publicDonors}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{stats.remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Donor Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <PieChartIcon className="w-6 h-6 mr-2 text-[#8B2325]" />
              Donor Privacy Distribution
            </h3>
            <div className="h-80">
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No donor distribution data available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Hourly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ActivityIcon className="w-6 h-6 mr-2 text-[#8B2325]" />
              Hourly Donation Activity
            </h3>
            <div className="h-80">
              {trends && processChartData().hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processChartData().hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="hour" 
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <YAxis 
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="donations" 
                      fill={CHART_COLORS.info} 
                      name="Number of Donations"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hourly activity data available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Donation Amount Distribution Chart */}
        {statistics && statistics.distribution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3Icon className="w-6 h-6 mr-2 text-[#8B2325]" />
              Donation Amount Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.distribution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="_id" 
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                            <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                            <p style={{ color: payload[0].color }} className="text-sm">
                              Donations: {payload[0].value}
                            </p>
                            <p style={{ color: payload[1].color }} className="text-sm">
                              Total Amount: ₹{payload[1].value.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill={CHART_COLORS.purple} 
                    name="Number of Donations"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="totalAmount" 
                    fill={CHART_COLORS.teal} 
                    name="Total Amount (₹)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Progress Visualization */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <TargetIcon className="w-6 h-6 mr-2 text-[#8B2325]" />
              Campaign Progress
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="40%" 
                  outerRadius="80%" 
                  data={[
                    {
                      name: 'Progress',
                      value: statistics.statistics.completionPercentage,
                      fill: statistics.statistics.completionPercentage >= 100 ? CHART_COLORS.success : CHART_COLORS.primary
                    }
                  ]}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#8884d8"
                  />
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="text-3xl font-bold fill-gray-900 dark:fill-white"
                  >
                    {statistics.statistics.completionPercentage}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{statistics.statistics.totalAmount.toLocaleString()} raised of ₹{statistics.campaign.targetAmount.toLocaleString()} goal
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {statistics.statistics.completionPercentage >= 100 
                    ? '🎉 Goal achieved! Thank you to all supporters!' 
                    : `₹${statistics.statistics.remainingAmount.toLocaleString()} remaining to reach the goal`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* All Donors Section - MOVED TO BOTTOM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <UsersIcon className="w-6 h-6 mr-2 text-[#8B2325]" />
            All Donors ({stats.totalDonors})
          </h3>

          <div className="space-y-4">
            {donors.map((donation, index) => (
              <motion.div
                key={donation._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-shrink-0">
                  {donation.donor.profilePicture ? (
                    <img
                      src={donation.donor.profilePicture}
                      alt={donation.donor.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#8B2325] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {donation.donor.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {donation.donor.name}
                    </h4>
                    <span className="font-bold text-[#8B2325] text-lg">
                      ₹{donation.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {new Date(donation.date).toLocaleDateString()}
                    </div>
                    {donation.anonymous && (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
                        Anonymous
                      </span>
                    )}
                  </div>

                  {donation.message && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-[#8B2325]">
                      <div className="flex items-start">
                        <MessageSquareIcon className="w-4 h-4 text-[#8B2325] mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                          "{donation.message}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Loading More Indicator */}
          {donorsLoading && (
            <div className="flex justify-center mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B2325]"></div>
            </div>
          )}

          {/* No More Data */}
          {!hasMore && donors.length > 0 && (
            <div className="text-center mt-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">You've reached the end of the donor list</p>
            </div>
          )}

          {/* Empty State */}
          {donors.length === 0 && !donorsLoading && (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Donors Yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                This campaign hasn't received any donations yet.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DetailedStatistics;
