import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

const ShareableSocialCard = ({ campaign, onClose, isOpen }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [format, setFormat] = useState('square'); // 'square' or 'story'
  const cardRef = useRef(null);
  const previewCardRef = useRef(null);
  
  // Utility function to truncate and clean text
  const truncateText = (text, maxLength = 120) => {
    if (!text || typeof text !== 'string') return '';
    
    // Remove extra whitespace and trim
    const cleaned = text.trim().replace(/\s+/g, ' ');
    
    if (cleaned.length <= maxLength) return cleaned;
    
    // Find the last space before maxLength to avoid cutting words
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.7 ? 
      truncated.substring(0, lastSpace) + '...' : 
      truncated + '...';
  };
  
  // Utility function to ensure clean display text (no duplicates)
  const getCleanDisplayText = (text, maxLength) => {
    const cleanText = truncateText(text, maxLength);
    // Remove any potential duplicates by splitting on common duplicate patterns
    const lines = cleanText.split(/[\.\.\.|…|\n]/);
    return lines[0].trim();
  };
  
  // Get campaign data once and reuse it everywhere to prevent repetition
  const campaignData = React.useMemo(() => {
    // Extract raw data first
    const rawTitle = campaign?.title || campaign?.name || 'Help Support This Campaign';
    const rawDescription = campaign?.story || campaign?.description || campaign?.shortDescription || 'Join us in making a positive impact in our community.';
    
    const data = {
      title: truncateText(rawTitle, 80), // Limit title to 80 chars
      description: truncateText(rawDescription, 120), // Limit description to 120 chars
      fullDescription: truncateText(rawDescription, 200), // Longer version for story format
      raised: campaign?.amountRaised || campaign?.raisedAmount || campaign?.raised || campaign?.currentAmount || 0,
      goal: campaign?.targetAmount || campaign?.goalAmount || campaign?.goal || 100000,
      donors: campaign?.donors || campaign?.donorsCount || campaign?.totalDonors || campaign?.supporters || 0,
      daysLeft: campaign?.daysLeft || campaign?.remainingDays || 30,
      image: campaign?.coverImage || campaign?.image || campaign?.imageUrl || campaign?.photo || '',
      category: campaign?.category || 'General'
    };
    
    // Calculate progress
    data.progress = data.goal > 0 ? Math.min((data.raised / data.goal) * 100, 100) : 0;
    
    return data;
  }, [campaign, truncateText]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);
  
  // Convert image to data URL to avoid CORS issues
  const imageToDataURL = async (imageUrl) => {
    try {
      // First try to load the image to check if it's accessible
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth || 600;
            canvas.height = img.naturalHeight || 280;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL());
          } catch (err) {
            resolve(null);
          }
        };
        
        img.onerror = () => {
          resolve(null);
        };
        
        // Set a timeout for image loading
        setTimeout(() => {
          resolve(null);
        }, 10000);
        
        img.src = imageUrl;
      });
    } catch (error) {
      return null;
    }
  };

  // Create a safe fallback image
  const createFallbackImage = (width, height, title) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#8B2325');
    gradient.addColorStop(1, '#B91C1C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add title text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(width / 20)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Split title into lines
    const maxWidth = width * 0.8;
    const words = title.substring(0, 60).split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    // Draw lines
    const lineHeight = Math.floor(width / 15);
    const startY = height / 2 - ((lines.length - 1) * lineHeight / 2);
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + (index * lineHeight));
    });
    
    return canvas.toDataURL();
  };

  // Helper function to get proxy URL for images
  const getProxyImageUrl = (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('filesatsahayognepal.dallytech.com')) {
      return null;
    }
    // Use your backend proxy route
    return `${import.meta.env.VITE_API_URL}/api/proxy/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  };

  // Helper function to get category-based icon
  const getCategoryIcon = (title, description, category) => {
    const content = `${title} ${description} ${category}`.toLowerCase();
    
    if (content.includes('cat') || content.includes('kitten')) return '🐱';
    if (content.includes('dog') || content.includes('puppy')) return '🐕';
    if (content.includes('education') || content.includes('school') || content.includes('study')) return '📚';
    if (content.includes('medical') || content.includes('health') || content.includes('hospital')) return '🏥';
    if (content.includes('emergency') || content.includes('urgent')) return '🚨';
    if (content.includes('child') || content.includes('family')) return '👨‍👩‍👧‍👦';
    if (content.includes('food') || content.includes('hunger')) return '🍚';
    if (content.includes('house') || content.includes('shelter') || content.includes('home')) return '🏠';
    
    return '💝'; // Default heart icon
  };

  // Instagram Story template (9:16 aspect ratio)
  const InstagramStoryTemplate = ({ campaignData }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    return (
      <div 
        className="w-[400px] h-[700px] bg-white flex flex-col shadow-2xl overflow-hidden border-2 border-gray-300"
        style={{ 
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          colorScheme: 'light' // Force light mode for consistent image generation
        }}
      >
        {/* Large background image or gradient */}
        <div className="h-[400px] relative overflow-hidden bg-gray-200">
          {campaignData.image && !imageError && getProxyImageUrl(campaignData.image) ? (
            <img 
              src={getProxyImageUrl(campaignData.image)}
              alt={campaignData.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#8B2325] via-[#A91B47] to-[#B91C1C] flex items-center justify-center text-white">
              <div className="text-center px-6">
                <div className="text-8xl mb-6">
                  {getCategoryIcon(campaignData.title, campaignData.description, campaignData.category)}
                </div>
                <h3 className="text-2xl font-bold leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>{campaignData.title}</h3>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
          
          {/* Top branding */}
          <div className="absolute top-6 left-6 right-6">
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <h2 className="text-xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Sahayog Nepal</h2>
              <p className="text-white/95 text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>Making a difference together</p>
            </div>
          </div>

          {/* Urgency badge */}
          <div className="absolute top-6 right-6">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              {campaignData.daysLeft > 0 ? `${campaignData.daysLeft} days left` : 'URGENT'}
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 p-6 bg-white">
          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {campaignData.title}
          </h3>
          
          <p className="text-gray-700 text-sm mb-4 leading-relaxed">
            {getCleanDisplayText(campaignData.fullDescription, 200)}
          </p>

          {/* Progress section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-[#8B2325]">
                Rs. {(campaignData.raised / 1000).toFixed(0)}K
              </span>
              <span className="text-gray-600 text-sm font-medium">
                of Rs. {(campaignData.goal / 1000).toFixed(0)}K goal
              </span>
            </div>
            
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-[#8B2325] to-[#B91C1C] rounded-full transition-all duration-300"
                style={{ width: `${campaignData.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>{campaignData.progress.toFixed(1)}% funded</span>
              <span>{campaignData.donors} {campaignData.donors === 1 ? 'donor' : 'donors'}</span>
            </div>
          </div>

          {/* Large CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg mb-3">
              Donate Now
            </div>
            <p className="text-gray-900 font-medium text-sm">
              sahayog.nepal
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Swipe up to donate • Every contribution counts
            </p>
          </div>
        </div>
      </div>
    );
  };

  // GoFundMe-style simple approach: Create HTML card and convert with html2canvas
  const generateShareImage = async () => {
    // Use the hidden card for image generation
    if (!cardRef.current) {
      throw new Error('Card reference not found');
    }

    try {
      // Make sure the card is prepared for capture
      const cardElement = cardRef.current;
      
      // Temporarily make visible for capture (off-screen to avoid UI interference)
      cardElement.style.visibility = 'visible';
      cardElement.style.position = 'fixed';
      cardElement.style.left = '-9999px';
      cardElement.style.top = '-9999px';
      cardElement.style.zIndex = '9999';
      
      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture with html2canvas - now with proper CORS handling via proxy
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2, // High quality
        useCORS: true, // Enable CORS since we're using proxy
        allowTaint: false, // Use clean canvas for better downloads
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight,
        windowWidth: 600,
        windowHeight: 600,
        logging: false
      });
      
      // Hide the card again
      cardElement.style.visibility = 'hidden';
      cardElement.style.position = 'absolute';
      cardElement.style.left = '-9999px';
      cardElement.style.zIndex = '-1';
      
      return canvas;
      
    } catch (error) {
      throw error;
    }
  };

  // Simple GoFundMe-style download
  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Generate image using simple html2canvas approach
      const canvas = await generateShareImage();
      
      // Simple blob conversion
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
        setTimeout(() => reject(new Error('Blob conversion timeout')), 5000);
      });
      
      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      // Simple download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sahayog-nepal-${format}-${Date.now()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      setIsDownloaded(true);
      
    } catch (error) {
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Copy campaign link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Campaign link copied to clipboard!');
    } catch (err) {
      // Silent fail for clipboard operations
    }
  };
  


  // Full-size card template for image generation (hidden)
  const FullSizeCardTemplate = ({ campaignData }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    return (
      <div 
        className="w-[600px] h-[600px] bg-white flex flex-col shadow-2xl overflow-hidden border-2 border-gray-300"
        style={{ 
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          colorScheme: 'light' // Force light mode for consistent image generation
        }}
      >
        {/* Header with branding */}
        <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Sahayog Nepal</h2>
              <p className="text-white/90 text-sm mt-1">Making a difference together</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                {campaignData.daysLeft > 0 ? `${campaignData.daysLeft} days left` : 'Urgent'}
              </div>
            </div>
          </div>
        </div>

        {/* Campaign image - using proxy to avoid CORS issues */}
        <div className="h-[280px] relative overflow-hidden bg-gray-200">
          {campaignData.image && !imageError && getProxyImageUrl(campaignData.image) ? (
            <img 
              src={getProxyImageUrl(campaignData.image)}
              alt={campaignData.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#8B2325] via-[#A91B47] to-[#B91C1C] flex items-center justify-center text-white">
              <div className="text-center px-6">
                {/* Category-based icon */}
                <div className="text-6xl mb-4">
                  {getCategoryIcon(campaignData.title, campaignData.description, campaignData.category)}
                </div>
                <h3 className="text-xl font-bold leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>{campaignData.title}</h3>
                <p className="text-white/95 text-sm mt-2 leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{getCleanDisplayText(campaignData.description, 60)}</p>
                {campaignData.image && (
                  <p className="text-white/70 text-xs mt-3">📷 Campaign has cover image</p>
                )}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>

        {/* Campaign details */}
        <div className="flex-1 p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
            {campaignData.title}
          </h3>
          
          <p className="text-gray-600 text-base mb-4 leading-relaxed">
            {getCleanDisplayText(campaignData.description, 120)}
          </p>

          {/* Progress section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold text-[#8B2325]">
                Rs. {campaignData.raised.toLocaleString()}
              </span>
              <span className="text-gray-600 font-medium">
                of Rs. {campaignData.goal.toLocaleString()}
              </span>
            </div>
            
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-[#8B2325] to-[#B91C1C] rounded-full transition-all duration-300"
                style={{ width: `${campaignData.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>{campaignData.progress.toFixed(1)}% funded</span>
              <span>{campaignData.donors} {campaignData.donors === 1 ? 'donor' : 'donors'}</span>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg">
              Donate Now at sahayog.nepal
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Every contribution makes a difference
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Preview card template (responsive and properly sized)  
  const PreviewCardTemplate = ({ campaignData }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    return (
      <div 
        className="w-full max-w-[300px] bg-white flex flex-col shadow-xl rounded-lg overflow-hidden border border-gray-200"
        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', aspectRatio: '1/1' }}
      >
        {/* Header with branding */}
        <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] p-3 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold">Sahayog Nepal</h2>
              <p className="text-white/90 text-xs mt-0.5">Making a difference together</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                {campaignData.daysLeft > 0 ? `${campaignData.daysLeft}d left` : 'Urgent'}
              </div>
            </div>
          </div>
        </div>

        {/* Campaign image */}
        <div className="h-[120px] relative overflow-hidden bg-gray-200">
          {campaignData.image && !imageError && getProxyImageUrl(campaignData.image) ? (
            <img 
              src={getProxyImageUrl(campaignData.image)}
              alt={campaignData.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#8B2325] via-[#A91B47] to-[#B91C1C] flex items-center justify-center text-white">
              <div className="text-center px-2">
                <div className="text-2xl mb-1">
                  {getCategoryIcon(campaignData.title, campaignData.description, campaignData.category)}
                </div>
                <h3 className="text-xs font-bold leading-tight" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{getCleanDisplayText(campaignData.title, 25)}</h3>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>

        {/* Campaign details */}
        <div className="flex-1 p-3">
          <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
            {campaignData.title}
          </h3>
          
          <p className="text-gray-600 text-xs mb-3 leading-relaxed">
            {getCleanDisplayText(campaignData.description, 80)}
          </p>

          {/* Progress section */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-[#8B2325]">
                Rs. {(campaignData.raised / 1000).toFixed(0)}K
              </span>
              <span className="text-gray-600 text-xs font-medium">
                of {(campaignData.goal / 1000).toFixed(0)}K
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div 
                className="h-full bg-gradient-to-r from-[#8B2325] to-[#B91C1C] rounded-full transition-all duration-300"
                style={{ width: `${campaignData.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>{campaignData.progress.toFixed(1)}% funded</span>
              <span>{campaignData.donors} {campaignData.donors === 1 ? 'donor' : 'donors'}</span>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white font-bold py-2 px-4 rounded-lg text-xs">
              Donate Now at sahayog.nepal
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Every contribution makes a difference
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white rounded-xl sm:rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl mx-2 sm:mx-4"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white p-4 sm:p-6">
              <div className="flex justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Share This Campaign</h2>
                  <p className="text-white/90 mt-1 text-sm sm:text-base">Help us spread the word and make a bigger impact</p>
                </div>
                <button 
                  onClick={onClose}
                  className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div 
              className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(95vh-120px)]"
              onWheel={(e) => {
                // Prevent event bubbling to parent elements
                e.stopPropagation();
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Instructions */}
                <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">How to Share in 3 Simple Steps</h3>
                    
                    {/* Step 1 */}
                    <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-blue-50 rounded-xl mb-3 sm:mb-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#8B2325] text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Download the share image</h4>
                        <p className="text-gray-600 text-xs sm:text-sm">Click the download button to save this beautiful campaign card to your device.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-green-50 rounded-xl mb-3 sm:mb-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#8B2325] text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Post on social media</h4>
                        <p className="text-gray-600 text-xs sm:text-sm">Share the image on Facebook, Instagram, Twitter, or WhatsApp to reach your friends and family.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-purple-50 rounded-xl mb-4 sm:mb-6">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#8B2325] text-white rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Include the campaign link</h4>
                        <p className="text-gray-600 text-xs sm:text-sm">Add this link so people can donate directly: <br />
                          <span className="font-mono text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 inline-block break-all">
                            {window.location.href}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      {isDownloading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating Image... Please wait</span>
                        </>
                      ) : isDownloaded ? (
                        <>
                          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Success! Share It Now</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="hidden sm:inline">
                            Download {format === 'story' ? 'Story' : 'Post'} Image
                          </span>
                          <span className="sm:hidden">Download {format === 'story' ? 'Story' : 'Post'}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-gray-100 text-gray-800 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Campaign Link</span>
                    </button>
                  </div>

                  {/* Impact Message */}
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-3 sm:p-4 rounded-xl border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">💫 Your Share Makes a Difference!</h4>
                    <p className="text-orange-800 text-xs sm:text-sm">When you share this campaign, you're not just spreading awareness - you're directly helping us reach more potential donors and achieve our goal faster.</p>
                  </div>
                </div>
                
                  {/* Preview */}
                <div className="order-1 lg:order-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                    
                    {/* Format selector */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => {
                          setFormat('square');
                          setIsDownloaded(false);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          format === 'square' 
                            ? 'bg-[#8B2325] text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Square Post
                      </button>
                      <button
                        onClick={() => {
                          setFormat('story');
                          setIsDownloaded(false);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          format === 'story' 
                            ? 'bg-[#8B2325] text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        IG Story
                      </button>
                    </div>
                  </div>                  <div className="flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-6 shadow-inner">
                    <div 
                      ref={previewCardRef} 
                      className={`${format === 'story' ? 'w-full max-w-[180px]' : 'w-full max-w-[280px] sm:max-w-[320px]'}`}
                    >
                      {format === 'story' ? (
                        <div className="transform scale-50 origin-center">
                          <InstagramStoryTemplate campaignData={campaignData} />
                        </div>
                      ) : (
                        <PreviewCardTemplate campaignData={campaignData} />
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 sm:mt-4 text-center">
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {format === 'story' 
                        ? 'High-quality 400x700 image perfect for Instagram Stories' 
                        : 'High-quality 600x600 image perfect for all social media platforms'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hidden card for image generation - dynamic based on format */}
          <div 
            ref={cardRef} 
            className="absolute top-0 left-[-1000px] pointer-events-none z-[-1]"
            style={{ 
              width: format === 'story' ? '400px' : '600px', 
              height: format === 'story' ? '700px' : '600px',
              visibility: 'hidden',
              position: 'absolute'
            }}
          >
            {format === 'story' ? <InstagramStoryTemplate campaignData={campaignData} /> : <FullSizeCardTemplate campaignData={campaignData} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareableSocialCard;