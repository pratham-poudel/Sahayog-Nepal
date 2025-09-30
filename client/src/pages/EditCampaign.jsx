import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import SEO from '../utils/seo.jsx';
import { useAuthContext } from '../contexts/AuthContext';
import useCategories from '../hooks/useCategories';
import HierarchicalCategorySelector from '../components/campaigns/HierarchicalCategorySelector';
import { apiRequest } from '../lib/queryClient';
import { getCoverImageUrl, getCampaignImageUrls } from '../utils/imageUtils';
import { API_URL as CONFIG_API_URL } from '../config/index.js';
import uploadService from '../services/uploadService';
import FileSelector from '../components/common/FileSelector';
import UploadProgressModal from '../components/common/UploadProgressModal';
import { DocumentIcon } from '@heroicons/react/24/outline';
import TurnstileWidget from '../components/common/TurnstileWidget';
import { TURNSTILE_CONFIG } from '../config/index.js';

const EditCampaign = ({ id }) => {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuthContext();
  const { categories, loading: categoriesLoading } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  
  // Existing campaign data state
  const [existingCoverImage, setExistingCoverImage] = useState(null);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]);
  const [existingVerificationDocs, setExistingVerificationDocs] = useState([]);
  
  // New files selected for upload
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [selectedAdditionalImages, setSelectedAdditionalImages] = useState([]);
  const [selectedVerificationDocs, setSelectedVerificationDocs] = useState([]);
  
  // Combined display arrays (existing + new)
  const [displayAdditionalImages, setDisplayAdditionalImages] = useState([]);
  const [displayVerificationDocs, setDisplayVerificationDocs] = useState([]);
  
  // Upload progress state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStages, setUploadStages] = useState([]);
  const [currentUploadStage, setCurrentUploadStage] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Turnstile validation state
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState(null);
  const { toast } = useToast();
  const authCheckPerformed = useRef(false);
  const turnstileRef = useRef();
  
  // Hierarchical categories state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  
  const { register, handleSubmit, watch, reset, formState: { errors }, setValue } = useForm({
    defaultValues: {
      title: '',
      category: '',
      subcategory: '',
      targetAmount: 10000,
      endDate: '',
      shortDescription: '',
      story: '',
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

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setFetchLoading(true);
        const response = await apiRequest('GET', `/api/campaigns/${id}`);
        
        if (!response.ok) {
          throw new Error('Campaign not found');
        }
        
        const data = await response.json();
        setCampaign(data.campaign);
          // Set form values
        reset({
          title: data.campaign.title,
          category: data.campaign.category,
          subcategory: data.campaign.subcategory || '',
          targetAmount: data.campaign.targetAmount,
          endDate: new Date(data.campaign.endDate).toISOString().split('T')[0],
          shortDescription: data.campaign.shortDescription,
          story: data.campaign.story
        });
        
        // Set category selector state
        setSelectedCategory(data.campaign.category);
        setSelectedSubcategory(data.campaign.subcategory || null);
        
        // Set existing cover image
        if (data.campaign.coverImage) {
          const coverImageUrl = getCoverImageUrl(data.campaign);
          setExistingCoverImage(coverImageUrl);
        }
        
        // Set existing additional images
        if (data.campaign.images && data.campaign.images.length > 0) {
          const imageUrls = getCampaignImageUrls(data.campaign);
          setExistingAdditionalImages(imageUrls);
          setDisplayAdditionalImages(imageUrls.map((url, index) => ({ 
            url, 
            type: 'existing', 
            id: `existing-${index}`,
            name: `Existing Image ${index + 1}`
          })));
        }
        
        // Set existing verification documents
        if (data.campaign.verificationDocuments && data.campaign.verificationDocuments.length > 0) {
          const verificationUrls = data.campaign.verificationDocuments.map(doc => {
            if (doc.startsWith('http')) {
              return doc;
            }
            return `${CONFIG_API_URL}/uploads/${doc}`;
          });
          setExistingVerificationDocs(verificationUrls);
          setDisplayVerificationDocs(verificationUrls.map((url, index) => ({ 
            url, 
            type: 'existing', 
            id: `existing-doc-${index}`,
            name: `Existing Document ${index + 1}`,
            preview: url
          })));
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast({
          title: "Error",
          description: "Could not load campaign details",
          variant: "destructive"
        });
        setLocation('/dashboard');
      } finally {
        setFetchLoading(false);
      }
    };
    
    if (isAuthenticated && id) {
      fetchCampaign();
    }
  }, [isAuthenticated, id, reset, setLocation, toast]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authCheckPerformed.current) {
      authCheckPerformed.current = true;
      toast({
        title: "Authentication required",
        description: "Please log in to edit a campaign",
        variant: "destructive"
      });
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation, toast]);

  // Redirect if campaign is not in 'pending' status
  useEffect(() => {
    if (campaign && campaign.status !== 'pending') {
      toast({
        title: "Edit not allowed",
        description: "Only campaigns under review can be edited",
        variant: "destructive"
      });
      setLocation('/dashboard');
    }
  }, [campaign, setLocation, toast]);

  // For checking if an existing image should be kept (utility function)
  const isExistingImageUrl = (url) => {
    if (!campaign || !campaign.images) return false;
    
    // Convert both to just filenames for comparison
    const urlFilename = url.split('/').pop();
    return campaign.images.some(img => {
      const imgFilename = img.split('/').pop();
      return imgFilename === urlFilename;
    });
  };
  
  // New file selection handlers
  const handleCoverImageSelect = (file) => {
    setSelectedCoverImage(file);
  };
  
  const handleAdditionalImagesSelect = (files) => {
    const currentTotal = displayAdditionalImages.length;
    const maxAllowed = 3;
    const availableSlots = maxAllowed - currentTotal;
    
    if (files.length > availableSlots) {
      toast({
        title: "Too many images",
        description: `You can only add ${availableSlots} more image(s). Currently have ${currentTotal}/3.`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedAdditionalImages(files || []);
    
    // Update display array
    const newImages = (files || []).map((file, index) => ({
      url: file.preview,
      type: 'new',
      id: `new-${index}`,
      name: file.name,
      file: file
    }));
    
    setDisplayAdditionalImages(prev => {
      const existingItems = prev.filter(item => item.type === 'existing');
      return [...existingItems, ...newImages];
    });
  };
  
  const handleVerificationDocsSelect = (files) => {
    const currentTotal = displayVerificationDocs.length;
    const maxAllowed = 3;
    const availableSlots = maxAllowed - currentTotal;
    
    if (files.length > availableSlots) {
      toast({
        title: "Too many documents",
        description: `You can only add ${availableSlots} more document(s). Currently have ${currentTotal}/3.`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedVerificationDocs(files || []);
    
    // Update display array
    const newDocs = (files || []).map((file, index) => ({
      url: file.preview,
      type: 'new',
      id: `new-doc-${index}`,
      name: file.name,
      preview: file.preview,
      file: file
    }));
    
    setDisplayVerificationDocs(prev => {
      const existingItems = prev.filter(item => item.type === 'existing');
      return [...existingItems, ...newDocs];
    });
  };
  
  // Remove functions
  const removeAdditionalImage = (itemId) => {
    setDisplayAdditionalImages(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      // Update selected files array to only include new files
      const newFiles = filtered.filter(item => item.type === 'new').map(item => item.file);
      setSelectedAdditionalImages(newFiles);
      return filtered;
    });
  };
  
  const removeVerificationDoc = (itemId) => {
    setDisplayVerificationDocs(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      // Update selected files array to only include new files
      const newFiles = filtered.filter(item => item.type === 'new').map(item => item.file);
      setSelectedVerificationDocs(newFiles);
      return filtered;
    });
  };
  
  // Turnstile handlers
  const handleTurnstileVerify = (token) => {
    console.log("Turnstile token received in EditCampaign");
    setTurnstileToken(token);
    setTurnstileError(null);
  };
  
  const handleTurnstileError = (errorCode) => {
    setTurnstileToken('');
    setTurnstileError(errorCode);
    toast({
      title: "Security verification failed",
      description: "Please try again.",
      variant: "destructive"
    });
  };
  
  const handleTurnstileExpire = () => {
    setTurnstileToken('');
    setTurnstileError("Token expired");
  };
  
  const onSubmit = async (data) => {
    // Check if user is logged in
    if (!isAuthenticated && !authCheckPerformed.current) {
      authCheckPerformed.current = true;
      toast({
        title: "Login required",
        description: "Please log in to edit a campaign.",
        variant: "destructive"
      });
      setLocation('/login');
      return;
    }
    
    // Validate Turnstile token
    if (!turnstileToken) {
      setTurnstileError("Please complete the security verification.");
      toast({
        title: "Security Verification Required",
        description: "Please complete the CAPTCHA verification to continue.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Initialize variables for uploaded files
      let uploadedCoverImage = null;
      let uploadedAdditionalImages = [];
      let uploadedVerificationDocs = [];
      
      // If there are new files to upload, show progress modal
      const hasNewUploads = selectedCoverImage || selectedAdditionalImages.length > 0 || selectedVerificationDocs.length > 0;
      
      if (hasNewUploads) {
        setShowUploadModal(true);
        setOverallProgress(0);
        
        // Prepare upload stages
        const stages = [];
        if (selectedCoverImage) {
          stages.push({
            id: 'cover',
            name: 'Uploading cover image...',
            status: 'pending',
            progress: 0
          });
        }
        if (selectedAdditionalImages.length > 0) {
          stages.push({
            id: 'additional',
            name: `Uploading ${selectedAdditionalImages.length} additional images...`,
            status: 'pending',
            progress: 0
          });
        }
        if (selectedVerificationDocs.length > 0) {
          stages.push({
            id: 'verification',
            name: `Uploading ${selectedVerificationDocs.length} verification documents...`,
            status: 'pending',
            progress: 0
          });
        }
        stages.push({
          id: 'submit',
          name: 'Updating campaign...',
          status: 'pending',
          progress: 0
        });
        
        setUploadStages(stages);
        
        const totalStages = stages.length;
        let completedStages = 0;
        
        // Upload cover image if selected
        if (selectedCoverImage) {
          setCurrentUploadStage('Uploading cover image...');
          setUploadStages(prev => prev.map(stage => 
            stage.id === 'cover' ? { ...stage, status: 'uploading' } : stage
          ));
          
          try {
            const result = await uploadService.uploadFile(selectedCoverImage, { fileType: 'campaign-cover' }, (progress) => {
              setUploadStages(prev => prev.map(stage => 
                stage.id === 'cover' ? { ...stage, progress } : stage
              ));
            });
            
            uploadedCoverImage = result.publicUrl;
            setUploadStages(prev => prev.map(stage => 
              stage.id === 'cover' ? { ...stage, status: 'completed', progress: 100 } : stage
            ));
            completedStages++;
            setOverallProgress((completedStages / totalStages) * 100);
          } catch (error) {
            setUploadStages(prev => prev.map(stage => 
              stage.id === 'cover' ? { ...stage, status: 'error', error: error.message } : stage
            ));
            throw new Error(`Cover image upload failed: ${error.message}`);
          }
        }
        
        // Upload additional images if selected
        if (selectedAdditionalImages.length > 0) {
          setCurrentUploadStage(`Uploading ${selectedAdditionalImages.length} additional images...`);
          setUploadStages(prev => prev.map(stage => 
            stage.id === 'additional' ? { ...stage, status: 'uploading' } : stage
          ));
          
          try {
            const results = await uploadService.uploadFiles(selectedAdditionalImages, { fileType: 'campaign-image' }, (progress) => {
              setUploadStages(prev => prev.map(stage => 
                stage.id === 'additional' ? { ...stage, progress } : stage
              ));
            });
            
            uploadedAdditionalImages = results.map(result => result.publicUrl);
            setUploadStages(prev => prev.map(stage => 
              stage.id === 'additional' ? { ...stage, status: 'completed', progress: 100 } : stage
            ));
            completedStages++;
            setOverallProgress((completedStages / totalStages) * 100);
          } catch (error) {
            setUploadStages(prev => prev.map(stage => 
              stage.id === 'additional' ? { ...stage, status: 'error', error: error.message } : stage
            ));
            throw new Error(`Additional images upload failed: ${error.message}`);
          }
        }
        
        // Upload verification documents if selected
        if (selectedVerificationDocs.length > 0) {
          setCurrentUploadStage(`Uploading ${selectedVerificationDocs.length} verification documents...`);
          setUploadStages(prev => prev.map(stage => 
            stage.id === 'verification' ? { ...stage, status: 'uploading' } : stage
          ));
          
          try {
            const results = await uploadService.uploadFiles(selectedVerificationDocs, { fileType: 'campaign-verification' }, (progress) => {
              setUploadStages(prev => prev.map(stage => 
                stage.id === 'verification' ? { ...stage, progress } : stage
              ));
            });
            
            uploadedVerificationDocs = results.map(result => result.publicUrl);
            setUploadStages(prev => prev.map(stage => 
              stage.id === 'verification' ? { ...stage, status: 'completed', progress: 100 } : stage
            ));
            completedStages++;
            setOverallProgress((completedStages / totalStages) * 100);
          } catch (error) {
            setUploadStages(prev => prev.map(stage => 
              stage.id === 'verification' ? { ...stage, status: 'error', error: error.message } : stage
            ));
            throw new Error(`Verification documents upload failed: ${error.message}`);
          }
        }
        
        // Update campaign data to include new uploads (we'll handle this in the payload creation)
        
        setCurrentUploadStage('Updating campaign...');
        setUploadStages(prev => prev.map(stage => 
          stage.id === 'submit' ? { ...stage, status: 'uploading' } : stage
        ));
      }
      
      // Create JSON payload instead of FormData
      const payload = {
        title: data.title,
        category: data.category,
        targetAmount: data.targetAmount,
        endDate: data.endDate,
        shortDescription: data.shortDescription,
        story: data.story,
        turnstileToken: turnstileToken // Include Turnstile token for server validation
      };

      if (data.subcategory) {
        payload.subcategory = data.subcategory;
      }
      
      // Only update cover image if a new one was selected
      if (selectedCoverImage && uploadedCoverImage) {
        payload.coverImage = uploadedCoverImage;
      }
      
      // Handle additional images - preserve existing ones and add new ones
      const finalAdditionalImages = [];
      displayAdditionalImages.forEach(item => {
        if (item.type === 'existing') {
          finalAdditionalImages.push(item.url);
        }
      });
      // Add newly uploaded images
      if (uploadedAdditionalImages.length > 0) {
        finalAdditionalImages.push(...uploadedAdditionalImages);
      }
      if (finalAdditionalImages.length > 0) {
        payload.additionalImages = finalAdditionalImages;
      }
      
      // Handle verification documents - preserve existing ones and add new ones
      const finalVerificationDocs = [];
      displayVerificationDocs.forEach(item => {
        if (item.type === 'existing') {
          finalVerificationDocs.push(item.url);
        }
      });
      // Add newly uploaded documents
      if (uploadedVerificationDocs.length > 0) {
        finalVerificationDocs.push(...uploadedVerificationDocs);
      }
      if (finalVerificationDocs.length > 0) {
        payload.verificationDocuments = finalVerificationDocs;
      }
      
      // Use fetch with JSON payload
      const token = localStorage.getItem('token');
      const response = await fetch(`${CONFIG_API_URL}/api/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update campaign');
      }
      
      // Mark final stage as completed
      if (hasNewUploads) {
        setUploadStages(prev => prev.map(stage => 
          stage.id === 'submit' ? { ...stage, status: 'completed', progress: 100 } : stage
        ));
        setOverallProgress(100);
        
        // Close modal after a short delay
        setTimeout(() => {
          setShowUploadModal(false);
        }, 2000);
      }
      
      // Show success message
      toast({
        title: "Campaign updated",
        description: "Your campaign has been updated successfully and is pending review.",
      });
      
      // Reset Turnstile token after successful submission
      setTurnstileToken('');
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      
      // Redirect to dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, hasNewUploads ? 3000 : 1500);
    } catch (error) {
      console.error('Error updating campaign:', error);
      
      // Close upload modal on error
      setShowUploadModal(false);
      
      // Reset Turnstile token on error
      setTurnstileToken('');
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      
      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your campaign.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state for both fetch loading and category loading
  if (fetchLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Campaign Not Found</h2>
          <p className="text-gray-600 mb-4">The campaign you are looking for does not exist or you don't have permission to edit it.</p>
          <button 
            onClick={() => setLocation('/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Edit Campaign" 
        description="Edit your fundraising campaign on NepalCrowdRise."
        keywords="edit campaign, fundraising, crowdfunding, charity"
      />
      
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div>
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h1 className="text-2xl md:text-3xl font-bold">Edit Campaign</h1>
                  <p className="text-gray-600 mt-2">
                    Update your campaign information below. Your changes will be reviewed before they are published.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Campaign Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          placeholder="Give your campaign a clear title"
                          {...register('title', { 
                            required: 'Campaign title is required',
                            minLength: { value: 10, message: 'Title must be at least 10 characters' },
                            maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                          })}
                        />
                        {errors.title && (
                          <p className="mt-1 text-red-500 text-sm">{errors.title.message}</p>
                        )}
                      </div>
                        <div>
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
                          <p className="mt-1 text-red-500 text-sm">{errors.category.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fundraising Goal (Rs.) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-4 py-2 border ${errors.targetAmount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          placeholder="10,000"
                          {...register('targetAmount', { 
                            required: 'Fundraising goal is required',
                            min: { value: 10000, message: 'Minimum amount is Rs. 10,000' },
                            max: { value: 10000000, message: 'Maximum amount is Rs. 1 crore' }
                          })}
                        />
                        {errors.targetAmount && (
                          <p className="mt-1 text-red-500 text-sm">{errors.targetAmount.message}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">Minimum Rs. 10,000 - Maximum Rs. 1 crore</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className={`w-full px-4 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          {...register('endDate', { 
                            required: 'End date is required',
                            validate: value => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const selectedDate = new Date(value);
                              return selectedDate >= today || 'End date must be in the future';
                            }
                          })}
                        />
                        {errors.endDate && (
                          <p className="mt-1 text-red-500 text-sm">{errors.endDate.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows="2"
                        className={`w-full px-4 py-2 border ${errors.shortDescription ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        placeholder="Briefly describe your campaign (150-200 characters)"
                        {...register('shortDescription', { 
                          required: 'Short description is required',
                          minLength: { value: 50, message: 'Description must be at least 50 characters' },
                          maxLength: { value: 200, message: 'Description must be less than 200 characters' }
                        })}
                      ></textarea>
                      {errors.shortDescription && (
                        <p className="mt-1 text-red-500 text-sm">{errors.shortDescription.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Campaign Story <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows="8"
                        className={`w-full px-4 py-2 border ${errors.story ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        placeholder="Tell your story. Why are you raising funds? How will they be used? Who will benefit?"
                        {...register('story', { 
                          required: 'Campaign story is required',
                          minLength: { value: 200, message: 'Story must be at least 200 characters' }
                        })}
                      ></textarea>
                      {errors.story && (
                        <p className="mt-1 text-red-500 text-sm">{errors.story.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Image <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose a compelling cover image for your campaign. This will be the main image people see.
                      </p>
                      
                      {/* Show existing cover image if available and no new image selected */}
                      {existingCoverImage && !selectedCoverImage && (
                        <div className="mb-4 relative">
                          <img src={existingCoverImage} alt="Current Cover" className="h-48 w-auto object-cover rounded-lg border" />
                          <div className="mt-2 flex justify-between items-center">
                            <p className="text-sm text-gray-600">Current cover image</p>
                            <button
                              type="button"
                              onClick={() => {
                                setExistingCoverImage(null);
                                setUploadedCoverPreview(null);
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove current image
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <FileSelector
                        fileType="campaign-cover"
                        accept="image/*"
                        maxFiles={1}
                        onFilesSelected={handleCoverImageSelect}
                        selectedFiles={selectedCoverImage ? [selectedCoverImage] : []}
                        showPreview={true}
                        dragDropArea={true}
                        className="w-full"
                      >
                        <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium text-primary-600">
                              {existingCoverImage ? 'Replace cover image' : 'Click to upload'}
                            </span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 15MB
                          </p>
                        </div>
                      </FileSelector>
                      
                      {selectedCoverImage && (
                        <div className="mt-3">
                          <p className="text-sm text-green-600">
                            ✓ New cover image selected: {selectedCoverImage.name}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Images (Optional)
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Add more images to showcase your campaign. You can have up to 3 additional images total.
                      </p>
                      
                      {/* Show current images (existing + newly selected) */}
                      {displayAdditionalImages.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-4">
                            {displayAdditionalImages.map((item) => (
                              <div key={item.id} className="relative group">
                                <img src={item.url} alt={item.name} className="h-32 w-32 object-cover rounded-lg border" />
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalImage(item.id)}
                                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                                  {item.type === 'existing' ? 'Current' : 'New'}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {displayAdditionalImages.length}/3 images ({displayAdditionalImages.filter(i => i.type === 'existing').length} existing, {displayAdditionalImages.filter(i => i.type === 'new').length} new)
                          </p>
                        </div>
                      )}
                      
                      {/* Only show file selector if under limit */}
                      {displayAdditionalImages.length < 3 && (
                        <>
                          <FileSelector
                            fileType="campaign-image"
                            accept="image/*"
                            maxFiles={3 - displayAdditionalImages.length}
                            onFilesSelected={handleAdditionalImagesSelect}
                            selectedFiles={selectedAdditionalImages}
                            showPreview={true}
                            dragDropArea={true}
                            className="w-full"
                          >
                            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium text-primary-600">Add more images</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG up to 15MB each (max {3 - displayAdditionalImages.length} more)
                              </p>
                            </div>
                          </FileSelector>
                          
                          {selectedAdditionalImages.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-green-600">
                                ✓ {selectedAdditionalImages.length} new image{selectedAdditionalImages.length > 1 ? 's' : ''} selected
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {displayAdditionalImages.length >= 3 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Maximum of 3 additional images reached. Remove an existing image to add a new one.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Verification Documents Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Documents (Optional)
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload documents to verify your campaign (citizenship, licenses, permits, etc.). This helps build trust with donors. Maximum 3 documents.
                      </p>
                      
                      {/* Show current documents (existing + newly selected) */}
                      {displayVerificationDocs.length > 0 && (
                        <div className="mb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayVerificationDocs.map((item) => (
                              <div key={item.id} className="relative group border rounded-lg p-4 hover:shadow-md transition-shadow">
                                {item.preview && item.preview.toLowerCase().includes('.pdf') ? (
                                  <div className="flex items-center space-x-3">
                                    <DocumentIcon className="h-8 w-8 text-red-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                      <p className="text-xs text-gray-500">PDF Document</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <img src={item.preview || item.url} alt={item.name} className="w-full h-24 object-cover rounded" />
                                    <p className="text-xs text-gray-600 mt-2 truncate">{item.name}</p>
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => removeVerificationDoc(item.id)}
                                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                
                                <div className="absolute bottom-2 left-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    item.type === 'existing' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {item.type === 'existing' ? 'Current' : 'New'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {displayVerificationDocs.length}/3 documents ({displayVerificationDocs.filter(i => i.type === 'existing').length} existing, {displayVerificationDocs.filter(i => i.type === 'new').length} new)
                          </p>
                        </div>
                      )}
                      
                      {/* Only show file selector if under limit */}
                      {displayVerificationDocs.length < 3 && (
                        <>
                          <FileSelector
                            fileType="campaign-verification"
                            accept="image/*,application/pdf"
                            maxFiles={3 - displayVerificationDocs.length}
                            onFilesSelected={handleVerificationDocsSelect}
                            selectedFiles={selectedVerificationDocs}
                            showPreview={true}
                            dragDropArea={true}
                            className="w-full"
                          >
                            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors">
                              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium text-primary-600">Add verification documents</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, PDF up to 15MB each (max {3 - displayVerificationDocs.length} more)
                              </p>
                            </div>
                          </FileSelector>
                          
                          {selectedVerificationDocs.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-green-600">
                                ✓ {selectedVerificationDocs.length} new document{selectedVerificationDocs.length > 1 ? 's' : ''} selected
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {displayVerificationDocs.length >= 3 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Maximum of 3 verification documents reached. Remove an existing document to add a new one.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Turnstile Security Verification */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Security Verification <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Please complete the security verification to prevent abuse and ensure the safety of our platform.
                      </p>
                      
                      <div className="flex justify-center">
                        <TurnstileWidget
                          ref={turnstileRef}
                          siteKey={TURNSTILE_CONFIG.siteKey}
                          onVerify={handleTurnstileVerify}
                          onExpire={handleTurnstileExpire}
                          onError={handleTurnstileError}
                          theme="light"
                          autoReset={true}
                          resetDelay={3000}
                        />
                      </div>
                      
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
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setLocation('/dashboard')}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !turnstileToken}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Progress Modal */}
      <UploadProgressModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        stages={uploadStages}
        currentStage={currentUploadStage}
        overallProgress={overallProgress}
      />
    </>
  );
};

export default EditCampaign; 