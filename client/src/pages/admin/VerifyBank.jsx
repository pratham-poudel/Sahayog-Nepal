import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../config/index';
import { 
  CheckCircle, XCircle, Clock, Eye, Search, Filter, 
  ChevronDown, RefreshCw, Download, AlertTriangle,
  User, CreditCard, Phone, Calendar, FileText,
  MoreVertical, Check, X, Trash2
} from 'lucide-react';

const VerifyBank = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [verificationModal, setVerificationModal] = useState({ show: false, account: null, action: null });
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch bank accounts
  const fetchBankAccounts = useCallback(async (currentFilters = filters) => {
    try {
      setSearchLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && key !== 'search') {
          queryParams.append(key, value);
        }
      });
      
      if (currentFilters.search && currentFilters.search.trim()) {
        queryParams.append('search', currentFilters.search.trim());
      }

      const response = await fetch(`${API_URL}/api/bank/admin/accounts?${queryParams}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (data.success) {
        setBankAccounts(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalAccounts(data.total || 0);
        console.log('Bank accounts set:', data.data || []); // Debug log
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchBankAccounts();
      }
    }, 300);

    setSearchDebounceTimer(timer);
    return () => clearTimeout(timer);  }, [filters.search]); // Remove fetchBankAccounts dependency

  // Handle filter changes (non-search filters)
  useEffect(() => {
    fetchBankAccounts();
  }, [filters.status, filters.page, filters.limit]);
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle search
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    fetchBankAccounts({ ...filters, page });
  };

  // Verify bank account
  const handleVerifyAccount = async (accountId) => {
    try {
      setActionLoading(prev => ({ ...prev, [accountId]: true }));
      
      const response = await fetch(`${API_URL}/api/bank/admin/accounts/${accountId}/verify`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        fetchBankAccounts();
        setVerificationModal({ show: false, account: null, action: null });
      } else {
        alert(data.message || 'Failed to verify account');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      alert('Failed to verify account');
    } finally {
      setActionLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };
  // Reject bank account
  const handleRejectAccount = async (accountId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [accountId]: true }));
      
      const response = await fetch(`${API_URL}/api/bank/admin/accounts/${accountId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason: reason.trim() })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchBankAccounts();
        setVerificationModal({ show: false, account: null, action: null });
        setRejectionReason('');
      } else {
        alert(data.message || 'Failed to reject account');
      }
    } catch (error) {
      console.error('Error rejecting account:', error);
      alert('Failed to reject account');
    } finally {
      setActionLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  // Update bank account status (Generic status changer)
  const handleStatusChange = async (accountId, newStatus, notes = '') => {
    try {
      setActionLoading(prev => ({ ...prev, [accountId]: true }));
      
      const response = await fetch(`${API_URL}/api/bank/admin/accounts/${accountId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          verificationStatus: newStatus,
          notes: notes
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchBankAccounts();
        alert(`Account status updated to ${newStatus.replace('_', ' ')}`);
      } else {
        alert(data.message || 'Failed to update account status');
      }
    } catch (error) {
      console.error('Error updating account status:', error);
      alert('Failed to update account status');
    } finally {
      setActionLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  // Delete bank account (Admin)
  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [accountId]: true }));
      
      const response = await fetch(`${API_URL}/api/bank/admin/accounts/${accountId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        fetchBankAccounts();
        setShowDocumentModal(false);
        alert('Bank account deleted successfully');
      } else {
        alert(data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    } finally {
      setActionLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'under_review': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'under_review': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Account Verification</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and verify user bank accounts</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => fetchBankAccounts()}
            disabled={searchLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${searchLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, account number, or bank..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Results per page */}
          <div className="relative">
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {bankAccounts.length} of {totalAccounts} bank accounts
      </div>

      {/* Bank Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {bankAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bank accounts found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.search || filters.status ? 'Try adjusting your filters' : 'No bank accounts have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Account Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bankAccounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {account.accountName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {account.bankName}
                        </div>
                        <div className="text-sm font-mono text-gray-500">
                          ****{account.accountNumber?.slice(-4)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {account.userId?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {account.userId?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.verificationStatus)}`}>
                        {getStatusIcon(account.verificationStatus)}
                        <span className="capitalize">{account.verificationStatus?.replace('_', ' ')}</span>
                      </span>
                      {account.rejectionReason && (
                        <div className="mt-1 text-xs text-red-600">
                          {account.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Document */}
                        {account.documentImage && (
                          <button
                            onClick={() => {
                              setSelectedAccount(account);
                              setShowDocumentModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}                        {/* Verify Button - Always available except when already verified */}
                        {account.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => setVerificationModal({ show: true, account, action: 'verify' })}
                            disabled={actionLoading[account._id]}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            title="Mark as Verified"
                          >
                            {actionLoading[account._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Verify
                              </>
                            )}
                          </button>
                        )}

                        {/* Reject Button - Always available except when already rejected */}
                        {account.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => setVerificationModal({ show: true, account, action: 'reject' })}
                            disabled={actionLoading[account._id]}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            title="Mark as Rejected"
                          >
                            {actionLoading[account._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </>
                            )}
                          </button>
                        )}

                        {/* Under Review Button - Always available except when already under review */}
                        {account.verificationStatus !== 'under_review' && (
                          <button
                            onClick={() => handleStatusChange(account._id, 'under_review')}
                            disabled={actionLoading[account._id]}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                            title="Mark as Under Review"
                          >
                            {actionLoading[account._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Under Review
                              </>
                            )}
                          </button>
                        )}

                        {/* Back to Pending Button - Always available except when already pending */}
                        {account.verificationStatus !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(account._id, 'pending')}
                            disabled={actionLoading[account._id]}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                            title="Reset to Pending"
                          >
                            {actionLoading[account._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Back to Pending
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete Button (Admin) */}
                        <button
                          onClick={() => handleDeleteAccount(account._id)}
                          disabled={actionLoading[account._id]}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-800 hover:bg-red-900 disabled:opacity-50"
                          title="Delete Account"
                        >
                          {actionLoading[account._id] ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {filters.page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1 || searchLoading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === totalPages || searchLoading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Bank Document - {selectedAccount.accountName}
                </h3>
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Account Name:</span>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedAccount.accountName}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Bank Name:</span>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedAccount.bankName}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Account Number:</span>
                    <div className="text-gray-600 dark:text-gray-400 font-mono">
                      {selectedAccount.accountNumber}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Phone Number:</span>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedAccount.associatedPhoneNumber}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Document Type:</span>
                    <div className="text-gray-600 dark:text-gray-400 capitalize">
                      {selectedAccount.documentType?.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Document Number:</span>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedAccount.documentNumber}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="text-gray-600 dark:text-gray-400 capitalize">
                      {selectedAccount.verificationStatus?.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatDate(selectedAccount.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">User:</span>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedAccount.userId?.name} ({selectedAccount.userId?.email})
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Primary Account:</span>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedAccount.isPrimary ? 'Yes' : 'No'}
                    </div>
                  </div>
                  {selectedAccount.rejectionReason && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-red-600">Rejection Reason:</span>
                      <div className="text-red-600 dark:text-red-400 mt-1">
                        {selectedAccount.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>                {selectedAccount.documentImage && (
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      Document:
                    </div>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        onClick={() => {
                          const documentUrl = selectedAccount.documentImage.startsWith('http') 
                            ? selectedAccount.documentImage 
                            : `${API_URL}${selectedAccount.documentImage}`;
                          window.open(documentUrl, '_blank');
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Document
                      </button>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="border-t pt-4">
                      <div className="font-medium text-gray-900 dark:text-white mb-3">
                        Status Actions:
                      </div>
                      <div className="flex flex-wrap gap-2">                        {/* Verify Button - Always available except when already verified */}
                        {selectedAccount.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => {
                              setVerificationModal({ show: true, account: selectedAccount, action: 'verify' });
                              setShowDocumentModal(false);
                            }}
                            disabled={actionLoading[selectedAccount._id]}
                            className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading[selectedAccount._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Verify
                          </button>
                        )}

                        {/* Reject Button - Always available except when already rejected */}
                        {selectedAccount.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => {
                              setVerificationModal({ show: true, account: selectedAccount, action: 'reject' });
                              setShowDocumentModal(false);
                            }}
                            disabled={actionLoading[selectedAccount._id]}
                            className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading[selectedAccount._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              <X className="w-4 h-4 mr-2" />
                            )}
                            Reject
                          </button>
                        )}

                        {/* Under Review Button - Always available except when already under review */}
                        {selectedAccount.verificationStatus !== 'under_review' && (
                          <button
                            onClick={() => {
                              handleStatusChange(selectedAccount._id, 'under_review');
                              setShowDocumentModal(false);
                            }}
                            disabled={actionLoading[selectedAccount._id]}
                            className="inline-flex items-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading[selectedAccount._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              <Clock className="w-4 h-4 mr-2" />
                            )}
                            Under Review
                          </button>
                        )}

                        {/* Back to Pending Button - Always available except when already pending */}
                        {selectedAccount.verificationStatus !== 'pending' && (
                          <button
                            onClick={() => {
                              handleStatusChange(selectedAccount._id, 'pending');
                              setShowDocumentModal(false);
                            }}
                            disabled={actionLoading[selectedAccount._id]}
                            className="inline-flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading[selectedAccount._id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Back to Pending
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAccount(selectedAccount._id)}
                          disabled={actionLoading[selectedAccount._id]}
                          className="inline-flex items-center px-3 py-2 bg-red-800 hover:bg-red-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading[selectedAccount._id] ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Confirmation Modal */}
      {verificationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                {verificationModal.action === 'verify' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {verificationModal.action === 'verify' ? 'Verify' : 'Reject'} Bank Account
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to {verificationModal.action} the bank account for{' '}
                <span className="font-medium">{verificationModal.account?.accountName}</span>?
              </p>

              {verificationModal.action === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setVerificationModal({ show: false, account: null, action: null });
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (verificationModal.action === 'verify') {
                      handleVerifyAccount(verificationModal.account._id);
                    } else {
                      handleRejectAccount(verificationModal.account._id, rejectionReason);
                    }
                  }}
                  disabled={verificationModal.action === 'reject' && !rejectionReason.trim()}
                  className={`flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white disabled:opacity-50 ${
                    verificationModal.action === 'verify' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {verificationModal.action === 'verify' ? 'Verify' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyBank;
