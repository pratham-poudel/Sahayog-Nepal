import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, Users, DollarSign, 
  CreditCard, Target, Activity, ArrowUpRight, ArrowDownRight,
  Package, Award, AlertCircle, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { API_URL } from '../../config/index';

const AdminAnalytics = ({ darkMode, chartColors }) => {
  const [timeframe, setTimeframe] = useState('month'); // day, month, year
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
 
  // Fetch analytics data based on timeframe
  const fetchAnalytics = async (selectedTimeframe) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/analytics/overview?timeframe=${selectedTimeframe}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
        calculateSummaryStats(result.data);
      } else {
        throw new Error(result.message || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics from analytics data
  const calculateSummaryStats = (data) => {
    if (!data) return;

    // Calculate campaign stats
    const totalCampaigns = data.campaignTrends?.reduce((sum, item) => sum + item.count, 0) || 0;
    const totalCampaignTarget = data.campaignTrends?.reduce((sum, item) => sum + item.totalTarget, 0) || 0;
    const totalCampaignRaised = data.campaignTrends?.reduce((sum, item) => sum + item.totalRaised, 0) || 0;
    
    // Calculate payment stats
    const totalPayments = data.paymentTrends?.reduce((sum, item) => sum + item.count, 0) || 0;
    const totalPaymentAmount = data.paymentTrends?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const totalPlatformFees = data.paymentTrends?.reduce((sum, item) => sum + item.platformFees, 0) || 0;
    
    // Calculate user stats
    const totalNewUsers = data.userGrowth?.reduce((sum, item) => sum + item.count, 0) || 0;
    
    // Calculate withdrawal stats
    const totalWithdrawals = data.withdrawalTrends?.reduce((sum, item) => sum + item.count, 0) || 0;
    const totalWithdrawnAmount = data.withdrawalTrends?.reduce((sum, item) => sum + item.amount, 0) || 0;

    // Calculate growth percentages (comparing first half vs second half of period)
    const calculateGrowth = (trends) => {
      if (!trends || trends.length < 2) return 0;
      const midpoint = Math.floor(trends.length / 2);
      const firstHalf = trends.slice(0, midpoint).reduce((sum, item) => sum + (item.count || item.amount || 0), 0);
      const secondHalf = trends.slice(midpoint).reduce((sum, item) => sum + (item.count || item.amount || 0), 0);
      if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
      return ((secondHalf - firstHalf) / firstHalf) * 100;
    };

    setSummaryStats({
      campaigns: {
        total: totalCampaigns,
        targetAmount: totalCampaignTarget,
        raisedAmount: totalCampaignRaised,
        successRate: totalCampaignTarget > 0 ? (totalCampaignRaised / totalCampaignTarget * 100).toFixed(1) : 0,
        growth: calculateGrowth(data.campaignTrends)
      },
      payments: {
        total: totalPayments,
        amount: totalPaymentAmount,
        platformFees: totalPlatformFees,
        average: totalPayments > 0 ? (totalPaymentAmount / totalPayments) : 0,
        growth: calculateGrowth(data.paymentTrends)
      },
      users: {
        total: totalNewUsers,
        growth: calculateGrowth(data.userGrowth)
      },
      withdrawals: {
        total: totalWithdrawals,
        amount: totalWithdrawnAmount,
        average: totalWithdrawals > 0 ? (totalWithdrawnAmount / totalWithdrawals) : 0,
        growth: calculateGrowth(data.withdrawalTrends)
      }
    });
  };

  // Fetch analytics on mount and when timeframe changes
  useEffect(() => {
    console.log('useEffect triggered, timeframe:', timeframe);
    fetchAnalytics(timeframe);
  }, [timeframe]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-NP').format(num || 0);
  };

  // Stat Card Component
  const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            {subValue && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subValue}</p>
            )}
            {trendValue !== undefined && (
              <div className="flex items-center mt-3">
                {trendValue >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${trendValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(trendValue).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  vs previous period
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => fetchAnalytics(timeframe)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Platform Analytics</h2>
              <p className="text-blue-100 text-sm mt-1">
                Comprehensive insights into your platform's performance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 z-10">
            <Calendar className="w-5 h-5 mr-2" />
            <button
              type="button"
              onClick={() => {
                console.log('Daily button clicked');
                setTimeframe('day');
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                timeframe === 'day'
                  ? 'bg-white text-blue-600 shadow-lg scale-105'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Monthly button clicked');
                setTimeframe('month');
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-white text-blue-600 shadow-lg scale-105'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Yearly button clicked');
                setTimeframe('year');
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                timeframe === 'year'
                  ? 'bg-white text-blue-600 shadow-lg scale-105'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      {loading && analytics && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Updating analytics...</span>
          </div>
        </div>
      )}

      {/* Summary Statistics Cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Campaigns"
            value={formatNumber(summaryStats.campaigns.total)}
            subValue={`${summaryStats.campaigns.successRate}% success rate`}
            icon={Package}
            trendValue={summaryStats.campaigns.growth}
            color="blue"
          />
          <StatCard
            title="Total Payments"
            value={formatNumber(summaryStats.payments.total)}
            subValue={`Avg: ${formatCurrency(summaryStats.payments.average)}`}
            icon={CreditCard}
            trendValue={summaryStats.payments.growth}
            color="green"
          />
          <StatCard
            title="New Users"
            value={formatNumber(summaryStats.users.total)}
            subValue={`Joined this period`}
            icon={Users}
            trendValue={summaryStats.users.growth}
            color="purple"
          />
          <StatCard
            title="Withdrawals"
            value={formatNumber(summaryStats.withdrawals.total)}
            subValue={`Avg: ${formatCurrency(summaryStats.withdrawals.average)}`}
            icon={DollarSign}
            trendValue={summaryStats.withdrawals.growth}
            color="orange"
          />
        </div>
      )}

      {/* Financial Overview Cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Total Revenue</h3>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{formatCurrency(summaryStats.payments.amount)}</p>
            <p className="text-sm opacity-90">From {formatNumber(summaryStats.payments.total)} payments</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Platform Fees</h3>
              <Award className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{formatCurrency(summaryStats.payments.platformFees)}</p>
            <p className="text-sm opacity-90">
              {((summaryStats.payments.platformFees / summaryStats.payments.amount) * 100 || 0).toFixed(1)}% of revenue
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Funds Raised</h3>
              <Target className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{formatCurrency(summaryStats.campaigns.raisedAmount)}</p>
            <p className="text-sm opacity-90">
              of {formatCurrency(summaryStats.campaigns.targetAmount)} target
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Creation Trends</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Campaigns created over time
              </p>
            </div>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.campaignTrends || []}>
              <defs>
                <linearGradient id="campaignGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="_id" 
                stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6"
                fill="url(#campaignGradient)"
                strokeWidth={2}
                name="Campaigns"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue & Fees</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Payment trends and platform fees
              </p>
            </div>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.paymentTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="_id" 
                stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="amount" fill="#10B981" name="Payment Amount" radius={[4, 4, 0, 0]} />
              <Bar dataKey="platformFees" fill="#F59E0B" name="Platform Fees" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Growth</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                New user registrations
              </p>
            </div>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="_id" 
                stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Withdrawal Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Withdrawal Trends</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Successful withdrawals processed
              </p>
            </div>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.withdrawalTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="_id" 
                stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => {
                  if (name === 'Withdrawn Amount') return formatCurrency(value);
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="amount" fill="#F97316" name="Withdrawn Amount" radius={[4, 4, 0, 0]} />
              <Bar dataKey="count" fill="#06B6D4" name="# of Withdrawals" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Target</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summaryStats.campaigns.targetAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Raised</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summaryStats.campaigns.raisedAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {summaryStats.campaigns.successRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Revenue</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summaryStats.payments.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Platform Fees</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summaryStats.payments.platformFees)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Withdrawn</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summaryStats.withdrawals.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
