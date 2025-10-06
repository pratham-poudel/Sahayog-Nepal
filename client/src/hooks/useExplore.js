import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { API_URL as CONFIG_API_URL } from '../config/index.js';

// API base URL
const API_URL = `${CONFIG_API_URL}/api`;

const useExplore = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const searchTimeoutRef = useRef(null);

  /**
   * Get campaigns for Regular tab
   * Uses smart algorithm to mix different types of campaigns
   */
  const getRegularCampaigns = async (options = {}) => {
    const { 
      page = 1,
      limit = 12,
      category = null,
      subcategory = null,
      search = null,
      sortBy = 'smart' // smart, newest, endingSoon, leastFunded, mostFunded
    } = options;

    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sortBy', sortBy);
      
      if (category && category !== 'All Campaigns') {
        params.append('category', category);
      }
      if (subcategory) {
        params.append('subcategory', subcategory);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await axios.get(`${API_URL}/explore/regular?${params.toString()}`);
      
      if (response.data.success) {
        return {
          campaigns: response.data.campaigns || [],
          pagination: response.data.pagination,
          total: response.data.total,
          debug: response.data.debug
        };
      } else {
        throw new Error(response.data.message || 'Failed to load campaigns');
      }
    } catch (error) {
      console.error('Error loading regular campaigns:', error);
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

  /**
   * Get campaigns for Urgent tab
   * Shows only campaigns with "Urgent" tag, sorted by urgency
   */
  const getUrgentCampaigns = async (options = {}) => {
    const { 
      page = 1,
      limit = 12,
      category = null,
      subcategory = null,
      search = null,
      sortBy = 'urgency' // urgency, newest, endingSoon, leastFunded, mostFunded
    } = options;

    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sortBy', sortBy);
      
      if (category && category !== 'All Campaigns') {
        params.append('category', category);
      }
      if (subcategory) {
        params.append('subcategory', subcategory);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await axios.get(`${API_URL}/explore/urgent?${params.toString()}`);
      
      if (response.data.success) {
        return {
          campaigns: response.data.campaigns || [],
          pagination: response.data.pagination,
          total: response.data.total
        };
      } else {
        throw new Error(response.data.message || 'Failed to load urgent campaigns');
      }
    } catch (error) {
      console.error('Error loading urgent campaigns:', error);
      toast({
        title: "Error loading urgent campaigns",
        description: error.message || "Failed to load urgent campaigns",
        variant: "destructive"
      });
      return { campaigns: [], pagination: null, total: 0 };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Debounced search function
   * Waits 500ms after user stops typing before making API call
   */
  const debouncedSearch = useCallback((fetchFunction, options) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout - 500ms delay
    return new Promise((resolve) => {
      searchTimeoutRef.current = setTimeout(async () => {
        const result = await fetchFunction(options);
        resolve(result);
      }, 500);
    });
  }, []);

  /**
   * Cancel any pending debounced search
   */
  const cancelDebouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  return {
    loading,
    getRegularCampaigns,
    getUrgentCampaigns,
    debouncedSearch,
    cancelDebouncedSearch
  };
};

export default useExplore;
