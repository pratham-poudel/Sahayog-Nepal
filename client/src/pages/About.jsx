import { motion } from 'framer-motion';
import { ChevronRight, Heart, Target, Eye, Shield, Users, ArrowRight } from 'lucide-react';
import SEO from '../utils/seo.jsx';
import { aboutContent, faqItems } from '../data/stats';

const About = () => {
  const stats = [
    { value: 'Growing', label: 'Donor Community', icon: Users },
    { value: 'Active', label: 'Campaign Platform', icon: Target },
    { value: 'Secure', label: 'Payment System', icon: Shield },
    { value: 'All Nepal', label: 'Coverage', icon: Heart },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create Your Campaign',
      description: 'Set up your fundraiser with basic details about your cause and funding goal.',
      icon: Target,
    },
    {
      step: 2,
      title: 'Share Your Story',
      description: 'Spread the word through social media and reach potential supporters.',
      icon: Users,
    },
    {
      step: 3, 
      title: 'Receive Donations',
      description: 'Accept contributions through our secure payment system.',
      icon: Shield,
    },
    {
      step: 4,
      title: 'Withdraw Funds',
      description: 'Get your funds transferred directly to your bank account.',
      icon: Heart,
    }
  ];

  return (
    <>
      <SEO 
        title="About Us" 
        description="Learn about Sahayog Nepal, Nepal's first crowdfunding platform connecting those in need with those who can help."
        keywords="about Sahayog Nepal, crowdfunding mission, Nepal donation platform"
      />
      
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section with Gradient and Image */}
        <div className="relative bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#b12a2c] text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/50 to-transparent"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
              {/* Left Side - Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="text-white"
              >
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-white/80 mb-8">
                  <a href="/" className="hover:text-white transition-colors">Home</a>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white font-medium">About Us</span>
                </nav>

                <div className="inline-block bg-white/20 backdrop-blur-sm text-white rounded-full px-4 py-2 mb-6 text-sm font-medium">
                  Bringing Transparency to Crowdfunding in Nepal
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  About Sahayog Nepal
                </h1>
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
                  A transparent crowdfunding platform where every donation is tracked, every campaign is accountable, and donors can see exactly how their contributions make a difference.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/start-campaign" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#8B2325] rounded-xl hover:bg-gray-100 transition-colors font-semibold shadow-lg"
                  >
                    Start a Campaign
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a 
                    href="/explore" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-colors font-semibold"
                  >
                    Browse Campaigns
                  </a>
                </div>
              </motion.div>

              {/* Right Side - Image */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative hidden lg:block"
              >
                <div className="relative w-full max-w-md mx-auto">
                  <div className="relative aspect-[3/4] bg-white rounded-2xl p-4 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1531482615713-2afd69097998" 
                      alt="Nepal community" 
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 rounded-xl pointer-events-none"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <stat.icon className="w-8 h-8 text-[#8B2325] mb-4" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12">
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#8B2325]/10 rounded-2xl">
                  <Target className="w-8 h-8 text-[#8B2325]" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {aboutContent.mission}
                </p>
              </motion.div>
              
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#8B2325]/10 rounded-2xl">
                  <Eye className="w-8 h-8 text-[#8B2325]" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Our Vision</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {aboutContent.vision}
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* The Story Section */}
        <div className="py-20 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                How It Started
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                From Facebook scams to transparent crowdfunding - building accountability into fundraising
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'The Problem',
                  description: 'While browsing Facebook and other social platforms, I noticed people collecting funds without proper verification or transparency. Many turned out to be scams, leaving donors with no way to track where their money went or if the cause was even legitimate.'
                },
                {
                  step: '02',
                  title: 'The Solution',
                  description: 'As an international student from Chandrauta, Kapilvastu studying BTech in India, I realized Nepal needed a transparent platform where donors could see exactly who donated, how much was collected, and how funds were being used - bringing accountability to crowdfunding.'
                },
                {
                  step: '03',
                  title: 'Today',
                  description: 'Sahayog Nepal is live, providing a transparent medium for fundraising in Nepal. Every donation is tracked, every rupee is accounted for, and campaign updates keep donors informed about how their contributions are making a difference.'
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-6xl font-bold text-[#8B2325]/20 mb-4">{item.step}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Built & Managed By
              </h2>
            </motion.div>

            <motion.div 
              className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-[#8B2325]/10 rounded-2xl flex items-center justify-center">
                    <Users className="w-16 h-16 text-[#8B2325]" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pratham Poudel</h3>
                  <p className="text-lg text-[#8B2325] font-medium mb-4">Founder & Developer</p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    2nd year BTech student from Chandrauta, Kapilvastu, currently studying in India as an international student. 
                    Built and manages Sahayog Nepal - handling everything from development to operations.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Database • Backend • Frontend • DevOps • Business
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-20 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Four simple steps to start your fundraising campaign
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <motion.div 
                  key={index}
                  className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#8B2325] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                  <item.icon className="w-10 h-10 text-[#8B2325] mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Values Section */}
        <div className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                What We Stand For
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Simple principles that guide how we build and run this platform
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aboutContent.values.map((value, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl hover:shadow-lg transition-all group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-14 h-14 bg-[#8B2325]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#8B2325] transition-colors">
                    <Heart className="w-7 h-7 text-[#8B2325] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-20 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Common Questions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Everything you need to know about the platform
              </p>
            </motion.div>
            
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <details className="group">
                    <summary className="flex justify-between items-center px-8 py-6 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <span className="font-semibold text-gray-900 dark:text-white">{item.question}</span>
                      <span className="transition group-open:rotate-180 flex-shrink-0 ml-4">
                        <ChevronRight className="w-5 h-5 text-gray-500 rotate-90" />
                      </span>
                    </summary>
                    <div className="px-8 py-6 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700">
                      {item.answer}
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div 
              className="bg-gradient-to-br from-[#8B2325] to-[#b12a2c] rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="p-12">
                  <h2 className="text-4xl font-bold text-white mb-6">Ready to Start?</h2>
                  <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    Create your campaign or support existing ones. Whether you need help or want to give it, start here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href="/start-campaign" 
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#8B2325] rounded-xl hover:bg-gray-100 transition-colors font-semibold shadow-lg"
                    >
                      Create Campaign
                      <ArrowRight className="w-5 h-5" />
                    </a>
                    <a 
                      href="/explore" 
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-colors font-semibold"
                    >
                      Browse Campaigns
                    </a>
                  </div>
                </div>
                <div className="hidden md:block h-full">
                  <img 
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3" 
                    alt="Community support" 
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
