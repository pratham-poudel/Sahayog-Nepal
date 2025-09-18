import { Link } from 'wouter';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getHomeStats, formatStatsForDisplay } from '../../services/statsService';

const CampaignCTA = () => {
  const [hoveredStat, setHoveredStat] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
      });
    };
    sequence();

    // Fetch real stats data
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(false);
        const rawStats = await getHomeStats();
        const formattedStats = formatStatsForDisplay(rawStats);
        
        // Create stats array with real data and styling
        const statsArray = [
          { 
            value: formattedStats?.activeCampaigns?.formatted || "42", 
            label: "Active Campaigns", 
            icon: "🎯", 
            color: "from-[#8B2325] to-red-500",
            bgColor: "from-[#8B2325]/10 to-red-500/5"
          },
          { 
            value: formattedStats?.totalFunds?.formatted || "₹2.5M+", 
            label: "Funds Raised", 
            icon: "💰", 
            color: "from-green-500 to-emerald-600",
            bgColor: "from-green-500/10 to-emerald-500/5"
          },
          { 
            value: formattedStats?.totalDonors?.formatted || "1,250+", 
            label: "Generous Donors", 
            icon: "❤️", 
            color: "from-pink-500 to-rose-600",
            bgColor: "from-pink-500/10 to-rose-500/5"
          },
          { 
            value: formattedStats?.districtsReached?.formatted || "12", 
            label: "Districts Reached", 
            icon: "🌍", 
            color: "from-blue-500 to-indigo-600",
            bgColor: "from-blue-500/10 to-indigo-500/5"
          }
        ];
        
        setStats(statsArray);
      } catch (err) {
        console.error('Error fetching CTA stats:', err);
        setError(true);
        // Fallback stats
        setStats([
          { 
            value: "42", 
            label: "Active Campaigns", 
            icon: "🎯", 
            color: "from-[#8B2325] to-red-500",
            bgColor: "from-[#8B2325]/10 to-red-500/5"
          },
          { 
            value: "₹2.5M+", 
            label: "Funds Raised", 
            icon: "💰", 
            color: "from-green-500 to-emerald-600",
            bgColor: "from-green-500/10 to-emerald-500/5"
          },
          { 
            value: "1,250+", 
            label: "Generous Donors", 
            icon: "❤️", 
            color: "from-pink-500 to-rose-600",
            bgColor: "from-pink-500/10 to-rose-500/5"
          },
          { 
            value: "12", 
            label: "Districts Reached", 
            icon: "🌍", 
            color: "from-blue-500 to-indigo-600",
            bgColor: "from-blue-500/10 to-indigo-500/5"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [controls]);

  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated floating elements */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#8B2325]/10 to-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-yellow-300/5 to-orange-300/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Enhanced Main Card */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden border-2 border-white/30 dark:border-gray-700/30"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          animate={controls}
        >
          <div className="grid md:grid-cols-2 relative">
            {/* Content Side */}
            <div className="p-8 md:p-12 lg:p-16 xl:p-20 flex flex-col justify-center relative">
              {/* Floating decoration */}
              <motion.div
                className="absolute top-8 right-8 w-20 h-20 bg-gradient-to-br from-[#8B2325]/20 to-blue-500/20 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {/* Badge */}
                <div className="flex items-center gap-3 mb-8">
                  <motion.div 
                    className="h-2 w-16 bg-gradient-to-r from-[#8B2325] via-blue-500 to-[#8B2325] rounded-full"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8B2325]/15 to-blue-500/15 backdrop-blur-sm text-[#8B2325] dark:text-blue-400 rounded-full text-sm font-bold border border-[#8B2325]/20">
                    <span className="text-lg mr-2">🚀</span>
                    Launch Today
                  </span>
                </div>
                
                {/* Main Heading */}
                <h2 className="text-h2 text-4xl md:text-5xl lg:text-6xl mb-8 font-black leading-tight">
                  <span className="bg-gradient-to-r from-[#8B2325] via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Your Vision,
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white">
                    Our Platform
                  </span>
                </h2>
                
                {/* Description */}
                <p className="text-body text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                  Join Nepal's most trusted crowdfunding platform. From healthcare emergencies to educational dreams, from disaster relief to community projects—every cause finds its champion here.
                </p>
                
                {/* Enhanced CTAs */}
                <div className="flex flex-col sm:flex-row gap-6 mb-8">
                  <Link to="/start-campaign">
                    <motion.button 
                      className="group relative py-5 px-10 bg-gradient-to-r from-[#8B2325] via-red-600 to-[#8B2325] text-white font-bold rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
                      whileHover={{ 
                        scale: 1.05,
                        y: -3,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{
                          x: [-100, 100]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                      />
                      <span className="relative z-10 flex items-center text-lg">
                        <span className="text-2xl mr-3">🎯</span>
                        Start Your Campaign
                      </span>
                    </motion.button>
                  </Link>
                  
                  <Link to="/explore">
                    <motion.button
                      className="py-5 px-10 border-3 border-[#8B2325] bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 dark:border-red-400 text-[#8B2325] dark:text-red-400 font-bold rounded-2xl hover:bg-[#8B2325] hover:text-white dark:hover:bg-red-400 dark:hover:text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      whileHover={{ 
                        scale: 1.05,
                        y: -3,
                        boxShadow: "0 20px 40px -12px rgba(139, 35, 37, 0.3)" 
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center text-lg">
                        <span className="text-2xl mr-3">👀</span>
                        Explore Campaigns
                      </span>
                    </motion.button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="font-semibold">Secure & Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="font-semibold">5% Platform Fee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="font-semibold">24/7 Support</span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Image Side with Enhanced Animation */}
            <div className="relative group">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#8B2325]/90 via-blue-600/70 to-purple-600/60 z-10"></div>
              
              {/* Reveal animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[#8B2325] to-blue-600 z-20"
                initial={{ scaleX: 1 }}
                whileInView={{ scaleX: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
                viewport={{ once: true }}
                style={{ transformOrigin: "right" }}
              />

              <div className="relative h-full min-h-[400px] md:min-h-[500px] overflow-hidden">
                <motion.img 
                  src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Community impact and support" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  width="600"
                  height="500"
                  loading="lazy"
                  initial={{ scale: 1.1 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 1.5 }}
                />
                
                {/* Floating success story */}
                <motion.div 
                  className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl z-30 border border-white/20"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="flex items-center gap-4">
                    <motion.img 
                      src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                      alt="Success Story" 
                      className="w-16 h-16 rounded-2xl border-3 border-[#8B2325] shadow-lg"
                      width="64"
                      height="64"
                      loading="lazy"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎉</span>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">Campaign Success!</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        "Raised ₹450,000 for rural school construction in just 3 weeks!"
                      </p>
                      <p className="text-xs text-[#8B2325] dark:text-red-400 mt-2 font-semibold">
                        - Prakash Thapa, Educator
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Enhanced Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className={`relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-2 border-white/30 dark:border-gray-700/30 overflow-hidden group cursor-pointer`}
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
              whileHover={{ 
                y: -8, 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {/* Animated background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                animate={hoveredStat === index ? {
                  background: [
                    `linear-gradient(45deg, ${stat.color.split(' ')[1]}/10, transparent)`,
                    `linear-gradient(225deg, ${stat.color.split(' ')[3]}/10, transparent)`,
                    `linear-gradient(45deg, ${stat.color.split(' ')[1]}/10, transparent)`
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="relative z-10">
                {/* Icon */}
                <motion.div 
                  className={`w-16 h-16 bg-gradient-to-br ${stat.bgColor} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <span className="text-3xl">{stat.icon}</span>
                </motion.div>
                
                {/* Content */}
                <motion.div
                  animate={hoveredStat === index ? { x: [0, 5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <p className={`text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-semibold">
                    {stat.label}
                  </p>
                </motion.div>
              </div>
              
              {/* Pulse effect */}
              {hoveredStat === index && (
                <motion.div
                  className="absolute inset-0 border-2 border-[#8B2325]/30 rounded-3xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CampaignCTA;
