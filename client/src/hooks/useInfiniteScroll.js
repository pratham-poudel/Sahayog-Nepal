import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for infinite scroll pagination
 * @param {Function} fetchFunction - The function to fetch data (should accept page and limit params)
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Items per page (default: 10)
 * @param {Array} options.dependencies - Dependencies to trigger reset (default: [])
 * @param {boolean} options.enabled - Whether to enable the hook (default: true)
 * @returns {Object} - { data, loading, hasMore, loadMore, error, reset, page }
 */
export const useInfiniteScroll = (fetchFunction, options = {}) => {
  const {
    limit = 10,
    dependencies = [],
    enabled = true
  } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Use ref to prevent duplicate calls
  const isFetching = useRef(false);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore || isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      const response = await fetchFunction(page, limit);
      
      if (response && response.data) {
        const newData = Array.isArray(response.data) ? response.data : [];
        
        setData(prevData => {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(prevData.map(item => item._id || item.id));
          const uniqueNewData = newData.filter(item => !existingIds.has(item._id || item.id));
          return [...prevData, ...uniqueNewData];
        });

        // Check if there's more data
        const total = response.total || response.totalCount || 0;
        const currentTotal = data.length + newData.length;
        setHasMore(currentTotal < total);
        setTotalCount(total);

        // Increment page for next call
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more data:', err);
      setError(err.message || 'Failed to load data');
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [enabled, loading, hasMore, page, limit, fetchFunction, data.length]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotalCount(0);
    isFetching.current = false;
  }, []);

  // Auto-load first page when enabled or dependencies change
  useEffect(() => {
    if (enabled) {
      reset();
    }
  }, [enabled, ...dependencies]);

  // Load first page after reset
  useEffect(() => {
    if (enabled && page === 1 && data.length === 0 && !loading && !isFetching.current) {
      loadMore();
    }
  }, [enabled, page, data.length, loading, loadMore]);

  return {
    data,
    loading,
    hasMore,
    loadMore,
    error,
    reset,
    page,
    totalCount
  };
};

/**
 * Hook for detecting when user scrolls near bottom
 * @param {Function} callback - Function to call when near bottom
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Distance from bottom to trigger (default: 100px)
 * @param {boolean} options.enabled - Whether to enable the hook (default: true)
 */
export const useScrollListener = (callback, options = {}) => {
  const { threshold = 100, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold, enabled]);
};

export default useInfiniteScroll;
