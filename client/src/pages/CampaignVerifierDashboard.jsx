import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import CampaignVerificationModal from '../components/employee/CampaignVerificationModal';
import {
  FileCheck,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Eye,
  LogOut,
  AlertTriangle,
  Tag
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CampaignVerifierDashboard = () => {
  const [location, setLocation] = useLocation();
  const [employee, setEmployee] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const observerTarget = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Check authentication
  useEffect(() => {
    checkAuth();
    fetchStatistics();
  }, []);

  // Fetch campaigns when filters change
  useEffect(() => {
    setCampaigns([]);
    setPage(1);
    setHasMore(true);
    fetchCampaigns(1, true);
  }, [statusFilter, categoryFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm === '') {
      setCampaigns([]);
      setPage(1);
      setHasMore(true);
      fetchCampaigns(1, true);
    } else {
      setSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        setCampaigns([]);
        setPage(1);
        setHasMore(true);
        fetchCampaigns(1, true);
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !searching) {
          fetchCampaigns(page + 1, false);
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
  }, [hasMore, loading, searching, page]);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/check-auth`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.employee.department === 'CAMPAIGN_VERIFIER') {
        setEmployee(data.employee);
      } else {
        setLocation('/employee');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setLocation('/employee');
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employee/campaigns/stats/overview`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchCampaigns = async (pageNum, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        status: statusFilter,
        category: categoryFilter,
        search: searchTerm,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const res = await fetch(`${API_BASE_URL}/api/employee/campaigns?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        if (reset) {
          setCampaigns(data.campaigns);
        } else {
          setCampaigns((prev) => [...prev, ...data.campaigns]);
        }
        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/employee/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setLocation('/employee');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowVerificationModal(true);
  };

  const handleVerificationComplete = (action, updatedCampaign) => {
    // Refresh campaigns list and statistics
    setCampaigns([]);
    setPage(1);
    setHasMore(true);
    fetchCampaigns(1, true);
    fetchStatistics();
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
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      active: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[status] || styles.pending;
  };

  if (loading && campaigns.length === 0) {
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
                <FileCheck className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-lg font-bold uppercase tracking-wide">
                  Campaign Verification Department
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
        {/* STATISTICS */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalCampaigns}</p>
                  <p className="text-xs text-gray-600">Total Campaigns</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-md flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{statistics.pendingCampaigns}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{statistics.activeCampaigns}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{statistics.rejectedCampaigns}</p>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{statistics.completedCampaigns}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{statistics.featuredCampaigns}</p>
                  <p className="text-xs text-gray-600">Featured</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{statistics.myVerifications}</p>
                  <p className="text-xs text-gray-600">My Verifications</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-white border border-gray-300 rounded-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search campaigns by title, category, story..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 text-sm appearance-none"
              >
                <option value="all">All Categories</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Animals">Animals</option>
                <option value="Environment">Environment</option>
                <option value="Emergency">Emergency</option>
                <option value="Community">Community</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* CAMPAIGNS LIST */}
        <div className="space-y-4">
          {campaigns.length === 0 && !loading ? (
            <div className="bg-white border border-gray-300 rounded-md p-12 text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">No campaigns found</p>
              <p className="text-gray-500 text-sm">
                {searchTerm
                  ? 'Try adjusting your search or filters'
                  : 'No campaigns match the selected filters'}
              </p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="bg-white border border-gray-300 rounded-md p-4 hover:border-blue-800 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Campaign Image */}
                  <div className="w-40 h-28 flex-shrink-0">
                    <img
                      src={campaign.coverImage}
                      alt={campaign.title}
                      className="w-full h-full object-cover rounded border border-gray-200"
                    />
                  </div>

                  {/* Campaign Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {campaign.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {campaign.shortDescription}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium border rounded-full whitespace-nowrap ${getStatusBadge(
                          campaign.status
                        )}`}
                      >
                        {campaign.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500 text-xs">Category</p>
                        <p className="font-medium text-gray-900">{campaign.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Target Amount</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(campaign.targetAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Raised</p>
                        <p className="font-medium text-green-700">
                          {formatCurrency(campaign.amountRaised)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Created</p>
                        <p className="font-medium text-gray-900">{formatDate(campaign.createdAt)}</p>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {campaign.creator?.profilePictureUrl ? (
                              <img
                                src={campaign.creator.profilePictureUrl}
                                alt={campaign.creator.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-gray-600">
                                {campaign.creator?.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-700">{campaign.creator?.name}</span>
                        </div>
                        {campaign.creator?.kycVerified ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-300">
                            KYC Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            KYC Not Verified
                          </span>
                        )}
                        {campaign.featured && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded border border-purple-300 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewCampaign(campaign)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View & Verify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="py-4 text-center">
            {hasMore && !loading && campaigns.length > 0 && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
            )}
          </div>
        </div>
      </main>

      {/* VERIFICATION MODAL */}
      {showVerificationModal && selectedCampaign && (
        <CampaignVerificationModal
          campaign={selectedCampaign}
          onClose={() => setShowVerificationModal(false)}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default CampaignVerifierDashboard;
