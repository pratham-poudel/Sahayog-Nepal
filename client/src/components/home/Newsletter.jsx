import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        title: "Subscription successful!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail('');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-[#8B2325]/10 to-amber-500/10 dark:from-[#8B2325]/20 dark:to-amber-500/20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1.5 bg-[#8B2325]/10 dark:bg-[#8B2325]/20 text-[#8B2325] dark:text-amber-400 rounded-full text-sm font-medium mb-3">Stay Connected</span>
          <h2 className="text-2xl md:text-3xl font-poppins font-bold mb-4 text-gray-900 dark:text-white">Join Our Newsletter</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Stay updated on new campaigns, success stories, and ways to make a difference in Nepal.</p>
          
          <form 
            className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3"
            onSubmit={handleSubmit}
          >
            <div className="relative flex-grow">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#8B2325] dark:focus:ring-amber-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {email === '' && <div className="w-0.5 h-5 bg-gray-300 dark:bg-gray-600 animate-pulse hidden"></div>}
              </div>
            </div>
            <motion.button 
              type="submit" 
              className="py-3 px-6 bg-gradient-to-r from-[#8B2325] to-[#a32729] text-white font-medium rounded-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Subscribing...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Subscribe</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </motion.button>
          </form>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">By subscribing, you agree to our Privacy Policy and consent to receive updates from Sahayog Nepal.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
