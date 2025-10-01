import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { API_URL } from '../../config/index';
import { 
  ArrowLeft, Calendar, User, DollarSign, Target, Eye, 
  CheckCircle, XCircle, Star, AlertTriangle, 
  MessageSquare, FileText, Download, TrendingUp, 
  Plus, X, Edit, Save
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const CampaignDetail = ({ id }) => {
  const [location, setLocation] = useLocation();
  const [campaign, setCampaign] = useState(null);
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );    // Tag management state
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tempTags, setTempTags] = useState([]);
  const [tagUpdateLoading, setTagUpdateLoading] = useState(false);

  useEffect(() => {
    fetchCampaignDetail();
    fetchCampaignFinances();
  }, [id]);
  const fetchCampaignDetail = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/campaigns/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCampaign(data.data);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    }
  };
  const fetchCampaignFinances = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/campaigns/${id}/finances`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setFinances(data.data);
      }
    } catch (error) {
      console.error('Error fetching campaign finances:', error);
    } finally {
      setLoading(false);
    }
  };  const handleStatusChange = async (status, reason = '') => {
    try {
      // For approval, we need to include tags
      let requestBody = { status, reason };
      
      if (status === 'active') {
        // Use current campaign tags or an empty array if no tags exist
        requestBody.tags = campaign.tags || [];
        
        // If no tags exist, prompt admin to add at least one tag
        if (!campaign.tags || campaign.tags.length === 0) {
          alert('This campaign has no tags assigned. Please add tags first before approving.');
          return;
        }
      }
      
      const response = await fetch(`${API_URL}/api/admin/campaigns/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      if (data.success) {
        fetchCampaignDetail();
        // Show success message
        alert(`Campaign ${status === 'active' ? 'approved' : status} successfully!`);
      } else {
        // Show error message from backend
        alert(`Error: ${data.message || 'Failed to update campaign status'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('An error occurred while updating the campaign status. Please try again.');
    }
  };
  const toggleFeatured = async () => {
    try {      const response = await fetch(`${API_URL}/api/admin/campaigns/${id}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featured: !campaign.featured })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchCampaignDetail();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  // Tag management functions
  const startEditingTags = () => {
    setIsEditingTags(true);
    setTempTags([...campaign.tags || []]);
    setNewTag('');
  };

  const cancelEditingTags = () => {
    setIsEditingTags(false);
    setTempTags([]);
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !tempTags.includes(newTag.trim())) {
      setTempTags([...tempTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTempTags(tempTags.filter(tag => tag !== tagToRemove));
  };
  const saveTags = async () => {
    try {
      setTagUpdateLoading(true);
      const response = await fetch(`${API_URL}/api/admin/campaigns/${id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tags: tempTags })
      });
      
      const data = await response.json();
      if (data.success) {
        setCampaign({ ...campaign, tags: tempTags });
        setIsEditingTags(false);
        setTempTags([]);
      }
    } catch (error) {
      console.error('Error updating tags:', error);
    } finally {
      setTagUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'canceled': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign Not Found</h2>          <button
            onClick={() => setLocation('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">              <button
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleFeatured}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    campaign.featured 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {campaign.featured ? 'Featured' : 'Not Featured'}
                </button>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Campaign Images */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {/* Cover Image */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Image</h4>
                    <img 
                      src={campaign.coverImageUrl || campaign.coverImage || '/api/placeholder/400/300'} 
                      alt={`${campaign.title} - Cover`}
                      className="w-full h-48 object-cover rounded-lg border-2 border-blue-200 dark:border-blue-700"
                    />
                  </div>
                  
                  {/* Additional Images */}
                  {campaign.imageUrls && campaign.imageUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Images ({campaign.imageUrls.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {campaign.imageUrls.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={imageUrl || '/api/placeholder/400/300'} 
                              alt={`${campaign.title} - Image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Fallback for campaigns with old image format */}
                  {(!campaign.imageUrls || campaign.imageUrls.length === 0) && campaign.images && campaign.images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Images ({campaign.images.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {campaign.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={image || '/api/placeholder/400/300'} 
                              alt={`${campaign.title} - Image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                              onClick={() => window.open(image, '_blank')}
                            />
                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* No additional images message */}
                  {(!campaign.imageUrls || campaign.imageUrls.length === 0) && 
                   (!campaign.images || campaign.images.length === 0) && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="text-sm">No additional images uploaded</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Info */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{campaign.title}</h1>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      NPR {campaign.amountRaised?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Raised</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      NPR {campaign.targetAmount?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Goal</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round((campaign.amountRaised / campaign.targetAmount) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {campaign.donors || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Donors</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full" 
                    style={{ width: `${Math.min((campaign.amountRaised / campaign.targetAmount) * 100, 100)}%` }}
                  ></div>
                </div>                {/* Creator Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{campaign.creator?.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{campaign.creator?.email}</div>
                    {campaign.creator?.phone && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{campaign.creator.phone}</div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Created: {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ends: {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {campaign.status === 'pending' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Actions</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleStatusChange('active')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve Campaign
                </button>
                
                <button
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection:');
                    if (reason) handleStatusChange('rejected', reason);
                  }}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Description */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Description</h3>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {campaign.description || campaign.story}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Info</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</span>
                    <div className="text-sm text-gray-900 dark:text-white">{campaign.category}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</span>
                    <div className="text-sm text-gray-900 dark:text-white">{campaign.location || 'Not specified'}</div>
                  </div>                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</span>
                      {!isEditingTags && (
                        <button
                          onClick={startEditingTags}
                          className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                      )}
                    </div>
                    
                    {isEditingTags ? (
                      <div className="space-y-3">
                        {/* Current tags being edited */}
                        <div className="flex flex-wrap gap-1">
                          {tempTags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        
                        {/* Add new tag input */}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            placeholder="Enter new tag"
                            className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={addTag}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={saveTags}
                            disabled={tagUpdateLoading}
                            className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {tagUpdateLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={cancelEditingTags}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.tags?.length > 0 ? (
                          campaign.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">No tags assigned</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Admin Notes</h3>
                <div className="space-y-3">
                  {campaign.rejectionReason && (
                    <div>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Rejection Reason</span>
                      <div className="text-sm text-gray-900 dark:text-white">{campaign.rejectionReason}</div>
                    </div>
                  )}
                  {campaign.adminFeedback && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Feedback</span>
                      <div className="text-sm text-gray-900 dark:text-white">{campaign.adminFeedback}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        {finances && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Financial Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      NPR {finances.financialSummary.platformFeesCollected.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Platform Fees</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {finances.financialSummary.totalPayments}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Payments</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      NPR {finances.financialSummary.averageDonation.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg Donation</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {finances.financialSummary.totalDonations}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Donations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(finances.financialSummary.paymentMethodBreakdown || {}).map(([method, count]) => ({
                        name: method.toUpperCase(),
                        value: count
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill={chartColors.primary}
                    >
                      {Object.entries(finances.financialSummary.paymentMethodBreakdown || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Breakdown Chart */}
        {finances && Object.keys(finances.financialSummary.monthlyBreakdown || {}).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Donation Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={Object.entries(finances.financialSummary.monthlyBreakdown || {}).map(([month, data]) => ({
                  month,
                  amount: data.amount,
                  count: data.count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="month" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="amount" stroke={chartColors.primary} strokeWidth={2} />
                  <Line type="monotone" dataKey="count" stroke={chartColors.success} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Donations */}
        {finances && finances.donations && finances.donations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Donations</h3>
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
                        Donor
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
                    {finances.donations.slice(0, 10).map((donation) => (
                      <tr key={donation._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {donation.anonymous ? 'Anonymous' : donation.donorId?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            NPR {donation.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </div>
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
      </div>
    </div>
  );
};

export default CampaignDetail;
