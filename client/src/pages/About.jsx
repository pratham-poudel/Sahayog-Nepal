import { motion } from 'framer-motion';
import SEO from '../utils/seo.jsx';
import { aboutContent, faqItems } from '../data/stats';
import Team from './Team.jsx';

const About = () => {
  const stats = [
    { value: '120,000+', label: 'Donors' },
    { value: '3,500+', label: 'Campaigns' },
    { value: 'Rs. 185M+', label: 'Raised' },
    { value: '28', label: 'Districts Reached' },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Start a Campaign',
      description: 'Create your fundraiser in minutes with our easy-to-use platform. Share your story and set your fundraising goal.',
      icon: 'ri-flag-line',
    },
    {
      step: 2,
      title: 'Share with Friends',
      description: 'Spread the word through social media, email, and messaging to reach potential donors across Nepal and worldwide.',
      icon: 'ri-share-line',
    },
    {
      step: 3, 
      title: 'Collect Donations',
      description: 'Receive donations quickly with our secure payment system. Track your progress in real-time on your dashboard.',
      icon: 'ri-money-rupee-circle-line',
    },
    {
      step: 4,
      title: 'Create Impact',
      description: 'Withdraw funds efficiently to your bank account and start making a difference in your community.',
      icon: 'ri-heart-pulse-line',
    }
  ];

  return (
    <>
      <SEO 
        title="About Us" 
        description="Learn about Sahayog Nepal, Nepal's first crowdfunding platform connecting those in need with those who can help."
        keywords="about Sahayog Nepal, crowdfunding mission, Nepal donation platform"
      />
      
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block bg-primary-100 text-primary-800 rounded-full px-4 py-1 mb-4 text-sm font-medium">
              Nepal's First Crowdfunding Platform
            </div>
            <h1 className="text-3xl md:text-5xl font-poppins font-bold mb-6">About Sahayog Nepal</h1>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Building a platform where generosity and community unite to empower Nepal's future, one campaign at a time.
            </p>
          </motion.div>
          
          {/* Hero Image with Overlay */}
          <div className="relative rounded-xl overflow-hidden mb-20 h-96">
            <img 
              src="https://images.unsplash.com/photo-1605745341112-85968b19335b" 
              alt="Nepal landscape" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/70 to-transparent flex items-center">
              <div className="max-w-xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">Empowering Communities Across Nepal</h2>
                <p className="mb-6">Founded in 2020, Sahayog Nepal has helped thousands of individuals and communities raise funds for causes that matter.</p>
                <button className="bg-white text-primary-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors">
                  Our Story
                </button>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-md"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-4xl font-bold text-primary-600 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="h-14 w-14 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mb-6">
                <i className="ri-focus-3-line text-2xl"></i>
              </div>
              <h2 className="text-2xl font-poppins font-semibold mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">{aboutContent.mission}</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="h-14 w-14 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mb-6">
                <i className="ri-eye-line text-2xl"></i>
              </div>
              <h2 className="text-2xl font-poppins font-semibold mb-4">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed">{aboutContent.vision}</p>
            </motion.div>
          </div>
          
          {/* How It Works */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-poppins font-bold mb-4">How Our Platform Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We've made crowdfunding simple and accessible for everyone in Nepal. Here's how our platform empowers communities:
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {howItWorks.map((item, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-md relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="absolute -top-4 -left-4 h-12 w-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {item.step}
                  </div>
                  <div className="h-12 w-12 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mb-4">
                    <i className={`${item.icon} text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Our History */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-poppins font-bold mb-8 text-center">Our Journey</h2>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5">
                  <img 
                    src="https://images.unsplash.com/photo-1595427648952-c59163b40315" 
                    alt="Community rebuilding efforts" 
                    className="rounded-lg w-full h-auto shadow-lg"
                  />
                </div>
                <div className="md:col-span-7">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="h-6 w-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
                        <h3 className="font-semibold">The Beginning (2020)</h3>
                      </div>
                      <p className="text-gray-700 pl-9">Started with a team of three passionate individuals after witnessing the need for organized fundraising following the 2015 earthquake recovery efforts.</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="h-6 w-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
                        <h3 className="font-semibold">Growth Phase (2021-2022)</h3>
                      </div>
                      <p className="text-gray-700 pl-9">Expanded to support diverse causes across all regions of Nepal, developed partnerships with local NGOs, and implemented secure payment infrastructure.</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="h-6 w-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
                        <h3 className="font-semibold">Today</h3>
                      </div>
                      <p className="text-gray-700 pl-9">Nepal's leading crowdfunding platform with over 120,000 donors, supporting thousands of campaigns and making real impact in communities throughout the country.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <Team />
          
          {/* Our Values */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-poppins font-bold mb-8 text-center">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {aboutContent.values.map((value, index) => (
                <motion.div 
                  key={index} 
                  className="bg-white p-8 rounded-xl shadow-md border-t-4 border-primary-600"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="h-14 w-14 bg-primary-100 text-primary-600 flex items-center justify-center rounded-full mb-4">
                    <i className={`ri-heart-line text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-700">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Platform Fee Section */}
          <motion.div 
            className="mb-20 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl overflow-hidden text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 md:p-12">
                <h2 className="text-3xl font-poppins font-bold mb-4">How We Sustain Our Platform</h2>
                <p className="mb-6 text-primary-100">
                  Sahayog Nepal operates with a flexible fee model that allows us to maintain our platform while ensuring maximum impact for campaigns.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex">
                    <div className="flex-shrink-0 h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                      <i className="ri-check-line text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Optional Platform Fee</h3>
                      <p className="text-primary-100">Donors can choose to add a tip (2.5% to 100%) to support our operations</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                      <i className="ri-check-line text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Transparent Pricing</h3>
                      <p className="text-primary-100">No hidden costs or charges for campaign creators</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                      <i className="ri-check-line text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Secure Payment Processing</h3>
                      <p className="text-primary-100">Industry-standard security to protect all transactions</p>
                    </div>
                  </div>
                </div>
                <a href="/start-campaign" className="inline-block bg-white text-primary-800 py-3 px-6 rounded-lg font-medium hover:bg-primary-50 transition-colors">
                  Start Fundraising
                </a>
              </div>
              <div className="hidden md:flex items-center justify-center bg-white/10 p-10">
                <img 
                  src="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf" 
                  alt="Digital payment illustration" 
                  className="max-h-80 rounded-lg shadow-xl"
                />
              </div>
            </div>
          </motion.div>
          
          {/* FAQ Section */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-poppins font-bold mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {faqItems.map((item, index) => (
                <motion.div 
                  key={index}
                  className={`border-b border-gray-200 ${index === faqItems.length - 1 ? 'border-b-0' : ''}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <details className="group">
                    <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                      <span className="font-medium">{item.question}</span>
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24">
                          <path d="M6 9l6 6 6-6"></path>
                        </svg>
                      </span>
                    </summary>
                    <p className="px-6 py-4 text-gray-700">{item.answer}</p>
                  </details>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Call to Action */}
          <motion.div 
            className="bg-primary-50 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 md:p-12">
                <h2 className="text-3xl font-poppins font-bold mb-4">Ready to Make a Difference?</h2>
                <p className="text-gray-700 mb-8">
                  Whether you need support for your cause or want to help others, Sahayog Nepal gives you the tools to create meaningful change. Join our growing community today.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <motion.a 
                    href="/start-campaign" 
                    className="py-3 px-8 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start a Campaign
                  </motion.a>
                  <motion.a 
                    href="/explore" 
                    className="py-3 px-8 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore Campaigns
                  </motion.a>
                </div>
              </div>
              <div className="hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1469571486292-b53601021a68" 
                  alt="People collaborating" 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default About;
