import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useAuthContext } from '../contexts/AuthContext';
import TurnstileWidget from '../components/common/TurnstileWidget';
import { TURNSTILE_CONFIG } from '../config/index.js';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    otp: ''
  });  const { toast } = useToast();
  const { forceUpdate } = useAuthContext();
  const [, setLocation] = useLocation();
  
  // Turnstile handlers
  const handleTurnstileVerify = (token) => {
    console.log("Turnstile token received in signup");
    setTurnstileToken(token);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken('');
    toast({
      title: "Security verification expired",
      description: "Please verify security again before continuing.",
      variant: "destructive"
    });
  };

  const handleTurnstileError = () => {
    setTurnstileToken('');
    toast({
      title: "Security verification failed",
      description: "There was an error with the security verification. Please try again.",
      variant: "destructive"
    });
  };
  
  // Email form (Step 1)
  const { 
    register: registerEmail, 
    handleSubmit: handleEmailSubmit, 
    formState: { errors: emailErrors } 
  } = useForm({
    defaultValues: {
      email: userData.email
    }
  });
  
  // User details form (Step 2)
  const { 
    register: registerUserDetails, 
    handleSubmit: handleUserDetailsSubmit,
    watch: watchUserDetails,
    formState: { errors: userDetailsErrors } 
  } = useForm({
    defaultValues: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      password: userData.password,
      confirmPassword: ''
    }
  });
  
  // Get the current value of password for validation
  const password = watchUserDetails("password");
  
  // OTP form (Step 3)
  const { 
    register: registerOtp, 
    handleSubmit: handleOtpSubmit, 
    formState: { errors: otpErrors } 
  } = useForm({
    defaultValues: {
      otp: userData.otp
    }
  });
  // Update form input fields for dark mode visibility with enhanced styling
  const formInputClasses = `appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8B2325] focus:border-[#8B2325] sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800/70 dark:border-gray-700 backdrop-blur-sm transition-all duration-200`;
  // Define a function to reset Turnstile in case of errors
  const resetTurnstile = () => {
    // The TurnstileWidget component will handle this internally
    setTurnstileToken('');
  };
  
  // Handle email submission (Step 1)
  const onEmailSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Check if email is already in use
      const response = await apiRequest('POST', '/api/users/send-otp', { email: data.email });
      const result = await response.json();
      
      if (response.ok) {
        setUserData(prev => ({ ...prev, email: data.email }));
        toast({
          title: "Verification email sent",
          description: "We've sent a verification code to your email address."
        });
        setStep(2);
      } else {
        throw new Error(result.message || "Email verification failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Handle user details submission (Step 2)
  const onUserDetailsSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Verify that passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      // Verify Turnstile token is present
      if (!turnstileToken) {
        throw new Error("Please complete the security verification");
      }
      
      setUserData(prev => ({
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
        turnstileToken: turnstileToken
      }));
        setStep(3);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      
      // Reset turnstile if there was a verification error
      if (error.message && error.message === "Please complete the security verification") {
        resetTurnstile();
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Handle OTP verification (Step 3)
  const onOtpSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Verify OTP and create account
      const response = await apiRequest('POST', '/api/users/verify-otp', {
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone,
        password: userData.password,
        otp: data.otp,
        turnstileToken: userData.turnstileToken
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Save token to localStorage
        if (result.token) {
          localStorage.setItem('token', result.token);
          // Force update of authentication state
          if (typeof forceUpdate === 'function') {
            forceUpdate();
          }
        }
        
        toast({
          title: "Account created successfully",
          description: "Welcome! Your account has been created and you are now logged in."
        });
        
        setLocation('/dashboard');
      } else {
        throw new Error(result.message || "OTP verification failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      
      // If there was a security verification error, reset the turnstile and go back to step 2
      if (error.message && error.message.includes('Security verification')) {
        resetTurnstile();
        setStep(2);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render email form (Step 1)
  const renderEmailForm = () => (
    <form className="space-y-6" onSubmit={handleEmailSubmit(onEmailSubmit)}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`${formInputClasses} ${
              emailErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="you@example.com"
            {...registerEmail("email", { 
              required: "Email is required", 
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address"
              }
            })}
          />
          {emailErrors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {emailErrors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex justify-center py-3 px-4 bg-gradient-to-br from-[#8B2325] to-[#a32729] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <span>Continue</span>
          )}
        </motion.button>
      </div>
    </form>  );

  // Render user details form (Step 2)
  const renderUserDetailsForm = () => (
    <form className="space-y-6" onSubmit={handleUserDetailsSubmit(onUserDetailsSubmit)}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name
          </label>
          <div className="mt-1">
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={`${formInputClasses} ${
                userDetailsErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="John"
              {...registerUserDetails("firstName", { required: "First name is required" })}
            />
            {userDetailsErrors.firstName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {userDetailsErrors.firstName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name
          </label>
          <div className="mt-1">
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={`${formInputClasses} ${
                userDetailsErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Doe"
              {...registerUserDetails("lastName", { required: "Last name is required" })}
            />
            {userDetailsErrors.lastName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {userDetailsErrors.lastName.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            value={userData.email}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 sm:text-sm"
            readOnly
            disabled
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone Number
        </label>
        <div className="mt-1">
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className={`${formInputClasses} ${
              userDetailsErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="+977 9810000000"
            {...registerUserDetails("phone", { required: "Phone number is required" })}
          />
          {userDetailsErrors.phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {userDetailsErrors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={`${formInputClasses} ${
              userDetailsErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="••••••••"
            {...registerUserDetails("password", { 
              required: "Password is required", 
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters"
              }
            })}
          />
          {userDetailsErrors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {userDetailsErrors.password.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm Password
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={`${formInputClasses} ${
              userDetailsErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="••••••••"
            {...registerUserDetails("confirmPassword", { 
              required: "Please confirm your password",
              validate: value => value === password || "Passwords do not match"
            })}
          />
          {userDetailsErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {userDetailsErrors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Security Verification
        </label>
        <TurnstileWidget
          siteKey={TURNSTILE_CONFIG.siteKey}
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileExpire}
          onError={handleTurnstileError}
          theme="light"
        />
        {!turnstileToken && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Please complete the security verification before continuing
          </p>
        )}
        {turnstileToken && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Security verification completed
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          className="h-4 w-4 text-[#8B2325] focus:ring-[#8B2325] border-gray-300 dark:border-gray-600 rounded"
          required
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          I agree to the{' '}
          <button onClick={(e) => e.preventDefault()} className="font-medium text-[#8B2325] dark:text-[#e05759] hover:text-[#a32729]">
            Terms of Service
          </button>{' '}
          and{' '}
          <button onClick={(e) => e.preventDefault()} className="font-medium text-[#8B2325] dark:text-[#e05759] hover:text-[#a32729]">
            Privacy Policy
          </button>
        </label>
      </div>

      <div className="flex justify-between space-x-4">        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-all duration-200"
          onClick={() => setStep(1)}
        >
          Back
        </motion.button>        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-2/3 flex justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isLoading || !turnstileToken 
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-br from-[#8B2325] to-[#a32729] hover:shadow-lg'
          } text-white`}
          disabled={isLoading || !turnstileToken}
        >
          {isLoading ? (
            <span className="animate-pulse">Processing...</span>
          ) : !turnstileToken ? (
            <span>Complete verification to continue</span>
          ) : (
            <span>Continue</span>
          )}
        </motion.button>
      </div>
    </form>
  );

  // Render OTP verification form (Step 3)
  const renderOtpForm = () => (
    <form className="space-y-6" onSubmit={handleOtpSubmit(onOtpSubmit)}>
      <div>
        <div className="mb-4 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#8B2325]/10 dark:bg-[#8B2325]/30 mx-auto">
            <i className="ri-mail-check-line text-2xl text-[#8B2325] dark:text-[#e05759]"></i>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-gray-100">Verify Your Email</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            We sent a verification code to <span className="font-medium">{userData.email}</span>.
            <br />Please enter the code below to verify your email.
          </p>
        </div>
        
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Verification Code
        </label>
        <div className="mt-1">
          <input
            id="otp"
            type="text"
            className={`${formInputClasses} text-center tracking-widest ${
              otpErrors.otp ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'            }`}
            placeholder="Enter 6-digit code"
            {...registerOtp("otp", { 
              required: "Verification code is required",
              pattern: {
                value: /^\d{6}$/,
                message: "Please enter a valid 6-digit code"
              }
            })}
          />
          {otpErrors.otp && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 text-center">
              {otpErrors.otp.message}
            </p>
          )}
        </div>
      </div>

      <div className="text-center text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Didn't receive a code? 
          <button 
            type="button" 
            className="ml-1 text-[#8B2325] dark:text-[#e05759] hover:text-[#a32729] font-medium"
            onClick={() => {
              // Resend OTP logic here
              apiRequest('POST', '/api/users/send-otp', { email: userData.email })
                .then(() => {
                  toast({
                    title: "Code resent",
                    description: "A new verification code has been sent to your email."
                  });
                })
                .catch(err => {
                  toast({
                    title: "Error",
                    description: "Failed to resend verification code. Please try again.",
                    variant: "destructive"
                  });
                });
            }}
          >
            Resend Code
          </button>
        </p>
      </div>

      <div className="flex justify-between space-x-4">        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-all duration-200"
          onClick={() => setStep(2)}
        >
          Back
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-2/3 flex justify-center py-3 px-4 bg-gradient-to-br from-[#8B2325] to-[#a32729] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-pulse">Verifying...</span>
          ) : (
            <span>Complete Sign Up</span>
          )}
        </motion.button>
      </div>
    </form>
  );

  // Progress indicator
  const renderProgressSteps = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${step >= 1 ? 'bg-[#8B2325] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          1
        </div>
        <div className={`w-12 h-1 ${step >= 2 ? 'bg-[#8B2325]' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${step >= 2 ? 'bg-[#8B2325] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          2
        </div>
        <div className={`w-12 h-1 ${step >= 3 ? 'bg-[#8B2325]' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${step >= 3 ? 'bg-[#8B2325] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          3
        </div>
      </div>
    </div>
  );

  // Step labels
  const getStepTitle = () => {
    switch(step) {
      case 1: return "Enter Your Email";
      case 2: return "Complete Your Profile";
      case 3: return "Verify Your Email";
      default: return "Create Your Account";
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Peaceful 3D Illustration Background */}
      <div className="absolute inset-0 z-0">
        {/* Main Background Elements */}
        <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-gradient-to-br from-blue-100 via-indigo-50 to-white dark:from-indigo-900 dark:via-blue-900 dark:to-gray-900" />
        
        {/* Animated 3D Elements */}
        <div className="absolute inset-0">
          {/* Peaceful Mountains */}
          <svg className="absolute bottom-0 left-0 w-full h-2/3 opacity-30 dark:opacity-25" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path fill="#8B2325" fillOpacity="0.3" d="M0,128L48,122.7C96,117,192,107,288,122.7C384,139,480,181,576,197.3C672,213,768,203,864,170.7C960,139,1056,85,1152,74.7C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            <path fill="#8B2325" fillOpacity="0.15" d="M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,202.7C672,213,768,203,864,181.3C960,160,1056,128,1152,112C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>

          {/* Peace Symbols */}
          <div className="absolute h-full w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: [0.1, 0.3, 0.1], 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute top-1/4 left-1/5 transform -translate-x-1/2 -translate-y-1/2"
            >
              <svg className="w-32 h-32 text-[#8B2325] opacity-20 dark:opacity-25 dark:text-[#e05759]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
                <path d="M12 2L12 22M12 2C7.58172 2 4 5.58172 4 10C4 14.4183 7.58172 18 12 18C16.4183 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2Z" stroke="currentColor" strokeWidth="1" />
              </svg>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: [0.2, 0.4, 0.2], 
                y: [0, -15, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity,
                repeatType: "reverse",
                delay: 2
              }}
              className="absolute bottom-1/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2"
            >
              <svg className="w-48 h-48 text-[#D5A021] opacity-15 dark:opacity-25 dark:text-[#f0be4b]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L12 22M12 12L20 4M12 12L4 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </motion.div>            
            
            {/* Abstract Shapes */}
            <motion.div
              className="absolute top-1/3 right-1/6 w-64 h-64 bg-[#8B2325] rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-20"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 20, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <motion.div
              className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#D5A021] rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-20 dark:bg-[#f0be4b]"
              animate={{
                scale: [1, 1.1, 1],
                x: [0, -20, 0],
                y: [0, 20, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
              }}
            />
          </div>

          {/* 3D Dots Grid Pattern */}
          <div className="absolute inset-0 opacity-30 dark:opacity-25" 
               style={{
                 backgroundImage: 'radial-gradient(#8B2325 1px, transparent 1px), radial-gradient(#D5A021 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
                 backgroundPosition: '0 0, 20px 20px'
               }} />
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#8B2325] mx-auto">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            <span className="text-[#8B2325] dark:text-[#e05759]">Sahayog</span><span className="text-[#D5A021] dark:text-[#f0be4b]">Nepal</span>
          </h2>
          <h2 className="mt-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            {getStepTitle()}
          </h2>
          {step === 1 && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login">
                <div className="inline font-medium text-[#8B2325] dark:text-[#e05759] hover:text-[#a32729]">
                  Sign in
                </div>
              </Link>
            </p>
          )}
        </div>

        {renderProgressSteps()}        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl py-8 px-4 sm:px-10 border border-white/20 dark:border-gray-700/30">
              {step === 1 && renderEmailForm()}
              {step === 2 && renderUserDetailsForm()}
              {step === 3 && renderOtpForm()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;