import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { 
  CreditCard, 
  Search, 
  Filter, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  Banknote,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import TransactionProcessingModal from '../components/employee/TransactionProcessingModal';
import ProtectedEmployeeRoute from '../components/employee/ProtectedEmployeeRoute';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TransactionManagementDashboard = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [employee, setEmployee] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('approved');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  const observerTarget = useRef(null);
  const searchTimeoutRef = useRef(null);
  const fetchInProgressRef = useRef(false); // Prevent duplicate fetches

  // Memoized fetch function to prevent recreating on every render
  const fetchTransactions = useCallback(async (pageNum, reset) => {
    // Prevent duplicate concurrent requests
    if (fetchInProgressRef.current && !reset) {
      console.log('⏸️ Fetch already in progress, skipping...');
      return;
    }

    fetchInProgressRef.current = true;

    if (reset) {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem('employeeToken');
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        status: statusFilter,
        ...(searchTerm.trim() && { search: searchTerm.trim() })
      });

      const response = await fetch(`${API_BASE_URL}/api/employee/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();

      if (reset) {
        setTransactions(data.data);
      } else {
        // Use functional update to avoid stale state
        setTransactions(prev => {
          // Prevent duplicate entries
          const existingIds = new Set(prev.map(t => t._id));
          const newTransactions = data.data.filter(t => !existingIds.has(t._id));
          return [...prev, ...newTransactions];
        });
      }

      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error Loading Transactions",
        description: "Failed to load transaction list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSearching(false);
      fetchInProgressRef.current = false;
    }
  }, [statusFilter, searchTerm, toast]); // Dependencies for useCallback

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/transactions-stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "Error Loading Statistics",
        description: "Failed to load dashboard statistics. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch data when status filter changes
  useEffect(() => {
    if (employee) {
      console.log('🔄 Status filter changed to:', statusFilter);
      setTransactions([]);
      setPage(1);
      setHasMore(true);
      fetchInProgressRef.current = false; // Reset fetch lock
      fetchTransactions(1, true);
      fetchStatistics();
    }
  }, [statusFilter, employee, fetchTransactions]);

  // Debounced search with longer delay for better UX
  useEffect(() => {
    if (!employee) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      setSearching(true);
      // Increased to 800ms for better debouncing
      searchTimeoutRef.current = setTimeout(() => {
        console.log('🔍 Search triggered:', searchTerm);
        setTransactions([]);
        setPage(1);
        setHasMore(true);
        fetchTransactions(1, true);
      }, 800);
    } else {
      setTransactions([]);
      setPage(1);
      setHasMore(true);
      fetchTransactions(1, true);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, employee, fetchTransactions]);

  // Infinite scroll observer with improved logic
  useEffect(() => {
    if (!hasMore || loading || searching || fetchInProgressRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !fetchInProgressRef.current) {
          console.log('📜 Infinite scroll triggered, loading more...');
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchTransactions(nextPage, false);
            return nextPage;
          });
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading slightly before reaching bottom
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, searching, fetchTransactions]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      if (!token) {
        setLocation('/employee');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/employee/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      setEmployee(data.employee);
      fetchTransactions(1, true);
      fetchStatistics();
    } catch (error) {
      console.error('Auth check failed:', error);
      toast({
        title: "Authentication Failed",
        description: "Your session has expired. Please login again.",
        variant: "destructive"
      });
      localStorage.removeItem('employeeToken');
      setLocation('/employee');
    }
  };

  const handleViewTransaction = async (transactionId) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch transaction details');

      const data = await response.json();
      setSelectedTransaction(data.data);
      setShowProcessingModal(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast({
        title: "Error Loading Details",
        description: "Failed to load transaction details. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleProcessingComplete = useCallback(() => {
    setShowProcessingModal(false);
    setSelectedTransaction(null);
    // Refresh data
    setTransactions([]);
    setPage(1);
    setHasMore(true);
    fetchInProgressRef.current = false; // Reset fetch lock
    fetchTransactions(1, true);
    fetchStatistics();
    
    // Show success toast
    toast({
      title: "Transaction Updated",
      description: "Transaction has been processed successfully.",
      variant: "default"
    });
  }, [fetchTransactions, toast]);

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    setLocation('/employee-login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = useCallback((status) => {
    const badges = {
      approved: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle, text: 'Approved' },
      processing: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, text: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, text: 'Failed' }
    };
    const badge = badges[status] || badges.approved;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  }, []);

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
                <p className="text-sm text-gray-600">Process approved withdrawals</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{employee?.name}</p>
                <p className="text-xs text-gray-600">{employee?.designationNumber}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* STATISTICS */}
      {statistics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Approved */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Pending Action</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.approved.count}</p>
              <p className="text-sm text-gray-600 mb-1">Approved Transactions</p>
              <p className="text-xs font-medium text-blue-600">{formatCurrency(statistics.approved.amount)}</p>
            </div>

            {/* Processing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.processing.count}</p>
              <p className="text-sm text-gray-600 mb-1">Processing</p>
              <p className="text-xs font-medium text-yellow-600">{formatCurrency(statistics.processing.amount)}</p>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Success</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.completed.count}</p>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-xs font-medium text-green-600">{formatCurrency(statistics.completed.amount)}</p>
            </div>

            {/* Failed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Failed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.failed.count}</p>
              <p className="text-sm text-gray-600 mb-1">Failed Transactions</p>
              <p className="text-xs font-medium text-red-600">{formatCurrency(statistics.failed.amount)}</p>
            </div>
          </div>

          {/* My Activity Stats */}
          <div className="mt-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-sm p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold">Your Activity</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">{statistics.myActivity.completed}</p>
                <p className="text-sm opacity-90">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.myActivity.processing}</p>
                <p className="text-sm opacity-90">Processing</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.myActivity.failed}</p>
                <p className="text-sm opacity-90">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.myActivity.totalProcessed}</p>
                <p className="text-sm opacity-90">Total Processed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS AND SEARCH */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by campaign, creator, bank, or transaction reference..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-700 uppercase tracking-wider">
              <div className="col-span-4">Campaign / Creator</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Bank Account</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {transactions.length === 0 && !loading ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No transactions found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchTerm ? 'Try adjusting your search' : 'Transactions will appear here when available'}
                </p>
              </div>
            ) : (
              <>
                {transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    onClick={() => handleViewTransaction(transaction._id)}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Campaign / Creator */}
                      <div className="col-span-4">
                        <div className="flex items-start gap-3">
                          {transaction.campaign?.coverImage && (
                            <img
                              src={transaction.campaign.coverImage}
                              alt=""
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {transaction.campaign?.title || 'Campaign Deleted'}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {transaction.creator?.name || 'Unknown'}
                            </p>
                            {transaction.creator?.kycVerified && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                                <CheckCircle className="w-3 h-3" />
                                KYC Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2">
                        <p className="font-bold text-gray-900">{formatCurrency(transaction.requestedAmount)}</p>
                        {transaction.processingDetails?.processingFee > 0 && (
                          <p className="text-xs text-gray-600">
                            Fee: {formatCurrency(transaction.processingDetails.processingFee)}
                          </p>
                        )}
                      </div>

                      {/* Bank Account */}
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.bankAccount?.bankName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {transaction.bankAccount?.accountNumber || 'N/A'}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        {getStatusBadge(transaction.status)}
                        {transaction.processingDetails?.transactionReference && (
                          <p className="text-xs text-gray-600 mt-1 font-mono">
                            Ref: {transaction.processingDetails.transactionReference.slice(0, 8)}...
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                        {transaction.processingDetails?.processedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed: {formatDate(transaction.processingDetails.processedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && transactions.length > 0 && (
                  <div className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                )}

                {/* Infinite scroll trigger */}
                {hasMore && !loading && (
                  <div ref={observerTarget} className="h-4" />
                )}

                {/* No more results */}
                {!hasMore && transactions.length > 0 && (
                  <div className="px-6 py-4 text-center text-sm text-gray-500">
                    No more transactions to load
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTION PROCESSING MODAL */}
      {showProcessingModal && selectedTransaction && (
        <TransactionProcessingModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowProcessingModal(false);
            setSelectedTransaction(null);
          }}
          onTransactionComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
};

// Wrap with Protected Route
const ProtectedTransactionManagementDashboard = () => (
  <ProtectedEmployeeRoute requiredDepartment="TRANSACTION_MANAGEMENT">
    <TransactionManagementDashboard />
  </ProtectedEmployeeRoute>
);

export default ProtectedTransactionManagementDashboard;
