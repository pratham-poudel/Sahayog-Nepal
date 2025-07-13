import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '../utils/constants';
import { MINIO_URL } from '../config/index.js';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import BlogCard from '../components/blog/BlogCard';
import BlogSidebar from '../components/blog/BlogSidebar';
import { 
  formatBlogDate, 
  getRelativeTime, 
  calculateReadingTime, 
  generateTableOfContents,
  getImageUrl,
  getCategoryColor
} from '../utils/blogUtils';
import { 
  FiClock, 
  FiEye, 
  FiShare2, 
  FiBookmark, 
  FiArrowLeft,
  FiArrowUp,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiCopy,
  FiCheck
} from 'react-icons/fi';
import { RiTwitterXFill, RiFacebookFill, RiInstagramLine, RiLinkedinFill } from 'react-icons/ri';


const BlogDetail = () => {
  const { slug } = useParams();
  const [location, setLocation] = useLocation();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tableOfContents, setTableOfContents] = useState([]);
  const { toast } = useToast();
  
  // References for scroll tracking
  const articleRef = useRef(null);
  const sectionRefs = useRef({});
  const heroRef = useRef(null);
    // Handle scroll for reading progress and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate reading progress
      if (articleRef.current) {
        const articleTop = articleRef.current.offsetTop;
        const articleHeight = articleRef.current.scrollHeight;
        const progress = Math.min(100, Math.max(0, 
          ((scrollTop - articleTop + windowHeight) / articleHeight) * 100
        ));
        setReadingProgress(progress);
      }
      
      // Show/hide scroll to top button
      setShowScrollTop(scrollTop > 500);
      
      // Update active section for table of contents
      const sections = Object.keys(sectionRefs.current);
      for (const section of sections) {
        const element = sectionRefs.current[section];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate table of contents when blog loads
  useEffect(() => {
    if (blog?.content) {
      const toc = generateTableOfContents(blog.content);
      setTableOfContents(toc);
    }
  }, [blog]);

  // Fetch blog data and related content
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch main blog
        const blogResponse = await axios.get(`${API_URL}/blogs/${slug}`);
        
        if (!blogResponse.data.success) {
          throw new Error('Blog not found');
        }
        
        const fetchedBlog = blogResponse.data.blog;
        setBlog(fetchedBlog);
        
        // Increment view count (fire and forget)
        axios.post(`${API_URL}/blogs/views/${fetchedBlog._id}`).catch(console.error);
        
        // Fetch related blogs in parallel
        const relatedPromise = axios.get(`${API_URL}/blogs/related/${slug}?limit=6`)
          .then(response => {
            if (response.data.success) {
              setRelatedBlogs(response.data.blogs);
            }
          })
          .catch(error => {
            console.error('Failed to fetch related blogs:', error);
            setRelatedBlogs([]);
          });
        
        await relatedPromise;
        
      } catch (error) {
        console.error('Error fetching blog:', error);
        setError(error.response?.status === 404 
          ? 'Blog post not found' 
          : 'Failed to load blog post'
        );
        
        // Redirect to blogs page after delay if not found
        if (error.response?.status === 404) {
          setTimeout(() => setLocation('/blog'), 3000);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (slug) {
      fetchBlogData();
    }
  }, [slug, setLocation]);
    // Share functionality
  const handleShare = (platform) => {
    const url = window.location.href;
    const title = blog.title;
    const text = blog.excerpt || `Check out this article: ${title}`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: url
    };
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        toast({
          title: "Link copied!",
          description: "Blog link has been copied to clipboard",
        });
      });
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    
    setShareMenuOpen(false);
  };

  // Bookmark functionality
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      description: isBookmarked 
        ? "Blog removed from your reading list" 
        : "Blog saved to your reading list",
    });
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
    // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Hero skeleton */}
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse mb-8"></div>
            
            {/* Content skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 max-w-md mx-auto"
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error.includes('not found') 
              ? "The blog post you're looking for doesn't exist or has been moved."
              : "We're having trouble loading this blog post. Please try again."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/blog">
              <button className="px-6 py-3 bg-[#8B2325] text-white rounded-xl font-medium hover:bg-[#a32729] transition-colors">
                <FiArrowLeft className="inline-block mr-2 h-4 w-4" />
                Back to Blogs
              </button>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!blog) return null;
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Reading Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-[#8B2325] to-[#a32729]"
        style={{ width: `${readingProgress}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${readingProgress}%` }}
        transition={{ duration: 0.1 }}
      />

      {/* Floating Action Buttons */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 space-y-3">
        {/* Share Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="w-12 h-12 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center border border-gray-200 dark:border-gray-700"
          >
            <FiShare2 className="h-5 w-5" />
          </motion.button>
          
          <AnimatePresence>
            {shareMenuOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                className="absolute right-16 top-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex space-x-2"
              >
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <FiTwitter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <FiFacebook className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-10 h-10 bg-blue-700 text-white rounded-lg flex items-center justify-center hover:bg-blue-800 transition-colors"
                >
                  <FiLinkedin className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-10 h-10 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  {copySuccess ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bookmark Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmark}
          className={`w-12 h-12 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center border transition-colors ${
            isBookmarked
              ? 'bg-[#8B2325] text-white border-[#8B2325]'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
          }`}
        >
          <FiBookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </motion.button>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-[#8B2325] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <FiArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] max-h-[700px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
        <motion.img 
          src={getImageUrl(blog.coverImage)}
          alt={blog.title}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="container mx-auto px-4 pb-16">
            <div className="max-w-4xl">
              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <Link href="/blog">
                  <button className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                    <FiArrowLeft className="h-4 w-4" />
                    Back to Blog
                  </button>
                </Link>
              </motion.div>
              
              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 flex flex-wrap gap-2"
              >
                {blog.tags?.map(tag => (
                  <Link key={tag} href={`/blog?category=${tag}`}>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${getCategoryColor(tag)} backdrop-blur-sm`}>
                      {tag}
                    </span>
                  </Link>
                ))}
              </motion.div>
              
              {/* Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                {blog.title}
              </motion.h1>
              
              {/* Author and Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-4 text-white/90"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={getImageUrl(blog.author?.profilePicture, 'https://ui-avatars.com/api/?name=' + encodeURIComponent(blog.author?.name || 'Anonymous'))}
                    alt={blog.author?.name || 'Anonymous'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                  <div>
                    <div className="font-semibold">{blog.author?.name || 'Anonymous'}</div>
                    <div className="text-sm text-white/70">
                      {blog.author?.title || 'Contributor'}
                    </div>
                  </div>
                </div>
                
                <div className="w-px h-12 bg-white/20"></div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <FiClock className="h-4 w-4" />
                    {calculateReadingTime(blog.content)} min read
                  </div>
                  <div className="flex items-center gap-1">
                    <FiEye className="h-4 w-4" />
                    {blog.views || 0} views
                  </div>
                  <div>
                    {formatBlogDate(blog.publishedAt || blog.createdAt)}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full fill-gray-50 dark:fill-gray-900">
            <path d="M0,96L60,112C120,128,240,160,360,160C480,160,600,128,720,128C840,128,960,160,1080,165.3C1200,171,1320,149,1380,138.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>
      </section>      {/* Main Content Area */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
            
            {/* Table of Contents Sidebar */}
            {tableOfContents.length > 0 && (
              <aside className="hidden lg:block lg:w-80">
                <div className="sticky top-24 space-y-6">
                  {/* Table of Contents */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-[#8B2325] rounded-full"></div>
                      Table of Contents
                    </h3>
                    <nav className="space-y-2">
                      {tableOfContents.map((section, index) => (
                        <motion.button
                          key={section.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                          onClick={() => scrollToSection(section.id)}
                          className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-all duration-200 ${
                            activeSection === section.id 
                              ? "bg-[#8B2325]/10 text-[#8B2325] dark:text-[#a32729] font-medium border-l-2 border-[#8B2325]"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {section.title}
                        </motion.button>
                      ))}
                    </nav>
                  </motion.div>

                  {/* Newsletter Subscription */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-gradient-to-br from-[#8B2325] to-[#a32729] rounded-2xl p-6 text-white"
                  >
                    <h4 className="font-bold mb-2">Stay Updated</h4>
                    <p className="text-sm text-white/80 mb-4">
                      Get the latest blog posts and updates delivered to your inbox.
                    </p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                      <button className="w-full bg-white text-[#8B2325] font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Subscribe
                      </button>
                    </div>
                  </motion.div>
                </div>
              </aside>
            )}
            
            {/* Main Article Content */}
            <main className="flex-1" ref={articleRef}>
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                
                {/* Article Excerpt */}
                {blog.excerpt && (
                  <div className="p-8 md:p-12 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-start gap-4">
                      <div className="w-1 h-16 bg-[#8B2325] rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <h2 className="text-sm font-semibold text-[#8B2325] dark:text-[#a32729] mb-2 uppercase tracking-wide">
                          Summary
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed font-light italic">
                          {blog.excerpt}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Article Body */}
                <div className="p-8 md:p-12">
                  <div className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-[#8B2325] dark:prose-a:text-[#a32729] prose-strong:text-gray-900 dark:prose-strong:text-white">
                    {blog.content?.map((block, index) => {
                      const sectionId = block.type === 'heading' ? `section-${index}` : null;
                      
                      switch (block.type) {
                        case 'paragraph':
                          return (
                            <motion.p 
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="mb-6 text-base md:text-lg leading-relaxed"
                            >
                              {block.content}
                            </motion.p>
                          );
                          
                        case 'heading':
                          return (
                            <motion.h2 
                              key={index}
                              id={sectionId}
                              ref={el => sectionRefs.current[sectionId] = el}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-16 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700 first:mt-0"
                            >
                              {block.content}
                            </motion.h2>
                          );
                          
                        case 'subheading':
                          return (
                            <motion.h3 
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-12 mb-4"
                            >
                              {block.content}
                            </motion.h3>
                          );
                          
                        case 'image':
                          return (
                            <motion.figure 
                              key={index}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                              className="my-12"
                            >
                              <div className="overflow-hidden rounded-2xl shadow-2xl">
                                <img 
                                  src={getImageUrl(block.url)} 
                                  alt={block.caption || 'Blog image'} 
                                  className="w-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                              </div>
                              {block.caption && (
                                <figcaption className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                                  {block.caption}
                                </figcaption>
                              )}
                            </motion.figure>
                          );
                          
                        case 'quote':
                          return (
                            <motion.blockquote 
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="my-8 pl-6 border-l-4 border-[#8B2325] bg-gray-50 dark:bg-gray-700/50 p-6 rounded-r-xl"
                            >
                              <p className="text-lg italic text-gray-700 dark:text-gray-300 mb-2">
                                "{block.content}"
                              </p>
                              {block.author && (
                                <cite className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  — {block.author}
                                </cite>
                              )}
                            </motion.blockquote>
                          );
                          
                        case 'list':
                          return (
                            <motion.ul 
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="my-6 space-y-2 list-disc list-inside"
                            >
                              {Array.isArray(block.items) ? block.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="text-gray-700 dark:text-gray-300">
                                  {item}
                                </li>
                              )) : null}
                            </motion.ul>
                          );
                          
                        case 'code':
                          return (
                            <motion.pre 
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="my-6 bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto"
                            >
                              <code>{block.content}</code>
                            </motion.pre>
                          );
                          
                        default:
                          return (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="my-4"
                            >
                              {block.content}
                            </motion.div>
                          );
                      }
                    })}
                  </div>
                </div>
                
                {/* Article Footer */}
                <footer className="border-t border-gray-200 dark:border-gray-700 p-8 md:p-12 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    {/* Author Info */}
                    <div className="flex items-center gap-4">
                      <img 
                        src={getImageUrl(blog.author?.profilePicture, 'https://ui-avatars.com/api/?name=' + encodeURIComponent(blog.author?.name || 'Anonymous'))}
                        alt={blog.author?.name || 'Anonymous'}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Written by {blog.author?.name || 'Anonymous'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {blog.author?.bio || 'Contributing author'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Published {getRelativeTime(blog.publishedAt || blog.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Share Buttons */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Share:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          <FiTwitter className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                        >
                          <FiFacebook className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                        >
                          <FiLinkedin className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          {copySuccess ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
              </motion.article>
            </main>

            {/* Right Sidebar */}
            <aside className="lg:w-80">
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <BlogSidebar 
                    recentPosts={relatedBlogs.slice(0, 3)}
                    popularPosts={relatedBlogs.slice(3, 6)}
                    categories={blog.tags || []}
                    popularTags={blog.tags || []}
                    compact={true}
                  />
                </motion.div>
              </div>
            </aside>
          </div>
        </div>      </section>

      {/* Related Blogs Section */}
      {relatedBlogs.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-800/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-7xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  You May Also Like
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Discover more insightful articles on similar topics
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedBlogs.map((related, index) => (
                  <motion.div
                    key={related._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  >
                    <BlogCard 
                      blog={related} 
                      variant="default"
                      showExcerpt={true}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-gradient-to-r from-[#8B2325] to-[#a32729] rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-20">
                <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="absolute h-full w-full">
                  <path d="M488.5,274.5Q488,299,469.5,318Q451,337,435,359Q419,381,394,397.5Q369,414,345,423Q321,432,287,431.5Q253,431,225,423.5Q197,416,173.5,401Q150,386,131,368.5Q112,351,92.5,331.5Q73,312,63,291Q53,270,37.5,241Q22,212,22.5,185Q23,158,29.5,124.5Q36,91,71,79Q106,67,134,54Q162,41,193,25.5Q224,10,254,21.5Q284,33,312,48.5Q340,64,363.5,84Q387,104,415,120.5Q443,137,455.5,164Q468,191,478.5,220Q489,249,488.5,274.5Z" fill="currentColor" />
                </svg>
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center">
                <div className="md:w-2/3 mb-8 md:mb-0 md:pr-8">
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-6 leading-tight">
                    Share Your Knowledge & Earn Rewards
                  </h3>
                  <p className="text-white/90 mb-8 max-w-2xl text-base md:text-lg leading-relaxed">
                    Join our community of writers and make an impact. Write your own blog on crowdfunding and social impact topics.
                    Get published, build your portfolio, and earn up to NPR 1,000 per accepted article.
                  </p>
                  <Link href="/blog/write">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center bg-white text-[#8B2325] font-semibold px-8 py-4 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <span>Start Writing Today</span>
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </motion.div>
                  </Link>
                </div>
                <div className="md:w-1/3 flex justify-center">
                  <div className="w-56 h-56 bg-white/10 rounded-full flex items-center justify-center">
                    <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-40 h-40 bg-white/30 rounded-full flex items-center justify-center">
                        <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BlogDetail; 