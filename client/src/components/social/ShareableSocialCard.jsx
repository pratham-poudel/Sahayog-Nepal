import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

const ShareableSocialCard = ({ campaign, onClose, isOpen }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('simple');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const cardRef = useRef(null);
  
  // Templates available for sharing
  const templates = [
    { id: 'simple', name: 'Simple' },
    { id: 'impact', name: 'Impact' },
    { id: 'urgent', name: 'Urgent' },
    { id: 'instagram', name: 'Instagram Story' }
  ];
  
  // Handle card generation and download
  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Generate image from the card element
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Allow loading cross-origin images
        backgroundColor: null // Transparent background
      });
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        // Create download link
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `sahayog-nepal-${campaign.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        setIsDownloading(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error generating image:', err);
      setIsDownloading(false);
    }
  };
  
  // Handle social media sharing
  const handleShare = async (platform) => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Generate image from the card element
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        // Create a file from the blob
        const file = new File([blob], `sahayog-nepal-${campaign.title.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });
        
        // Different share handling for different platforms
        switch(platform) {
          case 'facebook':
            // For Facebook, we'll use the Web Share API if available
            if (navigator.share) {
              try {
                await navigator.share({
                  title: `Support: ${campaign.title}`,
                  text: `Help support this campaign on Sahayog Nepal: ${campaign.description.substring(0, 100)}...`,
                  url: window.location.href,
                  files: [file]
                });
              } catch (err) {
                // Fallback to traditional sharing
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
              }
            } else {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
            }
            break;
            
          case 'twitter':
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Help support: ${campaign.title}`)}`, '_blank');
            break;
            
          case 'whatsapp':
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Help support: ${campaign.title} ${window.location.href}`)}`, '_blank');
            break;
            
          case 'instagram':
            // Instagram doesn't have a direct share URL, so we'll tell user to download and share
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            
            // Show instructions for Instagram
            alert('Save the image and share it on your Instagram story or post. When sharing, add a link to: ' + window.location.href);
            break;
            
          default:
            break;
        }
        
        setIsDownloading(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error generating share image:', err);
      setIsDownloading(false);
    }
  };
  
  // Card template for Instagram story (9:16 aspect ratio)
  const InstagramStoryTemplate = () => (
    <div 
      className="w-[360px] h-[640px] bg-gradient-to-br from-[#8B2325] to-[#551415] text-white flex flex-col p-6 rounded-xl overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-white">Sahayog Nepal</h2>
        <div className="text-sm text-white/80 rounded-full px-3 py-1 bg-white/20 backdrop-blur-sm">
          {campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : 'Urgent'}
        </div>
      </div>
      
      <div className="h-[300px] mb-4 rounded-lg overflow-hidden shadow-xl">
        <img 
          src={campaign.thumbnail} 
          alt={campaign.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{campaign.title}</h3>
      
      <div className="mb-3">
        <p className="text-white/80 text-sm mb-2 line-clamp-3">
          {campaign.description}
        </p>
      </div>
      
      <div className="mt-auto">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">Rs. {campaign.raised.toLocaleString()}</span>
            <span className="text-white/80">raised of Rs. {campaign.goal.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${campaign.progress}%` }}
            />
          </div>
          <div className="text-right text-xs mt-1 text-white/80">
            {campaign.progress}% towards goal
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="bg-white text-[#8B2325] font-bold py-3 px-8 rounded-lg text-center w-full">
            Scan QR or Visit Sahayog.Nepal
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <div className="text-white/60 text-xs text-center">
            Share this card and help us spread the word
          </div>
        </div>
      </div>
    </div>
  );
  
  // Card template for simple sharing (1:1 aspect ratio)
  const SimpleTemplate = () => (
    <div 
      className="w-[500px] h-[500px] bg-white dark:bg-gray-800 flex flex-col p-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-[#8B2325] dark:text-[#ffb347]">Sahayog Nepal</h2>
        <div className="text-xs text-white rounded-full px-3 py-1 bg-[#8B2325]">
          {campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : 'Urgent'}
        </div>
      </div>
      
      <div className="h-[200px] mb-4 rounded-lg overflow-hidden shadow-lg">
        <img 
          src={campaign.thumbnail} 
          alt={campaign.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{campaign.title}</h3>
      
      <div className="mb-3">
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
          {campaign.description}
        </p>
      </div>
      
      <div className="mt-auto">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-gray-900 dark:text-white">Rs. {campaign.raised.toLocaleString()}</span>
            <span className="text-gray-500 dark:text-gray-400">raised of Rs. {campaign.goal.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#8B2325] dark:bg-[#ffb347] rounded-full"
              style={{ width: `${campaign.progress}%` }}
            />
          </div>
          <div className="text-right text-xs mt-1 text-gray-500 dark:text-gray-400">
            {campaign.progress}% towards goal
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="bg-[#8B2325] text-white dark:bg-[#ffb347] dark:text-gray-900 font-bold py-2.5 px-6 rounded-lg inline-block">
            Donate Now at sahayog.nepal
          </div>
        </div>
      </div>
    </div>
  );
  
  // Card template for impact-focused sharing
  const ImpactTemplate = () => (
    <div 
      className="w-[500px] h-[500px] bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col p-6 rounded-lg overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-[#ffb347]">Make An Impact</h2>
        <p className="text-white/70 text-sm">With Sahayog Nepal</p>
      </div>
      
      <div className="h-[180px] mb-4 rounded-lg overflow-hidden shadow-lg">
        <img 
          src={campaign.thumbnail} 
          alt={campaign.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{campaign.title}</h3>
      
      <div className="mb-4 p-3 bg-white/10 rounded-lg">
        <p className="text-white text-sm font-medium">
          Your donation can help:
        </p>
        <ul className="mt-2 text-white/90 text-sm">
          {campaign.category === 'Education' && (
            <>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Provide education to children in need
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Support teachers with resources
              </li>
            </>
          )}
          {campaign.category === 'Healthcare' && (
            <>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Provide medical care to those in need
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Support healthcare facilities
              </li>
            </>
          )}
          {campaign.category === 'Disaster Relief' && (
            <>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Provide emergency aid to affected areas
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Help rebuild damaged homes and infrastructure
              </li>
            </>
          )}
          {campaign.category === 'Community' && (
            <>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Strengthen local community initiatives
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-[#ffb347]">✓</span> Support sustainable community growth
              </li>
            </>
          )}
        </ul>
      </div>
      
      <div className="mt-auto">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">Rs. {campaign.raised.toLocaleString()}</span>
            <span className="text-white/70">raised of Rs. {campaign.goal.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ffb347] rounded-full"
              style={{ width: `${campaign.progress}%` }}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="bg-[#ffb347] text-gray-900 font-bold py-2.5 px-6 rounded-lg text-center">
            Join us at sahayog.nepal and make a difference today
          </div>
        </div>
      </div>
    </div>
  );
  
  // Card template for urgent campaigns
  const UrgentTemplate = () => (
    <div 
      className="w-[500px] h-[500px] bg-gradient-to-br from-[#8B2325] to-[#4a1314] text-white flex flex-col p-6 rounded-lg overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-center justify-center mb-3">
        <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-white flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          URGENT APPEAL
        </div>
      </div>
      
      <div className="h-[180px] mb-4 rounded-lg overflow-hidden shadow-xl relative">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          src={campaign.thumbnail} 
          alt={campaign.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute left-3 bottom-3 z-20 bg-[#8B2325] text-white text-xs font-bold px-2 py-1 rounded-sm">
          {campaign.daysLeft > 0 ? `${campaign.daysLeft} DAYS LEFT` : 'CRITICAL NEED'}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{campaign.title}</h3>
      
      <div className="mb-3">
        <p className="text-white/90 text-sm line-clamp-2">
          {campaign.description}
        </p>
      </div>
      
      <div className="mt-auto space-y-4">
        <div className="bg-white/10 p-3 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">RAISED: Rs. {campaign.raised.toLocaleString()}</span>
            <span className="text-white/80">GOAL: Rs. {campaign.goal.toLocaleString()}</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${campaign.progress}%` }}
            />
          </div>
          <div className="mt-1 text-white/80 text-xs font-medium">
            We need your help to reach our goal
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="bg-white text-[#8B2325] font-bold py-3 px-6 rounded-md text-center w-full">
            DONATE NOW - EVERY RUPEE MATTERS
          </div>
        </div>
        
        <div className="text-center text-white/70 text-xs">
          Sahayog Nepal | www.sahayog.nepal | Making a difference together
        </div>
      </div>
    </div>
  );
  
  // Render appropriate template based on selection
  const renderSelectedTemplate = () => {
    switch(selectedTemplate) {
      case 'simple':
        return <SimpleTemplate />;
      case 'impact':
        return <ImpactTemplate />;
      case 'urgent':
        return <UrgentTemplate />;
      case 'instagram':
        return <InstagramStoryTemplate />;
      default:
        return <SimpleTemplate />;
    }
  };
  
  // Social media platforms to share to
  const socialPlatforms = [
    { id: 'download', name: 'Download', icon: 'download' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'twitter', name: 'Twitter', icon: 'twitter' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp' },
    { id: 'instagram', name: 'Instagram', icon: 'instagram' }
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Campaign</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Choose a Template</h3>
                  
                  <div className="space-y-3 mb-6">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        className={`w-full p-3 rounded-lg flex items-center ${
                          selectedTemplate === template.id 
                            ? 'bg-[#8B2325] text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        {selectedTemplate === template.id && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {template.name} Template
                      </button>
                    ))}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Share To</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {socialPlatforms.map(platform => (
                      <button
                        key={platform.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => platform.id === 'download' ? handleDownload() : handleShare(platform.id)}
                        disabled={isDownloading}
                      >
                        <div className="text-center">
                          {isDownloading ? (
                            <svg className="animate-spin mx-auto h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {platform.name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preview</h3>
                  
                  <div className="flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-hidden">
                    <div ref={cardRef} className="transform scale-75 origin-center">
                      {renderSelectedTemplate()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareableSocialCard;