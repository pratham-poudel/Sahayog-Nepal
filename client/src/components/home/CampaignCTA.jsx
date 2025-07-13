import { Link } from 'wouter';
import { motion } from 'framer-motion';

const CampaignCTA = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 dark:opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#8B2325]/30 dark:bg-[#8B2325]/40 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-amber-500/30 dark:bg-amber-500/40 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1.5 w-12 bg-gradient-to-r from-[#8B2325] to-amber-500 rounded-full"></div>
                  <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#8B2325]/10 to-amber-500/10 text-[#8B2325] dark:text-amber-400 rounded-full text-sm font-semibold">Start Today</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-poppins font-bold mb-6 bg-gradient-to-r from-[#8B2325] to-amber-600 bg-clip-text text-transparent">Ready to Start Your Fundraising Journey?</h2>
                
                <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                  Whether it's for education, healthcare, disaster relief, or community development - your cause matters. Launch your campaign in minutes and start making a difference.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5">
                  <Link to="/start-campaign">
                    <motion.button 
                      className="py-4 px-8 bg-gradient-to-r from-[#8B2325] to-[#a32729] text-white font-medium rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <i className="ri-flag-line mr-2 text-xl"></i>
                      Create a Campaign
                    </motion.button>
                  </Link>
                  <Link to="/about">
                    <motion.button 
                      className="py-4 px-8 border-2 border-[#8B2325] text-[#8B2325] dark:text-amber-400 dark:border-amber-400 font-medium rounded-xl hover:bg-[#8B2325]/5 dark:hover:bg-amber-400/5 transition-all duration-300 flex items-center justify-center"
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)" 
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <i className="ri-information-line mr-2 text-xl"></i>
                      Learn More
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#8B2325]/80 to-amber-600/60 mix-blend-multiply z-10"></div>
              <motion.div
                className="absolute top-0 left-0 w-full h-full bg-black/40 z-20"
                initial={{ opacity: 1 }}
                whileInView={{ opacity: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              />

              <div className="relative h-full min-h-[300px] md:min-h-0 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1596367407372-96cb88503db6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Community volunteers working together" 
                  className="w-full h-full object-cover"
                  width="600"
                  height="450"
                  loading="lazy"
                />
                
                {/* Floating testimonial */}
                <motion.div 
                  className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl shadow-lg z-30 border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://randomuser.me/api/portraits/women/42.jpg"
                      alt="Campaign Creator" 
                      className="w-12 h-12 rounded-full border-2 border-[#8B2325]"
                      width="48"
                      height="48"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">"Sahayog Nepal helped me raise funds for my school in just 2 weeks!"</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">- Anita Sharma, Campaign Creator</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {[
            { value: "500+", label: "Campaigns", icon: "ri-flag-line" },
            { value: "75M+", label: "Rupees Raised", icon: "ri-money-rupee-circle-line" },
            { value: "5,000+", label: "Donors", icon: "ri-user-heart-line" },
            { value: "35+", label: "Districts", icon: "ri-map-pin-line" }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-4"
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <div className="bg-gradient-to-br from-[#8B2325]/10 to-amber-500/10 p-3 rounded-lg">
                <i className={`${stat.icon} text-2xl text-[#8B2325] dark:text-amber-400`}></i>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CampaignCTA;
