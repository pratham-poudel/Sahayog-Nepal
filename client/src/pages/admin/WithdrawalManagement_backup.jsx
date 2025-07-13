import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../config/index';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, Search, Filter,
  Eye, Download, RefreshCw, ChevronLeft, ChevronRight,
  DollarSign, Calendar, User, Building2, CreditCard, Phone,
  FileText, MessageSquare, ExternalLink, Banknote, Mail,
  MapPin, Hash, Calendar as CalendarIcon, Star, Users,
  ArrowRight, ArrowDown, AlertCircle, Info
} from 'lucide-react';

const WithdrawalManagement = () => {
  // Data states
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  
  // Filter and pagination states
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
    // Modal states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processModal, setProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState('');
  const [processForm, setProcessForm] = useState({
    status: '',
    comments: '',
    transactionReference: '',
    processingFee: 0
  });

  // Fetch withdrawals with comprehensive data
  const fetchWithdrawals = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_URL}/api/withdrawals/admin/all?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setWithdrawals(data.data || []);
        setStats(data.stats || {});
        setPagination(prev => ({
          ...prev,
          page: data.pagination?.page || 1,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.pages || 1
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch withdrawals');
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process withdrawal with comprehensive status handling
  const processWithdrawal = async () => {
  // Process withdrawal request
  const processWithdrawal = async () => {
    if (!selectedWithdrawal || !processForm.status) return;

    setProcessing(selectedWithdrawal._id);
    try {
      const payload = {
        action: processForm.status,
        comments: processForm.comments,
        ...(processForm.status === 'completed' && {
          transactionReference: processForm.transactionReference,
          processingFee: processForm.processingFee
        })
      };

      const response = await fetch(`${API_URL}/api/withdrawals/admin/process/${selectedWithdrawal._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Withdrawal request processed successfully');
        
        // Reset form and modals
        setProcessModal(false);
        setSelectedWithdrawal(null);
        setProcessForm({
          status: '',
          comments: '',
          transactionReference: '',
          processingFee: 0
        });
        
        // Refresh data
        await fetchWithdrawals(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error({
        title: "Error",
        description: error.message || "Failed to process withdrawal request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  // Open process modal
  const openProcessModal = (withdrawal, action) => {
    setSelectedWithdrawal(withdrawal);
    setProcessAction(action);
    setProcessForm({
      comments: '',
      transactionReference: '',
      processingFee: 0
    });
    setShowProcessModal(true);
  };

  // Get comprehensive status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        icon: Clock, 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', 
        label: 'Pending Review' 
      },
      approved: { 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', 
        label: 'Approved' 
      },
      rejected: { 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', 
        label: 'Rejected' 
      },
      processing: { 
        icon: RefreshCw, 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', 
        label: 'Processing' 
      },
      completed: { 
        icon: CheckCircle, 
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400', 
        label: 'Completed' 
      },
      failed: { 
        icon: AlertTriangle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', 
        label: 'Failed' 
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className={`w-3 h-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {badge.label}
      </span>
    );
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchWithdrawals(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchWithdrawals(1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `NPR ${amount?.toLocaleString() || '0'}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action buttons based on status
  const getActionButtons = (withdrawal) => {
    const baseClasses = "p-2 rounded-lg transition-colors disabled:opacity-50";
    const isProcessing = processing[withdrawal._id];

    switch (withdrawal.status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => openProcessModal(withdrawal, 'approved')}
              disabled={isProcessing}
              className={`${baseClasses} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400`}
              title="Approve Request"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => openProcessModal(withdrawal, 'rejected')}
              disabled={isProcessing}
              className={`${baseClasses} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400`}
              title="Reject Request"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        );
      case 'approved':
        return (
          <>
            <button
              onClick={() => openProcessModal(withdrawal, 'processing')}
              disabled={isProcessing}
              className={`${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400`}
              title="Start Processing"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => openProcessModal(withdrawal, 'completed')}
              disabled={isProcessing}
              className={`${baseClasses} bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400`}
              title="Mark as Completed"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          </>
        );
      case 'processing':
        return (
          <>
            <button
              onClick={() => openProcessModal(withdrawal, 'completed')}
              disabled={isProcessing}
              className={`${baseClasses} bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400`}
              title="Mark as Completed"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => openProcessModal(withdrawal, 'failed')}
              disabled={isProcessing}
              className={`${baseClasses} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400`}
              title="Mark as Failed"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and process withdrawal requests with complete verification</p>
        </div>
        <button
          onClick={() => fetchWithdrawals(pagination.page)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {Object.entries(stats).map(([status, data]) => {
            const statusInfo = {
              pending: { icon: Clock, color: 'yellow' },
              approved: { icon: CheckCircle, color: 'green' },
              rejected: { icon: XCircle, color: 'red' },
              processing: { icon: RefreshCw, color: 'blue' },
              completed: { icon: CheckCircle, color: 'emerald' },
              failed: { icon: AlertTriangle, color: 'red' }
            };
            
            const info = statusInfo[status] || { icon: Banknote, color: 'gray' };
            const Icon = info.icon;
            
            return (
              <div key={status} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {status.replace('_', ' ')}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{data.count || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(data.totalAmount)}
                    </p>
                  </div>
                  <div className={`p-2 bg-${info.color}-100 dark:bg-${info.color}-900/20 rounded-lg`}>
                    <Icon className={`w-4 h-4 text-${info.color}-600 dark:text-${info.color}-400`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Campaign, user, email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
        setProcessForm({
          status: '',
          comments: '',
          transactionReference: '',
          processingFee: 0
        });
        
        // Refresh data
        fetchWithdrawals(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'Pending' },
      processing: { icon: RefreshCw, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Processing' },
      approved: { icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Approved' },
      completed: { icon: CheckCircle, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400', label: 'Completed' },
      rejected: { icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: 'Rejected' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchWithdrawals(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchWithdrawals(1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `NPR ${amount?.toLocaleString() || '0'}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Open process modal
  const openProcessModal = (withdrawal, status) => {
    setSelectedWithdrawal(withdrawal);
    setProcessForm({
      status,
      comments: '',
      transactionReference: '',
      processingFee: 0
    });
    setProcessModal(true);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and process withdrawal requests</p>
        </div>
        <button
          onClick={() => fetchWithdrawals(pagination.page)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(stats).map(([status, data]) => (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {status} Requests
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.count || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(data.totalAmount)}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Banknote className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Campaign title, user name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 rounded"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : withdrawals.length > 0 ? (
          <>
            <div className="overflow-x-auto">              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Campaign Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Bank Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status & Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {/* Campaign Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-12 w-12">
                            {withdrawal.campaign?.coverImage ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${withdrawal.campaign.coverImage}`}
                                alt=""
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {withdrawal.campaign?.title || 'Campaign Deleted'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {withdrawal.campaign?._id?.slice(-8) || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Target: {formatCurrency(withdrawal.campaign?.targetAmount)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* User Verification Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {withdrawal.creator?.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {withdrawal.creator?.email || 'N/A'}
                            </span>
                          </div>
                          {withdrawal.creator?.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {withdrawal.creator.phone}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Joined: {new Date(withdrawal.creator?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(withdrawal.requestedAmount)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Available: {formatCurrency(withdrawal.availableAmount)}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Raised: {formatCurrency(withdrawal.campaign?.amountRaised)}
                          </div>
                        </div>
                      </td>

                      {/* Bank Verification Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {withdrawal.bankAccount?.bankName || 'N/A'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <Hash className="w-3 h-3 inline mr-1" />
                              {withdrawal.bankAccount?.accountNumber || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <User className="w-3 h-3 inline mr-1" />
                              {withdrawal.bankAccount?.accountName || 'N/A'}
                            </div>
                            {withdrawal.bankAccount?.associatedPhoneNumber && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <Phone className="w-3 h-3 inline mr-1" />
                                {withdrawal.bankAccount.associatedPhoneNumber}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              withdrawal.bankAccount?.verificationStatus === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              withdrawal.bankAccount?.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {withdrawal.bankAccount?.verificationStatus === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {withdrawal.bankAccount?.verificationStatus === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {withdrawal.bankAccount?.verificationStatus === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {withdrawal.bankAccount?.verificationStatus?.replace('_', ' ') || 'Unknown'}
                            </span>
                            {withdrawal.bankAccount?.isPrimary && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                <Star className="w-3 h-3 mr-1" />
                                Primary
                              </span>
                            )}
                          </div>
                          {withdrawal.bankAccount?.documentType && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Doc: {withdrawal.bankAccount.documentType.replace('_', ' ').toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status & Date */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {getStatusBadge(withdrawal.status)}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(withdrawal.createdAt)}
                          </div>
                          {withdrawal.adminResponse && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Reviewed: {formatDate(withdrawal.adminResponse.reviewedAt)}
                            </div>
                          )}
                        </div>
                      </td>                      {/* Enhanced Actions */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          {/* View Details Button */}
                          <button
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </button>
                          
                          {/* Status-based Action Buttons */}
                          <div className="flex space-x-1">
                            {withdrawal.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openProcessModal(withdrawal, 'approved')}
                                  disabled={processing[withdrawal._id]}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 disabled:opacity-50 transition-colors"
                                  title="Approve Request"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openProcessModal(withdrawal, 'rejected')}
                                  disabled={processing[withdrawal._id]}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50 transition-colors"
                                  title="Reject Request"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            
                            {withdrawal.status === 'approved' && (
                              <>
                                <button
                                  onClick={() => openProcessModal(withdrawal, 'processing')}
                                  disabled={processing[withdrawal._id]}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 disabled:opacity-50 transition-colors"
                                  title="Start Processing"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openProcessModal(withdrawal, 'completed')}
                                  disabled={processing[withdrawal._id]}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 disabled:opacity-50 transition-colors"
                                  title="Mark as Completed"
                                >
                                  <CreditCard className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            
                            {withdrawal.status === 'processing' && (
                              <>
                                <button
                                  onClick={() => openProcessModal(withdrawal, 'completed')}
                                  disabled={processing[withdrawal._id]}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 disabled:opacity-50 transition-colors"
                                  title="Mark as Completed"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openProcessModal(withdrawal, 'failed')}
                                  disabled={processing[withdrawal._id]}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50 transition-colors"
                                  title="Mark as Failed"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                          
                          {/* Bank Document Link */}
                          {withdrawal.bankAccount?.documentImage && (
                            <button
                              onClick={() => {
                                const documentUrl = withdrawal.bankAccount.documentImage.startsWith('http') 
                                  ? withdrawal.bankAccount.documentImage 
                                  : `${API_URL}${withdrawal.bankAccount.documentImage}`;
                                window.open(documentUrl, '_blank');
                              }}
                              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                              title="View Bank Document"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Document
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => fetchWithdrawals(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchWithdrawals(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{pagination.total}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => fetchWithdrawals(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => fetchWithdrawals(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <Banknote className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No withdrawal requests</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No withdrawal requests found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Process Modal */}
      {processModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {processForm.status === 'approved' && 'Approve Withdrawal Request'}
                {processForm.status === 'rejected' && 'Reject Withdrawal Request'}
                {processForm.status === 'completed' && 'Mark as Completed'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comments {processForm.status === 'rejected' ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    value={processForm.comments}
                    onChange={(e) => setProcessForm(prev => ({ ...prev, comments: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    placeholder="Add your comments..."
                  />
                </div>

                {processForm.status === 'completed' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Transaction Reference (Required)
                      </label>
                      <input
                        type="text"
                        value={processForm.transactionReference}
                        onChange={(e) => setProcessForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                        placeholder="Bank transaction reference"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Processing Fee (NPR)
                      </label>
                      <input
                        type="number"
                        value={processForm.processingFee}
                        onChange={(e) => setProcessForm(prev => ({ ...prev, processingFee: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setProcessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processWithdrawal}
                  disabled={processing || (processForm.status === 'rejected' && !processForm.comments) || (processForm.status === 'completed' && !processForm.transactionReference)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Enhanced Detail Modal with Comprehensive Verification */}
      {selectedWithdrawal && !processModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-lg bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Withdrawal Request - Comprehensive Review
              </h3>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                {/* Campaign Information */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Campaign Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedWithdrawal.campaign?.title || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Amount</label>
                        <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(selectedWithdrawal.campaign?.targetAmount)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount Raised</label>
                        <p className="text-sm text-green-600 dark:text-green-400">{formatCurrency(selectedWithdrawal.campaign?.amountRaised)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Verification Information */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    User Verification Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedWithdrawal.creator?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Member since {new Date(selectedWithdrawal.creator?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedWithdrawal.creator?.email || 'N/A'}
                        </span>
                      </div>
                      {selectedWithdrawal.creator?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedWithdrawal.creator.phone}
                          </span>
                        </div>
                      )}
                      {selectedWithdrawal.creator?.bio && (
                        <div className="mt-2">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Bio</label>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {selectedWithdrawal.creator.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Request Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Requested Amount</label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(selectedWithdrawal.requestedAmount)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Available Amount</label>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(selectedWithdrawal.availableAmount)}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Request Date</label>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedWithdrawal.createdAt)}</p>
                    </div>
                  </div>
                  {selectedWithdrawal.reason && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Reason for Withdrawal</label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        {selectedWithdrawal.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Bank Verification */}
              <div className="space-y-6">
                {/* Bank Account Verification */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    Bank Account Verification
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedWithdrawal.bankAccount?.bankName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Verification Status
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedWithdrawal.bankAccount?.verificationStatus === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          selectedWithdrawal.bankAccount?.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {selectedWithdrawal.bankAccount?.verificationStatus === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {selectedWithdrawal.bankAccount?.verificationStatus === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {selectedWithdrawal.bankAccount?.verificationStatus === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {selectedWithdrawal.bankAccount?.verificationStatus?.replace('_', ' ') || 'Unknown'}
                        </span>
                        {selectedWithdrawal.bankAccount?.isPrimary && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              <Star className="w-3 h-3 mr-1" />
                              Primary Account
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Account Number</label>
                        <p className="font-mono text-gray-900 dark:text-white">{selectedWithdrawal.bankAccount?.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Account Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedWithdrawal.bankAccount?.accountName || 'N/A'}</p>
                      </div>
                      {selectedWithdrawal.bankAccount?.associatedPhoneNumber && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                          <p className="text-gray-900 dark:text-white">{selectedWithdrawal.bankAccount.associatedPhoneNumber}</p>
                        </div>
                      )}
                      {selectedWithdrawal.bankAccount?.documentType && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Document Type</label>
                          <p className="text-gray-900 dark:text-white capitalize">{selectedWithdrawal.bankAccount.documentType.replace('_', ' ')}</p>
                        </div>
                      )}
                      {selectedWithdrawal.bankAccount?.documentNumber && (
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Document Number</label>
                          <p className="font-mono text-gray-900 dark:text-white">{selectedWithdrawal.bankAccount.documentNumber}</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedWithdrawal.bankAccount?.verificationDate && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Verified Date</label>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedWithdrawal.bankAccount.verificationDate)}</p>
                      </div>
                    )}
                    
                    {/* Document Download */}
                    {selectedWithdrawal.bankAccount?.documentImage && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            const documentUrl = selectedWithdrawal.bankAccount.documentImage.startsWith('http') 
                              ? selectedWithdrawal.bankAccount.documentImage 
                              : `${API_URL}${selectedWithdrawal.bankAccount.documentImage}`;
                            window.open(documentUrl, '_blank');
                          }}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          View Verification Document
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Admin Response Section */}
                {selectedWithdrawal.adminResponse && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Admin Review
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Action Taken</label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {selectedWithdrawal.adminResponse.action}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Review Date</label>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(selectedWithdrawal.adminResponse.reviewedAt)}
                          </p>
                        </div>
                      </div>
                      {selectedWithdrawal.adminResponse.comments && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Admin Comments</label>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            {selectedWithdrawal.adminResponse.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Processing Details Section */}
                {selectedWithdrawal.processingDetails && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Processing Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedWithdrawal.processingDetails.transactionReference && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Transaction Reference</label>
                          <p className="font-mono text-gray-900 dark:text-white">
                            {selectedWithdrawal.processingDetails.transactionReference}
                          </p>
                        </div>
                      )}
                      {selectedWithdrawal.processingDetails.processingFee !== undefined && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Processing Fee</label>
                          <p className="text-gray-900 dark:text-white">
                            {formatCurrency(selectedWithdrawal.processingDetails.processingFee)}
                          </p>
                        </div>
                      )}
                      {selectedWithdrawal.processingDetails.finalAmount && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Final Amount</label>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(selectedWithdrawal.processingDetails.finalAmount)}
                          </p>
                        </div>
                      )}
                      {selectedWithdrawal.processingDetails.processedAt && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Processed Date</label>
                          <p className="text-gray-700 dark:text-gray-300">
                            {formatDate(selectedWithdrawal.processingDetails.processedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer with Action Buttons */}
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                {selectedWithdrawal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setProcessForm({ status: 'approved', comments: '', transactionReference: '', processingFee: 0 });
                        setProcessModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        setProcessForm({ status: 'rejected', comments: '', transactionReference: '', processingFee: 0 });
                        setProcessModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Request
                    </button>
                  </>
                )}
                
                {selectedWithdrawal.status === 'approved' && (
                  <>
                    <button
                      onClick={() => {
                        setProcessForm({ status: 'processing', comments: '', transactionReference: '', processingFee: 0 });
                        setProcessModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Start Processing
                    </button>
                    <button
                      onClick={() => {
                        setProcessForm({ status: 'completed', comments: '', transactionReference: '', processingFee: 0 });
                        setProcessModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Mark Completed
                    </button>
                  </>
                )}
                
                {selectedWithdrawal.status === 'processing' && (
                  <>
                    <button
                      onClick={() => {
                        setProcessForm({ status: 'completed', comments: '', transactionReference: '', processingFee: 0 });
                        setProcessModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Completed
                    </button>
                    <button
                      onClick={() => {
                        setProcessForm({ status: 'failed', comments: '', transactionReference: '', processingFee: 0 });
                        setProcessModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Mark Failed
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
