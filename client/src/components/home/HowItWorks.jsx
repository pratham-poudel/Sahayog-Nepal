import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useStats } from '../../contexts/StatsContext';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { formattedHomeStats: stats } = useStats();
  
  const steps = [
    {
      icon: '🚀',
      title: 'Launch Your Cause',
      description: 'Create a compelling campaign in under 5 minutes. Tell your story with photos, videos, and set your fundraising goal.',
      detail: 'Our intuitive campaign builder guides you through every step, from writing compelling descriptions to setting realistic goals.',
      iconBg: 'bg-gradient-to-br from-[#8B2325]/20 to-red-500/20',
      iconColor: 'text-[#8B2325]',
      stepNumber: '01',
      color: 'red'
    },
    {
      icon: '📱',
      title: 'Amplify Your Reach',
      description: 'Share across social media, WhatsApp, and email. Built-in sharing tools help you reach more generous hearts.',
      detail: 'Get custom sharing templates, QR codes, and social media assets designed to maximize your campaign visibility.',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-600',
      stepNumber: '02',
      color: 'blue'
    },
    {
      icon: '💰',
      title: 'Receive & Celebrate',
      description: 'Get funds directly to your bank account. Track donations in real-time and thank your amazing supporters.',
      detail: 'Transparent tracking, instant notifications, and automated thank-you messages help you stay connected with donors.',
      iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-600',
      stepNumber: '03',
      color: 'green'
    }
  ];

  const colorSchemes = {
    red: {
      gradient: 'from-[#8B2325] to-red-500',
      bg: 'from-[#8B2325]/10 to-red-500/5',
      border: 'border-[#8B2325]/30',
      text: 'text-[#8B2325]'
    },
    blue: {
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'from-blue-500/10 to-indigo-500/5',
      border: 'border-blue-500/30',
      text: 'text-blue-600'
    },
    green: {
      gradient: 'from-green-500 to-emerald-600',
      bg: 'from-green-500/10 to-emerald-500/5',
      border: 'border-green-500/30',
      text: 'text-green-600'
    }
  };

  return (
    <section className="py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#8B2325]/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Enhanced Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8B2325]/10 to-blue-500/10 rounded-full mb-8">
            <span className="text-caption text-[#8B2325] dark:text-red-400 font-semibold">Simple Process</span>
          </div>
          
          <h2 className="text-h2 text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-[#8B2325] via-blue-600 to-[#8B2325] bg-clip-text text-transparent font-black">
            How It Works
          </h2>
          
          <p className="text-body text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From idea to impact in three simple steps. Join thousands making a difference across Nepal.
          </p>
        </motion.div>

        {/* Interactive Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-20">
          {steps.map((step, index) => {
            const scheme = colorSchemes[step.color];
            const isActive = activeStep === index;
            
            return (
              <motion.div 
                key={index} 
                className="group relative cursor-pointer"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Connection Line (except last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600 z-0">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${scheme.gradient} origin-left`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isActive ? 1 : 0.3 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
                
                {/* Card */}
                <div className={`relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border-2 ${isActive ? scheme.border : 'border-white/20 dark:border-gray-700/20'} p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group-hover:bg-white/80 dark:group-hover:bg-gray-800/80`}>
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -right-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${scheme.gradient} text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg`}>
                      {step.stepNumber}
                    </div>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-20 h-20 ${step.iconBg} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-4xl">{step.icon}</span>
                  </div>
                  
                  {/* Content */}
                  <h3 className={`text-h3 text-2xl font-bold mb-4 ${scheme.text} dark:text-white group-hover:${scheme.text} transition-colors duration-300`}>
                    {step.title}
                  </h3>
                  
                  <p className="text-body text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {step.description}
                  </p>
                  
                  {/* Expanded detail on hover */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ 
                      opacity: isActive ? 1 : 0, 
                      height: isActive ? 'auto' : 0 
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className={`bg-gradient-to-r ${scheme.bg} rounded-2xl p-4 border ${scheme.border}`}>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${scheme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/20 p-12 shadow-2xl max-w-4xl mx-auto">
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="text-6xl">🎯</div>
              <div>
                <h3 className="text-h3 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Ready to Make History?
                </h3>
                <p className="text-body text-gray-600 dark:text-gray-300">
                  Join {stats?.totalUsers?.formatted || '1,250+'} changemakers already transforming Nepal
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/start-campaign">
                <motion.button 
                  className="group relative py-4 px-8 bg-gradient-to-r from-[#8B2325] via-[#a32729] to-[#8B2325] text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center">
                    <span className="text-2xl mr-2">🚀</span>
                    Start Your Campaign Now
                  </span>
                </motion.button>
              </Link>
              
              <Link to="/explore">
                <motion.button
                  className="py-4 px-8 border-2 border-[#8B2325] bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 dark:border-red-400 text-[#8B2325] dark:text-red-400 font-bold rounded-xl hover:bg-[#8B2325] hover:text-white dark:hover:bg-red-400 dark:hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center">
                    <span className="text-2xl mr-2">👀</span>
                    Explore Active Campaigns
                  </span>
                </motion.button>
              </Link>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>5% platform fee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>Secure payments</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
