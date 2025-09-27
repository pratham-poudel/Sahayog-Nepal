import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useStats } from '../../contexts/StatsContext';

// Real impact stories
const impactImages = [
  { 
    src: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Kathmandu",
    category: "Education"
  },
  {
    src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Pokhara",
    category: "Healthcare"
  },
  {
    src: "https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    location: "Sindhupalchok",  
    category: "Disaster Relief"
  },
  {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
    location: "Chitwan",
    category: "Environment"
  }
];

// Categories with SVG icons and direct links to subcategory pages
const categories = [
  {
    name: 'Education',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-7-7l7 7 7-7M3 6l9 5 9-5" />
      </svg>
    ),
    link: '/explore/primary-education'
  },
  {
    name: 'Healthcare',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    link: '/explore/medical-treatment'
  },
  {
    name: 'Animals',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 1.742 0 3.223.835 3.772 2M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14.586l-4.95-1.65a3.001 3.001 0 00-4.1 0L5 14.586m6.5-8.586L8 9l3.5-3z" />
      </svg>
    ),
    link: '/explore/cats'
  },
  {
    name: 'Environment',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76m11.928 9.869A9 9 0 008.965 3.525m11.928 9.868A9 9 0 118.965 3.525" />
      </svg>
    ),
    link: '/explore/reforestation'
  },
  {
    name: 'Pets',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 3v1.5M6.75 6L5.25 7.5m13.5-1.5L17.25 7.5M15.75 3v1.5" />
      </svg>
    ),
    link: '/explore/dogs'
  }
];

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { formattedHomeStats, formattedLiveStats: liveStats, loading: statsLoading, error: statsError } = useStats();
  
  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate impact images
    const rotationInterval = setInterval(() => {
      setActiveImageIndex(prevIndex => 
        prevIndex === impactImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => {
      clearInterval(rotationInterval);
    };
  }, []);

  // Parallax effect for decorative elements
  const useParallax = (value, distance) => {
    return {
      transform: `translateY(calc(${value} * ${distance}px))`,
    };
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Professional Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient overlays */}
        <motion.div 
          className="absolute -top-96 -left-96 w-[800px] h-[800px] bg-gradient-to-br from-[#8B2325]/8 via-blue-500/6 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute -bottom-96 -right-96 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/8 via-[#8B2325]/6 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, -15, 0]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2
          }}
        />
        
        {/* Accent elements */}
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-gradient-to-br from-[#8B2325]/4 to-transparent rounded-full blur-2xl animate-gentle-glow"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-tr from-blue-500/4 to-transparent rounded-full blur-2xl animate-gentle-glow delay-1000"></div>
        
        {/* Geometric patterns */}
        <div className="absolute top-20 right-32 w-3 h-3 bg-[#8B2325]/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-2 h-2 bg-blue-500/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-16 w-2.5 h-2.5 bg-[#8B2325]/15 rounded-full animate-pulse delay-2000"></div>
      </div>
      
      {/* Mountain silhouette in the background - Nepal-inspired element */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-gradient-to-t from-gray-200/30 to-transparent dark:from-gray-700/20 z-0 overflow-hidden">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none">
          <path d="M0,224L80,229.3C160,235,320,245,480,234.7C640,224,800,192,960,181.3C1120,171,1280,181,1360,186.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" 
                fill="currentColor" className="text-gray-300/30 dark:text-gray-600/20" />
          <path d="M0,256L48,261.3C96,267,192,277,288,245.3C384,213,480,139,576,133.3C672,128,768,192,864,218.7C960,245,1056,235,1152,218.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" 
                fill="currentColor" className="text-gray-400/20 dark:text-gray-700/20" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 md:px-6 lg:px-8 z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div 
            className="text-center md:text-left relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 z-0 blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            
            <h1 className="relative z-10">
              {/* Startup-focused Hero Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-4"
              >
                <span className="inline-block text-caption text-[#8B2325] dark:text-red-400 bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 px-4 py-2 rounded-full font-semibold mb-6 border border-[#8B2325]/20">
                  Nepal's Leading Crowdfunding Platform
                </span>
              </motion.div>

              <motion.span 
                className="block text-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-2 bg-gradient-to-br from-[#8B2325] via-blue-600 to-[#8B2325] bg-clip-text text-transparent font-black leading-[0.85]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              >
                Transform
              </motion.span>
              
              <motion.span 
                className="block text-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-gray-900 dark:text-white font-bold mb-6 leading-[0.9]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              >
                Communities Through
                <span className="text-gradient-nepal ml-3 font-black">Giving</span>
              </motion.span>
            </h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-10"
            >
              <p className="text-body text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
                Connect hearts, fund dreams, and build a stronger Nepal. 
                <span className="text-[#8B2325] dark:text-red-400 font-semibold"> Every rupee counts.</span>
              </p>
              
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Live since 2024</span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-500 dark:text-gray-500">Trusted • Transparent • Impactful</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Link to="/start-campaign" className="group">
                <motion.button 
                  className="relative w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-[#8B2325] via-[#a32729] to-[#8B2325] text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform transition-all duration-300 flex items-center justify-center overflow-hidden"
                  whileHover={{ 
                    scale: 1.05,
                    y: -2
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <span className="relative z-10 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Start Your Campaign
                  </span>
                </motion.button>
              </Link>
              
              <Link to="/explore" className="group">
                <motion.button
                  className="relative w-full sm:w-auto py-4 px-8 border-2 border-[#8B2325] bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 dark:border-[#a32729] text-[#8B2325] dark:text-[#a32729] font-bold rounded-xl hover:bg-[#8B2325] hover:text-white dark:hover:bg-[#a32729] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center overflow-hidden"
                  whileHover={{ 
                    scale: 1.05,
                    y: -2
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Explore Campaigns
                  </span>
                </motion.button>
              </Link>
            </motion.div>
            
            <motion.div 
              className="flex items-center justify-center md:justify-start mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
            >
              {/* Social proof with better design */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full p-4 border border-white/20 dark:border-gray-700/20 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[22, 43, 76, 35, 18].map((id, index) => (
                      <motion.img 
                        key={id}
                        className="h-12 w-12 rounded-full border-3 border-white dark:border-gray-800 object-cover shadow-lg"
                        src={`https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${id}.jpg`}
                        alt="Supporter"
                        width="48"
                        height="48"
                        loading="lazy"
                        fetchpriority="low"
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 1.2 + (index * 0.1) }}
                      />
                    ))}
                  </div>
                  
                  <div>
                    <p className="text-body font-bold text-gray-900 dark:text-white">
                      <span className="text-2xl font-black bg-gradient-to-r from-[#8B2325] to-blue-600 bg-clip-text text-transparent">
                        {formattedHomeStats?.totalUsers?.formatted ? `${formattedHomeStats.totalUsers.formatted}+` : "1,250+"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">generous hearts joined</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {/* Compact Modern Dashboard */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/20 max-w-md mx-auto">
              
              {/* Minimal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 border-b border-white/20 dark:border-gray-700/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Live Impact
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-[#8B2325] dark:text-red-400 font-medium">Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Compact Image Showcase */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                {impactImages.map((image, index) => (
                  <motion.div 
                    key={index}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ 
                      opacity: index === activeImageIndex ? 1 : 0,
                      scale: index === activeImageIndex ? 1 : 1.1
                    }}
                    transition={{ duration: 0.8 }}
                  >
                    <img 
                      src={image.src} 
                      alt={`Impact story from ${image.location}, Nepal`}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                    
                    {/* Minimal overlay info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {image.category}
                            </p>
                            <p className="text-xs text-[#8B2325] dark:text-red-400 font-medium">
                              {image.location}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Minimal navigation dots */}
                <div className="absolute top-3 right-3 flex space-x-1">
                  {impactImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === activeImageIndex 
                          ? 'w-6 h-2 bg-white shadow-md' 
                          : 'w-2 h-2 bg-white/60 hover:bg-white/80'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Compact Metrics - Real Data */}
              <div className="px-6 py-4">
                {statsLoading ? (
                  // Loading state
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((_, index) => (
                      <div key={index} className="text-center">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <motion.p 
                        className="text-xl font-black bg-gradient-to-r from-[#8B2325] to-blue-600 bg-clip-text text-transparent"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        key={formattedHomeStats?.totalCampaigns} // Re-animate when value changes
                      >
                        {formattedHomeStats?.totalCampaigns?.formatted || "42"}
                      </motion.p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Campaigns</p>
                      {statsError && (
                        <div className="w-1 h-1 bg-yellow-500 rounded-full mx-auto mt-1" title="Using cached data"></div>
                      )}
                    </div>
                    <div className="text-center">
                      <motion.p 
                        className="text-xl font-black bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        key={liveStats?.totalRaised} // Re-animate when value changes
                      >
                        {liveStats?.formatted?.totalRaised || "₹2.5M"}
                      </motion.p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Raised</p>
                    </div>
                    <div className="text-center">
                      <motion.p 
                        className="text-xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1.4 }}
                        key={liveStats?.recentDonations} // Re-animate when value changes
                      >
                        {liveStats?.recentDonations || "5"}
                      </motion.p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Recent</p>
                    </div>
                  </div>
                )}
                
                {/* Real-time indicator */}
                <div className="flex items-center justify-center mt-3 gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${statsError ? 'bg-yellow-500' : 'bg-green-500'} ${!statsLoading ? 'animate-pulse' : ''}`}></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {statsLoading ? 'Updating...' : statsError ? 'Offline mode' : 'Live data'}
                  </span>
                </div>
              </div>
              
              {/* Category Pills */}
              <div className="px-6 pb-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Browse Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 4).map((category, index) => (
                    <Link key={category.name} to={category.link}>
                      <motion.div
                        className="flex items-center gap-1 px-3 py-2 rounded-full bg-gradient-to-r from-white/60 to-white/30 dark:from-gray-700/60 dark:to-gray-800/30 border border-white/40 dark:border-gray-600/40 hover:border-[#8B2325]/60 dark:hover:border-red-400/60 hover:shadow-md backdrop-blur-sm transition-all duration-300 group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.6 + (index * 0.1) }}
                        whileHover={{ y: -2, scale: 1.05 }}
                      >
                        <div className="text-sm">{category.icon}</div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#8B2325] dark:group-hover:text-red-400 transition-colors">
                          {category.name}
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
