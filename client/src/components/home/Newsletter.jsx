import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { getHomeStats, formatStatsForDisplay } from '@/services/statsService';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [stats, setStats] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const rawStats = await getHomeStats();
        const formattedStats = formatStatsForDisplay(rawStats);
        setStats(formattedStats);
      } catch (error) {
        console.error('Error fetching Newsletter stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Welcome to our community! 🎉",
        description: "You'll receive updates on inspiring campaigns and impact stories.",
      });
      setEmail('');
      setIsLoading(false);
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000); // Reset after 3 seconds
    }, 1500);
  };

  const benefits = [
    { icon: "📧", text: "Weekly campaign highlights" },
    { icon: "💡", text: "Fundraising tips & strategies" },
    { icon: "🎯", text: "Success stories & impact updates" },
    { icon: "🤝", text: "Community events & networking" }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#8B2325]/5 to-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tl from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 0.8, 1],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8B2325]/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full mb-6 border border-[#8B2325]/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-2xl mr-2">📬</span>
              <span className="text-caption font-bold text-[#8B2325] dark:text-blue-400">Stay In The Loop</span>
            </motion.div>

            {/* Main Heading */}
            <h2 className="text-h2 text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#8B2325] via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Never Miss
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                A Moment of Impact
              </span>
            </h2>

            <p className="text-body text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join {stats?.totalUsers?.formatted || '2,500+'} changemakers getting exclusive updates, inspiring stories, and early access to life-changing campaigns across Nepal.
            </p>
          </motion.div>

          {/* Newsletter Form Card */}
          <motion.div
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border-2 border-white/30 dark:border-gray-700/30 shadow-2xl p-8 md:p-12 mb-12"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {!isSubscribed ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Email Input */}
                  <div className="relative flex-grow group">
                    <motion.input 
                      type="email" 
                      placeholder="Enter your email address" 
                      className="w-full py-5 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-[#8B2325]/20 focus:border-[#8B2325] dark:focus:ring-blue-500/20 dark:focus:border-blue-400 transition-all duration-300 text-lg placeholder:text-gray-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <motion.button 
                    type="submit" 
                    className="group relative py-5 px-10 bg-gradient-to-r from-[#8B2325] via-red-600 to-[#8B2325] text-white font-bold rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 disabled:opacity-70 whitespace-nowrap"
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
                    }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    {/* Button animations */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
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
                      {isLoading ? (
                        <>
                          <motion.div
                            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-3"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl mr-3">🚀</span>
                          <span>Join Community</span>
                        </>
                      )}
                    </span>
                  </motion.button>
                </div>
                
                {/* Privacy Notice */}
                <motion.p 
                  className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-green-600 mr-1">🔒</span>
                  By joining, you agree to our Privacy Policy. Unsubscribe anytime with one click. No spam, ever.
                </motion.p>
              </form>
            ) : (
              // Success State
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="text-8xl mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 0.6 }}
                >
                  🎉
                </motion.div>
                <h3 className="text-3xl font-bold text-[#8B2325] dark:text-blue-400 mb-3">Welcome Aboard!</h3>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  You're now part of Nepal's most impactful community. Check your inbox for a special welcome gift!
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Benefits Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
                whileHover={{ 
                  y: -5, 
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.8)"
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {benefit.icon}
                </motion.div>
                <p className="text-gray-700 dark:text-gray-300 font-semibold leading-relaxed group-hover:text-[#8B2325] dark:group-hover:text-blue-400 transition-colors duration-300">
                  {benefit.text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-xl">✓</span>
                <span className="font-semibold">{stats?.totalUsers?.formatted || '2,500+'} Active Subscribers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-xl">✓</span>
                <span className="font-semibold">Weekly Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-xl">✓</span>
                <span className="font-semibold">No Spam Promise</span>
              </div>
            </div>
            
            <p className="text-gray-400 dark:text-gray-500 italic">
              "The best way to stay connected with Nepal's changemaking community"
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
