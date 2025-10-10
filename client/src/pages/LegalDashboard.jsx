import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  Shield, 
  Search, 
  Filter, 
  LogOut, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Activity,
  Eye,
  ChevronDown,
  Flag
} from 'lucide-react';
import AlertReviewModal from '../components/employee/AlertReviewModal';
import ProtectedEmployeeRoute from '../components/employee/ProtectedEmployeeRoute';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const LegalDashboard = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [employee, setEmployee] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [riskScoreFilter, setRiskScoreFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const observerTarget = useRef(null);
  const searchTimeoutRef = useRef(null);
  const fetchInProgressRef = useRef(false);

  // Memoized fetch function
  const fetchAlerts = useCallback(async (pageNum, reset) => {
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
        reviewed: reviewedFilter,
        outcome: outcomeFilter,
        sortBy: 'riskScore',
        sortOrder: 'desc',
        ...(searchTerm.trim() && { search: searchTerm.trim() })
      });

      // Add risk score filters
      if (riskScoreFilter === 'high') {
        params.append('minRiskScore', '70');
      } else if (riskScoreFilter === 'medium') {
        params.append('minRiskScore', '50');
        params.append('maxRiskScore', '69');
      } else if (riskScoreFilter === 'low') {
        params.append('maxRiskScore', '49');
      }

      const response = await fetch(`${API_BASE_URL}/api/employee/legal/alerts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();

      if (reset) {
        setAlerts(data.data);
      } else {
        setAlerts(prev => {
          const existingIds = new Set(prev.map(a => a._id));
          const newAlerts = data.data.filter(a => !existingIds.has(a._id));
          return [...prev, ...newAlerts];
        });
      }

      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error Loading Alerts",
        description: "Failed to load alert list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSearching(false);
      fetchInProgressRef.current = false;
    }
  }, [reviewedFilter, outcomeFilter, riskScoreFilter, searchTerm, toast]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/legal/statistics`, {
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
        description: "Failed to load dashboard statistics.",
        variant: "destructive"
      });
    }
  };

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (employee) {
      console.log('🔄 Filters changed');
      setAlerts([]);
      setPage(1);
      setHasMore(true);
      fetchInProgressRef.current = false;
      fetchAlerts(1, true);
      fetchStatistics();
    }
  }, [reviewedFilter, outcomeFilter, riskScoreFilter, employee, fetchAlerts]);

  // Debounced search
  useEffect(() => {
    if (!employee) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      setSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        console.log('🔍 Search triggered:', searchTerm);
        setAlerts([]);
        setPage(1);
        setHasMore(true);
        fetchAlerts(1, true);
      }, 800);
    } else {
      setAlerts([]);
      setPage(1);
      setHasMore(true);
      fetchAlerts(1, true);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, employee, fetchAlerts]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading || searching || fetchInProgressRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !fetchInProgressRef.current) {
          console.log('📜 Infinite scroll triggered');
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchAlerts(nextPage, false);
            return nextPage;
          });
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, searching, fetchAlerts]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      if (!token) {
        setLocation('/employee-login');
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
      fetchAlerts(1, true);
      fetchStatistics();
    } catch (error) {
      console.error('Auth check failed:', error);
      toast({
        title: "Authentication Failed",
        description: "Your session has expired. Please login again.",
        variant: "destructive"
      });
      localStorage.removeItem('employeeToken');
      setLocation('/employee-login');
    }
  };

  const handleViewAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_BASE_URL}/api/employee/legal/alerts/${alertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch alert details');

      const data = await response.json();
      setSelectedAlert(data.data);
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error fetching alert details:', error);
      toast({
        title: "Error Loading Details",
        description: "Failed to load alert details.",
        variant: "destructive"
      });
    }
  };

  const handleReviewComplete = useCallback(() => {
    setShowReviewModal(false);
    setSelectedAlert(null);
    setAlerts([]);
    setPage(1);
    setHasMore(true);
    fetchInProgressRef.current = false;
    fetchAlerts(1, true);
    fetchStatistics();
    
    toast({
      title: "Review Completed",
      description: "Alert has been reviewed successfully.",
      variant: "default"
    });
  }, [fetchAlerts, toast]);

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    setLocation('/employee-login');
  };

  const getRiskBadge = (riskScore) => {
    if (riskScore >= 85) {
      return { color: 'bg-red-100 text-red-800 border-red-300', text: 'Critical', icon: AlertTriangle };
    } else if (riskScore >= 70) {
      return { color: 'bg-orange-100 text-orange-800 border-orange-300', text: 'High Risk', icon: Flag };
    } else if (riskScore >= 50) {
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'Medium Risk', icon: AlertTriangle };
    } else {
      return { color: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Low Risk', icon: Shield };
    }
  };

  const getOutcomeBadge = (outcome) => {
    const badges = {
      reported: { color: 'bg-red-100 text-red-800 border-red-300', icon: FileText, text: 'Reported' },
      dismissed: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle, text: 'Dismissed' },
      under_review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, text: 'Under Review' },
      none: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Activity, text: 'Pending' }
    };
    return badges[outcome] || badges.none;
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

  if (loading && alerts.length === 0) {
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
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Legal Authority Dashboard</h1>
                <p className="text-sm text-gray-600">AML Compliance & Alert Review</p>
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
            {/* Total Alerts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.overview.total}</p>
              <p className="text-sm text-gray-600 mb-1">Total Alerts</p>
              <p className="text-xs font-medium text-red-600">
                {statistics.overview.highRisk} High Risk
              </p>
            </div>

            {/* Unreviewed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Pending</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.overview.unreviewed}</p>
              <p className="text-sm text-gray-600 mb-1">Pending Review</p>
              <p className="text-xs font-medium text-yellow-600">
                {statistics.recent.alerts24h} in last 24h
              </p>
            </div>

            {/* Reviewed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Reviewed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.overview.reviewed}</p>
              <p className="text-sm text-gray-600 mb-1">Total Reviewed</p>
              <p className="text-xs font-medium text-green-600">
                {statistics.myActivity.totalReviewed} by you
              </p>
            </div>

            {/* Reports Filed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Reported</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.reports.total}</p>
              <p className="text-sm text-gray-600 mb-1">Reports Filed</p>
              <p className="text-xs font-medium text-red-600">
                STR: {statistics.reports.str} | TTR: {statistics.reports.ttr}
              </p>
            </div>
          </div>

          {/* Outcome Summary */}
          <div className="mt-4 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg shadow-sm p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold">Review Outcomes</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold">{statistics.outcomes.reported}</p>
                <p className="text-sm opacity-90">Reported</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.outcomes.dismissed}</p>
                <p className="text-sm opacity-90">Dismissed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.outcomes.underReview}</p>
                <p className="text-sm opacity-90">Under Review</p>
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
                  placeholder="Search by user, campaign, transaction, or indicators..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-400" />
              
              {/* Review Status Filter */}
              <select
                value={reviewedFilter}
                onChange={(e) => setReviewedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Alerts</option>
                <option value="unreviewed">Unreviewed</option>
                <option value="reviewed">Reviewed</option>
              </select>

              {/* Outcome Filter */}
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Outcomes</option>
                <option value="none">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="reported">Reported</option>
                <option value="dismissed">Dismissed</option>
              </select>

              {/* Risk Score Filter */}
              <select
                value={riskScoreFilter}
                onChange={(e) => setRiskScoreFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk (70+)</option>
                <option value="medium">Medium Risk (50-69)</option>
                <option value="low">Low Risk (&lt;50)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTS LIST */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-700 uppercase tracking-wider">
              <div className="col-span-1">Risk</div>
              <div className="col-span-3">User / Campaign</div>
              <div className="col-span-3">Indicators</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Reviewed By</div>
              <div className="col-span-1">Date</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {alerts.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No alerts found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchTerm ? 'Try adjusting your filters' : 'Alerts will appear here when available'}
                </p>
              </div>
            ) : (
              <>
                {alerts.map((alert) => {
                  const riskBadge = getRiskBadge(alert.riskScore);
                  const outcomeBadge = getOutcomeBadge(alert.outcome);
                  const RiskIcon = riskBadge.icon;
                  const OutcomeIcon = outcomeBadge.icon;

                  return (
                    <div
                      key={alert._id}
                      onClick={() => handleViewAlert(alert._id)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Risk Score */}
                        <div className="col-span-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${riskBadge.color}`}>
                            <RiskIcon className="w-3 h-3" />
                            {alert.riskScore}
                          </span>
                        </div>

                        {/* User / Campaign */}
                        <div className="col-span-3">
                          <div className="flex items-start gap-3">
                            {alert.userId?.profilePictureUrl && (
                              <img
                                src={alert.userId.profilePictureUrl}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {alert.userId?.name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {alert.userId?.email || 'No email'}
                              </p>
                              {alert.donationId?.campaignId && (
                                <p className="text-xs text-blue-600 truncate mt-1">
                                  {alert.donationId.campaignId.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Indicators */}
                        <div className="col-span-3">
                          <div className="flex flex-wrap gap-1">
                            {alert.indicators.slice(0, 3).map((indicator, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                              >
                                {indicator}
                              </span>
                            ))}
                            {alert.indicators.length > 3 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{alert.indicators.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${outcomeBadge.color}`}>
                            <OutcomeIcon className="w-3 h-3" />
                            {outcomeBadge.text}
                          </span>
                          {alert.reportType && alert.reportType !== 'none' && (
                            <p className="text-xs text-gray-600 mt-1 font-semibold">
                              {alert.reportType}
                            </p>
                          )}
                        </div>

                        {/* Reviewed By */}
                        <div className="col-span-2">
                          {alert.reviewed && alert.metadata?.reviewedBy ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {alert.metadata.reviewedBy.employeeName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {alert.metadata.reviewedBy.designationNumber}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Not reviewed</span>
                          )}
                        </div>

                        {/* Date */}
                        <div className="col-span-1">
                          <p className="text-xs text-gray-600">
                            {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && alerts.length > 0 && (
                  <div className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                )}

                {/* Infinite scroll trigger */}
                {hasMore && !loading && (
                  <div ref={observerTarget} className="h-4" />
                )}

                {/* No more results */}
                {!hasMore && alerts.length > 0 && (
                  <div className="px-6 py-4 text-center text-sm text-gray-500">
                    No more alerts to load
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ALERT REVIEW MODAL */}
      {showReviewModal && selectedAlert && (
        <AlertReviewModal
          alert={selectedAlert}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedAlert(null);
          }}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </div>
  );
};

// Wrap with Protected Route
const ProtectedLegalDashboard = () => (
  <ProtectedEmployeeRoute requiredDepartment="LEGAL_AUTHORITY_DEPARTMENT">
    <LegalDashboard />
  </ProtectedEmployeeRoute>
);

export default ProtectedLegalDashboard;
