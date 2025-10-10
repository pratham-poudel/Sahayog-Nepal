import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
    Users, 
    Search, 
    CheckCircle, 
    XCircle, 
    Filter,
    LogOut,
    UserCheck,
    Award,
    FileText,
    ChevronDown,
    Eye,
    Calendar,
    AlertCircle,
    Loader2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const KYCVerifierDashboard = () => {
    const [location, setLocation] = useLocation();
    const [employee, setEmployee] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searching, setSearching] = useState(false);
    const [statistics, setStatistics] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [kycStatus, setKycStatus] = useState('all'); // 'all', 'verified', 'unverified'
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    
    // Verification states
    const [verifying, setVerifying] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [isPremium, setIsPremium] = useState(false);

    const observerTarget = useRef(null);
    const searchDebounceTimer = useRef(null);

    // Check authentication
    useEffect(() => {
        checkAuth();
        fetchStatistics();
    }, []);

    // Debounced search effect
    useEffect(() => {
        // Clear existing timer
        if (searchDebounceTimer.current) {
            clearTimeout(searchDebounceTimer.current);
        }

        // Show searching indicator if there's a search term
        if (searchTerm) {
            setSearching(true);
        }

        // Set new timer for search (500ms delay)
        searchDebounceTimer.current = setTimeout(() => {
            setPage(1);
            setUsers([]);
            setHasMore(true);
            fetchUsers(1, true);
            setSearching(false);
        }, 500);

        // Cleanup on unmount or when searchTerm changes
        return () => {
            if (searchDebounceTimer.current) {
                clearTimeout(searchDebounceTimer.current);
            }
        };
    }, [searchTerm]);

    // Fetch users immediately when filter changes (no debounce needed)
    useEffect(() => {
        setPage(1);
        setUsers([]);
        setHasMore(true);
        fetchUsers(1, true);
    }, [kycStatus]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMoreUsers();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore, page]);

    const checkAuth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/employee/check-auth`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                if (data.employee.department !== 'USER_KYC_VERIFIER') {
                    setLocation('/employee');
                    return;
                }
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
            const response = await fetch(`${API_BASE_URL}/api/employee/kyc/statistics`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setStatistics(data.statistics);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    };

    const fetchUsers = async (pageNum = 1, reset = false) => {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const params = new URLSearchParams({
                page: pageNum,
                limit: 20,
                search: searchTerm,
                kycStatus: kycStatus
            });

            const response = await fetch(`${API_BASE_URL}/api/employee/kyc/users?${params}`, {
                credentials: 'include'
            });
            
            const data = await response.json();

            if (data.success) {
                if (reset) {
                    setUsers(data.users);
                } else {
                    setUsers(prev => [...prev, ...data.users]);
                }
                setHasMore(data.pagination.hasMore);
                setTotalUsers(data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreUsers = () => {
        if (!hasMore || loadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchUsers(nextPage, false);
    };

    const handleViewUser = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/employee/kyc/users/${userId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setSelectedUser(data.user);
                setShowModal(true);
                setVerificationNotes('');
                setIsPremium(data.user.isPremiumAndVerified || false);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        }
    };

    const handleVerifyUser = async () => {
        if (!selectedUser) return;
        
        setVerifying(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/employee/kyc/verify-user/${selectedUser._id}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        isPremiumAndVerified: isPremium,
                        verificationNotes
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                // Update local state
                setUsers(prev => prev.map(u => 
                    u._id === selectedUser._id 
                        ? { ...u, kycVerified: true, isPremiumAndVerified: isPremium }
                        : u
                ));
                setShowModal(false);
                setSelectedUser(null);
                fetchStatistics();
                alert('User verified successfully!');
            } else {
                alert(data.message || 'Failed to verify user');
            }
        } catch (error) {
            console.error('Verification failed:', error);
            alert('Failed to verify user');
        } finally {
            setVerifying(false);
        }
    };

    const handleUpdateStatus = async (kycVerified) => {
        if (!selectedUser) return;
        
        setVerifying(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/employee/kyc/update-status/${selectedUser._id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        kycVerified,
                        isPremiumAndVerified: kycVerified ? isPremium : false,
                        verificationNotes
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                setUsers(prev => prev.map(u => 
                    u._id === selectedUser._id 
                        ? { ...u, kycVerified, isPremiumAndVerified: kycVerified ? isPremium : false }
                        : u
                ));
                setShowModal(false);
                setSelectedUser(null);
                fetchStatistics();
                alert('User status updated successfully!');
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update status');
        } finally {
            setVerifying(false);
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

    if (loading && users.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">KYC Verification</h1>
                                <p className="text-sm text-gray-600">{employee?.name} • {employee?.designationNumber}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900">{statistics.totalUsers}</p>
                                </div>
                                <Users className="w-10 h-10 text-blue-600 opacity-80" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Verified</p>
                                    <p className="text-3xl font-bold text-green-600">{statistics.verifiedUsers}</p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-green-600 opacity-80" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Pending</p>
                                    <p className="text-3xl font-bold text-orange-600">{statistics.pendingVerifications}</p>
                                </div>
                                <AlertCircle className="w-10 h-10 text-orange-600 opacity-80" />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">My Verifications</p>
                                    <p className="text-3xl font-bold text-purple-600">{statistics.myVerifications}</p>
                                </div>
                                <Award className="w-10 h-10 text-purple-600 opacity-80" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email, or phone..."
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={kycStatus}
                                onChange={(e) => setKycStatus(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="all">All Users</option>
                                <option value="unverified">Unverified Only</option>
                                <option value="verified">Verified Only</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                        Showing {users.length} of {totalUsers} users
                        {searching && <span className="text-blue-600 ml-2">(searching...)</span>}
                    </p>
                </div>

                {/* Users List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">KYC Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Premium</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.profilePictureUrl ? (
                                                    <img 
                                                        src={user.profilePictureUrl} 
                                                        alt={user.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{user.phone}</td>
                                        <td className="px-6 py-4">
                                            {user.kycVerified ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isPremiumAndVerified ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                    <Award className="w-4 h-4" />
                                                    Premium
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleViewUser(user._id)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Loading more indicator */}
                    {loadingMore && (
                        <div className="py-8 text-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                            <p className="text-gray-600">Loading more users...</p>
                        </div>
                    )}

                    {/* Intersection observer target */}
                    {hasMore && !loadingMore && <div ref={observerTarget} className="h-4" />}

                    {/* No more results */}
                    {!hasMore && users.length > 0 && (
                        <div className="py-8 text-center text-gray-500 text-sm">
                            No more users to load
                        </div>
                    )}

                    {/* Empty state */}
                    {users.length === 0 && !loading && (
                        <div className="py-16 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No users found matching your filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Details Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">User Verification</h2>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* User Info */}
                            <div className="flex items-center gap-4">
                                {selectedUser.profilePictureUrl ? (
                                    <img 
                                        src={selectedUser.profilePictureUrl} 
                                        alt={selectedUser.name}
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                                    <p className="text-gray-600">{selectedUser.email}</p>
                                    <p className="text-gray-600">{selectedUser.phone}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">KYC Status</p>
                                    <p className="font-semibold">{selectedUser.kycVerified ? 'Verified' : 'Not Verified'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Premium Status</p>
                                    <p className="font-semibold">{selectedUser.isPremiumAndVerified ? 'Premium' : 'Regular'}</p>
                                </div>
                            </div>

                            {/* Documents */}
                            {selectedUser.personalVerificationDocument && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Verification Document</p>
                                    <a 
                                        href={selectedUser.personalVerificationDocument}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <FileText className="w-5 h-5" />
                                        View Document
                                    </a>
                                </div>
                            )}

                            {/* Previous Verification Info */}
                            {selectedUser.kycVerifiedBy?.employeeName && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">Previous Verification</p>
                                    <p className="text-sm text-blue-800">
                                        Verified by: {selectedUser.kycVerifiedBy.employeeName} ({selectedUser.kycVerifiedBy.designationNumber})
                                    </p>
                                    {selectedUser.kycVerifiedAt && (
                                        <p className="text-sm text-blue-700 mt-1">
                                            Date: {new Date(selectedUser.kycVerifiedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                    {selectedUser.kycVerificationNotes && (
                                        <p className="text-sm text-blue-700 mt-2">
                                            Notes: {selectedUser.kycVerificationNotes}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Verification Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPremium}
                                            onChange={(e) => setIsPremium(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="font-medium text-gray-700">
                                            Grant Premium & Verified Status
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Notes (Optional)
                                    </label>
                                    <textarea
                                        value={verificationNotes}
                                        onChange={(e) => setVerificationNotes(e.target.value)}
                                        placeholder="Add notes about this verification..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-4">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedUser(null);
                                }}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            
                            {!selectedUser.kycVerified ? (
                                <button
                                    onClick={handleVerifyUser}
                                    disabled={verifying}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Verify User
                                        </>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus(false)}
                                        disabled={verifying}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        Revoke
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(true)}
                                        disabled={verifying}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        Update
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KYCVerifierDashboard;
