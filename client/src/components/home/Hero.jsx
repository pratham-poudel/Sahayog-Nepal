import { Link } from 'wouter';
import { motion ,AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useStats } from '../../contexts/StatsContext';
import config from '../../config';



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
  const [topDonors, setTopDonors] = useState([]);
  const { formattedHomeStats, formattedLiveStats: liveStats, loading: statsLoading, error: statsError } = useStats();
  
  useEffect(() => {
    setIsVisible(true);
    
    // Fetch top 3 donors
    const fetchTopDonors = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/donors/top?limit=3`);
        const data = await response.json();
        if (data.success) {
          setTopDonors(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching top donors:', err);
      }
    };
    
    fetchTopDonors();
    
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
            
            {/* ✨ SACRED OPENER - Sanskrit Shloka */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6"
            >
              <div className="relative">
                {/* Subtle divine glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/20 via-rose-400/20 to-amber-400/20 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                
                <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-amber-200/50 dark:border-amber-700/30">
                  <p className="text-lg md:text-xl font-serif text-amber-600 dark:text-amber-400 leading-relaxed text-center md:text-left" style={{ fontFamily: 'Noto Serif Devanagari, serif' }}>
                    सर्वे भवन्तु सुखिनः, सर्वे सन्तु निरामयाः।
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 italic mt-1 text-center md:text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    May all be happy, may all be free from illness
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 🌿 EMOTIONAL CORE - Main Heading */}
            <motion.h1 
              className="relative z-10 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mt-6 mb-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <span className="block">Every Dream Deserves</span>
              <span className="block bg-gradient-to-r from-[#8B2325] via-rose-600 to-amber-600 bg-clip-text text-transparent">
                A Chance to Grow
              </span>
            </motion.h1>
            
            {/* 🌍 HUMAN CONNECTION - Location-based supporting line */}
            <motion.p 
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto md:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              From the hills of Dadeldhura to the valleys of Kathmandu, your kindness can change a life today.
            </motion.p>
            
            {/* 💫 INSPIRATIONAL QUOTE - Softer, contemplative tone */}
            <motion.blockquote 
              className="mt-6 mb-8 pl-4 border-l-4 border-amber-400 dark:border-amber-600"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 italic leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                "A single act of kindness throws out roots in all directions, and the roots spring up and make new trees."
              </p>
            </motion.blockquote>
            
            {/* 🏗️ TRUST & CREDIBILITY BADGES */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <p className="text-xs md:text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-3 justify-center md:justify-start flex-wrap" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Building hope since 2024
                </span>
                <span className="text-gray-400">•</span>
                <span>Trusted by families across Nepal</span>
              </p>
            </motion.div>
            
            {/* 🎯 CLEAR CTAs - Action-oriented with gradient glow */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Link to="/start-campaign" className="group relative">
                <motion.button 
                  className="relative w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-500 flex items-center justify-center overflow-hidden"
                  whileHover={{ 
                    scale: 1.02,
                    y: -2
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    backgroundSize: '200% auto'
                  }}
                >
                  {/* Animated gradient glow border */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400 blur-md -z-10"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
                  
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Story
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </motion.button>
              </Link>
              
              <Link to="/explore" className="group">
                <motion.button
                  className="relative w-full sm:w-auto py-4 px-8 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden"
                  whileHover={{ 
                    scale: 1.02,
                    y: -2
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-rose-500/0 group-hover:from-amber-500/5 group-hover:to-rose-500/5 transition-all duration-300 rounded-xl"></div>
                  
                  <span className="relative z-10 flex items-center gap-2">
                    Find Stories to Support
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </motion.button>
              </Link>
            </motion.div>
            
            {/* 👥 SOCIAL PROOF - Community engagement teaser */}
            <motion.div 
              className="flex items-center justify-center md:justify-start mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
            >
              {/* Simple, elegant social proof */}
              <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl px-5 py-4 border border-gray-200/50 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300 max-w-lg">
                <div className="flex -space-x-3">
                  {[22, 43, 76, 35, 18].map((id, index) => (
                    <motion.img 
                      key={id}
                      className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800 object-cover shadow-sm"
                      src={`https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${id}.jpg`}
                      alt="Community member"
                      width="40"
                      height="40"
                      loading="lazy"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.2 + (index * 0.08) }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Joined by <strong className="text-gray-900 dark:text-white font-bold">
                      {formattedHomeStats?.totalUsers?.formatted ? `${formattedHomeStats.totalUsers.formatted}+` : "200+"}
                    </strong> community members
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Optional: Top donors showcase - can be shown below or removed */}
            {topDonors.length > 0 && (
              <motion.div
                className="mt-6 bg-gradient-to-r from-amber-50/50 to-rose-50/50 dark:from-amber-900/10 dark:to-rose-900/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-amber-200/30 dark:border-amber-700/20 max-w-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  💛 Today's Hearts of Gold
                </p>
                <div className="flex gap-2">
                  {topDonors.slice(0, 3).map((donorData, index) => {
                    const donor = donorData.donor || {};
                    const firstName = donor.name?.split(' ')[0] || 'Anonymous';
                    const profilePicture = donor.profilePictureUrl || null;
                    
                    return (
                      <div
                        key={donorData._id || index}
                        className="flex-1 bg-white/70 dark:bg-gray-800/70 rounded-lg p-2 border border-white/60 dark:border-gray-700/40 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <img 
                            src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(donor.name || 'Anonymous')}&background=f59e0b&color=fff`}
                            alt={donor.name || 'Anonymous donor'}
                            className="w-6 h-6 rounded-full object-cover border border-amber-400/30"
                          />
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {firstName}
                          </p>
                        </div>
                        <p className="text-xs font-black text-amber-600 dark:text-amber-400 text-center">
                          ₹{donorData.totalDonated?.toLocaleString() || '0'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
  className="relative z-10"
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
  transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
>
  {/* GoFundMe-Inspired Hero Section */}
  <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
    {/* Circular Category Grid */}
    <div className="relative">
      {/* Connection Wires/Lines - SVG */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full -z-10"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          {/* Static gradient */}
          <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
          </linearGradient>

          {/* Animated gradient (for subtle shimmer if you want to switch to it later) */}
          <linearGradient
            id="wireGradientAnimated"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2">
              <animate
                attributeName="stopOpacity"
                values="0.2;0.8;0.2"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.6">
              <animate
                attributeName="stopOpacity"
                values="0.6;1;0.6"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2">
              <animate
                attributeName="stopOpacity"
                values="0.2;0.8;0.2"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>

        {/* Center point around (300, 288) */}
        {/* Lines to top-left (Medical) */}
        <motion.line
          x1="300"
          y1="288"
          x2="150"
          y2="135"
          stroke="url(#wireGradient)"
          strokeWidth="1.8"
          strokeDasharray="8,4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: 'easeInOut' }}
        />

        {/* Line to top-right (Education) */}
        <motion.line
          x1="300"
          y1="288"
          x2="450"
          y2="135"
          stroke="url(#wireGradient)"
          strokeWidth="1.8"
          strokeDasharray="8,4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.45, ease: 'easeInOut' }}
        />

        {/* Line to bottom-left (Emergency) */}
        <motion.line
          x1="300"
          y1="288"
          x2="150"
          y2="470"
          stroke="url(#wireGradient)"
          strokeWidth="1.8"
          strokeDasharray="8,4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.6, ease: 'easeInOut' }}
        />

        {/* Line to bottom-center (Animal) */}
        <motion.line
          x1="300"
          y1="288"
          x2="300"
          y2="480"
          stroke="url(#wireGradient)"
          strokeWidth="1.8"
          strokeDasharray="8,4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7, ease: 'easeInOut' }}
        />

        {/* Line to bottom-right (Business) */}
        <motion.line
          x1="300"
          y1="288"
          x2="450"
          y2="470"
          stroke="url(#wireGradient)"
          strokeWidth="1.8"
          strokeDasharray="8,4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.8, ease: 'easeInOut' }}
        />

        {/* Pulse at center */}
        <circle cx="300" cy="288" r="4" fill="#10b981" opacity="0.8">
          <animate
            attributeName="r"
            values="4;8;4"
            dur="2.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0.3;0.8"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Content wrapper to control layout and spacing */}
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 pt-4 pb-2 sm:gap-8 sm:pt-6 md:pt-8">
        {/* Top row: 2 circles */}
        <div className="grid w-full grid-cols-2 gap-6 sm:gap-8">
          {/* Medical */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.35 }}
          >
            <Link
              to="/explore/medical-treatment"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/0"
            >
              <div className="relative mx-auto h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className="h-full w-full overflow-hidden rounded-full bg-white dark:bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                      alt="Medical"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                </div>
                {/* Label */}
                <div className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/70 bg-slate-50 px-3 py-1 text-center text-xs font-semibold text-slate-800 shadow-md dark:border-slate-800/70 dark:bg-slate-800/90 dark:text-slate-100">
                  Medical
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Education */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.45 }}
          >
            <Link
              to="/explore/primary-education"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/0"
            >
              <div className="relative mx-auto h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className="h-full w-full overflow-hidden rounded-full bg-white dark:bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                      alt="Education"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/70 bg-slate-50 px-3 py-1 text-center text-xs font-semibold text-slate-800 shadow-md dark:border-slate-800/70 dark:bg-slate-800/90 dark:text-slate-100">
                  Education
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Middle: Center circle (Your cause) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="relative -mt-4 sm:-mt-6"
        >
          <Link
            to="/explore"
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/0"
          >
            <div className="relative h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                <div className="h-full w-full overflow-hidden rounded-full bg-white dark:bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                    alt="Your cause"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/70 bg-slate-50 px-4 py-1 text-center text-xs font-semibold text-slate-800 shadow-md dark:border-slate-800/70 dark:bg-slate-800/90 dark:text-slate-100">
                Your cause
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Bottom row: 3 circles */}
        <div className="grid w-full grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Emergency */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.6 }}
          >
            <Link
              to="/explore/natural-disaster"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/0"
            >
              <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className="h-full w-full overflow-hidden rounded-full bg-white dark:bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                      alt="Emergency"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/70 bg-slate-50 px-2.5 py-0.5 text-center text-[11px] font-semibold text-slate-800 shadow-md dark:border-slate-800/70 dark:bg-slate-800/90 dark:text-slate-100">
                  Emergency
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Animal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.7 }}
          >
            <Link
              to="/explore/cats"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/0"
            >
              <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className="h-full w-full overflow-hidden rounded-full bg-white dark:bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                      alt="Animal"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/70 bg-slate-50 px-2.5 py-0.5 text-center text-[11px] font-semibold text-slate-800 shadow-md dark:border-slate-800/70 dark:bg-slate-800/90 dark:text-slate-100">
                  Animal
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Business */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.8 }}
          >
            <Link
              to="/explore/startup"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/0"
            >
              <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className="h-full w-full overflow-hidden rounded-full bg-white dark:bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                      alt="Business"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/70 bg-slate-50 px-2.5 py-0.5 text-center text-[11px] font-semibold text-slate-800 shadow-md dark:border-slate-800/70 dark:bg-slate-800/90 dark:text-slate-100">
                  Business
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom Info / Stats Section */}
      <motion.div
        className="mt-12 space-y-5 text-center sm:mt-14"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.95 }}
      >
        {!statsLoading && (
          <div className="mx-auto grid max-w-xl grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3 shadow-sm dark:from-blue-900/30 dark:to-blue-800/30">
              <p className="text-xl font-extrabold text-blue-600 sm:text-2xl dark:text-blue-400">
                {formattedHomeStats?.activeCampaigns?.formatted || '42'}
              </p>
              <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-700 sm:text-xs dark:text-slate-200">
                Active Campaigns
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 shadow-sm dark:from-emerald-900/30 dark:to-emerald-800/30">
              <p className="text-xl font-extrabold text-emerald-600 sm:text-2xl dark:text-emerald-400">
                {liveStats?.formatted?.totalRaised || '₹2.5M'}
              </p>
              <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-700 sm:text-xs dark:text-slate-200">
                Total Raised
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 p-3 shadow-sm dark:from-violet-900/30 dark:to-violet-800/30">
              <p className="text-xl font-extrabold text-violet-600 sm:text-2xl dark:text-violet-400">
                {formattedHomeStats?.totalDonors?.formatted || '200+'}
              </p>
              <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-700 sm:text-xs dark:text-slate-200">
                Donors
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  </div>
</motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
