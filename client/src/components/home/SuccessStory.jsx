import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { successStory } from '../../data/stats';

const SuccessStory = () => {
  return (
    <section className="py-16 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1571388208497-71bedc66e932?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80" 
          alt="Nepal mountains" 
          className="w-full h-full object-cover opacity-20"
          loading="lazy"
        />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-3 py-1 bg-primary-500 bg-opacity-30 text-primary-300 rounded-full text-sm font-medium mb-4">Success Story</span>
          <h2 className="text-2xl md:text-3xl font-poppins font-bold mb-4">{successStory.title}</h2>
          <p className="text-gray-300">{successStory.description}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div 
            className="rounded-xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <img 
              src={successStory.image}
              alt="Rebuilding efforts in Sindhupalchok" 
              className="w-full"
              loading="lazy"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center mb-6">
              <div className="flex -space-x-2 mr-4">
                {successStory.leaders.map((leader, index) => (
                  <img 
                    key={index}
                    className="h-10 w-10 rounded-full border-2 border-gray-900" 
                    src={leader.image} 
                    alt={leader.name}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm text-gray-300">Led by</p>
                <p className="font-medium">Ramesh Karki & Community Leaders</p>
              </div>
            </div>
            
            <blockquote className="text-lg italic text-gray-300 mb-6">{successStory.quote}</blockquote>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Rs. {successStory.raised.toLocaleString()} raised</span>
                <span className="text-gray-400">Target exceeded by {Math.round((successStory.raised / successStory.target * 100) - 100)}%</span>
              </div>
              <div className="progress-bar bg-gray-700">
                <div className="progress-value" style={{ width: '100%', backgroundColor: '#10B981' }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              {successStory.impact.map((item, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <p className="font-bold text-xl">{item.value}</p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
            
            <Link href="/success-stories">
  <motion.span 
    className="inline-flex items-center text-primary-300 hover:text-primary-200 font-medium cursor-pointer"
    whileHover={{ x: 5 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    Read Full Story
    <i className="ri-arrow-right-line ml-2"></i>
  </motion.span>
</Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStory;
