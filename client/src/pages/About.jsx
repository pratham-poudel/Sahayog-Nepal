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
      description: 'Get your funds transferred directly to your bank accounts.',
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
                  Registered under Company Registration Act, 2034 B.S.
                </div>
                <h1 className="text-5xl md:text-7xl font-serif italic mb-6 leading-tight text-teal-50">
                  Keep Spreading Love! ❤️
                </h1>
                <h2 className="text-2xl md:text-3xl font-light text-white/90 mb-8">
                  With Sahayog Nepal's Social Impact Plan
                </h2>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 font-light">
                  A transparent and trustworthy digital platform fostering mutual support and social solidarity across Nepal through accountable crowdfunding.
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
                      src="https://kettocdn.gumlet.io/media/banner/0/95/image/bc5ae443b8da492ff0c97082e2981ada078e385d.jpg?w=auto&dpr=1.3" 
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 dark:bg-[#8B2325]/10 rounded-2xl">
                  <Target className="w-8 h-8 text-teal-600 dark:text-[#8B2325]" />
                </div>
                <h2 className="text-4xl font-serif italic text-teal-700 dark:text-teal-300">Our Mission</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light">
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 dark:bg-[#8B2325]/10 rounded-2xl">
                  <Eye className="w-8 h-8 text-teal-600 dark:text-[#8B2325]" />
                </div>
                <h2 className="text-4xl font-serif italic text-teal-700 dark:text-teal-300">Our Vision</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light">
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
              <h2 className="text-5xl md:text-6xl font-serif italic text-teal-700 dark:text-teal-300 mb-4">
                Introduction
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
                Building a culture of mutual support and solidarity through modern technology
              </p>
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-sm border-l-4 border-[#8B2325]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-light">
                In Nepal, there has been a recognized need to establish an institution named <span className="font-serif italic text-[#8B2325] text-xl">"Sahayog Nepal"</span> to promote the spirit of social assistance, unity, and philanthropy among citizens, and to strengthen the culture of mutual cooperation and empathy.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-light">
                Our primary purpose is to coordinate assistance through a convenient, transparent, and trustworthy digital platform using modern technology to provide timely support to economically disadvantaged, vulnerable individuals, and those facing sudden crises in areas such as health, education, natural disasters, human welfare, and emergency situations.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                This institution is firmly committed to upholding the principles of transparency, accountability, and responsibility in the assistance process, and to contributing to the development of a responsible digital support culture based on mutual trust and cooperation between donors and beneficiaries. This constitution has been prepared in accordance with the <span className="font-medium text-[#8B2325]">Company Registration Act, 2034 B.S.</span>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-serif italic text-teal-700 dark:text-teal-300 mb-4">
                Our Objectives
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
                The guiding principles that define our institutional purpose
              </p>
            </motion.div>

            <div className="grid md:grid-cols-1 gap-8">
              {[
                {
                  number: '1',
                  title: 'Establish Transparent Digital Infrastructure',
                  description: 'To establish and operate a convenient, transparent, and trustworthy digital platform for the collection and distribution of voluntary financial assistance from individuals, communities, and institutions, promoting the spirit of social support, unity, and philanthropy.'
                },
                {
                  number: '2',
                  title: 'Provide Emergency Financial Support',
                  description: 'To arrange financial resources to provide necessary assistance to economically vulnerable, disadvantaged, or individuals facing sudden crises in health treatment, education, natural disasters, human welfare, and other emergency situations.'
                },
                {
                  number: '3',
                  title: 'Foster Accountable Support Culture',
                  description: 'To ensure transparency, accountability, and responsibility in the assistance process and contribute to the development of a responsible digital support culture based on mutual trust and cooperation between donors and beneficiaries.'
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="bg-gradient-to-br from-teal-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-8 md:p-10 shadow-sm hover:shadow-lg transition-all border-l-4 border-[#8B2325]"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#8B2325] to-[#b12a2c] text-white rounded-full flex items-center justify-center font-serif italic text-2xl shadow-lg">
                        {item.number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-3">{item.title}</h3>
                      <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-light">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
              <h2 className="text-5xl md:text-6xl font-serif italic text-teal-700 dark:text-teal-300 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
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
              <h2 className="text-5xl md:text-6xl font-serif italic text-teal-700 dark:text-teal-300 mb-4">
                What We Stand For
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
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
              <h2 className="text-5xl md:text-6xl font-serif italic text-teal-700 dark:text-teal-300 mb-4">
                Common Questions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-light">
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
                  <h2 className="text-5xl font-serif italic text-white mb-6">Ready to Start?</h2>
                  <p className="text-xl text-white/90 mb-8 leading-relaxed font-light">
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
