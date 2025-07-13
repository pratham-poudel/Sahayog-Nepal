import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Eye, Clock, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { formatBlogDate, getImageUrl } from '../../utils/blogUtils';

const BlogSidebar = ({ recentBlogs = [], popularBlogs = [], categories = [], tags = [] }) => {
  const sidebarVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const SidebarCard = ({ children, title, icon: Icon }) => (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );

  const BlogMiniCard = ({ blog, showViews = false }) => (
    <motion.div
      whileHover={{ x: 5 }}
      className="group flex space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
    >
      <div className="flex-shrink-0">
        <Link href={`/blog/${blog.slug}`}>
          <img
            src={getImageUrl(blog.coverImage, 'blog')}
            alt={blog.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </Link>
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/blog/${blog.slug}`}>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 mb-1">
            {blog.title}
          </h4>
        </Link>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatBlogDate(blog.publishedAt || blog.createdAt)}</span>
          </div>
          {showViews && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{blog.views || 0}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Recent Posts */}
      {recentBlogs.length > 0 && (
        <SidebarCard title="Recent Posts" icon={Clock}>
          <div className="space-y-2">
            {recentBlogs.slice(0, 4).map((blog, index) => (
              <BlogMiniCard key={blog._id || index} blog={blog} />
            ))}
          </div>
          <Link href="/blog">
            <motion.button
              whileHover={{ x: 5 }}
              className="w-full mt-4 flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            >
              <span>View All Posts</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </SidebarCard>
      )}

      {/* Popular Posts */}
      {popularBlogs.length > 0 && (
        <SidebarCard title="Popular Posts" icon={TrendingUp}>
          <div className="space-y-2">
            {popularBlogs.slice(0, 4).map((blog, index) => (
              <BlogMiniCard key={blog._id || index} blog={blog} showViews />
            ))}
          </div>
        </SidebarCard>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <SidebarCard title="Categories" icon={TrendingUp}>
          <div className="space-y-2">
            {categories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category.name || index}
                whileHover={{ x: 5 }}
                className="flex items-center justify-between"
              >
                <Link
                  href={`/blog?category=${encodeURIComponent(category.name)}`}
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm"
                >
                  {category.name}
                </Link>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {category.count || 0}
                </span>
              </motion.div>
            ))}
          </div>
        </SidebarCard>
      )}      {/* Popular Tags */}
      {tags.length > 0 && (
        <SidebarCard title="Popular Tags" icon={TrendingUp}>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 12).map((tag, index) => {
              // Handle both {name, count} and {tag, count} formats
              const tagName = tag.name || tag.tag || tag;
              const tagKey = `tag-${index}-${tagName}`;
              
              return (
                <Link
                  key={tagKey}
                  href={`/blog?tag=${encodeURIComponent(tagName)}`}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                  >
                    #{tagName}
                  </motion.span>
                </Link>
              );
            })}
          </div>
        </SidebarCard>
      )}

      {/* Newsletter Signup */}
      <SidebarCard title="Stay Updated" icon={TrendingUp}>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Subscribe to our newsletter for the latest updates and insights.
          </p>
          <form className="space-y-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-gray-900 dark:text-white text-sm"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Subscribe
            </motion.button>
          </form>
        </div>
      </SidebarCard>

      {/* Social Media Links */}
      <SidebarCard title="Follow Us" icon={TrendingUp}>
        <div className="flex justify-center space-x-4">
          {[
            { name: 'Twitter', icon: '🐦', url: 'https://twitter.com' },
            { name: 'Facebook', icon: '📘', url: 'https://facebook.com' },
            { name: 'Instagram', icon: '📷', url: 'https://instagram.com' },
            { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com' }
          ].map((social, index) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center text-lg transition-all duration-200"
              title={social.name}
            >
              {social.icon}
            </motion.a>
          ))}
        </div>
      </SidebarCard>
    </motion.aside>
  );
};

export default BlogSidebar;
