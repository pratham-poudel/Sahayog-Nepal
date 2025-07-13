import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' 
          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
      }`}
      whileTap={{ scale: 0.92 }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="sr-only">Toggle theme</span>
      
      <div className="relative w-5 h-5 overflow-hidden">
        {/* Sun icon for dark mode */}
        <motion.svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 absolute inset-0"
          initial={theme === 'dark' ? { rotate: -30, opacity: 0 } : { rotate: 0, opacity: 1 }}
          animate={theme === 'dark' ? { rotate: 0, opacity: 1 } : { rotate: 30, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </motion.svg>
        
        {/* Moon icon for light mode */}
        <motion.svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 absolute inset-0"
          initial={theme === 'light' ? { rotate: -30, opacity: 0 } : { rotate: 0, opacity: 1 }}
          animate={theme === 'light' ? { rotate: 0, opacity: 1 } : { rotate: 30, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </motion.svg>
      </div>
    </motion.button>
  );
};

export default ThemeToggle;