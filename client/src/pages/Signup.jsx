import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useAuthContext } from '../contexts/AuthContext';
import TurnstileWidget from '../components/common/TurnstileWidget';
import { TURNSTILE_CONFIG } from '../config/index.js';
import uploadService from '../services/uploadService';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [identifierType, setIdentifierType] = useState(''); // 'email' or 'phone'
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    otp: '',
    personalVerificationDocument: '',
    detailsConfirmed: false,
    termsAccepted: false
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
  
  // Email/Phone form (Step 1)
  const { 
    register: registerIdentifier, 
    handleSubmit: handleIdentifierSubmit, 
    formState: { errors: identifierErrors } 
  } = useForm({
    defaultValues: {
      identifier: userData.email || userData.phone
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
  
  // Document upload form (Step 3)
  const {
    handleSubmit: handleDocumentSubmit,
    formState: { errors: documentErrors }
  } = useForm();
  
  // Handle document file selection
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (15MB max)
      if (file.size > 15 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 15MB",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image (JPG, PNG, GIF) or PDF file",
          variant: "destructive"
        });
        return;
      }
      
      setDocumentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview(null); // PDF doesn't need preview
      }
    }
  };
  
  // Handle document upload submission (Step 3)
  const onDocumentSubmit = async () => {
    if (!documentFile) {
      toast({
        title: "Document required",
        description: "Please upload your citizenship or verification document",
        variant: "destructive"
      });
      return;
    }
    
    setStep(4); // Move to OTP step
  };
  // Update form input fields for dark mode visibility with enhanced styling
  const formInputClasses = `appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8B2325] focus:border-[#8B2325] text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800/70 dark:border-gray-700 backdrop-blur-sm transition-all duration-200`;
  // Define a function to reset Turnstile in case of errors
  const resetTurnstile = () => {
    // The TurnstileWidget component will handle this internally
    setTurnstileToken('');
  };
  
  // Handle email submission (Step 1)
  // Handle identifier (email or phone) submission (Step 1)
  const onIdentifierSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const identifier = data.identifier;
      
      // Determine if identifier is email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/;
      
      let isEmail = false;
      let isPhone = false;
      let requestBody = {};
      
      if (emailRegex.test(identifier)) {
        isEmail = true;
        requestBody = { email: identifier };
        setIdentifierType('email');
      } else if (phoneRegex.test(identifier.replace(/[\s\-\+]/g, ''))) {
        isPhone = true;
        requestBody = { phone: identifier.replace(/[\s\-\+]/g, '') };
        setIdentifierType('phone');
      } else {
        throw new Error("Please enter a valid email address or phone number");
      }
      
      // Send OTP request
      const response = await apiRequest('POST', '/api/users/send-otp', requestBody);
      const result = await response.json();
      
      if (response.ok) {
        // Save the identifier to userData
        if (isEmail) {
          setUserData(prev => ({ ...prev, email: identifier, phone: '' }));
        } else {
          setUserData(prev => ({ ...prev, phone: identifier.replace(/[\s\-\+]/g, ''), email: '' }));
        }
        
        toast({
          title: `Verification code sent`,
          description: `We've sent a verification code to your ${result.identifierType || (isEmail ? 'email' : 'phone')}.`
        });
        setStep(2);
      } else {
        throw new Error(result.message || "Verification failed");
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
      
      // Verify checkboxes are checked
      if (!data.detailsConfirmed) {
        throw new Error("Please confirm that your details are correct and not misleading");
      }
      
      if (!data.termsAccepted) {
        throw new Error("Please accept the Terms of Use and Privacy Policy");
      }
      
      // Update userData with the form values
      // If email was verified, update phone from form (or keep empty)
      // If phone was verified, update email from form (or keep empty)
      setUserData(prev => ({
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        email: identifierType === 'email' ? prev.email : (data.email || ''),
        phone: identifierType === 'phone' ? prev.phone : (data.phone || ''),
        password: data.password,
        detailsConfirmed: data.detailsConfirmed,
        termsAccepted: data.termsAccepted
      }));
      
      setStep(3);
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
  // Handle OTP verification (Step 4 - Final step with upload)
  const onOtpSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Verify Turnstile token is present
      if (!turnstileToken) {
        throw new Error("Please complete the security verification");
      }
      
      // Prepare request body based on identifier type
      const requestBody = {
        name: `${userData.firstName} ${userData.lastName}`,
        password: userData.password,
        otp: data.otp,
        turnstileToken: turnstileToken
      };
      
      // Add email or phone based on what was verified
      if (identifierType === 'email') {
        requestBody.email = userData.email;
        // Phone is optional in this case, add if provided in step 2
        if (userData.phone) {
          requestBody.phone = userData.phone;
        }
      } else {
        requestBody.phone = userData.phone;
        // Email is optional in this case, add if provided in step 2
        if (userData.email) {
          requestBody.email = userData.email;
        }
      }
      
      // First, verify OTP and create account (without document)
      const response = await apiRequest('POST', '/api/users/verify-otp', requestBody);
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "OTP verification failed");
      }
      
      // Save token to localStorage immediately after account creation
      if (result.token) {
        localStorage.setItem('token', result.token);
        // Force update of authentication state
        if (typeof forceUpdate === 'function') {
          forceUpdate();
        }
      }
      
      // Now upload document with the new authentication token
      let documentUrl = '';
      if (documentFile) {
        try {
          setUploadProgress(10); // Show initial progress
          const uploadResult = await uploadService.uploadFile(
            documentFile,
            { fileType: 'document-citizenship' },
            (progress) => setUploadProgress(progress)
          );
          documentUrl = uploadResult.publicUrl;
          setUploadProgress(100);
          
          // Update user profile with document URL
          const updateResponse = await apiRequest('PUT', '/api/users/profile', {
            personalVerificationDocument: documentUrl
          });
          
          if (!updateResponse.ok) {
            console.error('Failed to update profile with document URL');
            // Don't fail the signup, just log the error
          }
        } catch (uploadError) {
          console.error('Document upload error:', uploadError);
          // Don't fail the signup, just show a warning
          toast({
            title: "Account created",
            description: "Your account was created, but document upload failed. You can upload it later from your profile.",
            variant: "default"
          });
        }
      }
      
      toast({
        title: "Account created successfully",
        description: "Welcome! Your account has been created and you are now logged in."
      });
      
      setLocation('/dashboard');
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      
      // If there was a security verification error, reset the turnstile
      if (error.message && error.message.includes('Security verification')) {
        resetTurnstile();
      }
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Render identifier (email or phone) form (Step 1)
  const renderIdentifierForm = () => (
    <form className="space-y-6" onSubmit={handleIdentifierSubmit(onIdentifierSubmit)}>
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Email or Phone Number
        </label>
        <div>
          <input
            id="identifier"
            type="text"
            autoComplete="email tel"
            className={`${formInputClasses} ${
              identifierErrors.identifier ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="you@example.com or 9876543210"
            {...registerIdentifier("identifier", { 
              required: "Email or phone number is required",
              validate: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^[0-9]{10,15}$/;
                const cleanValue = value.replace(/[\s\-\+]/g, '');
                
                if (emailRegex.test(value) || phoneRegex.test(cleanValue)) {
                  return true;
                }
                return "Please enter a valid email address or phone number";
              }
            })}
          />
          {identifierErrors.identifier && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {identifierErrors.identifier.message}
            </p>
          )}
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Enter your email address or phone number to receive a verification code
          </p>
        </div>
      </div>

      <div>        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex justify-center py-3.5 px-4 bg-gradient-to-br from-[#8B2325] to-[#a32729] text-white rounded-xl font-semibold hover:shadow-xl hover:from-[#9e292b] hover:to-[#b52d2f] transition-all duration-200 shadow-lg"
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

      {/* Conditionally render locked email or phone field based on what was verified */}
      {identifierType === 'email' ? (
        <>
          {/* Email field - locked and verified */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Verified
              </span>
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

          {/* Phone field - optional */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
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
                {...registerUserDetails("phone", { required: false })}
              />
              {userDetailsErrors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {userDetailsErrors.phone.message}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Phone field - locked and verified */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Verified
              </span>
            </label>
            <div className="mt-1">
              <input
                id="phone"
                type="tel"
                value={userData.phone}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 sm:text-sm"
                readOnly
                disabled
              />
            </div>
          </div>

          {/* Email field - optional */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
            </label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`${formInputClasses} ${
                  userDetailsErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="you@example.com"
                {...registerUserDetails("email", { 
                  required: false,
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address"
                  }
                })}
              />
              {userDetailsErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {userDetailsErrors.email.message}
                </p>
              )}
            </div>
          </div>
        </>
      )}

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
      </div>

      {/* KYC Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Important: KYC Verification Notice
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Please ensure that all the details you provide (Name, Phone Number, etc.) match exactly with your personal verification document (e.g., Citizenship, Passport). You will be required to upload this document in the next step for verification purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-start">
          <input
            id="detailsConfirmed"
            type="checkbox"
            className="h-4 w-4 mt-1 text-[#8B2325] focus:ring-[#8B2325] border-gray-300 dark:border-gray-600 rounded"
            {...registerUserDetails("detailsConfirmed", { 
              required: "You must confirm your details are correct" 
            })}
          />
          <label htmlFor="detailsConfirmed" className="ml-3 block text-sm text-gray-900 dark:text-gray-300">
            I hereby promise and confirm that all the details I am providing are correct, accurate, and not misleading. I understand that providing false information may result in account suspension or legal action.
          </label>
        </div>
        {userDetailsErrors.detailsConfirmed && (
          <p className="text-sm text-red-600 dark:text-red-400 ml-7">
            {userDetailsErrors.detailsConfirmed.message}
          </p>
        )}

        <div className="flex items-start">
          <input
            id="termsAccepted"
            type="checkbox"
            className="h-4 w-4 mt-1 text-[#8B2325] focus:ring-[#8B2325] border-gray-300 dark:border-gray-600 rounded"
            {...registerUserDetails("termsAccepted", { 
              required: "You must accept the Terms of Use and Privacy Policy" 
            })}
          />
          <label htmlFor="termsAccepted" className="ml-3 block text-sm text-gray-900 dark:text-gray-300">
            I accept the{' '}
            <a 
              href="/terms-of-use" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-[#8B2325] dark:text-[#e05759] hover:text-[#a32729] underline"
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Use
            </a>{' '}
            and{' '}
            <a 
              href="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-[#8B2325] dark:text-[#e05759] hover:text-[#a32729] underline"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </label>
        </div>
        {userDetailsErrors.termsAccepted && (
          <p className="text-sm text-red-600 dark:text-red-400 ml-7">
            {userDetailsErrors.termsAccepted.message}
          </p>
        )}
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
            isLoading 
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-br from-[#8B2325] to-[#a32729] hover:shadow-lg'
          } text-white`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <span>Continue to Document Upload</span>
          )}
        </motion.button>
      </div>
    </form>
  );

  // Render document upload form (Step 3)
  const renderDocumentUploadForm = () => (
    <form className="space-y-6" onSubmit={handleDocumentSubmit(onDocumentSubmit)}>
      <div>
        <div className="mb-4 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#8B2325]/10 dark:bg-[#8B2325]/30 mx-auto">
            <svg className="w-8 h-8 text-[#8B2325] dark:text-[#e05759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-gray-100">Upload Verification Document</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please upload your citizenship, passport, or other government-issued ID for KYC verification.
          </p>
        </div>

        {/* Information Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Document Requirements
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Accepted formats: JPG, PNG, GIF, or PDF</li>
                <li>• Maximum file size: 15MB</li>
                <li>• Document should be clear and readable</li>
                <li>• Ensure all information is visible</li>
              </ul>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Document *
          </label>
          
          {!documentFile ? (
            <label htmlFor="documentUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF or PDF (MAX. 15MB)
                </p>
              </div>
              <input
                id="documentUpload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                onChange={handleDocumentChange}
              />
            </label>
          ) : (
            <div className="relative w-full border-2 border-green-300 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              {documentPreview ? (
                <div className="mb-3">
                  <img
                    src={documentPreview}
                    alt="Document preview"
                    className="w-full h-48 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {documentFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentPreview(null);
                  }}
                  className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between space-x-4">
        <motion.button
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
          className={`w-2/3 flex justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            !documentFile
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-br from-[#8B2325] to-[#a32729] hover:shadow-lg'
          } text-white`}
          disabled={!documentFile}
        >
          <span>Continue to Verification</span>
        </motion.button>
      </div>
    </form>
  );

  // Render OTP verification form (Step 4)
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

      {/* Upload Progress Indicator */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Uploading document...
            </span>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div 
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Turnstile Security Verification */}
      <div>
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
            Please complete the security verification before submitting
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
          onClick={() => setStep(3)}
          disabled={isLoading}
        >
          Back
        </motion.button>
        <motion.button
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
            <span className="animate-pulse">Creating Account...</span>
          ) : !turnstileToken ? (
            <span>Complete verification to submit</span>
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
        <div className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold transition-all duration-200 ${step >= 1 ? 'bg-[#8B2325] text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          1
        </div>
        <div className={`w-12 h-1.5 rounded-full transition-all duration-200 ${step >= 2 ? 'bg-[#8B2325]' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
        <div className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold transition-all duration-200 ${step >= 2 ? 'bg-[#8B2325] text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          2
        </div>
        <div className={`w-12 h-1.5 rounded-full transition-all duration-200 ${step >= 3 ? 'bg-[#8B2325]' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
        <div className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold transition-all duration-200 ${step >= 3 ? 'bg-[#8B2325] text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          3
        </div>
        <div className={`w-12 h-1.5 rounded-full transition-all duration-200 ${step >= 4 ? 'bg-[#8B2325]' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
        <div className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold transition-all duration-200 ${step >= 4 ? 'bg-[#8B2325] text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          4
        </div>
      </div>
    </div>
  );

  // Step labels
  const getStepTitle = () => {
    switch(step) {
      case 1: return "Enter Your Email";
      case 2: return "Complete Your Profile";
      case 3: return "Upload Verification Document";
      case 4: return "Verify Your Email";
      default: return "Create Your Account";
    }
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
                  Start Your<br />
                  <span className="text-[#D5A021]">Journey Today</span>
                </h1>
                
                <p className="text-white/90 text-lg xl:text-xl mb-8 leading-relaxed">
                  Join SahayogNepal and become part of a community that's making real change. 
                  Create campaigns, raise funds, and transform lives.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Quick Setup</h3>
                      <p className="text-white/80">Get started in minutes with our easy registration</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Verified & Secure</h3>
                      <p className="text-white/80">KYC verification ensures trust and authenticity</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Make an Impact</h3>
                      <p className="text-white/80">Every contribution creates meaningful change</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
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
                    {getStepTitle()}
                  </h2>
                  {step === 1 && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Already have an account?{' '}
                      <Link href="/login">
                        <span className="text-[#8B2325] dark:text-[#e05759] font-semibold hover:underline cursor-pointer">
                          Sign in
                        </span>
                      </Link>
                    </p>
                  )}
                </div>

                {/* Progress Steps */}
                {renderProgressSteps()}

                {/* Form Content */}
                <div className="mt-8">
                  {step === 1 && renderIdentifierForm()}
                  {step === 2 && renderUserDetailsForm()}
                  {step === 3 && renderDocumentUploadForm()}
                  {step === 4 && renderOtpForm()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;