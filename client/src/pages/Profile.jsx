import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import SEO from '../utils/seo.jsx';
import useAuth from '../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getProfilePictureUrl } from '../utils/imageUtils';
import { API_URL as CONFIG_API_URL } from '../config/index.js';
import FileUpload from '../components/common/FileUpload.jsx';

const Profile = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, updateProfile, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Email change verification states
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  
  const { register: registerPersonal, handleSubmit: handleSubmitPersonal, formState: { errors: errorsPersonal }, reset: resetPersonal, watch: watchPersonal, getValues } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: ''
    }
  });
  
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword }, watch, reset: resetPassword } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const newPassword = watch('newPassword', '');
  
  // Update form with user data when available
  useEffect(() => {
    if (user) {
      console.log('Updating form with user data:', user);
      resetPersonal({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      setOriginalEmail(user.email || '');
    }
  }, [user, resetPersonal]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('token')) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);
  
  const onSubmitPersonal = async (data) => {
    // Check if email has changed
    if (data.email !== originalEmail) {
      // Email changed - trigger OTP verification flow
      await handleSendEmailChangeOtp(data.email);
      return;
    }
    
    // Normal profile update (no email change)
    setIsLoading(true);
    
    try {
      const response = await apiRequest('PUT', '/api/users/profile', {
        name: data.name,
        bio: data.bio
        // Phone and email are excluded from update
      });

      if (response.ok) {
        const result = await response.json();
        await refreshAuth();
        
        resetPersonal({
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone || '',
          bio: result.user.bio || ''
        });
        
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle send email change OTP
  const handleSendEmailChangeOtp = async (email) => {
    setEmailOtpSending(true);
    try {
      const response = await apiRequest('POST', '/api/users/send-email-change-otp', {
        newEmail: email
      });
      
      if (response.ok) {
        setNewEmail(email);
        setShowEmailOtpInput(true);
        toast({
          title: "Verification code sent",
          description: `A verification code has been sent to ${email}`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending email change OTP:', error);
      toast({
        variant: "destructive",
        title: "Failed to send code",
        description: error.message || "Failed to send verification code. Please try again."
      });
      // Reset email to original value
      resetPersonal({
        ...getValues(),
        email: originalEmail
      });
    } finally {
      setEmailOtpSending(false);
    }
  };
  
  // Handle verify email change OTP
  const handleVerifyEmailChangeOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code."
      });
      return;
    }
    
    setEmailOtpVerifying(true);
    try {
      const response = await apiRequest('POST', '/api/users/verify-email-change-otp', {
        otp: emailOtp
      });
      
      if (response.ok) {
        const result = await response.json();
        await refreshAuth();
        
        // Update original email
        setOriginalEmail(newEmail);
        
        // Update form
        resetPersonal({
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone || '',
          bio: result.user.bio || ''
        });
        
        // Reset OTP states
        setShowEmailOtpInput(false);
        setEmailOtp('');
        setNewEmail('');
        
        toast({
          title: "Email updated",
          description: "Your email address has been updated successfully."
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying email change OTP:', error);
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message || "Failed to verify code. Please try again."
      });
    } finally {
      setEmailOtpVerifying(false);
    }
  };
  
  // Handle cancel email change
  const handleCancelEmailChange = () => {
    setShowEmailOtpInput(false);
    setEmailOtp('');
    setNewEmail('');
    // Reset email to original value
    resetPersonal({
      ...getValues(),
      email: originalEmail
    });
  };
  
  const onSubmitPassword = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('PUT', '/api/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      // Reset form
      resetPassword();
    } catch (error) {
      toast({
        title: "Password change failed",
        description: error.message || "An error occurred while changing your password.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProfilePictureUpload = async (uploadResult) => {
    setIsLoading(true);
    
    try {
      // Update user profile with new profile picture URL
      const response = await apiRequest('PUT', '/api/users/profile', {
        profilePictureUrl: uploadResult.publicUrl,
        profilePicture: uploadResult.key // Store the key for consistency
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile picture');
      }
      
      // Force refresh of user data
      await refreshAuth();
      
      toast({
        title: "Profile updated",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle notification settings update
  const updateNotificationSettings = async (settings) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('PUT', '/api/users/notification-settings', settings);
      
      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
      
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated successfully."
      });
      
      // Force refresh of user data
      refreshAuth();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isAuthenticated && !localStorage.getItem('token')) {
    return null; // Redirect happens in useEffect
  }

  return (
    <>
      <SEO 
        title="Profile Settings" 
        description="Manage your Sahayog Nepal account settings and personal information."
        keywords="profile settings, account management, personal information"
      />
      
      <div className="bg-gray-50 dark:bg-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-8 text-gray-900 dark:text-white">Profile Settings</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 bg-gray-50 dark:bg-gray-700 p-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                      {user?.profilePicture ? (
                        <img 
                          src={getProfilePictureUrl(user)} 
                          alt={user.name} 
                          className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-lg">
                          <span className="text-3xl font-medium text-gray-500 dark:text-gray-300">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0">
                        <FileUpload
                          fileType="profile-picture"
                          accept="image/*"
                          maxFiles={1}
                          onUploadComplete={handleProfilePictureUpload}
                          dragDropArea={false}
                          className="inline-block"
                        >
                          <div className="bg-white dark:bg-gray-700 p-1 rounded-full shadow-md text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer transition-colors">
                            <i className="ri-camera-line text-lg"></i>
                            <span className="sr-only">Upload profile picture</span>
                          </div>
                        </FileUpload>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</p>
                  </div>
                  
                  <nav className="space-y-1">
                    <button 
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        activeTab === 'personal' 
                          ? 'bg-[#8B2635] bg-opacity-10 text-[#8B2635] dark:bg-[#8B2635] dark:bg-opacity-20 dark:text-[#E5A4B1] font-medium' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setActiveTab('personal')}
                    >
                      Personal Information
                    </button>
                    <button 
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        activeTab === 'password' 
                          ? 'bg-[#8B2635] bg-opacity-10 text-[#8B2635] dark:bg-[#8B2635] dark:bg-opacity-20 dark:text-[#E5A4B1] font-medium' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setActiveTab('password')}
                    >
                      Change Password
                    </button>
                    <button 
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        activeTab === 'preferences' 
                          ? 'bg-[#8B2635] bg-opacity-10 text-[#8B2635] dark:bg-[#8B2635] dark:bg-opacity-20 dark:text-[#E5A4B1] font-medium' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setActiveTab('preferences')}
                    >
                      Preferences
                    </button>
                  </nav>
                </div>
                
                <div className="md:w-2/3 p-6">
                  {activeTab === 'personal' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Personal Information</h2>
                      
                      <form onSubmit={handleSubmitPersonal(onSubmitPersonal)}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Full Name
                            </label>
                            <input
                              id="name"
                              type="text"
                              className={`w-full px-4 py-2 border ${errorsPersonal.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:border-[#8B2635] placeholder-gray-500 dark:placeholder-gray-400`}
                              {...registerPersonal("name", { required: "Name is required" })}
                            />
                            {errorsPersonal.name && (
                              <p className="mt-1 text-red-500 text-sm">{errorsPersonal.name.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email Address
                            </label>
                            <input
                              id="email"
                              type="email"
                              disabled={showEmailOtpInput}
                              className={`w-full px-4 py-2 border ${errorsPersonal.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:border-[#8B2635] placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed`}
                              {...registerPersonal("email", { 
                                required: "Email is required",
                                pattern: {
                                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                  message: "Please enter a valid email address"
                                }
                              })}
                            />
                            {errorsPersonal.email && (
                              <p className="mt-1 text-red-500 text-sm">{errorsPersonal.email.message}</p>
                            )}
                            {watchPersonal('email') !== originalEmail && !showEmailOtpInput && (
                              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                <span className="inline-flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Click "Save Changes" to verify this email address
                                </span>
                              </p>
                            )}
                          </div>
                          
                          {/* Email OTP Verification Section */}
                          {showEmailOtpInput && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                                    Email Verification Required
                                  </h3>
                                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                                    We've sent a verification code to <strong>{newEmail}</strong>. Please enter it below to confirm your email change.
                                  </p>
                                  <div className="flex flex-col gap-2">
                                    <input 
                                      type="text" 
                                      value={emailOtp}
                                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      placeholder="Enter 6-digit code"
                                      maxLength={6}
                                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white text-center text-lg font-mono tracking-wider"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={handleVerifyEmailChangeOtp}
                                        disabled={emailOtpVerifying || emailOtp.length !== 6}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {emailOtpVerifying ? 'Verifying...' : 'Verify Code'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEmailChange}
                                        disabled={emailOtpVerifying}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSendEmailChangeOtp(newEmail)}
                                    disabled={emailOtpSending}
                                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                                  >
                                    {emailOtpSending ? 'Sending...' : 'Resend verification code'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Phone Number
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Cannot be changed)</span>
                            </label>
                            <input
                              id="phone"
                              type="tel"
                              disabled={true}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                              {...registerPersonal("phone")}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Bio
                            </label>
                            <textarea
                              id="bio"
                              rows="4"
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:border-[#8B2635] placeholder-gray-500 dark:placeholder-gray-400 resize-vertical"
                              placeholder="Tell us a little about yourself..."
                              {...registerPersonal("bio")}
                            ></textarea>
                          </div>
                        </div>
                        
                        {!showEmailOtpInput && (
                          <div className="mt-6">
                            <motion.button
                              type="submit"
                              className="px-6 py-3 bg-[#8B2635] text-white font-medium rounded-lg hover:bg-[#7A1E2B] focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:ring-opacity-50 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              disabled={isLoading || emailOtpSending}
                            >
                              {isLoading || emailOtpSending ? (emailOtpSending ? 'Sending Code...' : 'Saving...') : 'Save Changes'}
                            </motion.button>
                          </div>
                        )}
                      </form>
                    </motion.div>
                  )}
                  
                  {activeTab === 'password' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Change Password</h2>
                      
                      <form id="password-form" onSubmit={handleSubmitPassword(onSubmitPassword)}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Current Password
                            </label>
                            <input
                              id="currentPassword"
                              type="password"
                              className={`w-full px-4 py-2 border ${errorsPassword.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:border-[#8B2635] placeholder-gray-500 dark:placeholder-gray-400`}
                              {...registerPassword("currentPassword", { required: "Current password is required" })}
                            />
                            {errorsPassword.currentPassword && (
                              <p className="mt-1 text-red-500 text-sm">{errorsPassword.currentPassword.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              New Password
                            </label>
                            <input
                              id="newPassword"
                              type="password"
                              className={`w-full px-4 py-2 border ${errorsPassword.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:border-[#8B2635] placeholder-gray-500 dark:placeholder-gray-400`}
                              {...registerPassword("newPassword", { 
                                required: "New password is required",
                                minLength: {
                                  value: 8,
                                  message: "Password must be at least 8 characters"
                                }
                              })}
                            />
                            {errorsPassword.newPassword && (
                              <p className="mt-1 text-red-500 text-sm">{errorsPassword.newPassword.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Confirm New Password
                            </label>
                            <input
                              id="confirmPassword"
                              type="password"
                              className={`w-full px-4 py-2 border ${errorsPassword.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:border-[#8B2635] placeholder-gray-500 dark:placeholder-gray-400`}
                              {...registerPassword("confirmPassword", { 
                                required: "Please confirm your password",
                                validate: value => value === newPassword || "Passwords do not match"
                              })}
                            />
                            {errorsPassword.confirmPassword && (
                              <p className="mt-1 text-red-500 text-sm">{errorsPassword.confirmPassword.message}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <motion.button
                            type="submit"
                            className="px-6 py-3 bg-[#8B2635] text-white font-medium rounded-lg hover:bg-[#7A1E2B] focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:ring-opacity-50 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Changing Password...' : 'Change Password'}
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                  
                  {activeTab === 'preferences' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Preferences</h2>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Email Notifications</h3>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                id="notify-new-donations"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                                defaultChecked={user?.notificationSettings?.newDonations ?? true}
                              />
                              <label htmlFor="notify-new-donations" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                New donations to your campaigns
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="notify-campaign-updates"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-600"
                                defaultChecked={user?.notificationSettings?.emailUpdates ?? true}
                              />
                              <label htmlFor="notify-campaign-updates" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Updates to campaigns you've donated to
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="notify-newsletter"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-600"
                                defaultChecked={user?.notificationSettings?.marketingEmails ?? false}
                              />
                              <label htmlFor="notify-newsletter" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Newsletter and platform updates
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <motion.button
                          type="button"
                          className="px-6 py-3 bg-[#8B2635] text-white font-medium rounded-lg hover:bg-[#7A1E2B] focus:outline-none focus:ring-2 focus:ring-[#8B2635] focus:ring-opacity-50 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const settings = {
                              emailUpdates: document.getElementById('notify-campaign-updates').checked,
                              newDonations: document.getElementById('notify-new-donations').checked,
                              marketingEmails: document.getElementById('notify-newsletter').checked
                            };
                            updateNotificationSettings(settings);
                          }}
                        >
                          Save Preferences
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Profile;
