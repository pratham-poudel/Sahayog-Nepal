/**
 * Blog utility functions for formatting, calculations, and data processing
 * Used across the blog system for consistent functionality
 */

import { format, parseISO, isValid } from 'date-fns';

/**
 * Calculate reading time based on content
 * @param {Array|string} content - Blog content (array of blocks or string)
 * @returns {number} Reading time in minutes
 */
export const calculateReadingTime = (content) => {
  if (!content) return 1;

  let totalWords = 0;
  
  if (Array.isArray(content)) {
    // Handle array format (content blocks)
    content.forEach(block => {
      if (block?.content && typeof block.content === 'string') {
        // Remove HTML tags and count words
        const text = block.content.replace(/<[^>]*>/g, '');
        totalWords += text.split(/\s+/).filter(word => word.length > 0).length;
      }
    });
  } else if (typeof content === 'string') {
    // Handle string format
    const text = content.replace(/<[^>]*>/g, '');
    totalWords = text.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Average reading speed: 200 words per minute
  const readingTime = Math.ceil(totalWords / 200);
  return Math.max(readingTime, 1); // Minimum 1 minute
};

/**
 * Format date consistently across the blog system
 * @param {string|Date} dateString - Date to format
 * @param {string} formatString - Format pattern (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export const formatBlogDate = (dateString, formatString = 'MMM dd, yyyy') => {
  if (!dateString) return 'Unknown date';

  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return 'Invalid date';
    
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Get relative time (e.g., "2 days ago")
 * @param {string|Date} dateString - Date to calculate from
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown';

  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return 'Unknown';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
      return formatBlogDate(date);
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  } catch (error) {
    console.error('Relative time calculation error:', error);
    return 'Unknown';
  }
};

/**
 * Extract excerpt from blog content
 * @param {Array|string} content - Blog content
 * @param {number} maxLength - Maximum excerpt length (default: 150)
 * @returns {string} Generated excerpt
 */
export const generateExcerpt = (content, maxLength = 150) => {
  if (!content) return '';

  let text = '';

  if (Array.isArray(content)) {
    // Find first paragraph or text content
    const textBlock = content.find(block => 
      (block.type === 'paragraph' || block.type === 'text') && block.content
    );
    text = textBlock?.content || '';
  } else if (typeof content === 'string') {
    text = content;
  }

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Truncate if too long
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim();
    // Don't cut words in half
    const lastSpace = text.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      text = text.substring(0, lastSpace);
    }
    text += '...';
  }

  return text.trim();
};

/**
 * Generate SEO-friendly slug from title
 * @param {string} title - Blog title
 * @returns {string} URL-safe slug
 */
export const generateSlug = (title) => {
  if (!title) return '';

  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Sanitize and validate tags
 * @param {Array} tags - Array of tag strings
 * @returns {Array} Cleaned tag array
 */
export const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];

  return tags
    .filter(tag => tag && typeof tag === 'string')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0 && tag.length <= 30)
    .slice(0, 10); // Maximum 10 tags
};

/**
 * Get image URL with fallback and proper folder handling
 * @param {string} imageUrl - Original image URL or filename
 * @param {string} imageType - Type of image ('profile', 'blog', 'campaign', 'general')
 * @param {string} fallbackUrl - Fallback image URL
 * @returns {string} Valid image URL
 */
export const getImageUrl = (imageUrl, imageType = 'general', fallbackUrl = '/images/blog-placeholder.jpg') => {
  if (!imageUrl) return fallbackUrl;
  
  // Handle relative URLs
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Handle MinIO URLs that are already complete
  if (imageUrl.includes('127.0.0.1:9000') || imageUrl.includes('localhost:9000')) {
    return imageUrl;
  }
  
  // Handle full URLs
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Handle filename-only cases with proper folder structure
  if (imageUrl && !imageUrl.includes('/') && !imageUrl.includes('http')) {
    const baseMinioUrl = import.meta.env.VITE_MINIO_URL || 'http://127.0.0.1:9000/mybucket';
    
    // Determine the correct subfolder based on image type
    // Note: VITE_MINIO_URL already includes '/mybucket', so we only add the subfolder
    let subfolder = '';
    switch (imageType) {
      case 'profile':
        subfolder = '/profiles';
        break;
      case 'blog':
      case 'campaign':
        subfolder = '/blogs';
        break;
      default:
        subfolder = '';
        break;
    }
    
    return `${baseMinioUrl}${subfolder}/${imageUrl}`;
  }
  
  return fallbackUrl;
};

/**
 * Optimize image URL for different sizes
 * @param {string} imageUrl - Original image URL
 * @param {string} size - Size variant ('thumb', 'medium', 'large')
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, size = 'medium') => {
  const baseUrl = getImageUrl(imageUrl);
  
  // For now, return the base URL
  // In production, you might want to implement image resizing service
  return baseUrl;
};

/**
 * Get blog category color for consistent theming
 * @param {string} category - Blog category
 * @returns {string} CSS class for category styling
 */
export const getCategoryColor = (category) => {
  const categoryColors = {
    technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    business: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    lifestyle: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
    education: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    health: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    travel: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
    food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  };

  return categoryColors[category?.toLowerCase()] || categoryColors.default;
};

/**
 * Parse and validate blog content
 * @param {Array|string} content - Raw blog content
 * @returns {Array} Validated content blocks
 */
export const parseContent = (content) => {
  if (!content) return [];

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [{ type: 'paragraph', content: content }];
    } catch {
      return [{ type: 'paragraph', content: content }];
    }
  }

  if (Array.isArray(content)) {
    return content.filter(block => block && typeof block === 'object' && block.type);
  }

  return [];
};

/**
 * Generate table of contents from content
 * @param {Array} content - Blog content blocks
 * @returns {Array} Table of contents items
 */
export const generateTableOfContents = (content) => {
  if (!Array.isArray(content)) return [];

  return content
    .filter(block => block.type === 'heading' && block.content)
    .map((block, index) => ({
      id: `heading-${index}`,
      title: block.content.replace(/<[^>]*>/g, ''),
      level: block.level || 2
    }));
};

/**
 * Filter blogs based on search criteria
 * @param {Array} blogs - Array of blog objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered blogs
 */
export const filterBlogs = (blogs, filters) => {
  if (!Array.isArray(blogs)) return [];

  const { search, category, tags, author, status } = filters;

  return blogs.filter(blog => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesTitle = blog.title?.toLowerCase().includes(searchLower);
      const matchesExcerpt = blog.excerpt?.toLowerCase().includes(searchLower);
      const matchesContent = blog.content?.some(block => 
        block.content?.toLowerCase().includes(searchLower)
      );
      
      if (!matchesTitle && !matchesExcerpt && !matchesContent) {
        return false;
      }
    }

    // Category filter
    if (category && category !== 'all') {
      const blogCategory = blog.tags?.find(tag => 
        getCategoryColor(tag) !== getCategoryColor('default')
      );
      if (blogCategory !== category) return false;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      const hasMatchingTag = tags.some(tag => 
        blog.tags?.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Author filter
    if (author) {
      const authorName = typeof blog.author === 'object' 
        ? blog.author.name 
        : blog.author;
      if (!authorName?.toLowerCase().includes(author.toLowerCase())) {
        return false;
      }
    }

    // Status filter
    if (status && status !== 'all') {
      if (blog.status !== status) return false;
    }

    return true;
  });
};

/**
 * Sort blogs by specified criteria
 * @param {Array} blogs - Array of blog objects
 * @param {string} sortBy - Sort criteria ('newest', 'oldest', 'popular', 'alphabetical')
 * @returns {Array} Sorted blogs
 */
export const sortBlogs = (blogs, sortBy = 'newest') => {
  if (!Array.isArray(blogs)) return [];

  const sorted = [...blogs];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt));
    
    case 'popular':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    
    case 'alphabetical':
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    
    default:
      return sorted;
  }
};

/**
 * Get popular tags from blog array
 * @param {Array} blogs - Array of blog objects
 * @param {number} limit - Maximum number of tags to return
 * @returns {Array} Popular tags with counts
 */
export const getPopularTags = (blogs, limit = 10) => {
  if (!Array.isArray(blogs)) return [];

  const tagCounts = {};

  blogs.forEach(blog => {
    if (Array.isArray(blog.tags)) {
      blog.tags.forEach(tag => {
        if (tag && typeof tag === 'string') {
          const cleanTag = tag.trim().toLowerCase();
          tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
        }
      });
    }
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export default {
  calculateReadingTime,
  formatBlogDate,
  getRelativeTime,
  generateExcerpt,
  generateSlug,
  sanitizeTags,
  getImageUrl,
  getOptimizedImageUrl,
  getCategoryColor,
  parseContent,
  generateTableOfContents,
  filterBlogs,
  sortBlogs,
  getPopularTags
};
