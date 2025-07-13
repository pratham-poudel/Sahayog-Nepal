import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Clock, Eye, Calendar, User, ArrowRight } from 'lucide-react';
import { formatBlogDate, getImageUrl } from '../../utils/blogUtils';

const BlogCard = ({ blog, index = 0, variant = 'default' }) => {
  const isLarge = variant === 'large';
  const isHorizontal = variant === 'horizontal';
  
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut"
      }
    }
  };

  const imageHoverVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  if (isHorizontal) {
    return (
      <motion.article
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -2 }}
        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/5 relative overflow-hidden">
            <Link href={`/blog/${blog.slug}`}>
              <motion.div
                className="relative h-64 md:h-full"
                variants={imageHoverVariants}
                whileHover="hover"
              >
                <img
                  src={getImageUrl(blog.coverImage, 'blog')}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            </Link>
            {blog.featured && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Featured
              </div>
            )}
          </div>
          
          <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags?.slice(0, 2).map((tag, index) => (
                  <Link
                    key={index}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-block"
                  >
                    <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
              
              <Link href={`/blog/${blog.slug}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 mb-3">
                  {blog.title}
                </h2>
              </Link>
              
              <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                {blog.excerpt}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{blog.readTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{blog.views || 0}</span>
                  </div>
                </div>                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatBlogDate(blog.publishedAt || blog.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={getImageUrl(blog.author?.profilePicture, 'profile', `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author?.name || 'Anonymous')}&background=ef4444&color=fff`)}
                    alt={blog.author?.name || 'Anonymous'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {blog.author?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Author
                    </p>
                  </div>
                </div>
                
                <Link href={`/blog/${blog.slug}`}>
                  <motion.button
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm group"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 ${
        isLarge ? 'md:col-span-2' : ''
      }`}
    >
      <div className="relative overflow-hidden">
        <Link href={`/blog/${blog.slug}`}>
          <motion.div
            className={`relative ${isLarge ? 'h-80' : 'h-56'}`}
            variants={imageHoverVariants}
            whileHover="hover"
          >
            <img
              src={getImageUrl(blog.coverImage, 'blog')}
              alt={blog.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </motion.div>
        </Link>
        
        {blog.featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Featured
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
          <div className="flex flex-wrap gap-2">
            {blog.tags?.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          <Link href={`/blog/${blog.slug}`}>
            <h3 className={`font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 ${
              isLarge ? 'text-2xl' : 'text-xl'
            }`}>
              {blog.title}
            </h3>
          </Link>
          
          <p className="text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
            {blog.excerpt}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <img
                src={getImageUrl(blog.author?.profilePicture, 'profile', `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author?.name || 'Anonymous')}&background=ef4444&color=fff`)}
                alt={blog.author?.name || 'Anonymous'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {blog.author?.name || 'Anonymous'}
                </p>                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatBlogDate(blog.publishedAt || blog.createdAt)}</span>
                  <span>•</span>
                  <span>{blog.readTime} min read</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Eye className="w-4 h-4" />
              <span>{blog.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
