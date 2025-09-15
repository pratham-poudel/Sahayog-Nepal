import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import SEO from '../utils/seo.jsx';
import { useAuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useContext } from 'react';
import useCategories from '../hooks/useCategories';
import HierarchicalCategorySelector from '../components/campaigns/HierarchicalCategorySelector';
import TurnstileWidget from '../components/common/TurnstileWidget';
import FileUpload from '../components/common/FileUpload.jsx';
import axios from 'axios';
import { API_URL as CONFIG_API_URL, TURNSTILE_CONFIG } from '../config/index.js';

const StartCampaign = () => {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuthContext();
  const { theme } = useContext(ThemeContext);
  const { categories, loading: categoriesLoading } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [coverImageUpload, setCoverImageUpload] = useState(null);
  const [additionalImageUploads, setAdditionalImageUploads] = useState([]);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileKey, setTurnstileKey] = useState(0); // Force re-render of Turnstile widget
  const [showTurnstile, setShowTurnstile] = useState(false); // Show/hide Turnstile widget
  
  // Hierarchical categories state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  
  // Auto-save functionality
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  
  const { toast } = useToast();
  const authCheckPerformed = useRef(false);
  const autoSaveTimeoutRef = useRef(null);
  
  const { register, handleSubmit, watch, trigger, formState: { errors, isValid }, setValue, getValues } = useForm({
    defaultValues: {
      title: '',
      category: '',
      subcategory: '',
      targetAmount: 10000,
      endDate: '',
      shortDescription: '',
      story: '',
      coverImage: null,
      additionalImages: []
    },
    mode: 'onChange'
  });
  
  const watchCategory = watch('category');
  const watchSubcategory = watch('subcategory');
  
  // Filter out 'All Campaigns' from categories
  const campaignCategories = categories.filter(category => category !== 'All Campaigns');

  // Handle hierarchical category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setValue('category', category);
    // Clear subcategory when main category changes
    setSelectedSubcategory(null);
    setValue('subcategory', '');
  };

  const handleSubcategoryChange = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setValue('subcategory', subcategory || '');
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authCheckPerformed.current) {
      authCheckPerformed.current = true;
      toast({
        title: "Authentication required",
        description: "Please log in to create a campaign",
        variant: "destructive"
      });
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation, toast]);

  // Auto-save functionality
  const AUTO_SAVE_KEY = `campaign_draft_${user?.id || 'anonymous'}`;
  const AUTO_SAVE_TIMESTAMP_KEY = `${AUTO_SAVE_KEY}_timestamp`;

  const saveFormData = (formData, step, images = null) => {
    if (!autoSaveEnabled) return;
    
    setAutoSaveStatus('saving');
    
    const dataToSave = {
      formData,
      step,
      timestamp: Date.now(),
      userId: user?.id,
      images: {
        coverPreview: uploadedCoverPreview,
        additionalPreviews: uploadedAdditionalPreviews,
        hasCoverImage: !!coverImage // Track if cover image exists
      }
    };
    
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(AUTO_SAVE_TIMESTAMP_KEY, dataToSave.timestamp.toString());
      setAutoSaveStatus('saved');
      
      // Clear saved status after 3 seconds
      setTimeout(() => setAutoSaveStatus(''), 3000);
    } catch (error) {
      console.warn('Failed to save form data:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  };

  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      const timestamp = localStorage.getItem(AUTO_SAVE_TIMESTAMP_KEY);
      
      if (saved && timestamp) {
        const parsedData = JSON.parse(saved);
        const savedTime = parseInt(timestamp);
        const now = Date.now();
        
        // Check if saved data is less than 24 hours old
        if (now - savedTime < 24 * 60 * 60 * 1000) {
          return parsedData;
        } else {
          // Clean up old data
          clearSavedData();
        }
      }
    } catch (error) {
      console.warn('Failed to load saved data:', error);
      clearSavedData();
    }
    return null;
  };

  const clearSavedData = () => {
    localStorage.removeItem(AUTO_SAVE_KEY);
    localStorage.removeItem(AUTO_SAVE_TIMESTAMP_KEY);
  };

  const restoreFormData = (savedData) => {
    if (savedData.formData) {
      Object.keys(savedData.formData).forEach(key => {
        setValue(key, savedData.formData[key]);
      });
    }
    
    if (savedData.step) {
      setCurrentStep(savedData.step);
    }
    
    if (savedData.images) {
      if (savedData.images.coverPreview) {
        setUploadedCoverPreview(savedData.images.coverPreview);
        // Note: We can't restore the actual file object, but we track that there was one
        // The user will need to re-upload if they want to submit
        if (savedData.images.hasCoverImage) {
          // Set a flag to indicate this is a restored preview, not a new upload
          setCoverImage('RESTORED_PREVIEW'); // Special marker to indicate restored state
        }
      }
      if (savedData.images.additionalPreviews) {
        setUploadedAdditionalPreviews(savedData.images.additionalPreviews);
      }
    }
    
    toast({
      title: "Campaign Restored",
      description: "Your previous campaign data has been restored. You may need to re-upload your cover image to submit.",
      variant: "default"
    });
  };

  const handleContinueDraft = () => {
    if (savedData) {
      restoreFormData(savedData);
    }
    setShowContinueModal(false);
  };

  const handleStartOver = () => {
    clearSavedData();
    setShowContinueModal(false);
    toast({
      title: "Starting Fresh",
      description: "Previous campaign data has been cleared.",
      variant: "default"
    });
  };

  // Check for saved data on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const saved = loadSavedData();
      if (saved && saved.userId === user.id) {
        setSavedData(saved);
        setShowContinueModal(true);
      }
    }
  }, [isAuthenticated, user]);

  // Auto-save form data with debounce
  const watchedValues = watch();
  useEffect(() => {
    if (!isAuthenticated || !user || !autoSaveEnabled) return;
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      const formData = getValues();
      // Only save if there's meaningful data
      if (formData.title?.trim() || formData.category || formData.shortDescription?.trim()) {
        saveFormData(formData, currentStep, { coverImage, additionalImages });
      }
    }, 2000); // Save after 2 seconds of inactivity
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [watchedValues, currentStep, isAuthenticated, user, autoSaveEnabled]);

  // Clean up auto-save on successful submission
  const clearAutoSave = () => {
    clearSavedData();
    setAutoSaveEnabled(false);
  };

  // Validate current step before proceeding to next
  const handleNextStep = async () => {
    let isStepValid = false;
    
    if (currentStep === 1) {
      isStepValid = await trigger(['title', 'category', 'targetAmount', 'endDate']);
      
      // Additional validation for targetAmount
      const targetAmount = getValues('targetAmount');
      if (targetAmount < 10000 || targetAmount > 10000000) {
        setValue('targetAmount', targetAmount < 10000 ? 10000 : 10000000);
        toast({
          title: "Invalid amount",
          description: "Fundraising goal must be between Rs. 10,000 and Rs. 1 crore",
          variant: "destructive"
        });
        return;
      }
      
      // Additional validation for endDate
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(getValues('endDate'));
      if (endDate < today) {
        toast({
          title: "Invalid date",
          description: "End date must be in the future",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 2) {
      isStepValid = await trigger(['shortDescription', 'story']);
      
      // Validate cover image
      if (!coverImageUpload) {
        toast({
          title: "Cover image required",
          description: "Please upload a cover image for your campaign",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (isStepValid) {
      nextStep();
    } else {
      toast({
        title: "Incomplete information",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive"
      });
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = (uploadResult) => {
    setCoverImageUpload(uploadResult);
    toast({
      title: "Cover image uploaded",
      description: "Cover image has been uploaded successfully.",
    });
  };

  // Handle additional images upload
  const handleAdditionalImagesUpload = (uploadResults) => {
    setAdditionalImageUploads(uploadResults);
    toast({
      title: "Additional images uploaded", 
      description: `${uploadResults.length} additional image(s) uploaded successfully.`,
    });
  };
  
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  
  // Handle Turnstile verification
  const handleTurnstileVerify = (token) => {
    setTurnstileToken(token);
    toast({
      title: "Security verification successful",
      description: "You can now submit your campaign.",
      variant: "default"
    });
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setShowTurnstile(false);
    toast({
      title: "Security verification expired",
      description: "Please verify security again before submitting.",
      variant: "destructive"
    });
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setShowTurnstile(false);
    toast({
      title: "Security verification failed",
      description: "There was an error with the security verification. Please try again.",
      variant: "destructive"
    });
  };

  const startSecurityVerification = () => {
    setShowTurnstile(true);
    setTurnstileKey(prev => prev + 1); // Force re-render
  };

  // Reset Turnstile when going back from Step 3
  useEffect(() => {
    if (currentStep < 3 && (turnstileToken || showTurnstile)) {
      setTurnstileToken(null);
      setShowTurnstile(false);
      setTurnstileKey(prev => prev + 1);
    }
  }, [currentStep, turnstileToken, showTurnstile]);
  
  const onSubmit = async (data) => {
    // Check if user is logged in
    if (!isAuthenticated && !authCheckPerformed.current) {
      authCheckPerformed.current = true;
      toast({
        title: "Login required",
        description: "Please log in to create a campaign.",
        variant: "destructive"
      });
      setLocation('/login');
      return;
    }

    // Check turnstile verification
    if (!turnstileToken) {
      toast({
        title: "Security verification required",
        description: "Please complete the security verification to proceed.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare campaign data - no FormData needed as files are already uploaded
      const campaignData = {
        title: data.title,
        category: data.category,
        subcategory: data.subcategory || null,
        targetAmount: data.targetAmount,
        endDate: data.endDate,
        shortDescription: data.shortDescription,
        story: data.story,
        turnstileToken: turnstileToken,
        coverImageUrl: coverImageUpload?.publicUrl,
        coverImage: coverImageUpload?.publicUrl, // Store full URL directly
        additionalImages: additionalImageUploads.map(upload => upload.publicUrl), // Store full URLs
        additionalImageUrls: additionalImageUploads.map(upload => upload.publicUrl)
      };
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Send request to API
      const response = await axios.post(
        `${CONFIG_API_URL}/api/campaigns`,
        campaignData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Check response status and data
      if (response.data && response.data.success) {
        // Clear auto-save data on successful submission
        clearAutoSave();
        
        toast({
          title: "Campaign created!",
          description: response.data.message || "Your campaign has been submitted for review.",
        });
        
        // Redirect to dashboard with page refresh to ensure clean state
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        // Handle successful request but with error in response
        toast({
          title: "Something went wrong",
          description: response.data.message || "Unable to create campaign. Please try again.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Campaign creation error:', error);
      
      // Extract error message from response if available
      let errorMessage = "An error occurred while creating your campaign.";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        console.log('Server response:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response received from server. Please check your internet connection.";
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Campaign creation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Start a Campaign" 
        description="Create your own fundraising campaign on Sahayog Nepal. Share your story and start raising funds for your cause."
        keywords="create campaign, start fundraising, Nepal crowdfunding, raise funds"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative text-center mb-12 rounded-2xl overflow-hidden min-h-[250px] md:min-h-[300px]">
              {/* Background Image */}
              <img 
                src="http://127.0.0.1:9000/mybucket/uploads/ChatGPT%20Image%20Jun%209,%202025,%2011_19_53%20AM.png"
                alt="Campaign Background"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40 dark:from-black/60 dark:via-black/40 dark:to-black/60"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col justify-center items-center h-full py-12 md:py-16 px-4 md:px-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold mb-3 md:mb-4 text-white drop-shadow-2xl text-center leading-tight">
                  Start Your Campaign
                </h1>
                <p className="text-base md:text-lg text-white/95 max-w-xl md:max-w-2xl mx-auto drop-shadow-lg text-center leading-relaxed">
                  Share your story, connect with supporters, and make a meaningful impact. 
                  Create your fundraising campaign in just a few simple steps.
                </p>
              </div>
            </div>
            
            {/* Auto-save indicator */}
            <AnimatePresence>
              {autoSaveStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
                    autoSaveStatus === 'saving' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : autoSaveStatus === 'saved'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}
                >
                  {autoSaveStatus === 'saving' && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {autoSaveStatus === 'error' && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {autoSaveStatus === 'saving' && 'Saving draft...'}
                    {autoSaveStatus === 'saved' && 'Draft saved'}
                    {autoSaveStatus === 'error' && 'Save failed'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Continue Draft Modal */}
            <AnimatePresence>
              {showContinueModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowContinueModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-gray-200 dark:border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center mb-6">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                        <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Continue Your Campaign?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        We found a saved draft of your campaign from{' '}
                        <span className="font-medium">
                          {savedData && new Date(savedData.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>. Would you like to continue where you left off?
                      </p>
                    </div>
                    
                    <div className="flex space-x-4">
                      <motion.button
                        type="button"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#8B2325] to-[#a02729] text-white font-semibold rounded-xl hover:from-[#7a1f21] hover:to-[#8f2326] transition-all duration-300 shadow-lg hover:shadow-xl"
                        onClick={handleContinueDraft}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Continue Draft
                      </motion.button>
                      <motion.button
                        type="button"
                        className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300"
                        onClick={handleStartOver}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Start Over
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className="flex flex-col items-center"
                  >
                    <div 
                      className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 relative ${
                        currentStep >= step 
                          ? 'bg-gradient-to-r from-[#8B2325] to-[#a02729] text-white shadow-lg' 
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step === 3 && turnstileToken ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step
                      )}
                      {step === 3 && currentStep === 3 && turnstileToken && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className={`text-sm mt-3 font-medium transition-colors duration-300 ${
                      currentStep >= step ? 'text-[#8B2325] dark:text-[#a02729]' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step === 1 && 'Basic Information'}
                      {step === 2 && 'Campaign Details'}
                      {step === 3 && 'Review & Submit'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative mt-4">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div 
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-[#8B2325] to-[#a02729] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="p-8 md:p-12">
                    <div className="flex items-center mb-8">
                      <div className="h-8 w-1 bg-gradient-to-b from-[#8B2325] to-[#a02729] rounded-full mr-4"></div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Basic Information</h2>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="group">
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Campaign Title*
                        </label>
                        <input
                          id="title"
                          type="text"
                          className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                            errors.title 
                              ? 'border-red-400 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400' 
                              : 'border-gray-200 dark:border-gray-600 focus:border-[#8B2325] dark:focus:border-[#a02729] group-hover:border-gray-300 dark:group-hover:border-gray-500'
                          }`}
                          placeholder="e.g., Clean Water for Remote Villages in Nepal"
                          {...register("title", { required: "Campaign title is required" })}
                        />
                        {errors.title && (
                          <p className="mt-2 text-red-500 dark:text-red-400 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="group">
                        <HierarchicalCategorySelector
                          selectedCategory={selectedCategory}
                          selectedSubcategory={selectedSubcategory}
                          onCategoryChange={handleCategoryChange}
                          onSubcategoryChange={handleSubcategoryChange}
                          loading={categoriesLoading}
                          mode="dropdown"
                        />
                        
                        {/* Hidden fields for form validation */}
                        <input
                          type="hidden"
                          {...register("category", { required: "Please select a category" })}
                          value={selectedCategory}
                        />
                        <input
                          type="hidden"
                          {...register("subcategory")}
                          value={selectedSubcategory || ''}
                        />
                        
                        {errors.category && (
                          <p className="mt-2 text-red-500 dark:text-red-400 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.category.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group">
                          <label htmlFor="targetAmount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Fundraising Goal (NPR)*
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-lg">
                              Rs.
                            </span>
                            <input
                              id="targetAmount"
                              type="number"
                              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                                errors.targetAmount 
                                  ? 'border-red-400 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400' 
                                  : 'border-gray-200 dark:border-gray-600 focus:border-[#8B2325] dark:focus:border-[#a02729] group-hover:border-gray-300 dark:group-hover:border-gray-500'
                              }`}
                              placeholder="10,000"
                              min="10000"
                              {...register("targetAmount", { 
                                required: "Fundraising goal is required",
                                min: {
                                  value: 10000,
                                  message: "Minimum goal amount is Rs. 10,000"
                                }
                              })}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum: Rs. 10,000 | Maximum: Rs. 1,00,00,000</p>
                          {errors.targetAmount && (
                            <p className="mt-2 text-red-500 dark:text-red-400 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.targetAmount.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="group">
                          <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Campaign End Date*
                          </label>
                          <input
                            id="endDate"
                            type="date"
                            className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white ${
                              errors.endDate 
                                ? 'border-red-400 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400' 
                                : 'border-gray-200 dark:border-gray-600 focus:border-[#8B2325] dark:focus:border-[#a02729] group-hover:border-gray-300 dark:group-hover:border-gray-500'
                            }`}
                            {...register("endDate", { 
                              required: "End date is required",
                              validate: value => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const selectedDate = new Date(value);
                                return selectedDate > today || "End date must be in the future";
                              }
                            })}
                          />
                          {errors.endDate && (
                            <p className="mt-2 text-red-500 dark:text-red-400 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.endDate.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <motion.button
                        type="button"
                        className="px-8 py-3 bg-gradient-to-r from-[#8B2325] to-[#a02729] text-white font-semibold rounded-lg hover:from-[#7a1f21] hover:to-[#8f2326] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        onClick={handleNextStep}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Continue to Details →
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Campaign Details */}
                {currentStep === 2 && (
                  <div className="p-6 md:p-8 bg-gradient-to-br from-white dark:from-gray-800 to-gray-50/30 dark:to-gray-800/30">
                    <div className="flex items-center mb-8">
                      <div className="h-8 w-1 bg-gradient-to-b from-[#8B2325] to-[#a02729] rounded-full mr-4"></div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Campaign Details</h2>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="group">
                        <label htmlFor="shortDescription" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Short Description*
                        </label>
                        <textarea
                          id="shortDescription"
                          rows="3"
                          className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none ${
                            errors.shortDescription 
                              ? 'border-red-400 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400' 
                              : 'border-gray-200 dark:border-gray-600 focus:border-[#8B2325] dark:focus:border-[#a02729] group-hover:border-gray-300 dark:group-hover:border-gray-500'
                          }`}
                          placeholder="Provide a brief summary of your campaign (150-200 characters)"
                          {...register("shortDescription", { 
                            required: "Description is required",
                            maxLength: {
                              value: 200,
                              message: "Description should not exceed 200 characters"
                            }
                          })}
                        ></textarea>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>{watch('shortDescription')?.length || 0} / 200 characters</span>
                          {errors.shortDescription && (
                            <p className="text-red-500 dark:text-red-400 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.shortDescription.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="group">
                        <label htmlFor="story" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Campaign Story*
                        </label>
                        <textarea
                          id="story"
                          rows="6"
                          className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none ${
                            errors.story 
                              ? 'border-red-400 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400' 
                              : 'border-gray-200 dark:border-gray-600 focus:border-[#8B2325] dark:focus:border-[#a02729] group-hover:border-gray-300 dark:group-hover:border-gray-500'
                          }`}
                          placeholder="Tell potential donors about your campaign, why it matters, and how their donations will help"
                          {...register("story", { required: "Campaign story is required" })}
                        ></textarea>
                        {errors.story && (
                          <p className="mt-2 text-red-500 dark:text-red-400 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.story.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Cover Image* (Required)
                        </label>
                        <FileUpload
                          fileType="campaign-cover"
                          accept="image/*"
                          maxFiles={1}
                          onUploadComplete={handleCoverImageUpload}
                          className="w-full"
                        >
                          <p className="text-sm font-medium">
                            Click to upload cover image or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG, GIF up to 15MB (1200x630px recommended)
                          </p>
                        </FileUpload>
                      </div>
                      
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Additional Images (Optional - Up to 3)
                        </label>
                        <FileUpload
                          fileType="campaign-image"
                          accept="image/*"
                          maxFiles={3}
                          onUploadComplete={handleAdditionalImagesUpload}
                          className="w-full"
                        >
                          <p className="text-sm font-medium">
                            Click to upload additional images or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG, GIF up to 15MB each (max 3 images)
                          </p>
                        </FileUpload>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          These images will appear in the campaign gallery
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-between">
                      <motion.button
                        type="button"
                        className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 shadow-sm"
                        onClick={prevStep}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        ← Back
                      </motion.button>
                      <motion.button
                        type="button"
                        className="px-8 py-3 bg-gradient-to-r from-[#8B2325] to-[#a02729] text-white font-semibold rounded-lg hover:from-[#7a1f21] hover:to-[#8f2326] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        onClick={handleNextStep}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Review & Submit →
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Review & Submit */}
                {currentStep === 3 && (
                  <div className="p-6 md:p-8 bg-gradient-to-br from-white dark:from-gray-800 to-gray-50/30 dark:to-gray-800/30">
                    <div className="flex items-center mb-8">
                      <div className="h-8 w-1 bg-gradient-to-b from-[#8B2325] to-[#a02729] rounded-full mr-4"></div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Review & Submit</h2>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="bg-gradient-to-r from-gray-50 dark:from-gray-700 to-white dark:to-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Campaign Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Title</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{watch('title')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Category</p>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {watch('category')}
                              {watch('subcategory') && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                  • {watch('subcategory')}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Fundraising Goal</p>
                            <p className="font-semibold text-gray-800 dark:text-white">Rs. {parseInt(watch('targetAmount')).toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">End Date</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{new Date(watch('endDate')).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Short Description</h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{watch('shortDescription')}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Campaign Story</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{watch('story')}</p>
                        </div>
                      </div>
                      
                      {coverImageUpload && (
                        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Cover Image</h3>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <img 
                              src={coverImageUpload.publicUrl} 
                              alt="Cover Preview" 
                              className="w-full h-64 object-cover rounded-lg shadow-md"
                            />
                          </div>
                        </div>
                      )}
                      
                      {additionalImageUploads.length > 0 && (
                        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                          <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Additional Images</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {additionalImageUploads.map((upload, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <img 
                                  src={upload.publicUrl} 
                                  alt={`Additional Preview ${index + 1}`} 
                                  className="w-full h-32 object-cover rounded-lg shadow-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Security Verification */}
                      <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Security Verification</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          Please complete the security verification to prevent spam and ensure campaign authenticity.
                        </p>
                        {!turnstileToken && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              Complete the verification below to enable campaign submission.
                            </p>
                          </div>
                        )}
                        <div className="flex justify-center">
                          <TurnstileWidget
                            key={turnstileKey}
                            siteKey={TURNSTILE_CONFIG.siteKey}
                            onVerify={handleTurnstileVerify}
                            onExpire={handleTurnstileExpire}
                            onError={handleTurnstileError}
                            theme={theme === 'dark' ? 'dark' : 'light'}
                            size="normal"
                          />
                        </div>
                        {turnstileToken && (
                          <div className="mt-3 flex items-center justify-center text-green-600 dark:text-green-400">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Security verification completed</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gradient-to-r from-yellow-50 dark:from-yellow-900/20 to-amber-50 dark:to-amber-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-6 rounded-xl shadow-sm">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-yellow-500 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Campaign Review Process</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                              Your campaign will be carefully reviewed by our team before it goes live. This usually takes 1-2 business days to ensure quality and authenticity.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-10 flex justify-between items-center">
                      <motion.button
                        type="button"
                        className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 shadow-sm"
                        onClick={prevStep}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                      >
                        ← Back
                      </motion.button>
                      <motion.button
                        type="submit"
                        className={`px-8 py-3 bg-gradient-to-r from-[#8B2325] to-[#a02729] text-white font-semibold rounded-xl hover:from-[#7a1f21] hover:to-[#8f2326] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center ${
                          isLoading || !turnstileToken ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                        whileHover={isLoading || !turnstileToken ? {} : { scale: 1.02 }}
                        whileTap={isLoading || !turnstileToken ? {} : { scale: 0.98 }}
                        disabled={isLoading || !turnstileToken}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Campaign...
                          </>
                        ) : !turnstileToken ? (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Complete Security Check
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Submit Campaign
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default StartCampaign;