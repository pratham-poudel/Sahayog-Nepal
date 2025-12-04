import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { useAuthContext } from '../contexts/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiSmartphone } from 'react-icons/fi';
import TurnstileWidget from '../components/common/TurnstileWidget';
import { TURNSTILE_CONFIG } from '../config/index.js';
import { API_URL } from '../config/index.js';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [otpStep, setOtpStep] = useState(1); // 1: identifier input, 2: otp verification
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpIdentifierType, setOtpIdentifierType] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { loginAndRedirect } = useAuthContext();
  const turnstileRef = useRef();
  const handleTurnstileVerify = (token) => {
    console.log("Turnstile token received in login");
    setTurnstileToken(token);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken('');
  };

  const handleTurnstileError = (errorCode) => {
    setTurnstileToken('');
    toast({
      title: "Security verification failed",
      description: "Please try again.",
      variant: "destructive"
    });
  };

  // Reset turnstile token when switching between login modes
  const switchLoginMode = (mode) => {
    setLoginMode(mode);
    setTurnstileToken('');
    setOtpStep(1);
    setOtpIdentifier('');
    setOtpIdentifierType('');
    
    // Reset turnstile widget with a slight delay to ensure proper cleanup
    setTimeout(() => {
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }, 100);
  };
  
  // Form for identifier/password login
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  // Form for OTP identifier input
  const { register: registerOtpIdentifier, handleSubmit: handleOtpIdentifierSubmit, formState: { errors: otpIdentifierErrors }, watch: watchOtpIdentifier } = useForm({
    defaultValues: {
      identifier: ''
    }
  });

  // Form for OTP verification
  const { register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm({
    defaultValues: {
      otp: ''
    }
  });

  // Enhanced form input styles with icons
  const formInputClasses = `appearance-none block w-full px-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8B2325] focus:border-[#8B2325] sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800/70 dark:border-gray-700 backdrop-blur-sm transition-all duration-200`;
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setLocation('/dashboard');
    }
  }, [setLocation]);

  // Cleanup effect for login mode changes
  useEffect(() => {
    // Reset turnstile token when login mode changes
    setTurnstileToken('');
  }, [loginMode]);

  // Cleanup effect on component unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts or cleanup
      if (turnstileRef.current) {
        try {
          // Attempt to reset the widget on unmount
          turnstileRef.current.reset();
        } catch (error) {
          console.warn('Error cleaning up Turnstile on unmount:', error);
        }
      }
    };
  }, []);

  // Identifier/Password login
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Check if Turnstile token is present
      if (!turnstileToken) {
        throw new Error("Please complete the security verification");
      }

      // Detect if identifier is email or phone
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier);
      const isPhone = /^[0-9]{10}$/.test(data.identifier);

      if (!isEmail && !isPhone) {
        throw new Error("Please enter a valid email or 10-digit phone number");
      }

      const requestBody = {
        password: data.password,
        turnstileToken
      };

      if (isEmail) {
        requestBody.email = data.identifier;
      } else {
        requestBody.phone = data.identifier;
      }

      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        setLocation('/dashboard');
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
      
      // Clear turnstile token on error
      if (error.message && (error.message.includes('Security verification') || error.message.includes('security verification'))) {
        setTurnstileToken('');
      }
      
      setIsLoading(false);
    }
  };

  // Send OTP for login
  const onOtpIdentifierSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      if (!turnstileToken) {
        throw new Error("Please complete the security verification");
      }

      // Detect if identifier is email or phone
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier);
      const isPhone = /^[0-9]{10}$/.test(data.identifier);

      if (!isEmail && !isPhone) {
        throw new Error("Please enter a valid email or 10-digit phone number");
      }

      const requestBody = { turnstileToken };
      
      if (isEmail) {
        requestBody.email = data.identifier;
      } else {
        requestBody.phone = data.identifier;
      }

      const response = await fetch(`${API_URL}/api/users/send-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        setOtpIdentifier(data.identifier);
        setOtpIdentifierType(result.identifierType);
        setOtpStep(2);
        toast({
          title: "OTP sent",
          description: `Please check your ${result.identifierType} for the verification code.`
        });
      } else {
        throw new Error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      
      // Clear turnstile token on error
      if (error.message && (error.message.includes('Security verification') || error.message.includes('security verification'))) {
        setTurnstileToken('');
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Verify OTP and login
  const onOtpSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Detect if identifier is email or phone
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpIdentifier);
      
      const requestBody = {
        otp: data.otp
      };

      if (isEmail) {
        requestBody.email = otpIdentifier;
      } else {
        requestBody.phone = otpIdentifier;
      }

      const response = await fetch(`${API_URL}/api/users/login-with-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        // Store token and user data
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        setLocation('/dashboard');      } else {
        throw new Error(result.message || "Invalid OTP");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your OTP and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to login mode selection
  const resetLoginMode = () => {
    switchLoginMode('password');
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative flex items-center justify-center p-4 overflow-hidden">
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

      {/* Main Container with Two Column Layout */}
      <div className="relative w-full max-w-5xl z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 0.9 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30"
        >
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left Side - Branding & Info */}
            <div className="hidden lg:flex flex-col justify-center p-12 xl:p-16 bg-gradient-to-br from-[#8B2325] to-[#a32729] dark:from-[#9e292b] dark:to-[#b52d2f] relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D5A021] rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-sm mb-8 shadow-lg">
                  <span className="text-white font-bold text-4xl">S</span>
                </div>
                
                <h1 className="text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
                  Welcome to<br />
                  <span className="text-[#D5A021]">SahayogNepal</span>
                </h1>
                
                <p className="text-white/90 text-lg xl:text-xl mb-8 leading-relaxed">
                  Empowering communities through secure and transparent crowdfunding. 
                  Join thousands who are making a difference.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Secure & Trusted</h3>
                      <p className="text-white/80">Bank-level security for all transactions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Lightning Fast</h3>
                      <p className="text-white/80">Quick setup and instant verification</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Community Driven</h3>
                      <p className="text-white/80">Join a network of compassionate donors</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-8 lg:p-12 xl:p-16">
              <div className="max-w-md mx-auto">
                {/* Mobile Logo */}
                <div className="lg:hidden text-center mb-8">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[#8B2325] to-[#a32729] mb-4">
                    <span className="text-white font-bold text-2xl">S</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    <span className="bg-gradient-to-r from-[#8B2325] to-[#D5A021] dark:from-[#e05759] dark:to-[#f0be4b] bg-clip-text text-transparent">
                      SahayogNepal
                    </span>
                  </h1>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Sign in
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Access your account securely
                  </p>
                </div>

                {/* Login Mode Toggle */}
                <div className="mb-6">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => switchLoginMode('password')}
                      className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        loginMode === 'password'
                          ? 'bg-white dark:bg-gray-700 text-[#8B2325] dark:text-[#e05759] shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <FiLock className="mr-2" />
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => switchLoginMode('otp')}
                      className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        loginMode === 'otp'
                          ? 'bg-white dark:bg-gray-700 text-[#8B2325] dark:text-[#e05759] shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <FiSmartphone className="mr-2" />
                      OTP
                    </button>
                  </div>
                </div>

                {/* Shared Turnstile Widget for both login modes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Security Verification
                  </label>
                  <TurnstileWidget
                    key={`turnstile-${loginMode}-${otpStep}`}
                    ref={turnstileRef}
                    siteKey={TURNSTILE_CONFIG.siteKey}
                    onVerify={handleTurnstileVerify}
                    onExpire={handleTurnstileExpire}
                    onError={handleTurnstileError}
                    theme="light"
                    autoReset={true}
                    resetDelay={3000}
                  />
                  {!turnstileToken && (
                    <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Please complete the security verification
                    </p>
                  )}
                  {turnstileToken && (
                    <p className="mt-3 text-sm text-green-600 dark:text-green-400 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verification completed successfully
                    </p>
                  )}
                </div>

                {/* Password Login Form */}
                {loginMode === 'password' && (
                  <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Email or Phone Number
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg" />
                        <input
                          id="identifier"
                          type="text"
                          autoComplete="username"
                          className={`${formInputClasses} ${errors.identifier ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          placeholder="you@example.com or 9812345678"
                          {...register("identifier", { 
                            required: "Email or phone number is required",
                            validate: (value) => {
                              const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                              const isPhone = /^[0-9]{10}$/.test(value);
                              return isEmail || isPhone || "Please enter a valid email or 10-digit phone number";
                            }
                          })}
                        />
                      </div>
                      {errors.identifier && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <FiArrowRight className="mr-1.5" /> {errors.identifier.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg" />
                        <input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          className={`${formInputClasses} ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          placeholder="••••••••"
                          {...register("password", { 
                            required: "Password is required",
                            minLength: {
                              value: 6,
                              message: "Minimum 6 characters required"
                            }
                          })}
                        />
                      </div>
                      {errors.password && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <FiArrowRight className="mr-1.5" /> {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-[#8B2325] focus:ring-[#8B2325] border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                      </label>
                      <button type="button" className="text-sm text-[#8B2325] dark:text-[#e05759] hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center text-base ${
                        isLoading || !turnstileToken 
                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                          : 'bg-gradient-to-br from-[#8B2325] to-[#a32729] hover:shadow-xl hover:from-[#9e292b] hover:to-[#b52d2f]'
                      } text-white shadow-lg`}
                      disabled={isLoading || !turnstileToken}
                    >
                      {isLoading ? (
                        <span className="animate-pulse">Signing in...</span>
                      ) : !turnstileToken ? (
                        <span>Complete verification to continue</span>
                      ) : (
                        <>
                          <span>Sign in</span>
                          <FiArrowRight className="ml-2" />
                        </>
                      )}
                    </motion.button>
                  </form>
                )}

                {/* OTP Login Form */}
                {loginMode === 'otp' && (
                  <>
                    {otpStep === 1 && (
                      <form className="space-y-6" onSubmit={handleOtpIdentifierSubmit(onOtpIdentifierSubmit)}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Email or Phone Number
                          </label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg" />
                            <input
                              id="otp-identifier"
                              type="text"
                              autoComplete="username"
                              className={`${formInputClasses} ${otpIdentifierErrors.identifier ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                              placeholder="you@example.com or 9812345678"
                              {...registerOtpIdentifier("identifier", { 
                                required: "Email or phone number is required",
                                validate: (value) => {
                                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                                  const isPhone = /^[0-9]{10}$/.test(value);
                                  return isEmail || isPhone || "Please enter a valid email or 10-digit phone number";
                                }
                              })}
                            />
                          </div>
                          {otpIdentifierErrors.identifier && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                              <FiArrowRight className="mr-1.5" /> {otpIdentifierErrors.identifier.message}
                            </p>
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center text-base ${
                            isLoading || !turnstileToken 
                              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                              : 'bg-gradient-to-br from-[#8B2325] to-[#a32729] hover:shadow-xl hover:from-[#9e292b] hover:to-[#b52d2f]'
                          } text-white shadow-lg`}
                          disabled={isLoading || !turnstileToken}
                        >
                          {isLoading ? (
                            <span className="animate-pulse">Sending OTP...</span>
                          ) : !turnstileToken ? (
                            <span>Complete verification to continue</span>
                          ) : (
                            <>
                              <span>Send OTP</span>
                              <FiArrowRight className="ml-2" />
                            </>
                          )}
                        </motion.button>
                      </form>
                    )}

                    {otpStep === 2 && (
                      <form className="space-y-6" onSubmit={handleOtpSubmit(onOtpSubmit)}>
                        <div className="text-center mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            We've sent a verification code to your {otpIdentifierType}
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white text-base">
                            {otpIdentifier}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Verification Code
                          </label>
                          <div className="relative">
                            <FiSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg" />
                            <input
                              id="otp"
                              type="text"
                              maxLength="6"
                              className={`${formInputClasses} ${otpErrors.otp ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} text-center text-xl tracking-widest font-semibold`}
                              placeholder="• • • • • •"
                              {...registerOtp("otp", { 
                                required: "OTP is required",
                                pattern: {
                                  value: /^\d{6}$/,
                                  message: "OTP must be 6 digits"
                                }
                              })}
                            />
                          </div>
                          {otpErrors.otp && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                              <FiArrowRight className="mr-1.5" /> {otpErrors.otp.message}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-4">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-3.5 px-4 rounded-xl font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            onClick={() => {
                              setOtpStep(1);
                            }}
                          >
                            Back
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center text-base ${
                              isLoading 
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                : 'bg-gradient-to-br from-[#8B2325] to-[#a32729] hover:shadow-xl hover:from-[#9e292b] hover:to-[#b52d2f]'
                            } text-white shadow-lg`}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <span className="animate-pulse">Verifying...</span>
                            ) : (
                              <>
                                <span>Verify & Login</span>
                                <FiArrowRight className="ml-2" />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    )}
                  </>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-[#8B2325] dark:text-[#e05759] font-semibold hover:underline">
                      Register now
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;