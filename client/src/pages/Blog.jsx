import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '../utils/constants';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Pagination from '../components/shared/Pagination';
import BlogCard from '../components/blog/BlogCard';
import BlogFilters from '../components/blog/BlogFilters';
import BlogSidebar from '../components/blog/BlogSidebar';
import SEO from '../utils/seo';
import { filterBlogs, sortBlogs, getPopularTags } from '../utils/blogUtils';
import { performanceMetrics } from '../utils/performanceTest';
import { FiEdit, FiTrendingUp, FiGrid, FiList } from 'react-icons/fi';

const Blog = () => {
  // State management
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  console.log('Blog component rendering...');
  
  // Filter and display states
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    tags: [],
    sortBy: 'newest'
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(9);
  
  // Sidebar data
  const [sidebarData, setSidebarData] = useState({
    recentPosts: [],
    popularPosts: [],
    categories: [],
    popularTags: []
  });
    // Parse query parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = searchParams.get('category');
    const searchFromUrl = searchParams.get('search');
    const pageFromUrl = searchParams.get('page');
    const sortFromUrl = searchParams.get('sort');
    
    // Set initial states from URL if present
    setFilters(prev => ({
      ...prev,
      category: categoryFromUrl || 'all',
      search: searchFromUrl || '',
      sortBy: sortFromUrl || 'newest'
    }));
    
    if (pageFromUrl) {
      setCurrentPage(parseInt(pageFromUrl, 10));
    }
    
    // Fetch blogs with the parameters from URL
    fetchBlogs();
  }, [location]);
    // Update URL whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.category !== 'all') {
      params.set('category', filters.category);
    }
    
    if (filters.search) {
      params.set('search', filters.search);
    }
    
    if (filters.sortBy !== 'newest') {
      params.set('sort', filters.sortBy);
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage);
    }
    
    const newUrl = params.toString() ? `/blog?${params.toString()}` : '/blog';
    
    // Don't trigger unnecessary navigation if URL hasn't changed
    if (location !== newUrl) {
      setLocation(newUrl, { replace: true });
    }
  }, [filters, currentPage]);

  // Apply filters and sorting whenever blogs or filters change
  useEffect(() => {
    if (blogs.length > 0) {
      const filtered = filterBlogs(blogs, filters);
      const sorted = sortBlogs(filtered, filters.sortBy);
      setFilteredBlogs(sorted);
      setTotalPages(Math.ceil(sorted.length / pageSize));
      
      // Reset to page 1 if current page is beyond total pages
      if (currentPage > Math.ceil(sorted.length / pageSize)) {
        setCurrentPage(1);
      }
    }
  }, [blogs, filters, pageSize, currentPage]);  const fetchBlogs = async () => {
    const performanceTracker = performanceMetrics.trackAPICall(
      async () => {
        const response = await axios.get(`${API_URL}/blogs?limit=100&status=published`);
        return response;
      },
      'fetchBlogs'
    );

    try {
      setIsLoading(true);
      console.log('Fetching blogs from:', `${API_URL}/blogs?limit=100&status=published`);
      
      const { result: response } = await performanceTracker;
        if (response.data.success) {
        const allBlogs = response.data.blogs || [];
        console.log('Fetched blogs:', allBlogs.length, allBlogs);
        setBlogs(allBlogs);
        
        // Prepare sidebar data
        const popularTags = getPopularTags(allBlogs, 10);
        const recentPosts = [...allBlogs]
          .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
          .slice(0, 5);
        const popularPosts = [...allBlogs]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5);
        
        // Extract unique categories from tags
        const categorySet = new Set();
        allBlogs.forEach(blog => {
          if (Array.isArray(blog.tags)) {
            blog.tags.forEach(tag => categorySet.add(tag));
          }
        });
        const categories = Array.from(categorySet).slice(0, 10);
          setSidebarData({
          recentPosts,
          popularPosts,
          categories,
          popularTags
        });
      } else {
        console.log('API response not successful:', response.data);
        setError('Failed to fetch blogs');
        toast({
          title: "Error",
          description: 'Failed to fetch blogs',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      console.error('Error details:', error.response?.data);
      setError('An error occurred while fetching blogs');
      toast({
        title: "Error",
        description: 'An error occurred while fetching blogs',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get paginated blogs
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );  return (
    <>
      <SEO 
        title="Blog - Stories of Impact & Change"
        description="Discover inspiring stories, expert insights, and community journeys that are transforming lives across Nepal and beyond. Read about successful campaigns, social impact, and community development initiatives."
        keywords="Nepal blog, social impact stories, crowdfunding success, community development, charity stories, Nepal community, social change, fundraising insights"
        ogImage="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
        ogUrl={`${window.location.origin}/blog`}
      />
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "NepalCrowdRise Blog",
            "description": "Stories of impact and change from Nepal's leading crowdfunding platform",
            "url": `${window.location.origin}/blog`,
            "publisher": {
              "@type": "Organization",
              "name": "NepalCrowdRise",
              "url": window.location.origin
            },
            "blogPost": blogs.slice(0, 10).map(blog => ({
              "@type": "BlogPosting",
              "headline": blog.title,
              "description": blog.excerpt,
              "url": `${window.location.origin}/blog/${blog.slug}`,
              "datePublished": blog.publishedAt || blog.createdAt,
              "author": {
                "@type": "Person",
                "name": blog.author?.name || "Anonymous"
              }
            }))
          })
        }}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Modern Hero Section */}
      <section className="relative bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#b12a2c] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/50 to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <FiTrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white/80" />
              <span className="text-white/80 font-medium text-sm sm:text-base">NepalCrowdRise Blog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Stories of 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                Impact & Change
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-10 max-w-2xl text-white/90 leading-relaxed">
              Discover inspiring stories, expert insights, and community journeys that are 
              transforming lives across Nepal and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/blog/write">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#8B2325] font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FiEdit className="h-5 w-5" />
                  Share Your Story
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('blog-content')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                Explore Blogs
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section id="blog-content" className="container mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Content Area */}
          <main className="flex-1" role="main">
            {/* Filters and Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 sm:mb-12"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Latest Articles
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    {filteredBlogs.length} article{filteredBlogs.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-4">
                  <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'grid'
                          ? 'bg-[#8B2325] text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <FiGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      aria-label="List view"
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'list'
                          ? 'bg-[#8B2325] text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <FiList className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Blog Filters Component */}
              <BlogFilters
                availableTags={sidebarData.popularTags.map(tagObj => 
                  typeof tagObj === 'string' ? tagObj : tagObj.tag
                )}
                activeFilter={filters.category}
                onFilterChange={(category) => handleFiltersChange({ category })}
                searchTerm={filters.search}
                onSearchChange={(search) => handleFiltersChange({ search })}
                onSearch={(e) => {
                  e.preventDefault();
                  // Search is handled by the onSearchChange above
                }}
              />
            </motion.div>            {/* Content Area */}
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <div className="text-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading amazing stories...</p>
                </div>
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                  <button
                    onClick={fetchBlogs}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B2325] text-white rounded-xl hover:bg-[#a32729] transition-colors font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            ) : filteredBlogs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No blogs found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {filters.search
                      ? `No results for "${filters.search}"`
                      : filters.category !== 'all'
                      ? `No blogs in "${filters.category}" category`
                      : 'There are no blogs published yet'}
                  </p>
                  {(filters.search || filters.category !== 'all' || filters.tags.length > 0) && (
                    <button
                      onClick={() => handleFiltersChange({ search: '', category: 'all', tags: [] })}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                {/* Blog Grid/List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'
                      : 'space-y-6 lg:space-y-8'
                  }
                >
                  {paginatedBlogs.map((blog, index) => (
                    <motion.div
                      key={blog._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <BlogCard 
                        blog={blog} 
                        variant={viewMode === 'list' ? 'horizontal' : 'default'}
                      />
                    </motion.div>
                  ))}
                </motion.div>
                
                {/* Pagination */}
                {Math.ceil(filteredBlogs.length / pageSize) > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-16 flex justify-center"
                  >
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredBlogs.length / pageSize)}
                      onPageChange={handlePageChange}
                    />
                  </motion.div>
                )}
              </>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >              <BlogSidebar                recentBlogs={sidebarData.recentPosts}
                popularBlogs={sidebarData.popularPosts}
                categories={sidebarData.categories.map(cat => ({ name: cat, count: 0 }))}
                tags={sidebarData.popularTags.map(tagObj => ({ 
                  name: typeof tagObj === 'string' ? tagObj : tagObj.tag, 
                  count: typeof tagObj === 'object' ? tagObj.count : 0 
                }))}
              />
            </motion.div>
          </aside>        </div>
      </section>
    </div>
    </>
  );
};

export default Blog;