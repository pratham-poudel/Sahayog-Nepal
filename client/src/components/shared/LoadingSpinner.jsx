import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };
  
  // Color classes
  const colorClasses = {
    primary: 'border-[#8B2325] border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-500 border-t-transparent',
  };
  
  const classList = `${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.primary} rounded-full animate-spin`;
  
  return (
    <div className="flex items-center justify-center">
      <div className={classList}></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner; 