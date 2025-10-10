import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import WithdrawalVerificationModal from '../components/employee/WithdrawalVerificationModal';
import BankVerificationModal from '../components/employee/BankVerificationModal';
import {
  Wallet,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  LogOut,
  Eye,
  Building,
  User,
  TrendingUp,
  FileText
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const WithdrawalProcessorDashboard = () => {
  const [location, setLocation] = useLocation();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('withdrawals'); // 'withdrawals' or 'bank-accounts'
  const [withdrawals, setWithdrawals] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [bankStatistics, setBankStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBankVerificationModal, setShowBankVerificationModal] = useState(false);

  const observerTarget = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Check authentication
  useEffect(() => {
    checkAuth();
    fetchStatistics();
    fetchBankStatistics();
  }, []);

  // Fetch data when tab or filters change
  useEffect(() => {
    if (activeTab === 'withdrawals') {
      setWithdrawals([]);
      setBankAccounts([]);
    } else {
      setBankAccounts([]);
      setWithdrawals([]);
    }
    setPage(1);
    setHasMore(true);
    setSearchTerm('');
    setStatusFilter('pending');
    
    if (activeTab === 'withdrawals') {
      fetchWithdrawals(1, true);
    } else {
      fetchBankAccounts(1, true);
    }
  }, [activeTab]);

  // Fetch data when filters change
  useEffect(() => {
    if (activeTab === 'withdrawals') {
      setWithdrawals([]);
    } else {
      setBankAccounts([]);
    }
    setPage(1);
    setHasMore(true);
    
    if (activeTab === 'withdrawals') {
      fetchWithdrawals(1, true);
    } else {
      fetchBankAccounts(1, true);
    }
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm === '') {
      if (activeTab === 'withdrawals') {
        setWithdrawals([]);
      } else {
        setBankAccounts([]);
      }
      setPage(1);
      setHasMore(true);
      
      if (activeTab === 'withdrawals') {
        fetchWithdrawals(1, true);
      } else {
        fetchBankAccounts(1, true);
      }
    } else {
      setSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        if (activeTab === 'withdrawals') {
          setWithdrawals([]);
        } else {
          setBankAccounts([]);
        }
        setPage(1);
        setHasMore(true);
        
        if (activeTab === 'withdrawals') {
          fetchWithdrawals(1, true);
        } else {
          fetchBankAccounts(1, true);
        }
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, activeTab]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !searching) {
          if (activeTab === 'withdrawals') {
            fetchWithdrawals(page + 1, false);
          } else {
            fetchBankAccounts(page + 1, false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, searching, page, activeTab]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      if (!token) {
        setLocation('/employee/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/employee/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      if (data.success && data.data.department === 'WITHDRAWAL_DEPARTMENT') {
        setEmployee(data.data);
      } else {
        setLocation('/employee/portal');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('employeeToken');
      setLocation('/employee/login');
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/withdrawals-stats/overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchBankStatistics = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/bank-accounts-stats/overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBankStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching bank statistics:', error);
    }
  };

  const fetchWithdrawals = async (pageNum, reset) => {
    if (reset) {
      setLoading(true);
    } else {
      setSearching(false);
    }

    try {
      const token = localStorage.getItem('employeeToken');
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/employee/withdrawals?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (reset) {
            setWithdrawals(data.data);
          } else {
            setWithdrawals(prev => [...prev, ...data.data]);
          }
          setPage(pageNum);
          setHasMore(data.pagination.hasMore);
        }
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const fetchBankAccounts = async (pageNum, reset) => {
    if (reset) {
      setLoading(true);
    } else {
      setSearching(false);
    }

    try {
      const token = localStorage.getItem('employeeToken');
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/employee/bank-accounts?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (reset) {
            setBankAccounts(data.data);
          } else {
            setBankAccounts(prev => [...prev, ...data.data]);
          }
          setPage(pageNum);
          setHasMore(data.pagination.hasMore);
        }
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleViewWithdrawal = async (withdrawalId) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/withdrawals/${withdrawalId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedWithdrawal(data.data);
          setShowVerificationModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching withdrawal details:', error);
    }
  };

  const handleViewBankAccount = async (bankAccountId) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/bank-accounts/${bankAccountId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedBankAccount(data.data);
          setShowBankVerificationModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching bank account details:', error);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    setSelectedWithdrawal(null);
    // Refresh data
    if (activeTab === 'withdrawals') {
      setWithdrawals([]);
      setPage(1);
      setHasMore(true);
      fetchWithdrawals(1, true);
      fetchStatistics();
    } else {
      setBankAccounts([]);
      setPage(1);
      setHasMore(true);
      fetchBankAccounts(1, true);
      fetchBankStatistics();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    setLocation('/employee/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-purple-100 text-purple-800 border-purple-300',
      failed: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[status] || styles.pending;
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER */}
      <header className="bg-blue-900 text-white py-4 border-b-4 border-red-600 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-lg font-bold uppercase tracking-wide">
                  Withdrawal Processing Department
                </h1>
                <p className="text-xs opacity-90">Sahayog Nepal – Official Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="font-medium">{employee?.name}</p>
                <p className="text-xs opacity-80">{employee?.designationNumber}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* TABS */}
        <div className="bg-white border border-gray-300 rounded-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('bank-accounts')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'bank-accounts'
                  ? 'bg-blue-900 text-white border-b-4 border-red-600'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Building className="w-5 h-5" />
              <span>Bank Account Verification</span>
              {bankStatistics && bankStatistics.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                  {bankStatistics.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'withdrawals'
                  ? 'bg-blue-900 text-white border-b-4 border-red-600'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span>Withdrawal Processing</span>
              {statistics && statistics.pending?.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                  {statistics.pending.count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* STATISTICS FOR WITHDRAWALS */}
        {activeTab === 'withdrawals' && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                  <p className="text-xs text-gray-600">Total Requests</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-md flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{statistics.pending.count}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-xs text-gray-500">{formatCurrency(statistics.pending.amount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{statistics.approved.count}</p>
                  <p className="text-xs text-gray-600">Approved</p>
                  <p className="text-xs text-gray-500">{formatCurrency(statistics.approved.amount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{statistics.rejected.count}</p>
                  <p className="text-xs text-gray-600">Rejected</p>
                  <p className="text-xs text-gray-500">{formatCurrency(statistics.rejected.amount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{statistics.processing.count}</p>
                  <p className="text-xs text-gray-600">Processing</p>
                  <p className="text-xs text-gray-500">{formatCurrency(statistics.processing.amount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{statistics.completed.count}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-xs text-gray-500">{formatCurrency(statistics.completed.amount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{statistics.myActivity.totalProcessed}</p>
                  <p className="text-xs text-gray-700 font-medium">My Processed</p>
                  <p className="text-xs text-gray-600">
                    ✓{statistics.myActivity.totalApprovals} ✗{statistics.myActivity.totalRejections}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATISTICS FOR BANK ACCOUNTS */}
        {activeTab === 'bank-accounts' && bankStatistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <Building className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{bankStatistics.total}</p>
                  <p className="text-xs text-gray-600">Total Accounts</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-md flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{bankStatistics.pending}</p>
                  <p className="text-xs text-gray-600">Pending Review</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{bankStatistics.verified}</p>
                  <p className="text-xs text-gray-600">Verified</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{bankStatistics.rejected}</p>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{bankStatistics.myActivity?.totalProcessed || 0}</p>
                  <p className="text-xs text-gray-700 font-medium">My Processed</p>
                  <p className="text-xs text-gray-600">
                    ✓{bankStatistics.myActivity?.totalVerifications || 0} ✗{bankStatistics.myActivity?.totalRejections || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-white border border-gray-300 rounded-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'withdrawals' ? "Search by campaign, creator, bank details..." : "Search by user, bank name, account number..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {activeTab === 'withdrawals' ? (
                  <>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* WITHDRAWALS LIST */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            {withdrawals.length === 0 && !loading ? (
              <div className="bg-white border border-gray-300 rounded-md p-8 text-center">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No withdrawal requests found</p>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Try adjusting your search terms' : 'There are no withdrawal requests matching your filters'}
                </p>
              </div>
            ) : (
              withdrawals.map((withdrawal) => (
              <div
                key={withdrawal._id}
                className="bg-white border border-gray-300 rounded-md p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Campaign Info */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">CAMPAIGN</p>
                      <p className="font-medium text-gray-900">{withdrawal.campaign?.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getStatusBadge(withdrawal.campaign?.status)}`}>
                          {withdrawal.campaign?.status}
                        </span>
                      </p>
                    </div>

                    {/* Creator Info */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">CREATOR</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{withdrawal.creator?.name}</p>
                          <p className="text-xs text-gray-600">{withdrawal.creator?.email}</p>
                          <p className="text-xs text-gray-600">{withdrawal.creator?.phone}</p>
                        </div>
                      </div>
                      {withdrawal.creator?.kycVerified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          KYC Verified
                        </span>
                      )}
                    </div>

                    {/* Bank & Amount Info */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">BANK ACCOUNT</p>
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{withdrawal.bankAccount?.bankName}</p>
                          <p className="text-xs text-gray-600">A/C: {withdrawal.bankAccount?.accountNumber}</p>
                          <p className="text-xs text-gray-600">{withdrawal.bankAccount?.accountName}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                        <p className="text-xs text-blue-700 font-medium">Withdrawal Amount</p>
                        <p className="text-lg font-bold text-blue-900">{formatCurrency(withdrawal.requestedAmount)}</p>
                        <p className="text-xs text-blue-600">Available: {formatCurrency(withdrawal.availableAmount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getStatusBadge(withdrawal.status)}`}>
                      {withdrawal.status.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500">{formatDate(withdrawal.createdAt)}</p>
                    <button
                      onClick={() => handleViewWithdrawal(withdrawal._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View & Process
                    </button>
                  </div>
                </div>

                {/* Employee Processing Info */}
                {withdrawal.employeeProcessedBy?.employeeId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">PROCESSED BY</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {withdrawal.employeeProcessedBy.employeeName} ({withdrawal.employeeProcessedBy.employeeDesignation})
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(withdrawal.employeeProcessedBy.processedAt)}
                        </p>
                      </div>
                      {withdrawal.employeeProcessedBy.notes && (
                        <p className="text-xs text-gray-600 italic max-w-md">"{withdrawal.employeeProcessedBy.notes}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          </div>
        )}

        {/* BANK ACCOUNTS LIST */}
        {activeTab === 'bank-accounts' && (
          <div className="space-y-4">
            {bankAccounts.length === 0 && !loading ? (
              <div className="bg-white border border-gray-300 rounded-md p-8 text-center">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No bank accounts found</p>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Try adjusting your search terms' : 'There are no bank accounts matching your filters'}
                </p>
              </div>
            ) : (
              bankAccounts.map((bankAccount) => (
                <div
                  key={bankAccount._id}
                  className="bg-white border border-gray-300 rounded-md p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* User Info */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ACCOUNT HOLDER</p>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{bankAccount.user?.name}</p>
                            <p className="text-xs text-gray-600">{bankAccount.user?.email}</p>
                            <p className="text-xs text-gray-600">{bankAccount.user?.phone}</p>
                          </div>
                        </div>
                        {bankAccount.user?.kycVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            KYC Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
                            <AlertTriangle className="w-3 h-3" />
                            KYC Pending
                          </span>
                        )}
                      </div>

                      {/* Bank Details */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">BANK DETAILS</p>
                        <div className="flex items-start gap-2">
                          <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{bankAccount.bankName}</p>
                            <p className="text-sm text-gray-700">{bankAccount.accountName}</p>
                            <p className="text-xs text-gray-600 font-mono">A/C: {bankAccount.accountNumber}</p>
                            {bankAccount.branchName && (
                              <p className="text-xs text-gray-600">Branch: {bankAccount.branchName}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Document & Dates */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">VERIFICATION INFO</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Submitted:</span> {formatDate(bankAccount.createdAt)}
                          </p>
                          {bankAccount.documentUrl && (
                            <p className="text-xs text-blue-600 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Document attached
                            </p>
                          )}
                          {bankAccount.isPrimary && (
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                              Primary Account
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getStatusBadge(bankAccount.verificationStatus)}`}>
                        {bankAccount.verificationStatus?.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleViewBankAccount(bankAccount._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View & Verify
                      </button>
                    </div>
                  </div>

                  {/* Employee Verification Info */}
                  {bankAccount.employeeVerification?.employeeId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">VERIFIED BY EMPLOYEE</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {bankAccount.employeeVerification.employeeName} ({bankAccount.employeeVerification.employeeDesignation})
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(bankAccount.employeeVerification.verifiedAt)}
                          </p>
                        </div>
                        {bankAccount.employeeVerification.notes && (
                          <p className="text-xs text-gray-600 italic max-w-md">"{bankAccount.employeeVerification.notes}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Loading & Infinite Scroll Trigger */}
        {hasMore && (
          <div ref={observerTarget} className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          </div>
        )}

        {!hasMore && activeTab === 'withdrawals' && withdrawals.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No more withdrawal requests to load</p>
          </div>
        )}

        {!hasMore && activeTab === 'bank-accounts' && bankAccounts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No more bank accounts to load</p>
          </div>
        )}
      </main>

      {/* WITHDRAWAL VERIFICATION MODAL */}
      {showVerificationModal && selectedWithdrawal && (
        <WithdrawalVerificationModal
          withdrawal={selectedWithdrawal}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedWithdrawal(null);
          }}
          onVerificationComplete={handleVerificationComplete}
        />
      )}

      {/* BANK VERIFICATION MODAL */}
      {showBankVerificationModal && selectedBankAccount && (
        <BankVerificationModal
          bankAccount={selectedBankAccount}
          onClose={() => {
            setShowBankVerificationModal(false);
            setSelectedBankAccount(null);
          }}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default WithdrawalProcessorDashboard;
