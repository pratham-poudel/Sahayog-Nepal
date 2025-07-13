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

const Profile = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, updateProfile, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { register: registerPersonal, handleSubmit: handleSubmitPersonal, formState: { errors: errorsPersonal }, reset: resetPersonal } = useForm({
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
    }
  }, [user, resetPersonal]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('token')) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);
  
  const onSubmitPersonal = async (data) => {
    setIsLoading(true);
    
    try {
      const updatedUser = await updateProfile(data);
      resetPersonal({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        bio: updatedUser.bio || ''
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
  
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${CONFIG_API_URL}/api/users/profile-picture`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Force refresh of user data
        await refreshAuth();
        
        toast({
          title: "Profile updated",
          description: "Your profile picture has been updated successfully."
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile picture');
      }
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
      
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-8">Profile Settings</h1>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 bg-gray-50 p-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                      {user?.profilePicture ? (
                        <img 
                          src={getProfilePictureUrl(user)} 
                          alt={user.name} 
                          className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-lg">
                          <span className="text-3xl font-medium text-gray-500">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                        </div>
                      )}
                      <label 
                        htmlFor="profile-picture-upload" 
                        className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-md text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        <i className="ri-camera-line text-lg"></i>
                        <span className="sr-only">Upload profile picture</span>
                      </label>
                      <input 
                        type="file" 
                        id="profile-picture-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                      />
                    </div>
                    <h3 className="text-lg font-medium">{user?.name || 'User'}</h3>
                    <p className="text-gray-500 text-sm">Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</p>
                  </div>
                  
                  <nav className="space-y-1">
                    <button 
                      className={`w-full text-left px-4 py-2 rounded-md ${
                        activeTab === 'personal' 
                          ? 'bg-primary-50 text-primary-700 font-medium' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => setActiveTab('personal')}
                    >
                      Personal Information
                    </button>
                    <button 
                      className={`w-full text-left px-4 py-2 rounded-md ${
                        activeTab === 'password' 
                          ? 'bg-primary-50 text-primary-700 font-medium' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => setActiveTab('password')}
                    >
                      Change Password
                    </button>
                    <button 
                      className={`w-full text-left px-4 py-2 rounded-md ${
                        activeTab === 'preferences' 
                          ? 'bg-primary-50 text-primary-700 font-medium' 
                          : 'hover:bg-gray-100 text-gray-700'
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
                      <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                      
                      <form onSubmit={handleSubmitPersonal(onSubmitPersonal)}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <input
                              id="name"
                              type="text"
                              className={`w-full px-4 py-2 border ${errorsPersonal.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600`}
                              {...registerPersonal("name", { required: "Name is required" })}
                            />
                            {errorsPersonal.name && (
                              <p className="mt-1 text-red-500 text-sm">{errorsPersonal.name.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <input
                              id="email"
                              type="email"
                              className={`w-full px-4 py-2 border ${errorsPersonal.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600`}
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
                          </div>
                          
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              id="phone"
                              type="tel"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                              placeholder="+977 98XXXXXXXX"
                              {...registerPersonal("phone")}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                              Bio
                            </label>
                            <textarea
                              id="bio"
                              rows="4"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                              placeholder="Tell us a little about yourself..."
                              {...registerPersonal("bio")}
                            ></textarea>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <motion.button
                            type="submit"
                            className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-70"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                  
                  {activeTab === 'password' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                      
                      <form id="password-form" onSubmit={handleSubmitPassword(onSubmitPassword)}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <input
                              id="currentPassword"
                              type="password"
                              className={`w-full px-4 py-2 border ${errorsPassword.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600`}
                              {...registerPassword("currentPassword", { required: "Current password is required" })}
                            />
                            {errorsPassword.currentPassword && (
                              <p className="mt-1 text-red-500 text-sm">{errorsPassword.currentPassword.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <input
                              id="newPassword"
                              type="password"
                              className={`w-full px-4 py-2 border ${errorsPassword.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600`}
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
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <input
                              id="confirmPassword"
                              type="password"
                              className={`w-full px-4 py-2 border ${errorsPassword.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600`}
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
                            className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-70"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                      <h2 className="text-xl font-semibold mb-6">Preferences</h2>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Email Notifications</h3>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                id="notify-new-donations"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                                defaultChecked={user?.notificationSettings?.newDonations ?? true}
                              />
                              <label htmlFor="notify-new-donations" className="ml-2 text-sm text-gray-700">
                                New donations to your campaigns
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="notify-campaign-updates"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                                defaultChecked={user?.notificationSettings?.emailUpdates ?? true}
                              />
                              <label htmlFor="notify-campaign-updates" className="ml-2 text-sm text-gray-700">
                                Updates to campaigns you've donated to
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="notify-newsletter"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                                defaultChecked={user?.notificationSettings?.marketingEmails ?? false}
                              />
                              <label htmlFor="notify-newsletter" className="ml-2 text-sm text-gray-700">
                                Newsletter and platform updates
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <motion.button
                          type="button"
                          className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
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
