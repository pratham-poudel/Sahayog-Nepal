import { Link } from 'wouter';
import { motion } from 'framer-motion';

const EarnWithUs = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Testimonials from content creators
  const testimonials = [
    {
      id: 1,
      name: "Aanya Sharma",
      role: "Content Writer",
      image: "https://randomuser.me/api/portraits/women/12.jpg",
      quote: "Writing blogs for Sahayog has been incredibly rewarding. Not only do I earn extra income, but I'm helping spread awareness about important social causes.",
      earnings: "NPR 5,500 earned from 6 articles"
    },
    {
      id: 2,
      name: "Rohit Patel",
      role: "Video Content Creator",
      image: "https://randomuser.me/api/portraits/men/33.jpg",
      quote: "My video script idea was selected and produced. The team was professional and I received full credit. The extra income was a great bonus!",
      earnings: "NPR 2,000 earned from 1 video script"
    }
  ];

  // Process steps
  const howItWorks = [
    {
      step: 1,
      title: "Choose Your Skill",
      description: "Select the opportunity that matches your skills and interests - writing, video concepts, or joining our team.",
      icon: (
        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      step: 2,
      title: "Create & Submit",
      description: "Use our easy-to-use tools to create your content or application, then submit for review.",
      icon: (
        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      step: 3,
      title: "Get Reviewed & Approved",
      description: "Our editorial team reviews submissions. Constructive feedback helps you improve your content.",
      icon: (
        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      step: 4,
      title: "Earn & Build Your Profile",
      description: "Get paid for approved content and build your portfolio as a verified contributor.",
      icon: (
        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Hero Section with animated background */}
      <section className="relative bg-gradient-to-r from-[#8B2325] to-[#a32729] py-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full"></div>
          <div className="absolute top-20 -left-20 w-60 h-60 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Earn With Us
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Share your skills, support our mission, and earn rewards while making a real impact on communities across Nepal
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link href="/blog/write">
                <div className="inline-block bg-white text-[#8B2325] font-semibold px-10 py-5 rounded-lg shadow-xl transition transform hover:scale-105 hover:shadow-2xl text-lg">
                  Start Earning Now
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent"></div>
      </section>
      
      {/* How It Works Steps */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We've designed a simple process that allows you to contribute your talents, get recognized, and earn rewards.
            </p>
          </motion.div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={item.step}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-600 text-center relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-16 h-16 bg-[#8B2325]/10 dark:bg-[#8B2325]/20 text-[#8B2325] rounded-full flex items-center justify-center mb-6 mx-auto">
                    {item.icon}
                  </div>
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#8B2325] rounded-full text-white flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Earning Options */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#8B2325]/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-[#8B2325]/5 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your Path
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Select the option that aligns with your skills and interests. Each opportunity offers unique benefits and rewards.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 lg:gap-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Blog Writing */}
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group hover:transform hover:scale-105 transition-all duration-300"
              variants={itemVariants}
            >
              <div className="h-48 bg-blue-600 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80" 
                  alt="Blog writing"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-blue-600/60 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  Blog Writing
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  Write informative and engaging blogs on crowdfunding, social impact, and community development.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Earn NPR 500-1,000</span> per accepted blog</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Choose from 5 professional</span> blog templates</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Build your portfolio</span> with published content</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Editorial support</span> to refine your writing</p>
                  </div>
                </div>
                <div className="text-center">
                  <Link href="/blog">
                    <div className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg">
                      Explore Blogs
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
            
            {/* Video Ideas */}
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group hover:transform hover:scale-105 transition-all duration-300"
              variants={itemVariants}
            >
              <div className="h-48 bg-purple-600 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1601158935942-52255782d322?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80" 
                  alt="Video ideas"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-purple-600/60 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  Video Ideas
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  Submit creative video scripts and ideas that can help promote our platform and mission.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Earn up to NPR 2,000</span> for selected ideas</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Recognition in final video</span> credits and promotions</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Opportunity for ongoing</span> creative collaboration</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Help spread awareness</span> about important causes</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-block px-8 py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg cursor-not-allowed opacity-75 relative">
                    <span className="absolute -top-2 -right-2 bg-[#8B2325] text-white text-xs px-2 py-1 rounded-full font-bold">Coming Soon</span>
                    Join Waiting List
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Join Our Team */}
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 group hover:transform hover:scale-105 transition-all duration-300"
              variants={itemVariants}
            >
              <div className="h-48 bg-green-600 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80" 
                  alt="Join our team"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-green-600/60 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  Join Our Team
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  Convince us why you'd be a great addition to our team, regardless of your background.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Potential part-time or full-time</span> positions</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Flexible remote work</span> options available</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Be part of a mission-driven</span> organization</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Growth opportunities</span> in an expanding company</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-block px-8 py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg cursor-not-allowed opacity-75 relative">
                    <span className="absolute -top-2 -right-2 bg-[#8B2325] text-white text-xs px-2 py-1 rounded-full font-bold">Coming Soon</span>
                    View Opportunities
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Success Stories
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Hear from people who have already joined our community of creators.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <motion.div 
                key={testimonial.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 shadow-lg relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: testimonial.id * 0.1 }}
              >
                <div className="absolute top-8 right-8 text-[#8B2325]/20 dark:text-[#8B2325]/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-white shadow-lg"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg italic relative z-10">
                  "{testimonial.quote}"
                </p>
                <div className="bg-[#8B2325] text-white px-4 py-2 rounded-lg text-sm font-medium inline-block mt-2">
                  {testimonial.earnings}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-[#8B2325] to-[#a32729] relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
              Ready to Share Your Talents?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
              Join our community of creators and earn rewards while helping us grow our platform and impact.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/blog/write">
                <div className="px-10 py-5 bg-white hover:bg-gray-100 text-[#8B2325] rounded-lg shadow-2xl font-semibold transition-all duration-300 transform hover:scale-105 text-lg">
                  Start Writing
                </div>
              </Link>
              <Link href="/blog">
                <div className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-lg shadow-2xl font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105 text-lg">
                  Explore Our Blog
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EarnWithUs; 