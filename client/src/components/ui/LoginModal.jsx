import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { UIContext } from '../../App';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '../../contexts/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const uiContext = useContext(UIContext);
  const { toast } = useToast();
  const { loginAndRedirect } = useAuthContext();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const success = await loginAndRedirect(data.email, data.password);
      if (success) {
        toast({
          title: "Login successful",
          description: "You are now logged in to your account.",
        });
        onClose();
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.1 } }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl max-w-md w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            variants={contentVariants}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 flex items-center justify-center bg-[#8B2325] rounded-full">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h3 className="text-xl font-poppins font-bold">
                    <span className="text-[#8B2325] dark:text-[#a32729]">Sahayog</span><span className="text-[#D5A021] dark:text-[#e5b43c]">Nepal</span>
                  </h3>
                </div>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={onClose}
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  className={`w-full py-2 px-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent`}
                  placeholder="your@email.com"
                  {...register("email", { required: "Email is required", pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address"
                  }})}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className={`w-full py-2 px-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent`}
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required", minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }})}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
                <div className="flex justify-end mt-1">
                  <a href="#" className="text-xs text-primary-600 hover:text-primary-700">Forgot Password?</a>
                </div>
              </div>
              
              <motion.button 
                type="submit" 
                className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-70"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </motion.button>
            </form>
            
            <div className="relative flex items-center justify-center mt-6 mb-6">
              <div className="border-t border-gray-300 absolute w-full"></div>
              <div className="bg-white px-4 relative z-10 text-sm text-gray-500">or continue with</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.button 
                className="py-2.5 px-4 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <i className="ri-google-fill text-red-500 mr-2"></i>
                <span className="text-sm font-medium">Google</span>
              </motion.button>
              <motion.button 
                className="py-2.5 px-4 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <i className="ri-facebook-fill text-blue-600 mr-2"></i>
                <span className="text-sm font-medium">Facebook</span>
              </motion.button>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <span>Don't have an account?</span>
              <motion.a 
                href="#" 
                className="text-primary-600 hover:text-primary-700 font-medium ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  uiContext.openRegisterModal();
                }}
                whileHover={{ scale: 1.05 }}
              >
                Sign Up
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
