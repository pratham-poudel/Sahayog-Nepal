import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

const ShareableSocialCard = ({ campaign, onClose, isOpen }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const cardRef = useRef(null);
  
  // Simple text truncation
  const truncate = (text, max) => {
    if (!text) return '';
    const clean = text.trim().replace(/\s+/g, ' ');
    if (clean.length <= max) return clean;
    const cut = clean.substring(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > max * 0.7 ? cut.substring(0, lastSpace) : cut) + '...';
  };
  
  // Extract campaign data simply
  const data = {
    title: truncate(campaign?.title || 'Help Support This Campaign', 80),
    description: truncate(campaign?.story || campaign?.description || 'Join us in making a positive impact.', 200),
    raised: campaign?.amountRaised || campaign?.raised || 0,
    goal: campaign?.targetAmount || campaign?.goal || 100000,
    donors: campaign?.donors || campaign?.donorsCount || 0,
    daysLeft: campaign?.daysLeft || 30,
    image: campaign?.coverImage || campaign?.image || '',
    category: campaign?.category || 'General'
  };
  
  data.progress = data.goal > 0 ? Math.min((data.raised / data.goal) * 100, 100) : 0;
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);
  
  // Get proxy URL for images
  const getProxyUrl = (url) => {
    if (!url || !url.includes('filesatsahayognepal.dallytech.com')) return null;
    return `${import.meta.env.VITE_API_URL}/api/proxy/image-proxy?url=${encodeURIComponent(url)}`;
  };
  
  // Get category icon
  const getIcon = (title, desc, cat) => {
    const content = `${title} ${desc} ${cat}`.toLowerCase();
    if (content.includes('cat') || content.includes('kitten')) return '🐱';
    if (content.includes('dog') || content.includes('puppy')) return '🐕';
    if (content.includes('education') || content.includes('school')) return '📚';
    if (content.includes('medical') || content.includes('health')) return '🏥';
    if (content.includes('emergency') || content.includes('urgent')) return '🚨';
    if (content.includes('child') || content.includes('family')) return '👨‍👩‍👧‍👦';
    if (content.includes('food') || content.includes('hunger')) return '🍚';
    if (content.includes('house') || content.includes('shelter')) return '🏠';
    return '💝';
  };

  // Simple download handler with progress
  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setStatusMessage('Preparing...');
    
    try {
      // Simulate progress for rendering phase (0-30%)
      setDownloadProgress(10);
      setStatusMessage('Loading content...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setDownloadProgress(20);
      setStatusMessage('Preparing image...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setDownloadProgress(30);
      setStatusMessage('Rendering campaign...');
      
      // Generate canvas
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: () => {
          setDownloadProgress(50); // Canvas cloned
          setStatusMessage('Processing image...');
        }
      });
      
      setDownloadProgress(70); // Canvas generated
      setStatusMessage('Optimizing quality...');
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to create image');
        
        setDownloadProgress(85); // Blob created
        setStatusMessage('Preparing download...');
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sahayog-nepal-story-${Date.now()}.png`;
        link.click();
        
        setDownloadProgress(100); // Download triggered
        setStatusMessage('Download complete!');
        
        setTimeout(() => {
          URL.revokeObjectURL(url);
          setIsDownloaded(true);
          setDownloadProgress(0);
          setStatusMessage('');
        }, 500);
      }, 'image/png', 1.0);
      
    } catch (error) {
      alert('Failed to generate image. Please try again.');
      setDownloadProgress(0);
      setStatusMessage('');
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, 600);
    }
  };
  
  // Copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Campaign link copied!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const proxyUrl = getProxyUrl(data.image);
  const icon = getIcon(data.title, data.description, data.category);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 9999 }}
        >
          <motion.div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl relative z-[10000]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            style={{ zIndex: 10000 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white p-6 relative z-[10001]">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Share This Campaign</h2>
                  <p className="text-white/90 mt-1">Help us spread the word</p>
                </div>
                <button 
                  onClick={onClose}
                  className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors relative z-[10002]"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-100px)] relative z-[10001]">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Instructions */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">3 Simple Steps</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#8B2325] text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Download</h4>
                        <p className="text-gray-600 text-sm">Save the story image</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#8B2325] text-white rounded-full flex items-center justify-center font-bold">2</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Post</h4>
                        <p className="text-gray-600 text-sm">Share on Instagram, Facebook, WhatsApp</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#8B2325] text-white rounded-full flex items-center justify-center font-bold">3</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Add Link</h4>
                        <p className="text-gray-600 break-all font-mono text-xs bg-purple-100 p-2 rounded mt-1">
                          {window.location.href}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isDownloading ? (
                        <>
                          {/* Circular Progress Indicator */}
                          <div className="relative w-12 h-12">
                            {/* Background circle */}
                            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="4"
                                fill="none"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="white"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 20}`}
                                strokeDashoffset={`${2 * Math.PI * 20 * (1 - downloadProgress / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-300"
                              />
                            </svg>
                            {/* Percentage text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{downloadProgress}%</span>
                            </div>
                          </div>
                          <span>Generating...</span>
                        </>
                      ) : isDownloaded ? (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Downloaded! Share Now</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Download Story Image</span>
                        </>
                      )}
                    </button>

                    {/* Progress bar when downloading */}
                    {isDownloading && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#8B2325] to-[#B91C1C] rounded-full transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                        {statusMessage && (
                          <p className="text-center text-sm text-gray-600 animate-pulse">
                            {statusMessage}
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Link</span>
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">💫 Make a Difference!</h4>
                    <p className="text-orange-800 text-sm">Your share helps us reach more donors and achieve our goal faster.</p>
                  </div>
                </div>
                
                {/* Preview */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Preview</h3>
                  <div className="flex justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-inner">
                    <div className="w-[200px] h-[350px] bg-white rounded-lg shadow-xl overflow-hidden">
                      {/* Mini preview */}
                      <div className="h-[200px] relative bg-gray-200">
                        {proxyUrl && !imageError ? (
                          <img 
                            src={proxyUrl}
                            alt={data.title}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#8B2325] to-[#B91C1C] flex items-center justify-center text-white">
                            <div className="text-center p-4">
                              <div className="text-4xl mb-2">{icon}</div>
                              <h3 className="text-xs font-bold leading-tight">{data.title.substring(0, 30)}</h3>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-white">
                        <h4 className="text-xs font-bold mb-2 line-clamp-2">{data.title}</h4>
                        <div className="w-full h-1 bg-gray-200 rounded-full mb-2">
                          <div className="h-full bg-[#8B2325] rounded-full" style={{ width: `${data.progress}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Rs. {(data.raised/1000).toFixed(0)}K</span>
                          <span>{data.progress.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm text-center mt-4">
                    High-quality 1080x1920 for Instagram Stories
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hidden full-size card for download */}
          <div 
            ref={cardRef} 
            className="absolute pointer-events-none"
            style={{ 
              left: '-9999px',
              top: '-9999px',
              width: '1080px',
              height: '1920px',
              zIndex: -1
            }}
          >
            <div 
              className="w-[1080px] h-[1920px] bg-white flex flex-col"
              style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
            >
              {/* Hero Image */}
              <div className="h-[1100px] relative overflow-hidden bg-gray-200">
                {proxyUrl && !imageError ? (
                  <img 
                    src={proxyUrl}
                    alt={data.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#8B2325] to-[#B91C1C] flex items-center justify-center text-white p-16">
                    <div className="text-center">
                      <div className="text-[200px] mb-12">{icon}</div>
                      <h3 className="text-6xl font-bold leading-tight" style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.9)' }}>
                        {data.title}
                      </h3>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Top branding */}
                <div className="absolute top-16 left-16 right-16">
                  <div className="bg-white/30 backdrop-blur-md rounded-3xl p-10 border-2 border-white/20">
                    <h2 className="text-5xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      Sahayog Nepal
                    </h2>
                    <p className="text-white/95 text-3xl mt-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                      Making a difference together
                    </p>
                  </div>
                </div>

                {/* Urgency badge */}
                <div className="absolute top-16 right-16">
                  <div className="bg-red-500 text-white px-8 py-4 rounded-full text-3xl font-bold shadow-lg">
                    {data.daysLeft > 0 ? `${data.daysLeft} days left` : 'URGENT'}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-16 bg-white">
                <h3 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  {data.title}
                </h3>
                
                <p className="text-gray-700 text-3xl mb-10 leading-relaxed">
                  {data.description}
                </p>

                {/* Progress */}
                <div className="mb-12">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-5xl font-bold text-[#8B2325]">
                      Rs. {(data.raised / 1000).toFixed(0)}K
                    </span>
                    <span className="text-gray-600 text-3xl font-medium">
                      of Rs. {(data.goal / 1000).toFixed(0)}K
                    </span>
                  </div>
                  
                  <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-gradient-to-r from-[#8B2325] to-[#B91C1C] rounded-full"
                      style={{ width: `${data.progress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-2xl text-gray-600">
                    <span>{data.progress.toFixed(1)}% funded</span>
                    <span>{data.donors} donors</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-[#8B2325] to-[#B91C1C] text-white font-bold py-10 px-16 rounded-3xl text-5xl shadow-xl mb-6">
                    Donate Now
                  </div>
                  <p className="text-gray-900 font-bold text-4xl">sahayognepal.org</p>
                  <p className="text-gray-500 text-2xl mt-3">Every contribution counts</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareableSocialCard;
