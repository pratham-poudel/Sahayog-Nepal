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

const EditCampaign = ({ id }) => {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuthContext();
  const { categories, loading: categoriesLoading } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);  const [coverImage, setCoverImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [uploadedCoverPreview, setUploadedCoverPreview] = useState(null);
  const [uploadedAdditionalPreviews, setUploadedAdditionalPreviews] = useState([]);
  const { toast } = useToast();
  const authCheckPerformed = useRef(false);
  
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
        
        // Set preview images
        if (data.campaign.coverImage) {
          setUploadedCoverPreview(getCoverImageUrl(data.campaign));
        }
        
        if (data.campaign.images && data.campaign.images.length > 0) {
          // Use the utility function to get proper image URLs
          const imageUrls = getCampaignImageUrls(data.campaign);
          setUploadedAdditionalPreviews(imageUrls);
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

  const handleAdditionalImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Limit to 3 additional images
      const newFiles = files.slice(0, 3 - uploadedAdditionalPreviews.length);
      
      if (newFiles.length > 0) {
        try {
          setIsLoading(true);
          
          // Upload multiple files using presigned URLs
          const results = await uploadService.uploadFiles(newFiles, { fileType: 'campaign-image' });
          
          // Store uploaded URLs instead of file objects
          const uploadedUrls = results.map(result => result.publicUrl);
          setAdditionalImages(prev => [...prev, ...uploadedUrls]);
          
          // Create previews for display using the uploaded URLs
          setUploadedAdditionalPreviews(prev => [...prev, ...uploadedUrls]);
          
          toast({
            title: "Success",
            description: `${newFiles.length} additional images uploaded successfully`,
          });
        } catch (error) {
          console.error('Additional images upload failed:', error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload additional images. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const removeAdditionalImage = (index) => {
    const imageToRemove = uploadedAdditionalPreviews[index];
    
    // Check if this is an existing image (from campaign.images) or a newly added one
    const isNewImage = !isExistingImageUrl(imageToRemove);
    
    if (isNewImage) {
      // Find the corresponding index in additionalImages (only new images are there)
      const newImageIndex = additionalImages.findIndex((_, i) => {
        // Calculate which preview corresponds to this file
        const existingImagesCount = campaign?.images?.length || 0;
        const newImagePreviewIndex = index - existingImagesCount;
        return i === newImagePreviewIndex;
      });
      
      if (newImageIndex !== -1) {
        setAdditionalImages(prev => prev.filter((_, i) => i !== newImageIndex));
      }
    }
    
    // Remove from preview list
    setUploadedAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setIsLoading(true);
        
        // Upload file using presigned URL
        const result = await uploadService.uploadFile(file, { fileType: 'campaign-cover' });
        
        // Store the uploaded URL instead of file object
        setCoverImage(result.publicUrl);
        
        // Create a preview URL for display
        setUploadedCoverPreview(result.publicUrl);
        
        toast({
          title: "Success",
          description: "Cover image uploaded successfully",
        });
      } catch (error) {
        console.error('Cover image upload failed:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload cover image. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // For checking if an existing image should be kept
  const isExistingImageUrl = (url) => {
    if (!campaign || !campaign.images) return false;
    
    // Convert both to just filenames for comparison
    const urlFilename = url.split('/').pop();
    return campaign.images.some(img => {
      const imgFilename = img.split('/').pop();
      return imgFilename === urlFilename;
    });
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
    
    try {
      setIsLoading(true);
      
      // Create JSON payload instead of FormData
      const payload = {
        title: data.title,
        category: data.category,
        targetAmount: data.targetAmount,
        endDate: data.endDate,
        shortDescription: data.shortDescription,
        story: data.story
      };

      if (data.subcategory) {
        payload.subcategory = data.subcategory;
      }
      
      // Add cover image URL if uploaded
      if (coverImage) {
        payload.coverImage = coverImage;
      }
      
      // Add additional image URLs if any new ones
      if (additionalImages.length > 0) {
        payload.additionalImages = additionalImages;
      }
      
      // Also include a list of existing images to keep
      if (campaign.images) {
        // Keep track of which existing images should be preserved
        const keepImages = [];
        uploadedAdditionalPreviews.forEach(previewUrl => {
          if (isExistingImageUrl(previewUrl)) {
            // Extract just the filename from the URL
            const filename = previewUrl.split('/').pop();
            keepImages.push(filename);
          }
        });
        if (keepImages.length > 0) {
          payload.keepImages = keepImages;
        }
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
      
      // Show success message
      toast({
        title: "Campaign updated",
        description: "Your campaign has been updated successfully and is pending review.",
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error updating campaign:', error);
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cover Image <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                          {uploadedCoverPreview ? (
                            <div>
                              <img src={uploadedCoverPreview} alt="Cover Preview" className="mx-auto h-48 w-auto object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => {
                                  setCoverImage(null);
                                  setUploadedCoverPreview(null);
                                }}
                                className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
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
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="cover-image-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="cover-image-upload"
                                    name="coverImage"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Images (Optional)
                      </label>
                      <div className="mt-1 flex flex-wrap gap-4">
                        {uploadedAdditionalPreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img src={preview} alt={`Additional ${index + 1}`} className="h-32 w-32 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(index)}
                              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        
                        {uploadedAdditionalPreviews.length < 3 && (
                          <div className="h-32 w-32 flex items-center justify-center border-2 border-gray-300 border-dashed rounded-lg">
                            <label htmlFor="additional-images-upload" className="cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <input
                                id="additional-images-upload"
                                name="additionalImages"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                multiple
                                onChange={handleAdditionalImageUpload}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">You can upload up to 3 additional images</p>
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
                      disabled={isLoading}
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
    </>
  );
};

export default EditCampaign; 