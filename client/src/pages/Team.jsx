import { motion } from 'framer-motion';
import SEO from '../utils/seo.jsx';
import { teamMembers } from '../data/stats';

const Team = () => {
  return (
    <>
      <SEO 
        title="Our Team" 
        description="Meet the dedicated team behind Sahayog Nepal who are working to empower communities across Nepal through innovative crowdfunding."
        keywords="Sahayog Nepal team, crowdfunding experts, Nepal social enterprise"
      />
      
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-4">Meet Our Team</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The dedicated professionals who are working to empower communities across Nepal through innovative crowdfunding solutions.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={member.id}
                className="bg-white rounded-xl overflow-hidden shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-poppins font-semibold text-xl mb-1">{member.name}</h3>
                  <p className="text-primary-600 font-medium text-sm mb-4">{member.role}</p>
                  <p className="text-gray-600 mb-4">{member.bio}</p>
                  <div className="flex space-x-3">
                    {member.social.linkedin && (
                      <a 
                        href={member.social.linkedin} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <i className="ri-linkedin-fill text-lg"></i>
                      </a>
                    )}
                    {member.social.twitter && (
                      <a 
                        href={member.social.twitter} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-gray-500 hover:text-blue-400"
                      >
                        <i className="ri-twitter-fill text-lg"></i>
                      </a>
                    )}
                    {member.social.facebook && (
                      <a 
                        href={member.social.facebook} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-gray-500 hover:text-blue-700"
                      >
                        <i className="ri-facebook-fill text-lg"></i>
                      </a>
                    )}
                    {member.social.instagram && (
                      <a 
                        href={member.social.instagram} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-gray-500 hover:text-pink-600"
                      >
                        <i className="ri-instagram-line text-lg"></i>
                      </a>
                    )}
                    {member.social.github && (
                      <a 
                        href={member.social.github} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-gray-500 hover:text-gray-900"
                      >
                        <i className="ri-github-fill text-lg"></i>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Join Our Team Section */}
          <motion.div 
            className="bg-nepal-blue/10 rounded-xl p-8 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-poppins font-semibold mb-4">Join Our Team</h2>
                <p className="text-gray-700 mb-6">
                  We're always looking for passionate individuals who are committed to making a difference in Nepal. If you're dedicated to social impact and want to be part of our mission, we'd love to hear from you.
                </p>
                <motion.a 
                  href="#" 
                  className="inline-flex items-center py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Open Positions
                  <i className="ri-arrow-right-line ml-2"></i>
                </motion.a>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1606819717115-9159c900370b" 
                  alt="Team collaboration" 
                  className="rounded-lg w-full"
                />
              </div>
            </div>
          </motion.div>
          
          {/* Our Partners */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-poppins font-semibold mb-8 text-center">Our Partners</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-6 rounded-xl flex items-center justify-center shadow-md"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <i className={`ri-building-${index + 1}-line text-3xl text-gray-500`}></i>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Contact Us CTA */}
          <motion.div 
            className="bg-primary-50 rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-poppins font-semibold mb-4">Get in Touch</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Have questions for our team? We'd love to hear from you. Reach out to us and we'll get back to you as soon as possible.
            </p>
            <motion.a 
              href="mailto:info@sahayognepal.com" 
              className="py-3 px-8 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Us
            </motion.a>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Team;
