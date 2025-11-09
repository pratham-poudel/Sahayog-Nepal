import { useState } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { API_URL as CONFIG_API_URL } from '../config/index.js';

// API base URL
const API_URL = `${CONFIG_API_URL}/api`;

// Function to get the authentication token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Configure axios instance with auth headers
const axiosWithAuth = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

// Configure axios instance for multipart form data
const axiosWithFormData = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

const useCampaigns = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get all campaigns with pagination, sorting, and filtering
  const getAllCampaigns = async (options = {}) => {
    const { 
      page = 1,
      limit = 9,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category = null,
      subcategory = null,
      featured = null,
      urgentOnly = false
    } = options;

    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Ensure proper pagination
      params.append('page', page);
      params.append('limit', limit);
      
      // Calculate offset for server-side pagination (if needed by API)
      // This helps ensure that correct campaigns are fetched for each page
      const offset = (page - 1) * limit;
      params.append('offset', offset);
      
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      if (category && category !== 'All Campaigns') {
        params.append('category', category);
      }

      if (subcategory) {
        params.append('subcategory', subcategory);
      }
      
      // Only append featured flag if explicitly set to true or false
      if (featured !== null) {
        params.append('featured', featured);
      }
      
      if (urgentOnly) {
        params.append('urgentOnly', true);
      }
      
      const response = await axios.get(`${API_URL}/campaigns?${params.toString()}`);
      
      if (response.data.success) {
        // Verify we have the expected pagination structure from the backend
        if (response.data.pagination) {
          // Validate pagination data matches the requested page
          if (response.data.pagination.page !== page) {
            console.warn('Page mismatch in pagination data. Requested:', page, 'Received:', response.data.pagination.page);
          }
        }
        
        // Log retrieved data
        console.log(`Retrieved ${response.data.campaigns ? response.data.campaigns.length : 0} campaigns with featured=${featured}, page=${page}, limit=${limit}`);
        
        return {
          campaigns: response.data.campaigns,
          pagination: response.data.pagination,
          total: response.data.total
        };
      } else {
        throw new Error(response.data.message || 'Failed to load campaigns');
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error loading campaigns",
        description: error.message || "Failed to load campaigns",
        variant: "destructive"
      });
      return { campaigns: [], pagination: null, total: 0 };
    } finally {
      setLoading(false);
    }
  };

  // Get campaign by ID
  const getCampaignById = async (id) => {
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/campaigns/${id}`);
      
      if (response.data.success) {
        return response.data.campaign;
      } else {
        throw new Error(response.data.message || 'Campaign not found');
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast({
        title: "Error loading campaign",
        description: error.message || "Failed to load campaign details",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get campaigns created by the user (protected route)
  const getUserCampaigns = async () => {
    setLoading(true);
    
    try {
      const api = axiosWithAuth();
      const response = await api.get('/campaigns/user/campaigns');
      
      if (response.data.success) {
        return response.data.campaigns;
      } else {
        throw new Error(response.data.message || 'Failed to load campaigns');
      }
    } catch (error) {
      console.error('Error loading user campaigns:', error);
      
      // Handle unauthorized errors
      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your campaigns",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error loading your campaigns",
          description: error.message || "Failed to load your campaigns",
          variant: "destructive"
        });
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new campaign (multipart form data + protected route)
  const createCampaign = async (campaignData) => {
    setLoading(true);
    
    try {
      // Create FormData object for file uploads
      const formData = new FormData();
      
      // Append text fields
      Object.keys(campaignData).forEach(key => {
        if (key !== 'coverImage' && key !== 'additionalImages') {
          formData.append(key, campaignData[key]);
        }
      });
      
      // Append files
      if (campaignData.coverImage) {
        formData.append('coverImage', campaignData.coverImage);
      }
      
      if (campaignData.additionalImages) {
        campaignData.additionalImages.forEach(image => {
          formData.append('additionalImages', image);
        });
      }
      
      const api = axiosWithFormData();
      const response = await api.post('/campaigns', formData);
      
      if (response.data.success) {
        toast({
          title: "Campaign created",
          description: "Your campaign has been successfully created and is pending review.",
        });
        
        return response.data.campaignId;
      } else {
        throw new Error(response.data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      
      // Handle unauthorized errors
      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a campaign",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error creating campaign",
          description: error.message || "Failed to create campaign",
          variant: "destructive"
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Search campaigns by term with advanced options
  const searchCampaigns = async (term, options = {}) => {
    const {
      page = 1,
      limit = 9,
      sortBy = 'score', // Default to relevance for search
      sortOrder = 'desc',
      category = null
    } = options;
    
    setLoading(true);
    
    try {
      // Trim and validate search term
      const trimmedTerm = term.trim();
      if (!trimmedTerm) {
        return { campaigns: [], pagination: null, total: 0 };
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      if (category && category !== 'All Campaigns') {
        params.append('category', category);
      }
      
      // Use the correct API endpoint format that matches the backend controller
      const response = await axios.get(`${API_URL}/campaigns/search/${encodeURIComponent(trimmedTerm)}?${params.toString()}`);
      
      if (response.data.success) {
        return {
          campaigns: response.data.campaigns,
          pagination: response.data.pagination,
          total: response.data.total
        };
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching campaigns:', error);
      toast({
        title: "Error searching campaigns",
        description: error.message || "Failed to search campaigns",
        variant: "destructive"
      });
      return { campaigns: [], pagination: null, total: 0 };
    } finally {
      setLoading(false);
    }
  };

  // Make a donation to a campaign (protected route)
  const makeDonation = async (campaignId, donationData) => {
    setLoading(true);
    
    try {
      const api = axiosWithAuth();
      const response = await api.post('/donations', {
        campaignId,
        ...donationData
      });
      
      if (response.data.success) {
        toast({
          title: "Donation successful",
          description: `Thank you for your donation of Rs. ${donationData.amount.toLocaleString()} to this campaign.`,
        });
        
        return response.data.donation;
      } else {
        throw new Error(response.data.message || 'Failed to process donation');
      }
    } catch (error) {
      console.error('Error processing donation:', error);
      
      // Handle unauthorized errors
      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please log in to make a donation",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Donation failed",
          description: error.message || "There was an error processing your donation",
          variant: "destructive"
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add update to an existing campaign (protected route)
  const addCampaignUpdate = async (campaignId, updateData) => {
    setLoading(true);
    
    try {
      const api = axiosWithAuth();
      const response = await api.post(`/campaigns/${campaignId}/updates`, updateData);
      
      if (response.data.success) {
        toast({
          title: "Update added",
          description: "Your campaign update has been successfully added.",
        });
        
        return response.data.update;
      } else {
        throw new Error(response.data.message || 'Failed to add campaign update');
      }
    } catch (error) {
      console.error('Error adding campaign update:', error);
      
      // Handle unauthorized errors
      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please log in to add campaign updates",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error adding update",
          description: error.message || "Failed to add campaign update",
          variant: "destructive"
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get rotating featured campaigns - Dynamic rotation with offset-based fetching
  const getRotatingFeaturedCampaigns = async (options = {}) => {
    const { 
      offset = 0, // Use offset instead of page for seamless rotation
      category = null,
      strategy = null
    } = options;
    
    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('offset', offset); // Offset-based rotation
      
      if (category && category !== 'All Campaigns') {
        params.append('category', category);
      }
      
      if (strategy) {
        params.append('strategy', strategy);
      }
      
      console.log(`[API] Fetching featured campaigns with offset: ${offset}, category: ${category || 'All'}`);
      
      // Use special endpoint for rotating featured campaigns
      const response = await axios.get(`${API_URL}/campaigns/featured/rotation?${params.toString()}`);
      
      if (response.data.success) {
        console.log(`[API] Received ${response.data.campaigns.length} campaigns, strategy: ${response.data.strategy}`);
        return {
          campaigns: response.data.campaigns,
          total: response.data.total,
          offset: response.data.offset,
          nextOffset: response.data.nextOffset,
          strategy: response.data.strategy,
          hasMore: response.data.hasMore,
          isFallback: response.data.isFallback
        };
      } else {
        throw new Error(response.data.message || 'Failed to load featured campaigns');
      }
    } catch (error) {
      console.error('[API] Error loading rotating featured campaigns:', error);
      toast({
        title: "Error loading featured campaigns",
        description: error.message || "Failed to load featured campaigns",
        variant: "destructive"
      });
      return { campaigns: [], total: 0, offset: 0, nextOffset: 0, strategy: null, hasMore: false, isFallback: false };
    } finally {
      setLoading(false);
    }
  };

  // Get related campaigns for a specific campaign
  const getRelatedCampaigns = async (campaignId, category, limit = 3) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('page', 1);
      params.append('limit', limit);
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', 'desc');
      params.append('exclude', campaignId);
      
      if (category && category !== 'All Campaigns') {
        params.append('category', category);
      }
      
      const response = await axios.get(`${API_URL}/campaigns?${params.toString()}`);
      
      if (response.data.success) {
        // Additional safety filter to ensure current campaign is not included
        const filteredCampaigns = response.data.campaigns.filter(campaign => 
          campaign._id !== campaignId && campaign.id !== campaignId
        );
        return filteredCampaigns.slice(0, limit);
      } else {
        throw new Error(response.data.message || 'Failed to load related campaigns');
      }
    } catch (error) {
      console.error('Error loading related campaigns:', error);
      toast({
        title: "Error loading related campaigns",
        description: error.message || "Failed to load related campaigns",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getAllCampaigns,
    getCampaignById,
    getUserCampaigns,
    createCampaign,
    searchCampaigns,
    makeDonation,
    addCampaignUpdate,
    getRotatingFeaturedCampaigns,
    getRelatedCampaigns
  };
};

export default useCampaigns;
