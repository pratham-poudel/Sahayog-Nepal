import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { API_URL } from '../config/index';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Users, DollarSign, TrendingUp, Eye, Settings, Download, 
  Search, Filter, ChevronDown, RefreshCw, Calendar,
  CheckCircle, XCircle, Clock, AlertTriangle, Star,
  FileText, Activity, CreditCard, UserCheck, MoreVertical,
  Edit3, Trash2, Flag, Ban, Check, Shield, ShieldX
} from 'lucide-react';
import VerifyBank from './admin/VerifyBank';
import WithdrawalManagement from './admin/WithdrawalManagement';
import AdminAnalytics from './admin/AdminAnalytics';

const AdminDashboard = () => {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);  const [campaigns, setCampaigns] = useState([]);  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );  // Track which tabs have been loaded to avoid re-fetching
  const [loadedTabs, setLoadedTabs] = useState({
    dashboard: false,
    campaigns: false,
    users: false,
    payments: false,
    analytics: false,
    verifybank: false,
    withdrawals: false
  });

  // Individual loading states for each tab
  const [tabLoading, setTabLoading] = useState({
    dashboard: false,
    campaigns: false,
    users: false,
    payments: false,
    analytics: false,
    verifybank: false,
    withdrawals: false
  });

  // Filters and search states
  const [campaignFilters, setCampaignFilters] = useState({
    status: '',
    category: '',
    search: '',
    page: 1,
    limit: 20
  });
  
  const [paymentFilters, setPaymentFilters] = useState({
    status: '',
    paymentMethod: '',
    search: '',
    page: 1,
    limit: 20
  });  const [userFilters, setUserFilters] = useState({
    search: '',
    page: 1,
    limit: 20
  });

  // Pagination metadata
  const [campaignPagination, setCampaignPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  
  const [userPagination, setUserPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  
  const [paymentPagination, setPaymentPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [statusDropdown, setStatusDropdown] = useState({});
  
  // Loading states for specific actions
  const [actionLoading, setActionLoading] = useState({
    campaignStatus: {},
    bulkAction: false,
    featured: {}
  });    // Add search loading states
  const [searchLoading, setSearchLoading] = useState({
    campaigns: false,
    users: false,
    payments: false
  });
    // Debounce timer for search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  const [userSearchDebounceTimer, setUserSearchDebounceTimer] = useState(null);
  const [paymentSearchDebounceTimer, setPaymentSearchDebounceTimer] = useState(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  // Apply dark mode on component mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);  // Close status dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.status-dropdown')) {
        setStatusDropdown({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);  // Combined effect for campaigns with proper debouncing
  useEffect(() => {
    if (!loadedTabs.campaigns) return; // Don't run until campaigns tab has been loaded
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    // Set loading state
    setTabLoading(prev => ({ ...prev, campaigns: true }));
    
    // If search is being used, debounce the call
    if (campaignFilters.search.trim() !== '') {
      const timer = setTimeout(async () => {
        await fetchCampaigns();
        setTabLoading(prev => ({ ...prev, campaigns: false }));
      }, 500);
      setSearchDebounceTimer(timer);
      
      return () => clearTimeout(timer);
    } else {
      // If no search, call immediately for filter changes
      fetchCampaigns().finally(() => {
        setTabLoading(prev => ({ ...prev, campaigns: false }));
      });
    }
  }, [loadedTabs.campaigns, campaignFilters.search, campaignFilters.status, campaignFilters.category]);  // Combined effect for users with proper debouncing
  useEffect(() => {
    if (!loadedTabs.users) return; // Don't run until users tab has been loaded
    
    if (userSearchDebounceTimer) {
      clearTimeout(userSearchDebounceTimer);
    }
    
    // Set loading state
    setTabLoading(prev => ({ ...prev, users: true }));
    
    if (userFilters.search.trim() !== '') {
      const timer = setTimeout(async () => {
        await fetchUsers();
        setTabLoading(prev => ({ ...prev, users: false }));
      }, 500);
      setUserSearchDebounceTimer(timer);
      
      return () => clearTimeout(timer);
    } else {
      fetchUsers().finally(() => {
        setTabLoading(prev => ({ ...prev, users: false }));
      });
    }
  }, [loadedTabs.users, userFilters.search]);  // Combined effect for payments with proper debouncing
  useEffect(() => {
    if (!loadedTabs.payments) return; // Don't run until payments tab has been loaded
    
    if (paymentSearchDebounceTimer) {
      clearTimeout(paymentSearchDebounceTimer);
    }
    
    // Set loading state
    setTabLoading(prev => ({ ...prev, payments: true }));
    
    if (paymentFilters.search.trim() !== '') {
      const timer = setTimeout(async () => {
        await fetchPayments();
        setTabLoading(prev => ({ ...prev, payments: false }));
      }, 500);
      setPaymentSearchDebounceTimer(timer);
      
      return () => clearTimeout(timer);
    } else {
      fetchPayments().finally(() => {
        setTabLoading(prev => ({ ...prev, payments: false }));
      });
    }
  }, [loadedTabs.payments, paymentFilters.search, paymentFilters.status, paymentFilters.paymentMethod]);

  // Effect for analytics
  useEffect(() => {
    if (!loadedTabs.analytics) return; // Don't run until analytics tab has been loaded
    
    setTabLoading(prev => ({ ...prev, analytics: true }));
    fetchAnalytics().finally(() => {
      setTabLoading(prev => ({ ...prev, analytics: false }));
    });  }, [loadedTabs.analytics]);

  // API call function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/admin${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include',
        ...options
      });

      if (response.status === 401) {
        setLocation('/admin/login');
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call error:', error);
      return null;
    }
  };

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    const data = await apiCall('/dashboard/stats');
    if (data?.success) {
      setStats(data.data);
    }
  }, []);  // Fetch campaigns
  const fetchCampaigns = useCallback(async (shouldAppend = false) => {
    const params = new URLSearchParams();
    
    // Only add non-empty parameters
    if (campaignFilters.status) params.append('status', campaignFilters.status);
    if (campaignFilters.category) params.append('category', campaignFilters.category);
    if (campaignFilters.search?.trim()) params.append('search', campaignFilters.search.trim());
    params.append('page', campaignFilters.page.toString());
    params.append('limit', campaignFilters.limit.toString());

    try {
      setSearchLoading(prev => ({ ...prev, campaigns: true }));
      const data = await apiCall(`/campaigns?${params.toString()}`);
      if (data?.success) {
        // Append or replace based on shouldAppend flag
        setCampaigns(prev => shouldAppend ? [...prev, ...(data.data || [])] : (data.data || []));
        
        // Update pagination metadata - backend returns data.pagination object
        const pagination = data.pagination || {};
        const totalPages = pagination.pages || pagination.totalPages || 0;
        const total = pagination.total || 0;
        
        setCampaignPagination({
          total: total,
          totalPages: totalPages,
          hasMore: campaignFilters.page < totalPages
        });
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, campaigns: false }));
    }
  }, [campaignFilters.status, campaignFilters.category, campaignFilters.search, campaignFilters.page, campaignFilters.limit]);  // Fetch users
  const fetchUsers = useCallback(async (shouldAppend = false) => {
    const params = new URLSearchParams();
    
    if (userFilters.search?.trim()) params.append('search', userFilters.search.trim());
    params.append('page', userFilters.page.toString());
    params.append('limit', userFilters.limit.toString());

    try {
      setSearchLoading(prev => ({ ...prev, users: true }));
      const data = await apiCall(`/users?${params.toString()}`);
      if (data?.success) {
        // Append or replace based on shouldAppend flag
        setUsers(prev => shouldAppend ? [...prev, ...(data.data || [])] : (data.data || []));
        
        // Update pagination metadata - backend returns data.pagination object
        const pagination = data.pagination || {};
        const totalPages = pagination.pages || pagination.totalPages || 0;
        const total = pagination.total || 0;
        
        setUserPagination({
          total: total,
          totalPages: totalPages,
          hasMore: userFilters.page < totalPages
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, users: false }));
    }
  }, [userFilters.search, userFilters.page, userFilters.limit]);
  // Fetch payments
  const fetchPayments = useCallback(async (shouldAppend = false) => {
    const params = new URLSearchParams();
    
    if (paymentFilters.status) params.append('status', paymentFilters.status);
    if (paymentFilters.paymentMethod) params.append('paymentMethod', paymentFilters.paymentMethod);
    if (paymentFilters.search?.trim()) params.append('search', paymentFilters.search.trim());
    params.append('page', paymentFilters.page.toString());
    params.append('limit', paymentFilters.limit.toString());

    try {
      setSearchLoading(prev => ({ ...prev, payments: true }));
      const data = await apiCall(`/payments?${params.toString()}`);
      if (data?.success) {
        // Append or replace based on shouldAppend flag
        setPayments(prev => shouldAppend ? [...prev, ...(data.data || [])] : (data.data || []));
        
        // Update pagination metadata - backend returns data.pagination object
        const pagination = data.pagination || {};
        const totalPages = pagination.pages || pagination.totalPages || 0;
        const total = pagination.total || 0;
        
        setPaymentPagination({
          total: total,
          totalPages: totalPages,
          hasMore: paymentFilters.page < totalPages
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, payments: false }));
    }  }, [paymentFilters.status, paymentFilters.paymentMethod, paymentFilters.search, paymentFilters.page, paymentFilters.limit]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    const data = await apiCall('/analytics/overview?timeframe=month');
    if (data?.success) {
      setAnalytics(data.data);
    }
  }, []);

  // Load More handlers
  const handleLoadMoreCampaigns = async () => {
    const nextPage = campaignFilters.page + 1;
    setCampaignFilters(prev => ({ ...prev, page: nextPage }));
    
    // Manually fetch with updated page for appending
    const params = new URLSearchParams();
    if (campaignFilters.status) params.append('status', campaignFilters.status);
    if (campaignFilters.category) params.append('category', campaignFilters.category);
    if (campaignFilters.search?.trim()) params.append('search', campaignFilters.search.trim());
    params.append('page', nextPage.toString());
    params.append('limit', campaignFilters.limit.toString());

    try {
      setSearchLoading(prev => ({ ...prev, campaigns: true }));
      const data = await apiCall(`/campaigns?${params.toString()}`);
      if (data?.success) {
        setCampaigns(prev => [...prev, ...(data.data || [])]);
        
        const pagination = data.pagination || {};
        const totalPages = pagination.pages || pagination.totalPages || 0;
        const total = pagination.total || 0;
        
        setCampaignPagination({
          total: total,
          totalPages: totalPages,
          hasMore: nextPage < totalPages
        });
      }
    } catch (error) {
      console.error('Error loading more campaigns:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  const handleLoadMoreUsers = async () => {
    const nextPage = userFilters.page + 1;
    setUserFilters(prev => ({ ...prev, page: nextPage }));
    
    // Manually fetch with updated page for appending
    const params = new URLSearchParams();
    if (userFilters.search?.trim()) params.append('search', userFilters.search.trim());
    params.append('page', nextPage.toString());
    params.append('limit', userFilters.limit.toString());

    try {
      setSearchLoading(prev => ({ ...prev, users: true }));
      const data = await apiCall(`/users?${params.toString()}`);
      if (data?.success) {
        setUsers(prev => [...prev, ...(data.data || [])]);
        
        const pagination = data.pagination || {};
        const totalPages = pagination.pages || pagination.totalPages || 0;
        const total = pagination.total || 0;
        
        setUserPagination({
          total: total,
          totalPages: totalPages,
          hasMore: nextPage < totalPages
        });
      }
    } catch (error) {
      console.error('Error loading more users:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, users: false }));
    }
  };

  const handleLoadMorePayments = async () => {
    const nextPage = paymentFilters.page + 1;
    setPaymentFilters(prev => ({ ...prev, page: nextPage }));
    
    // Manually fetch with updated page for appending
    const params = new URLSearchParams();
    if (paymentFilters.status) params.append('status', paymentFilters.status);
    if (paymentFilters.paymentMethod) params.append('paymentMethod', paymentFilters.paymentMethod);
    if (paymentFilters.search?.trim()) params.append('search', paymentFilters.search.trim());
    params.append('page', nextPage.toString());
    params.append('limit', paymentFilters.limit.toString());

    try {
      setSearchLoading(prev => ({ ...prev, payments: true }));
      const data = await apiCall(`/payments?${params.toString()}`);
      if (data?.success) {
        setPayments(prev => [...prev, ...(data.data || [])]);
        
        const pagination = data.pagination || {};
        const totalPages = pagination.pages || pagination.totalPages || 0;
        const total = pagination.total || 0;
        
        setPaymentPagination({
          total: total,
          totalPages: totalPages,
          hasMore: nextPage < totalPages
        });
      }
    } catch (error) {
      console.error('Error loading more payments:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, payments: false }));
    }
  };

  // Reset handlers when filters change (except page)
  const handleCampaignFilterChange = (key, value) => {
    setCampaignFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    // Will trigger fetchCampaigns via useEffect
  };

  const handleUserFilterChange = (key, value) => {
    setUserFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    // Will trigger fetchUsers via useEffect
  };

  const handlePaymentFilterChange = (key, value) => {
    setPaymentFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    // Will trigger fetchPayments via useEffect
  };

  // Initial data fetch (only dashboard stats on mount)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      // Only load dashboard stats initially
      await fetchStats();
      setLoading(false);
      setInitialized(true);
      // Mark dashboard as loaded
      setLoadedTabs(prev => ({ ...prev, dashboard: true }));
    };
    
    loadInitialData();
  }, []);  // Handle tab switching with lazy loading
  const handleTabSwitch = async (tabId) => {
    setActiveTab(tabId);
    
    // Load data for the tab if not already loaded
    if (!loadedTabs[tabId]) {
      // Mark tab as loaded first - this will trigger the useEffect to fetch data
      setLoadedTabs(prev => ({ ...prev, [tabId]: true }));
    }
  };

  // Campaign status change with loading state
  const handleCampaignStatusChange = async (campaignId, status, reason = '') => {
    setActionLoading(prev => ({
      ...prev,
      campaignStatus: { ...prev.campaignStatus, [campaignId]: true }
    }));

    try {
      const data = await apiCall(`/campaigns/${campaignId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      });
      
      if (data?.success) {
        // Only refresh campaigns and stats, not everything
        await Promise.all([
          fetchCampaigns(),
          fetchStats()
        ]);
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
    } finally {
      setActionLoading(prev => ({
        ...prev,
        campaignStatus: { ...prev.campaignStatus, [campaignId]: false }
      }));
    }
  };
  // Bulk campaign actions with loading state
  const handleBulkAction = async (action, reason = '') => {
    if (selectedCampaigns.length === 0) return;
    
    setActionLoading(prev => ({ ...prev, bulkAction: true }));

    try {
      const data = await apiCall('/campaigns/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          action,
          campaignIds: selectedCampaigns,
          data: { reason }
        })
      });
      
      if (data?.success) {
        setSelectedCampaigns([]);
        // Only refresh campaigns and stats
        await Promise.all([
          fetchCampaigns(),
          fetchStats()
        ]);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, bulkAction: false }));
    }
  };

  // Handle user promotion to verified status
  const handleUserPromote = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to promote "${userName}" to verified premium partner? This will send them a congratulatory email.`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`promote_${userId}`]: true }));

    try {
      const data = await apiCall(`/users/${userId}/promote`, {
        method: 'PUT',
        body: JSON.stringify({ sendEmail: true })
      });
      
      if (data?.success) {
        // Refresh users list
        await fetchUsers();
        alert(`Successfully promoted ${userName} to verified premium partner!`);
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Failed to promote user. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`promote_${userId}`]: false }));
    }
  };

  // Handle user demotion (remove verified status)
  const handleUserDemote = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove verified status from "${userName}"?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`demote_${userId}`]: true }));

    try {
      const data = await apiCall(`/users/${userId}/demote`, {
        method: 'PUT'
      });
      
      if (data?.success) {
        // Refresh users list
        await fetchUsers();
        alert(`Successfully removed verified status from ${userName}.`);
      }
    } catch (error) {
      console.error('Error demoting user:', error);
      alert('Failed to remove verified status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`demote_${userId}`]: false }));
    }
  };

  // Toggle campaign featured status with loading state
  const toggleFeatured = async (campaignId, featured) => {
    setActionLoading(prev => ({
      ...prev,
      featured: { ...prev.featured, [campaignId]: true }
    }));

    try {
      const data = await apiCall(`/campaigns/${campaignId}/featured`, {
        method: 'PUT',
        body: JSON.stringify({ featured })
      });
      
      if (data?.success) {
        // Only refresh campaigns
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
    } finally {
      setActionLoading(prev => ({
        ...prev,
        featured: { ...prev.featured, [campaignId]: false }
      }));    }
  };


  // Export data
  const exportData = async (type, format = 'json') => {
    const endpoint = `/export/${type}?format=${format}`;
    window.open(`/api/admin${endpoint}`, '_blank');
  };

  // Chart colors for dark/light mode
  const chartColors = {
    primary: darkMode ? '#3B82F6' : '#2563EB',
    secondary: darkMode ? '#10B981' : '#059669',
    warning: darkMode ? '#F59E0B' : '#D97706',
    danger: darkMode ? '#EF4444' : '#DC2626',
    success: darkMode ? '#10B981' : '#059669'
  };

  // Stats cards data
  const getStatsCards = () => [
    {
      title: 'Total Campaigns',
      value: stats?.campaigns?.total || 0,
      icon: FileText,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Active Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Total Revenue',
      value: `NPR ${(stats?.payments?.totalPlatformFees || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'purple',
      change: '+23%'
    },
    {
      title: 'Pending Reviews',
      value: stats?.campaigns?.pending || 0,
      icon: Clock,
      color: 'orange',
      change: '-5%'
    }
  ];
  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Status management dropdown component
  const StatusDropdownMenu = ({ campaign }) => {
    const isDropdownOpen = statusDropdown[campaign._id];
    
    const statusOptions = [
      { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
      { value: 'active', label: 'Active', icon: CheckCircle, color: 'text-green-600' },
      { value: 'completed', label: 'Completed', icon: Flag, color: 'text-blue-600' },
      { value: 'cancelled', label: 'Cancelled', icon: Ban, color: 'text-gray-600' },
      { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-600' }
    ];

    const toggleDropdown = (campaignId) => {
      setStatusDropdown(prev => ({
        ...prev,
        [campaignId]: !prev[campaignId]
      }));
    };

    const handleStatusSelect = async (newStatus) => {
      setStatusDropdown(prev => ({ ...prev, [campaign._id]: false }));
      
      if (newStatus === campaign.status) return; // No change needed
      
      let reason = '';
      if (newStatus === 'rejected' || newStatus === 'cancelled') {
        reason = prompt(`Please provide a reason for marking this campaign as ${newStatus}:`);
        if (!reason) return; // User cancelled the prompt
      }
      
      await handleCampaignStatusChange(campaign._id, newStatus, reason);
    };

    return (
      <div className="relative status-dropdown">
        <button
          onClick={() => toggleDropdown(campaign._id)}
          disabled={actionLoading.campaignStatus[campaign._id]}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          title="Change Status"
        >
          {actionLoading.campaignStatus[campaign._id] ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span>Status</span>
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                Change Status
              </div>
              {statusOptions.map((option) => {
                const IconComponent = option.icon;
                const isCurrentStatus = option.value === campaign.status;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      isCurrentStatus ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    disabled={isCurrentStatus}
                  >
                    <IconComponent className={`w-4 h-4 ${option.color}`} />
                    <span className={isCurrentStatus ? 'font-medium' : ''}>
                      {option.label}
                      {isCurrentStatus && ' (Current)'}
                    </span>
                    {isCurrentStatus && <Check className="w-3 h-3 text-blue-600 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading component
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                <RefreshCw className="w-5 h-5" />
              </button>              <button
                onClick={() => apiCall('/logout', { method: 'POST' }).then(() => setLocation('/admin/login'))}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto">            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart },
              { id: 'campaigns', label: 'Campaigns', icon: FileText },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
              { id: 'verifybank', label: 'Verify Bank', icon: CheckCircle },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              const isLoading = tabLoading[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  disabled={isLoading}
                  className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-4 lg:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors disabled:opacity-50 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.charAt(0)}</span>
                  {isLoading && <span className="text-xs hidden lg:inline">(Loading...)</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getStatsCards().map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                        <p className={`text-sm ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {card.change} from last month
                        </p>
                      </div>
                      <div className={`p-3 rounded-full bg-${card.color}-100 dark:bg-${card.color}-900`}>
                        <Icon className={`w-6 h-6 text-${card.color}-600 dark:text-${card.color}-300`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Status Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.campaignStatusDistribution || []}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill={chartColors.primary}
                    >
                      {(stats?.campaignStatusDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Revenue Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis 
                      dataKey="_id.month" 
                      stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                    />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={chartColors.primary} 
                      fill={chartColors.primary}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {(stats?.recentActivity || []).slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {activity.creator} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={activity.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      value={campaignFilters.search}
                      onChange={(e) => {
                        // Update search immediately in state, but debounce the API call
                        setCampaignFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
                      }}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={campaignFilters.status}
                    onChange={(e) => setCampaignFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <select
                    value={campaignFilters.category}
                    onChange={(e) => setCampaignFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="Medical">Medical</option>
                    <option value="Education">Education</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Animals">Animals</option>
                    <option value="Environment">Environment</option>
                    <option value="Community">Community</option>
                  </select>
                </div>
                  <div className="flex space-x-2">
                  {selectedCampaigns.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkAction('approve')}
                        disabled={actionLoading.bulkAction}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {actionLoading.bulkAction && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span>Approve Selected</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleBulkAction('reject', reason);
                        }}
                        disabled={actionLoading.bulkAction}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {actionLoading.bulkAction && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span>Reject Selected</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => exportData('campaigns', 'csv')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCampaigns(campaigns.map(c => c._id));
                            } else {
                              setSelectedCampaigns([]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Creator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {searchLoading.campaigns ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500 dark:text-gray-400">Searching campaigns...</span>
                          </div>
                        </td>
                      </tr>
                    ) : campaigns.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {campaignFilters.search?.trim() ? 'No campaigns found matching your search.' : 'No campaigns found.'}
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((campaign) => (
                        <tr key={campaign._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCampaigns.includes(campaign._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCampaigns(prev => [...prev, campaign._id]);
                              } else {
                                setSelectedCampaigns(prev => prev.filter(id => id !== campaign._id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={campaign.coverImage}
                                alt={campaign.title}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {campaign.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {campaign.category}
                              </div>
                              {campaign.featured && (
                                <div className="flex items-center mt-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">Featured</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{campaign.creator?.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{campaign.creator?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={campaign.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            NPR {campaign.amountRaised?.toLocaleString()} / NPR {campaign.targetAmount?.toLocaleString()}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((campaign.amountRaised / campaign.targetAmount) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {Math.round((campaign.amountRaised / campaign.targetAmount) * 100)}% • {campaign.donors} donors
                          </div>
                        </td>                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <div className="flex items-center space-x-2">
                            {/* Status Management Dropdown - Available for all campaigns */}
                            <StatusDropdownMenu campaign={campaign} />
                            
                            {/* Featured Toggle */}
                            <button
                              onClick={() => toggleFeatured(campaign._id, !campaign.featured)}
                              disabled={actionLoading.featured[campaign._id]}
                              className={`${campaign.featured ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600 disabled:opacity-50`}
                              title={campaign.featured ? 'Remove from featured' : 'Add to featured'}
                            >
                              {actionLoading.featured[campaign._id] ? (
                                <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Star className={`w-5 h-5 ${campaign.featured ? 'fill-current' : ''}`} />
                              )}
                            </button>

                            {/* View Details */}
                            <button
                              onClick={() => setLocation(`/admin/campaign/${campaign._id}`)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Load More Button for Campaigns */}
              {campaignPagination.hasMore && !searchLoading.campaigns && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleLoadMoreCampaigns}
                    disabled={searchLoading.campaigns}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {searchLoading.campaigns ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>Load More ({campaignPagination.total - campaigns.length} remaining)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userFilters.search}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => exportData('users', 'csv')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Campaigns
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {searchLoading.users ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500 dark:text-gray-400">Searching users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {userFilters.search?.trim() ? 'No users found matching your search.' : 'No users found.'}
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name}
                                </div>
                                {user.isPremiumAndVerified && (
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                  </svg>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.campaigns?.length || 0} campaigns
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Active: {user.campaigns?.filter(c => c.status === 'active').length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setLocation(`/admin/user/${user._id}`)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {user.isPremiumAndVerified ? (
                              <button
                                onClick={() => handleUserDemote(user._id, user.name)}
                                disabled={actionLoading[`demote_${user._id}`]}
                                className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove Verification"
                              >
                                {actionLoading[`demote_${user._id}`] ? (
                                  <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <ShieldX className="w-5 h-5" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserPromote(user._id, user.name)}
                                disabled={actionLoading[`promote_${user._id}`]}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Promote to Verified"
                              >
                                {actionLoading[`promote_${user._id}`] ? (
                                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Shield className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Load More Button for Users */}
              {userPagination.hasMore && !searchLoading.users && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleLoadMoreUsers}
                    disabled={searchLoading.users}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {searchLoading.users ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>Load More ({userPagination.total - users.length} remaining)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search payments..."
                      value={paymentFilters.search}
                      onChange={(e) => setPaymentFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={paymentFilters.status}
                    onChange={(e) => setPaymentFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                  <select
                    value={paymentFilters.paymentMethod}
                    onChange={(e) => setPaymentFilters(prev => ({ ...prev, paymentMethod: e.target.value, page: 1 }))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Methods</option>
                    <option value="khalti">Khalti</option>
                    <option value="esewa">eSewa</option>
                    <option value="fonepay">FonePay</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <button
                  onClick={() => exportData('payments', 'csv')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Donor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {searchLoading.payments ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500 dark:text-gray-400">Searching payments...</span>
                          </div>
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          {paymentFilters.search?.trim() ? 'No payments found matching your search.' : 'No payments found.'}
                        </td>
                      </tr>                    ) : (
                      payments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payment.transactionId || payment.purchaseOrderId}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {payment.paymentMethod?.toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {payment.donorName || payment.userId?.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {payment.donorEmail}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {payment.campaignId?.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              NPR {payment.amount?.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Fee: NPR {payment.platformFee?.toLocaleString() || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={payment.status?.toLowerCase()} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setLocation(`/admin/payment/${payment._id}`)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Load More Button for Payments */}
              {paymentPagination.hasMore && !searchLoading.payments && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleLoadMorePayments}
                    disabled={searchLoading.payments}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {searchLoading.payments ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>Load More ({paymentPagination.total - payments.length} remaining)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AdminAnalytics 
            darkMode={darkMode} 
            chartColors={chartColors} 
          />
        )}        {/* Verify Bank Tab */}
        {activeTab === 'verifybank' && (
          <VerifyBank />
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <WithdrawalManagement />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;