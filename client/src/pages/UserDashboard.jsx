import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import SEO from '../utils/seo.jsx';
import useAuth from '../hooks/useAuth';
import { apiRequest } from '../lib/queryClient';
import { Progress } from '../components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { getProfilePictureUrl ,getCoverImageUrl} from '../utils/imageUtils';
import { API_URL as CONFIG_API_URL, MINIO_URL, TURNSTILE_CONFIG } from '../config/index.js';
import uploadService from '../services/uploadService';

// Import icons
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  PlusIcon,
  BellIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  CalendarIcon,
  PencilIcon,
  PencilSquareIcon,
  HeartIcon,
  InformationCircleIcon,
  XMarkIcon,
  FolderPlusIcon,
  ChatBubbleLeftRightIcon,
  ChartPieIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowDownOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Import bank account components
import AddBankAccount from '../components/user/AddBankAccount';
import BankAccountList from '../components/user/BankAccountList';
import TurnstileWidget from '../components/common/TurnstileWidget';

const UserDashboard = () => {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  // Campaign status counts
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0
  });
  
  // Analytics summary
  const [analytics, setAnalytics] = useState({
    totalRaised: 0,
    totalDonors: 0,
    averageProgress: 0
  });
  
  // Dummy donation data (as requested)
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [overviewDonations, setOverviewDonations] = useState([]);
  
  // After the existing useState declarations
  const [activeFilter, setActiveFilter] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ show: false, campaign: null });
  const [updateModal, setUpdateModal] = useState({ show: false, campaign: null });
  const [updateForm, setUpdateForm] = useState({ title: '', content: '' });
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  
  // Profile related states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profilePicture: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailUpdates: true,
    newDonations: true,
    marketingEmails: false
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [notificationUpdateLoading, setNotificationUpdateLoading] = useState(false);
  
  // Bank account states
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [bankAccountsRefresh, setBankAccountsRefresh] = useState(0);
  
  // Withdrawal states
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalModal, setWithdrawalModal] = useState({ show: false, campaign: null });
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedCampaignForWithdrawal, setSelectedCampaignForWithdrawal] = useState(null);
  const [withdrawalForm, setWithdrawalForm] = useState({
    campaignId: '',
    bankAccountId: '',
    amount: '',
    reason: ''
  });
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  
  // Turnstile handlers for withdrawal
  const handleTurnstileVerify = (token) => {
    setTurnstileToken(token);
    setWithdrawalForm({...withdrawalForm, turnstileToken: token});
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken('');
    setWithdrawalForm({...withdrawalForm, turnstileToken: ''});
  };

  const handleTurnstileError = () => {
    setTurnstileToken('');
    setWithdrawalForm({...withdrawalForm, turnstileToken: ''});
  };
  
  // Handle profile picture change
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setProfileUpdateLoading(true);
      
      // Upload using presigned URL
      const result = await uploadService.uploadFile(
        file, 
        { fileType: 'profile-picture' },
        (progress) => {
          console.log('Upload progress:', progress);
        }
      );
      
      if (result.success) {
        // Update user profile with new profile picture URL
        // Extract just the filename from the key (e.g., "users/profile-pictures/filename.jpg" -> "filename.jpg")
        const fileName = result.key.split('/').pop();
        
        const response = await apiRequest('PUT', '/api/users/profile', {
          profilePictureUrl: result.publicUrl,
          profilePicture: fileName // Store just the filename for consistency
        });
        
        if (response.ok) {
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
      } else {
        throw new Error(result.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProfileUpdateLoading(false);
    }
  };
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setProfileUpdateLoading(true);
      const response = await apiRequest('PUT', '/api/users/profile', profileData);
      
      if (response.ok) {
        const data = await response.json();
        
        // Update user object with new data
        const updatedUser = {
          ...user,
          ...data.user
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Force refresh of user data
        refreshAuth();
        
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully."
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProfileUpdateLoading(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setPasswordUpdateLoading(true);
      const response = await apiRequest('PUT', '/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully."
        });
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPasswordUpdateLoading(false);
    }
  };
  
  // Handle notification settings update
  const handleNotificationSettingsUpdate = async () => {
    try {
      setNotificationUpdateLoading(true);
      const response = await apiRequest('PUT', '/api/users/notification-settings', notificationSettings);
      
      if (response.ok) {
        toast({
          title: "Preferences updated",
          description: "Your notification preferences have been updated successfully."
        });
      } else {
        throw new Error('Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Update failed",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setNotificationUpdateLoading(false);
    }
  };
  
  // Add this computed value after all useEffect hooks
  // Filter campaigns based on active filter
  const filteredCampaigns = activeFilter
    ? userCampaigns.filter(campaign => campaign.status === activeFilter)
    : userCampaigns;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !localStorage.getItem('token')) {
      setLocation('/login');
    }
  }, [isAuthenticated, authLoading, setLocation]);
  
  // Load profile data when user data changes or when profile tab is active
  useEffect(() => {
    if (user && activeTab === 'profile') {
      console.log('Loading profile data:', user);
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || ''
      });
      
      // In a real app, you would fetch notification settings from backend
      // Here we just use default values
      setNotificationSettings({
        emailUpdates: true,
        newDonations: true,
        marketingEmails: false
      });
    }
  }, [user, activeTab]);
  
  // Fetch user campaigns from real backend
  useEffect(() => {
    const fetchUserCampaigns = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        // Call the real backend API
        const response = await apiRequest('GET', '/api/campaigns/user/campaigns');
        const data = await response.json();
        
        if (data.success) {
          setUserCampaigns(data.campaigns);
          
          // Calculate status counts
          const counts = {
            active: 0,
            pending: 0,
            completed: 0,
            cancelled: 0,
            rejected: 0
          };
          
          let totalRaised = 0;
          let totalDonors = 0;
          let totalProgress = 0;
          
          data.campaigns.forEach(campaign => {
            // Count campaigns by status
            counts[campaign.status]++;
            
            // Calculate analytics
            totalRaised += campaign.amountRaised || 0;
            totalDonors += campaign.donors || 0;
            totalProgress += campaign.percentageRaised || 0;
          });
          
          setStatusCounts(counts);
          
          // Set analytics
          setAnalytics({
            totalRaised:totalRaised,
            totalDonors,
            averageProgress: data.campaigns.length 
              ? Math.round(totalProgress / data.campaigns.length) 
              : 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch user campaigns:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserCampaigns();
  }, [isAuthenticated]);

  // Add these useEffects for fetching different types of donations
  
  // For donations tab - fetch donations made BY the user
  useEffect(() => {
    if (activeTab === 'donations' && user?._id) {
      const fetchDonations = async () => {
        setDonationsLoading(true);
        console.log('Attempting to fetch donations for user:', user._id);
        
        try {
          console.log('Making API request to:', `/api/users/mydonation/${user._id}`);
          const response = await apiRequest('GET', `/api/users/mydonation/${user._id}`);
          console.log('Response status:', response.status, response.ok);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);
            
            // Always ensure donations is an array
            if (data.success && Array.isArray(data.donations)) {
              console.log('Setting donations with data:', data.donations);
              console.log('Sample donation structure:', data.donations[0]);
              setDonations(data.donations);
            } else if (data.success && data.donations === null) {
              console.log('No donations returned from API');
              setDonations([]);
            } else {
              console.log('Unexpected response structure:', data);
              setDonations([]);
            }
          } else {
            console.error('Error response from donations API:', response.status);
            setDonations([]);
          }
        } catch (error) {
          console.error('Error fetching donations:', error);
          setDonations([]);
        } finally {
          setDonationsLoading(false);
        }
      };
      
      fetchDonations();
    }
  }, [activeTab, user]);

  // For overview section - fetch donations made TO the user's campaigns
  useEffect(() => {
    if (activeTab === 'overview' && user?._id) {
      const fetchRecentDonationsToUser = async () => {
        console.log('Fetching recent donations to user campaigns:', user._id);
        
        try {
          const response = await apiRequest('GET', `/api/donations/user/${user._id}/recent`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Recent donations to user campaigns:', data);
            
            if (data.success && Array.isArray(data.data)) {
              // Transform the data to match the existing donation structure for the overview section
              const transformedDonations = data.data.map(donation => {
                let donorName = 'Unknown Donor';
                
                if (donation.anonymous) {
                  donorName = 'Anonymous Donor';
                } else {
                  // Check for guest donation (has donorName field directly)
                  if (donation.donorName) {
                    donorName = donation.donorName;
                  }
                  // Check for logged-in user donation (has donorId.name)
                  else if (donation.donorId && donation.donorId.name) {
                    donorName = donation.donorId.name;
                  }
                }

                return {
                  id: donation._id,
                  campaignId: donation.campaignId._id,
                  campaignTitle: donation.campaignId.title,
                  amount: donation.amount,
                  date: new Date(donation.date).toLocaleDateString(),
                  status: 'Completed',
                  donorName: donorName,
                  donorId: donation.donorId ? donation.donorId._id : null,
                  anonymous: donation.anonymous || false,
                  message: donation.message || '',
                  isGuestDonation: !!donation.donorName && !donation.donorId
                };
              });
              setOverviewDonations(transformedDonations);
            } else {
              setOverviewDonations([]);
            }
          } else {
            console.error('Error fetching recent donations to user campaigns:', response.status);
            setOverviewDonations([]);
          }
        } catch (error) {
          console.error('Error fetching recent donations to user campaigns:', error);
          setOverviewDonations([]);
        }
      };
      
      fetchRecentDonationsToUser();
    }
  }, [activeTab, user]);
  
  // Add these functions before the return statement
  // Show feedback modal for a campaign
  const showFeedback = (campaign) => {
    setFeedbackModal({
      show: true,
      campaign
    });
  };

  // Withdrawal-related functions
  const fetchWithdrawals = async () => {
    if (!isAuthenticated) return;
    
    setWithdrawalsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/withdrawals/my-requests');
      const data = await response.json();
      
      if (data.success) {
        setWithdrawals(data.data || []);
      } else {
        console.error('Failed to fetch withdrawals:', data.message);
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    setBankAccountsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/bank/accounts');
      const data = await response.json();
      
      if (data.success) {
        setBankAccounts(data.data || []);
      } else {
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    } finally {
      setBankAccountsLoading(false);
    }
  };

  const initiateWithdrawal = (campaign) => {
    // Check if there's already a pending withdrawal request for this campaign
    const hasPendingRequest = withdrawals.some(withdrawal => 
      withdrawal.campaign._id === campaign._id && 
      (withdrawal.status === 'pending' || withdrawal.status === 'processing')
    );

    if (hasPendingRequest) {
      toast({
        title: "Withdrawal request already exists",
        description: "You already have a pending withdrawal request for this campaign. Please wait for it to be processed.",
        variant: "destructive"
      });
      return;
    }

    setWithdrawalModal({
      show: true,
      campaign
    });
    setWithdrawalForm({
      campaignId: campaign._id,
      bankAccountId: '',
      amount: '',
      reason: '',
      turnstileToken: ''
    });
    setTurnstileToken(''); // Reset turnstile token state
    fetchBankAccounts();
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    
    if (!withdrawalForm.turnstileToken) {
      toast({
        title: "Verification required",
        description: "Please complete the security verification.",
        variant: "destructive"
      });
      return;
    }

    setWithdrawalSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/withdrawals/request', {
        campaignId: withdrawalForm.campaignId,
        bankAccountId: withdrawalForm.bankAccountId,
        requestedAmount: parseFloat(withdrawalForm.amount),
        reason: withdrawalForm.reason,
        turnstileToken: withdrawalForm.turnstileToken
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Withdrawal request submitted",
          description: "Your withdrawal request has been submitted and will be processed within 3-5 business days.",
        });
        setWithdrawalModal({ show: false, campaign: null });
        setTurnstileToken(''); // Reset turnstile token
        fetchWithdrawals();
        // Refresh campaigns to update available amounts
        const campaignResponse = await apiRequest('GET', '/api/campaigns/user/campaigns');
        const campaignData = await campaignResponse.json();
        if (campaignData.success) {
          setUserCampaigns(campaignData.campaigns);
        }
      } else {
        // Enhanced error handling for existing pending requests
        if (data.existingRequest) {
          toast({
            title: "Withdrawal request already exists",
            description: `You have a ${data.existingRequest.status} withdrawal request for NPR ${data.existingRequest.amount.toLocaleString()} created on ${new Date(data.existingRequest.createdAt).toLocaleDateString()}. Please wait for it to be processed.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Withdrawal failed",
            description: data.message || "Failed to submit withdrawal request.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Error",
        description: "An error occurred while submitting your withdrawal request.",
        variant: "destructive"
      });
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const getWithdrawalStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: ClockIcon },
      processing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', icon: ArrowPathIcon },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: CheckCircleIcon },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: ExclamationTriangleIcon }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Fetch withdrawals when tab becomes active
  useEffect(() => {
    if (activeTab === 'withdrawals' && isAuthenticated) {
      fetchWithdrawals();
    }
  }, [activeTab, isAuthenticated]);

  // Handle campaign cancellation
  const handleCancelCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to cancel this campaign? This action cannot be undone and the campaign will be permanently deleted.')) return;
    
    try {
      setIsLoading(true);
      const response = await apiRequest('PATCH', `/api/campaigns/${campaignId}/status`, {
        status: 'cancelled'
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // If campaign was deleted (for non-admin users), remove it from local state
        if (responseData.deleted) {
          setUserCampaigns(prevCampaigns => 
            prevCampaigns.filter(c => c._id !== campaignId)
          );
          
          // Update status counts - find the original status to decrement correctly
          const originalCampaign = userCampaigns.find(c => c._id === campaignId);
          if (originalCampaign) {
            setStatusCounts(prev => ({
              ...prev,
              [originalCampaign.status]: prev[originalCampaign.status] - 1
            }));
          }
          
          toast({
            title: "Campaign cancelled",
            description: "The campaign has been cancelled and removed successfully."
          });
        } else {
          // If campaign status was just updated (for admin users)
          setUserCampaigns(prevCampaigns => 
            prevCampaigns.map(c => 
              c._id === campaignId ? {...c, status: 'cancelled'} : c
            )
          );
          
          // Update status counts for status change
          const originalCampaign = userCampaigns.find(c => c._id === campaignId);
          if (originalCampaign) {
            setStatusCounts(prev => ({
              ...prev,
              [originalCampaign.status]: prev[originalCampaign.status] - 1,
              cancelled: prev.cancelled + 1
            }));
          }
          
          toast({
            title: "Campaign cancelled",
            description: "The campaign status has been updated to cancelled."
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel campaign');
      }
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle campaign update submission
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    
    if (!updateForm.title.trim() || !updateForm.content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both title and content fields.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUpdateSubmitting(true);
      const response = await apiRequest('POST', `/api/campaigns/${updateModal.campaign._id}/updates`, updateForm);
      
      if (response.ok) {
        // Update the campaign in local state
        const data = await response.json();
        
        setUserCampaigns(prevCampaigns => 
          prevCampaigns.map(c => 
            c._id === updateModal.campaign._id 
              ? {...c, updates: [...(c.updates || []), data.update]} 
              : c
          )
        );
        
        // Close the modal and reset form
        setUpdateModal({ show: false, campaign: null });
        setUpdateForm({ title: '', content: '' });
        
        toast({
          title: "Update posted",
          description: "Your campaign update has been posted successfully."
        });
      } else {
        throw new Error('Failed to post update');
      }
    } catch (error) {
      console.error('Error posting campaign update:', error);
      toast({
        title: "Failed to post update",
        description: "There was an error posting your update. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdateSubmitting(false);
    }
  };
  
  // Show update modal for a campaign
  const showUpdateModal = (campaign) => {
    setUpdateModal({
      show: true,
      campaign
    });
    setUpdateForm({ title: '', content: '' });
  };
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }
  
  if (!isAuthenticated && !localStorage.getItem('token')) {
    return null; // Redirect happens in useEffect
  }

  // Dashboard components
  const dashboardComponents = {
    overview: (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Dashboard Overview</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex gap-2">
            <Link href="/start-campaign">
              <a className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
                <PlusIcon className="w-5 h-5 mr-2" />
                New Campaign
              </a>
            </Link>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Raised</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">Rs. {analytics.totalRaised.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="text-green-500 dark:text-green-400 font-medium">+{analytics.averageProgress}%</span> from your targets
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Campaigns</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{statusCounts.active}</h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {statusCounts.pending} campaign(s) pending approval
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Donors</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{analytics.totalDonors}</h3>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UserCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Across {userCampaigns.length} campaign(s)
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{analytics.averageProgress}%</h3>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <ArrowPathIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {statusCounts.completed} campaign(s) completed
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent Campaigns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">Recent Campaigns</h2>
          </div>
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 rounded"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : userCampaigns.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {userCampaigns.slice(0, 3).map(campaign => (
                <div key={campaign._id} className="p-6 flex items-start space-x-4">
                  <img 
                    src={getCoverImageUrl(campaign)}
                    alt={campaign.title}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/campaign/${campaign._id}`}>
                      <a className="text-base font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                        {campaign.title}
                      </a>
                    </Link>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        campaign.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {campaign.daysLeft} days left
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress 
                        value={campaign.targetAmount > 0 ? Math.min((campaign.amountRaised / campaign.targetAmount) * 100, 100) : 0}
                        className="h-1.5 bg-gray-200 dark:bg-gray-700" 
                        indicatorClassName="bg-blue-600 dark:bg-blue-500"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          Rs. {(campaign.amountRaised).toLocaleString()} raised
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {campaign.targetAmount > 0 ? Math.round((campaign.amountRaised / campaign.targetAmount) * 100) : 0}% of Rs. {campaign.targetAmount.toLocaleString()}
                        </span>
                      </div>
                      {/* Amount Withdrawn Information */}
                      {(campaign.amountWithdrawn || 0) > 0 && (
                        <div className="flex justify-between mt-1 text-xs text-blue-600 dark:text-blue-400">
                          <span className="font-medium">
                            Rs. {(campaign.amountWithdrawn || 0).toLocaleString()} withdrawn
                          </span>
                          <span className="text-blue-500 dark:text-blue-300">
                            Rs. {((campaign.amountRaised || 0) - (campaign.amountWithdrawn || 0)).toLocaleString()} available
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 text-center">
                <Link href="#" onClick={() => setActiveTab('campaigns')}>
                  <a className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                    View all campaigns
                  </a>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                <PlusIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first campaign and start making a difference!</p>
              <Link href="/start-campaign">
                <a className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
                  Create Campaign
                </a>
              </Link>
            </div>
          )}
        </div>
        
        {/* Recent Donations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">Recent Donations to Your Campaigns</h2>
          </div>
          
          {overviewDonations.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Donor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {overviewDonations.slice(0, 4).map(donation => (
                    <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {donation.donorName}
                          </span>
                          {donation.anonymous && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              Anonymous
                            </span>
                          )}
                          {donation.isGuestDonation && !donation.anonymous && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Guest
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/campaign/${donation.campaignId}`}>
                          <a className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                            {donation.campaignTitle}
                          </a>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Rs. {(donation.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate block">
                          {donation.message ? donation.message : <em>No message</em>}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {donation.date}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                <CurrencyDollarIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No donations received yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Share your campaigns to start receiving donations from supporters.</p>
              <Link href="/campaigns">
                <a className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
                  View Your Campaigns
                </a>
              </Link>
            </div>
          )}
        </div>
      </div>
    ),
    
    // Replace the simplified campaigns tab
    campaigns: (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Your Campaigns</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage and track all your fundraising campaigns</p>
          </div>
          <Link href="/start-campaign">
            <a className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Campaign
            </a>
          </Link>
        </div>

        {/* Campaign filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap gap-2">
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !activeFilter ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveFilter(null)}
          >
            All ({userCampaigns.length})
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveFilter('active')}
          >
            Active ({statusCounts.active})
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveFilter('pending')}
          >
            Under Review ({statusCounts.pending})
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveFilter('completed')}
          >
            Completed ({statusCounts.completed})
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveFilter('rejected')}
          >
            Rejected ({statusCounts.rejected})
          </button>
          <button 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'cancelled' ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveFilter('cancelled')}
          >
            Cancelled ({statusCounts.cancelled})
          </button>
        </div>

        {/* Campaign List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="bg-gray-200 dark:bg-gray-700 h-24 w-24 rounded-lg"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            filteredCampaigns.map(campaign => (
              <div key={campaign._id} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <img 
                      src={getCoverImageUrl(campaign)} 
                      alt={campaign.title}
                      className="w-full h-48 md:h-40 object-cover rounded-lg shadow-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          {campaign.title}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {campaign.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            campaign.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : 'Ended'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <div className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {campaign.shortDescription}
                    </p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">Rs. {campaign.amountRaised.toLocaleString()} raised</span>
                        <span className="text-gray-600 dark:text-gray-400">of Rs. {campaign.targetAmount.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={campaign.targetAmount > 0 ? Math.min((campaign.amountRaised / campaign.targetAmount) * 100, 100) : 0}
                        className="h-2 bg-gray-200 dark:bg-gray-700" 
                        indicatorClassName="bg-blue-600 dark:bg-blue-500"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {campaign.targetAmount > 0 ? Math.round((campaign.amountRaised / campaign.targetAmount) * 100) : 0}% funded
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {campaign.daysLeft} days left
                        </span>
                      </div>
                      {/* Amount Withdrawn Information */}
                      {(campaign.amountWithdrawn || 0) > 0 && (
                        <div className="flex justify-between text-xs mt-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Rs. {(campaign.amountWithdrawn || 0).toLocaleString()} withdrawn
                          </span>
                          <span className="text-blue-500 dark:text-blue-300">
                            Rs. {((campaign.amountRaised || 0) - (campaign.amountWithdrawn || 0)).toLocaleString()} available
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/campaign/${campaign._id}`}>
                          <a className="py-1.5 px-3 bg-[#8B2325] hover:bg-[#7a1f21] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                            View Campaign
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                          </a>
                        </Link>
                        
                        {campaign.status === 'pending' && (
                          <Link href={`/edit-campaign/${campaign._id}`}>
                            <a className="inline-flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Edit
                            </a>
                          </Link>
                        )}
                        
                        {campaign.status === 'active' && (
                          <>
                            <button 
                              onClick={() => showUpdateModal(campaign)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                              Post Update
                            </button>
                          </>
                        )}
                        
                        {(campaign.status === 'active' || campaign.status === 'completed') && (
                          <Link href={`/detailstatistic/${campaign._id}`}>
                            <a className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg">
                              <ChartPieIcon className="w-4 h-4 mr-2" />
                              View Analytics
                            </a>
                          </Link>
                        )}
                        
                        {((campaign.amountRaised - (campaign.amountWithdrawn || 0)) >= 10000) && (
                          (() => {
                            const hasPendingRequest = withdrawals.some(withdrawal => 
                              withdrawal.campaign._id === campaign._id && 
                              (withdrawal.status === 'pending' || withdrawal.status === 'processing')
                            );

                            if (hasPendingRequest) {
                              return (
                                <button 
                                  disabled
                                  className="inline-flex items-center px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                                  title="Withdrawal request pending"
                                >
                                  <ClockIcon className="w-4 h-4 mr-2" />
                                  Withdrawal Pending
                                </button>
                              );
                            }

                            return (
                              <button 
                                onClick={() => initiateWithdrawal(campaign)}
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <BanknotesIcon className="w-4 h-4 mr-2" />
                                Withdraw Funds
                              </button>
                            );
                          })()
                        )}
                        
                        {campaign.status === 'pending' && (
                          <button 
                            onClick={() => handleCancelCampaign(campaign._id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        )}
                        
                        {campaign.status === 'rejected' && (
                          <button 
                            onClick={() => showFeedback(campaign)}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                          >
                            <InformationCircleIcon className="w-4 h-4 mr-1" />
                            View Feedback
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {campaign.updates && campaign.updates.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                        <div className="flex items-center mb-2">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Updates</h4>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="mb-1">
                            <span className="font-medium">{campaign.updates[campaign.updates.length - 1].title}</span> - {new Date(campaign.updates[campaign.updates.length - 1].date).toLocaleDateString()}
                          </div>
                          <p className="line-clamp-2">
                            {campaign.updates[campaign.updates.length - 1].content}
                          </p>
                          
                          {campaign.updates.length > 1 && (
                            <Link href={`/campaign/${campaign._id}#updates`}>
                              <a className="text-primary-600 dark:text-primary-400 text-xs hover:underline inline-flex items-center mt-1">
                                View all {campaign.updates.length} updates
                              </a>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                <FolderPlusIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeFilter ? `No ${activeFilter} campaigns found` : 'No campaigns yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {activeFilter 
                  ? `You don't have any ${activeFilter} campaigns at the moment.`
                  : 'Create your first campaign and start making a difference!'
                }
              </p>
              {!activeFilter && (
                <Link href="/start-campaign">
                  <a className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
                    Create Campaign
                  </a>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    donations: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold dark:text-white">Your Donations</h2>
        </div>
        
        {donationsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="flex justify-center mb-4">
              <HeartIcon className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium dark:text-white">No Donations Yet</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">You haven't made any donations yet. Explore campaigns and support a cause you care about.</p>
            <Link to="/explore" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
              Explore Campaigns
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Campaign</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {donations.map((donation) => (
                    <tr key={donation._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {donation.campaignId?.coverImage ? (
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
  className="h-10 w-10 rounded-md object-cover"
  src={`${donation.campaignId.coverImage}`}
  alt=""
/>

                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <HeartIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {donation.campaignId?.title || "Unknown Campaign"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
  NPR {donation.amount }
</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(donation.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {donation.campaignId?._id ? (
                          <Link 
                            to={`/campaign/${donation.campaignId._id}`} 
                            className="text-primary hover:text-primary-dark dark:text-primary-light"
                          >
                            View Campaign
                          </Link>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Campaign Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    ),
    profile: (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Your Profile</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your personal information and account settings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6 col-span-2">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Profile Information</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-full md:w-28">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {user?.profilePicture ? (
                        <img 
                          src={getProfilePictureUrl(user)} 
                          alt={user?.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-medium">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <label 
                      htmlFor="profile-picture" 
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
                    >
                      <PencilIcon className="w-5 h-5" />
                      <span className="sr-only">Upload Photo</span>
                    </label>
                    <input 
                      type="file" 
                      id="profile-picture" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                    />
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input 
                        type="text" 
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        value={profileData.email} 
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={profileData.phone || ""} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea 
                      value={profileData.bio || ""} 
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
               <button 
  onClick={handleProfileUpdate}
  disabled={profileUpdateLoading}
  className="inline-flex items-center px-4 py-2 bg-[#800000] text-white font-medium rounded-lg hover:bg-[#660000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {profileUpdateLoading ? (
    <>
      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : 'Save Changes'}
</button>

              </div>
            </div>
          </div>
          
          {/* Account Settings */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold dark:text-white mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input 
                    type="password" 
                    value={passwordData.currentPassword} 
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    value={passwordData.newPassword} 
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input 
                    type="password" 
                    value={passwordData.confirmPassword} 
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="pt-2 flex justify-end">
                  <button 
  onClick={handleChangePassword}
  disabled={passwordUpdateLoading || passwordData.newPassword !== passwordData.confirmPassword}
  className="inline-flex items-center px-4 py-2 bg-[#800000] text-white font-medium rounded-lg hover:bg-[#660000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {passwordUpdateLoading ? (
    <>
      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
      Updating...
    </>
  ) : 'Update Password'}
</button>

                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold dark:text-white mb-4">Notification Settings</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.emailUpdates} 
                    onChange={(e) => setNotificationSettings({...notificationSettings, emailUpdates: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Email Campaign Updates</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.newDonations} 
                    onChange={(e) => setNotificationSettings({...notificationSettings, newDonations: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">New Donation Alerts</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.marketingEmails} 
                    onChange={(e) => setNotificationSettings({...notificationSettings, marketingEmails: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Marketing Emails</span>
                </label>
                
                <div className="pt-3 flex justify-end">
                  <button 
                    onClick={handleNotificationSettingsUpdate}
                    disabled={notificationUpdateLoading}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {notificationUpdateLoading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    
    // Bank accounts component
    bankAccounts: (
      <div className="space-y-6">
        <BankAccountList 
          key={bankAccountsRefresh}
          onRefresh={() => setBankAccountsRefresh(prev => prev + 1)}
        />
      </div>
    ),
    
    // Withdrawals component
    withdrawals: (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Withdrawal Requests</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your fund withdrawal requests and history</p>
          </div>
          <button
            onClick={() => setActiveTab('campaigns')}
            className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Withdrawal Request
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Withdrawn</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  NPR {withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.requestedAmount, 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Requests</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </h3>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available to Withdraw</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  NPR {userCampaigns
                    .filter(c => (c.amountRaised - (c.amountWithdrawn || 0)) >= 10000)
                    .reduce((sum, c) => sum + (c.amountRaised - (c.amountWithdrawn || 0)), 0)
                    .toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ArrowDownOnSquareIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold dark:text-white">Withdrawal History</h3>
          </div>

          {withdrawalsLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 rounded"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : withdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Bank Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reason
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Admin Response
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            {withdrawal.campaign?.coverImage ? (
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={`${withdrawal.campaign.coverImage}`}
                                  alt=""
                                />
                              </div>
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <BanknotesIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {withdrawal.campaign?.title || 'Campaign Deleted'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {withdrawal.campaign?._id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          NPR {withdrawal.requestedAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {withdrawal.bankAccount?.bankName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {withdrawal.bankAccount?.accountNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getWithdrawalStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {withdrawal.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {withdrawal.adminResponse ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {withdrawal.adminResponse.actionTaken}
                            </div>
                            {withdrawal.adminResponse.comments && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                {withdrawal.adminResponse.comments}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(withdrawal.adminResponse.reviewedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500">
                            {withdrawal.status === 'pending' ? 'Under Review' : 'No Response'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No withdrawal requests</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You haven't made any withdrawal requests yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  View Your Campaigns
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Eligible Campaigns for Withdrawal */}
        {userCampaigns.filter(c => (c.amountRaised - (c.amountWithdrawn || 0)) >= 10000).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold dark:text-white">Campaigns Eligible for Withdrawal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Campaigns with more than NPR 10,000 available for withdrawal
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCampaigns
                  .filter(campaign => (campaign.amountRaised - (campaign.amountWithdrawn || 0)) >= 10000)
                  .map(campaign => (
                    <div key={campaign._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <img 
                          src={`${campaign.coverImage}`}
                          alt={campaign.title}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                            {campaign.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Available: NPR {((campaign.amountRaised || 0) - (campaign.amountWithdrawn || 0)).toLocaleString()}
                          </p>
                          <button
                            onClick={() => initiateWithdrawal(campaign)}
                            className="mt-2 inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            <BanknotesIcon className="w-4 h-4 mr-1" />
                            Withdraw
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  };

  return (
    <>
      <SEO 
        title="User Dashboard" 
        description="Manage your campaigns, donations, and profile on NepalCrowdRise."
        keywords="user dashboard, campaign management, donation history"
      />
      
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
            <div className="p-6 flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center overflow-hidden">
                {user?.profilePicture ? (
                  <img 
                  src={getProfilePictureUrl(user)} 
                    alt={user?.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
              </div>
            </div>
            
            <nav className="px-3 py-4">
              <ul className="space-y-1">
                <li>
                  <button
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'overview'
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <HomeIcon className="w-5 h-5" />
                    <span>Overview</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'campaigns'
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveTab('campaigns')}
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Campaigns</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'donations'
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveTab('donations')}
                  >
                    <CurrencyDollarIcon className="w-5 h-5" />
                    <span>Donations</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'bankAccounts'
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveTab('bankAccounts')}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    <span>Bank Accounts</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'withdrawals'
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveTab('withdrawals')}
                  >
                    <BanknotesIcon className="w-5 h-5" />
                    <span>Withdrawals</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                </li>
                <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={logout}
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </nav>
            
            <div className="px-4 py-6">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 mb-3">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="font-medium text-sm">Need help?</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Have questions about your campaigns or donations?
                </p>
                <a 
                  href="mailto:support@nepalcrowdrise.com"
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
                >
                  Contact Support
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 p-6 md:p-8 max-w-7xl">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {dashboardComponents[activeTab]}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Campaign Update Modal */}
      {updateModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Post Campaign Update</h3>
                <button
                  onClick={() => setUpdateModal({ show: false, campaign: null })}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitUpdate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Update Title
                  </label>
                  <input
                    type="text"
                    value={updateForm.title}
                    onChange={(e) => setUpdateForm({...updateForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    placeholder="What's new with your campaign?"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Update Content
                  </label>
                  <textarea
                    value={updateForm.content}
                    onChange={(e) => setUpdateForm({...updateForm, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 min-h-[120px]"
                    placeholder="Share the details with your donors..."
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateModal({ show: false, campaign: null })}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 
                             hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSubmitting}
                    className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md 
                             hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-70"
                  >
                    {updateSubmitting ? 'Posting...' : 'Post Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback Modal */}
      {feedbackModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Admin Feedback</h3>
              <button 
                onClick={() => setFeedbackModal({show: false, campaign: null})}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
              <p className="text-red-800 dark:text-red-400 text-sm">
                {feedbackModal.campaign?.rejectionReason}
              </p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setFeedbackModal({show: false, campaign: null})}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {withdrawalModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h3>
                <button
                  onClick={() => setWithdrawalModal({ show: false, campaign: null })}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {withdrawalModal.campaign && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {withdrawalModal.campaign.title}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Total Raised: NPR {withdrawalModal.campaign.amountRaised?.toLocaleString()}</p>
                    <p>Already Withdrawn: NPR {(withdrawalModal.campaign.amountWithdrawn || 0).toLocaleString()}</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      Available: NPR {((withdrawalModal.campaign.amountRaised || 0) - (withdrawalModal.campaign.amountWithdrawn || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleWithdrawalSubmit}>
                {/* Bank Account Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Bank Account
                  </label>
                  {bankAccounts.filter(account => account.verificationStatus === 'verified').length > 0 ? (
                    <select
                      value={withdrawalForm.bankAccountId}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, bankAccountId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      required
                    >
                      <option value="">Choose a bank account</option>
                      {bankAccounts.filter(account => account.verificationStatus === 'verified').map(account => (
                        <option key={account._id} value={account._id}>
                          {account.bankName} - {account.accountNumber} ({account.accountName})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-yellow-800 dark:text-yellow-400 text-sm mb-2">
                        You need to add and verify a bank account before withdrawing funds.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawalModal({ show: false, campaign: null });
                          setShowAddBankAccount(true);
                        }}
                        className="text-sm bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
                      >
                        Add Bank Account
                      </button>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Withdrawal Amount (NPR)
                  </label>
                  <input
                    type="number"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    placeholder="Enter amount"
                    min="10000"
                    max={withdrawalModal.campaign ? 
                      (withdrawalModal.campaign.amountRaised || 0) - (withdrawalModal.campaign.amountWithdrawn || 0) : 0}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum withdrawal: NPR 10,000
                  </p>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Withdrawal
                  </label>
                  <textarea
                    value={withdrawalForm.reason}
                    onChange={(e) => setWithdrawalForm({...withdrawalForm, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 min-h-[80px]"
                    placeholder="Explain how you plan to use these funds..."
                    required
                  />
                </div>

                {/* Turnstile Captcha */}
                <div className="mb-6">
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

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawalModal({ show: false, campaign: null });
                      setTurnstileToken(''); // Reset turnstile token when canceling
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                             rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawalSubmitting || !withdrawalForm.turnstileToken || bankAccounts.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {withdrawalSubmitting ? 'Processing...' : 'Submit Withdrawal Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showAddBankAccount && (
        <AddBankAccount
          onSuccess={() => {
            setShowAddBankAccount(false);
            setBankAccountsRefresh(prev => prev + 1);
            toast({
              title: "Success",
              description: "Bank account added successfully. It will be reviewed within 24-48 hours.",
            });
          }}
          onClose={() => setShowAddBankAccount(false)}
        />
      )}
    </>
  );
};

export default UserDashboard;
