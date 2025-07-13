import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

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
  
  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate impact images
    const rotationInterval = setInterval(() => {
      setActiveImageIndex(prevIndex => 
        prevIndex === impactImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => clearInterval(rotationInterval);
  }, []);

  // Parallax effect for decorative elements
  const useParallax = (value, distance) => {
    return {
      transform: `translateY(calc(${value} * ${distance}px))`,
    };
  };

  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Nepali flag-inspired decorative elements */}
      <motion.div 
        className="absolute top-0 left-0 w-40 h-40 bg-[#DC143C] rounded-full opacity-10 blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1] 
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-0 w-60 h-60 bg-[#003893] rounded-full opacity-10 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      />
      
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
            
            <h1 className="font-poppins font-bold text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-4 leading-tight">
              <span className="block text-gray-900 dark:text-white mb-2 text-[min(8vw,2.25rem)] md:text-[min(6vw,2.5rem)] lg:text-[min(4vw,3rem)]">
                Empower Nepal Through
              </span>
              <motion.span 
                className="block bg-clip-text text-transparent bg-gradient-to-r from-[#DC143C] to-[#003893] dark:from-[#ff3358] dark:to-[#1e68ff] font-extrabold text-[min(7.5vw,2.5rem)] md:text-[min(6vw,3rem)] lg:text-[min(5vw,3.5rem)] tracking-normal md:tracking-wide"
                animate={{ 
                  backgroundPosition: ['0% center', '100% center', '0% center'],
                }}
                transition={{ 
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{ letterSpacing: "0.01em" }}
              >
                Community Crowdfunding
              </motion.span>
            </h1>
            
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Join Nepal's first donation platform to support causes that matter. Together, we can make a difference in communities across Nepal.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start w-full">
              <Link to="/start-campaign" className="w-full sm:w-auto">
                <motion.button 
                  className="w-full py-3 sm:py-4 px-6 sm:px-8 bg-[#8B2325] hover:bg-[#7a1f21] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center"
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start a Campaign
                </motion.button>
              </Link>
              <Link to="/explore" className="w-full sm:w-auto">
                <motion.button
                  className="w-full py-3 sm:py-4 px-6 sm:px-8 border-2 border-[#8B2325] dark:border-[#a32729] bg-white dark:bg-gray-800 text-[#8B2325] dark:text-[#a32729] font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explore Campaigns
                </motion.button>
              </Link>
            </div>
            
            <motion.div 
              className="flex items-center justify-center md:justify-start mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <div className="flex -space-x-4">
                {[22, 43, 76, 35, 18].map((id, index) => (
                  <motion.img 
                    key={id}
                    className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800 object-cover shadow-md"
                    src={`https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${id}.jpg`}
                    alt="Supporter"
                    width="40"
                    height="40"
                    loading="lazy"
                    fetchpriority="low"
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + (index * 0.1) }}
                  />
                ))}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  <span className="font-bold text-primary-600 dark:text-primary-400">5,000+</span> donors
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">making an impact in Nepal</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {/* Simplified Impact Showcase */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Real Impact Stories
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Communities we've helped across Nepal
                </p>
              </div>
              
              {/* Main image showcase */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                {impactImages.map((image, index) => (
                  <motion.div 
                    key={index}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: index === activeImageIndex ? 1 : 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <img 
                      src={image.src} 
                      alt={`Impact story from ${image.location}, Nepal`}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                        <p className="text-sm font-medium">
                          {image.category} • {image.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Simple navigation dots */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  {impactImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === activeImageIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white/60 hover:bg-white/80'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Impact stats */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <motion.p 
                      className="text-2xl font-bold text-[#8B2325] dark:text-[#ff3358]"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      500+
                    </motion.p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Campaigns</p>
                  </div>
                  <div className="text-center">
                    <motion.p 
                      className="text-2xl font-bold text-green-600 dark:text-green-400"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                    >
                      75M+
                    </motion.p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rupees</p>
                  </div>
                  <div className="text-center">
                    <motion.p 
                      className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                    >
                      35+
                    </motion.p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Districts</p>
                  </div>
                </div>
              </div>
              
              {/* Category links */}
              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {categories.map((category, index) => (
                    <Link key={category.name} to={category.link}>
                      <motion.div
                        className="flex flex-col items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[#8B2325] dark:hover:border-[#ff3358] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.6 + (index * 0.1) }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="mb-2">{category.icon}</div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#8B2325] dark:group-hover:text-[#ff3358] transition-colors text-center">
                          {category.name}
                        </p>
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
