import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { API_URL } from '../../config/index';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, CreditCard, 
  TrendingUp, Activity, Eye, Download, MapPin, Shield, ShieldX,
  FileText, Building2, CheckCircle, XCircle, Clock, AlertCircle,
  ExternalLink, Banknote, DollarSign
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const UserDetail = ({ id }) => {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    fetchUserDetail();
  }, [id]);
  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPromote = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}/promote`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Update the user state
        setUser(prev => ({
          ...prev,
          user: {
            ...prev.user,
            isPremiumAndVerified: true
          }
        }));
        alert('User promoted to verified successfully!');
      } else {
        alert(data.message || 'Failed to promote user');
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Error promoting user');
    }
  };

  const handleUserDemote = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}/demote`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Update the user state
        setUser(prev => ({
          ...prev,
          user: {
            ...prev.user,
            isPremiumAndVerified: false
          }
        }));
        alert('User verification removed successfully!');
      } else {
        alert(data.message || 'Failed to remove user verification');
      }
    } catch (error) {
      console.error('Error demoting user:', error);
      alert('Error removing user verification');
    }
  };

  const chartColors = {
    primary: darkMode ? '#3B82F6' : '#2563EB',
    success: darkMode ? '#10B981' : '#059669',
    warning: darkMode ? '#F59E0B' : '#D97706',
    danger: darkMode ? '#EF4444' : '#DC2626'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h2>          <button
            onClick={() => setLocation('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const campaignStats = user.user.campaigns || [];
  const donations = user.donations || [];
  const payments = user.payments || [];
  const bankAccounts = user.bankAccounts || [];
  const withdrawalRequests = user.withdrawalRequests || [];
  const verificationDocumentUrl = user.user.verificationDocumentUrl;

  const getCampaignStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">              <button
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Joined {new Date(user.user.createdAt).toLocaleDateString()}
                </span>
                {user.user.isPremiumAndVerified ? (
                  <button
                    onClick={() => handleUserDemote()}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <ShieldX className="w-4 h-4" />
                    <span>Remove Verification</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserPromote()}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Promote to Verified</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* User Avatar & Info */}
              <div className="lg:col-span-1 text-center">
                <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-16 h-16 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.user.name}</h1>
                  {user.user.isPremiumAndVerified && (
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{user.user.email}</p>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {campaignStats.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Campaigns</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {donations.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Donations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {user.stats.verifiedBankAccounts || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Bank Accounts</div>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-600 dark:text-gray-300">{user.user.email}</span>
                      </div>
                      {user.user.phone && (
                        <div className="flex items-center">
                          <Phone className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-600 dark:text-gray-300">{user.user.phone}</span>
                        </div>
                      )}
                      {user.user.location && (
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-600 dark:text-gray-300">{user.user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-600 dark:text-gray-300">
                          Member since {new Date(user.user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Campaigns:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{user.stats.totalCampaigns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Donations:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{user.stats.totalDonations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Amount Donated:</span>
                        <span className="font-medium text-gray-900 dark:text-white">NPR {user.stats.totalDonated.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Payments:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{user.stats.totalPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Amount Paid:</span>
                        <span className="font-medium text-gray-900 dark:text-white">NPR {user.stats.totalPaid.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financial Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Bank Accounts:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.stats.verifiedBankAccounts}/{user.stats.totalBankAccounts} Verified
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Withdrawals:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{user.stats.totalWithdrawals || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Withdrawn:</span>
                        <span className="font-medium text-gray-900 dark:text-white">NPR {(user.stats.totalWithdrawn || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Pending Withdrawals:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">{user.stats.pendingWithdrawals || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {['overview', 'verification', 'bankAccounts', 'withdrawals', 'campaigns', 'donations', 'payments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'bankAccounts' ? 'Bank Accounts' : 
                   tab === 'verification' ? 'Verification' :
                   tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Status Distribution */}
            {campaignStats.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          campaignStats.reduce((acc, campaign) => {
                            acc[campaign.status] = (acc[campaign.status] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([status, count]) => ({ name: status, value: count }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill={chartColors.primary}
                      >
                        {Object.entries(campaignStats.reduce((acc, campaign) => {
                          acc[campaign.status] = (acc[campaign.status] || 0) + 1;
                          return acc;
                        }, {})).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {/* Recent Campaigns */}
                  {campaignStats.slice(0, 3).map((campaign) => (
                    <div key={campaign._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{campaign.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          NPR {campaign.amountRaised?.toLocaleString()} raised
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                  ))}
                  
                  {/* Recent Donations */}
                  {donations.slice(0, 2).map((donation) => (
                    <div key={donation._id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Donated to campaign</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          NPR {donation.amount.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Verification Documents</h3>
              
              {/* Verification Status */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {user.user.isPremiumAndVerified ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Verified User</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">This user has been verified by an admin</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Not Verified</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">This user has not been verified yet</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity Document */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Identity Verification Document
                </h4>
                
                {verificationDocumentUrl ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Personal Verification Document
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Citizenship, License, or Passport
                        </div>
                      </div>
                      <a
                        href={verificationDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">Open</span>
                      </a>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                      <img
                        src={verificationDocumentUrl}
                        alt="Verification Document"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No verification document uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bankAccounts' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Bank Accounts</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''} found
                </div>
              </div>
              
              {bankAccounts.length > 0 ? (
                <div className="space-y-4">
                  {bankAccounts.map((account) => (
                    <div key={account._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{account.bankName}</h4>
                              {account.isPrimary && (
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                              Account: {account.accountNumber}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Holder: {account.accountName}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          account.verificationStatus === 'verified' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : account.verificationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : account.verificationStatus === 'under_review'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {account.verificationStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact Number</div>
                          <div className="text-sm text-gray-900 dark:text-white flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {account.associatedPhoneNumber}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Document Type</div>
                          <div className="text-sm text-gray-900 dark:text-white flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                            {account.documentType.charAt(0).toUpperCase() + account.documentType.slice(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Document Number</div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {account.documentNumber}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Added On</div>
                          <div className="text-sm text-gray-900 dark:text-white flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {new Date(account.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {account.verificationDate && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Verification Details
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            Verified on {new Date(account.verificationDate).toLocaleDateString()}
                            {account.verifiedBy && ` by ${account.verifiedBy.username || 'Admin'}`}
                          </div>
                        </div>
                      )}

                      {account.rejectionReason && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="text-xs text-red-600 dark:text-red-400 mb-1">
                            Rejection Reason
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {account.rejectionReason}
                          </div>
                        </div>
                      )}

                      {/* Document Image */}
                      {account.documentImageUrl && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Verification Document
                            </div>
                            <a
                              href={account.documentImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="text-sm">Open Full Size</span>
                            </a>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                            <img
                              src={account.documentImageUrl}
                              alt={`${account.documentType} verification`}
                              className="w-full h-auto max-h-64 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {account.notes && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                            Admin Notes
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {account.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No bank accounts found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Withdrawal History</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {withdrawalRequests.length} request{withdrawalRequests.length !== 1 ? 's' : ''} found
                </div>
              </div>
              
              {withdrawalRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
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
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {withdrawalRequests.map((withdrawal) => (
                        <tr key={withdrawal._id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                              {withdrawal.campaign?.title || 'Unknown Campaign'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {withdrawal.reason?.substring(0, 50)}{withdrawal.reason?.length > 50 ? '...' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              NPR {withdrawal.requestedAmount.toLocaleString()}
                            </div>
                            {withdrawal.processingDetails?.finalAmount && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Final: NPR {withdrawal.processingDetails.finalAmount.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              withdrawal.withdrawalType === 'full'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {withdrawal.withdrawalType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              withdrawal.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : withdrawal.status === 'approved'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : withdrawal.status === 'rejected' || withdrawal.status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : withdrawal.status === 'processing'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(withdrawal.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                // Show withdrawal details modal
                                alert(JSON.stringify(withdrawal, null, 2));
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No withdrawal requests found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Campaigns</h3>
                <button className="text-blue-600 hover:text-blue-500 text-sm">
                  <Download className="w-4 h-4 inline mr-1" />
                  Export
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {campaignStats.map((campaign) => (
                      <tr key={campaign._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {campaign.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">                          <button
                            onClick={() => setLocation(`/admin/campaign/${campaign._id}`)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Donations</h3>
                <button className="text-blue-600 hover:text-blue-500 text-sm">
                  <Download className="w-4 h-4 inline mr-1" />
                  Export
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {donations.map((donation) => (
                      <tr key={donation._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {donation.campaignId?.title || 'Unknown Campaign'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            NPR {donation.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {donation.message || 'No message'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Payments</h3>
                <button className="text-blue-600 hover:text-blue-500 text-sm">
                  <Download className="w-4 h-4 inline mr-1" />
                  Export
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Transaction ID
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
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.transactionId || payment.purchaseOrderId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {payment.campaignId?.title || 'Unknown Campaign'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            NPR {payment.amount?.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Fee: NPR {payment.platformFee?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'Completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : payment.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
