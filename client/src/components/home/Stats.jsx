import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { getHomeStats, formatStatsForDisplay } from '../../services/statsService';

const CountUp = ({ target, suffix = "", duration = 2000, isVisible }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const updateCount = () => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(target * easeOutCubic);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(target);
      }
    };
    
    updateCount();
  }, [target, duration, isVisible]);
  
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
    }
    return num.toString();
  };
  
  return (
    <span>
      {target >= 1000 ? formatNumber(count) : count}
      {suffix}
    </span>
  );
};

const Stats = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(false);
        const rawStats = await getHomeStats();
        const formattedStats = formatStatsForDisplay(rawStats);
        
        // Convert to array format for existing component logic
        const statsArray = [
          formattedStats.totalFunds,
          formattedStats.activeCampaigns,
          formattedStats.totalUsers,
          formattedStats.districtsReached
        ].filter(Boolean); // Remove any null values
        
        setStats(statsArray);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(true);
        // Set fallback stats
        setStats([
          {
            label: "Funds Raised",
            value: "₹2.5M+",
            target: 2500000,
            description: "Total funding raised through our platform",
            suffix: "",
            icon: "💰"
          },
          {
            label: "Active Campaigns",
            value: "42",
            target: 42,
            description: "Ongoing campaigns seeking support",
            suffix: "",
            icon: "🎯"
          },
          {
            label: "Generous Hearts",
            value: "1,250+",
            target: 1250,
            description: "Amazing people who have contributed",
            suffix: "+",
            icon: "❤️"
          },
          {
            label: "Districts Reached",
            value: "12",
            target: 12,
            description: "Across beautiful Nepal",
            suffix: "",
            icon: "🗺️"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  
  return (
    <section className="py-20 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-[#8B2325]/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 rounded-full mb-6">
            <span className="text-caption text-[#8B2325] dark:text-red-400 font-semibold">Our Growing Impact</span>
          </div>
          
          <h2 className="text-h2 text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-[#8B2325] via-blue-600 to-[#8B2325] bg-clip-text text-transparent font-black">
            Making Nepal Stronger
          </h2>
          
          <p className="text-body text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Every number tells a story of hope, community, and positive change across our beautiful nation.
          </p>
        </motion.div>
        
        {/* Stats Grid */}
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div 
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
              >
                <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-8 md:p-10 h-full shadow-xl animate-pulse">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-t-2xl"></div>
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </motion.div>
            ))
          ) : (
            stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
            >
              {/* Card Background with Glassmorphism */}
              <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-8 md:p-10 h-full shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group-hover:bg-white/80 dark:group-hover:bg-gray-800/80">
                
                {/* Gradient Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8B2325] via-blue-500 to-[#8B2325] rounded-t-2xl"></div>
                
                {/* Icon */}
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                
                {/* Number */}
                <div className="mb-4">
                  <span className="text-display text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-br from-[#8B2325] via-blue-600 to-[#8B2325] bg-clip-text text-transparent block">
                    <CountUp 
                      target={stat.target || stat.value} 
                      suffix={stat.suffix || ""}
                      duration={2000 + (index * 200)}
                      isVisible={isInView}
                    />
                  </span>
                </div>
                
                {/* Label */}
                <h3 className="text-h3 text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#8B2325] dark:group-hover:text-red-400 transition-colors duration-300">
                  {stat.label}
                </h3>
                
                {/* Description */}
                <p className="text-body text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {stat.description}
                </p>
                
                {/* Real-time indicator */}
                {!error && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
                  </div>
                )}
                
                {/* Error indicator */}
                {error && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Cached</span>
                  </div>
                )}
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#8B2325]/10 via-blue-500/5 to-[#8B2325]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </motion.div>
          ))
          )}
        </div>
        
        {/* Call to Action */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 backdrop-blur-sm rounded-full px-6 py-3 border border-[#8B2325]/20">
            <span className="text-2xl">🚀</span>
            <p className="text-body text-lg font-semibold text-gray-700 dark:text-gray-300">
              Join our journey to reach{' '}
              <span className="text-[#8B2325] dark:text-red-400 font-bold">₹10M raised</span> by 2025!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
