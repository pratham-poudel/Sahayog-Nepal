import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import { blogTemplates } from '../data/blogs';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { API_URL as CONFIG_API_URL } from '../config/index.js';
import { 
  FiPlus, 
  FiTrash2, 
  FiImage, 
  FiType, 
  FiMessageSquare,
  FiFileText,
  FiEye,
  FiSave,
  FiSend,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiX,
  FiUpload,
  FiEdit3,
  FiSettings,
  FiUser,
  FiTag,
  FiBookOpen
} from 'react-icons/fi';

const API_URL = `${CONFIG_API_URL}/api/blogs`;

const WriteBlog = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Choose template, 2: Write blog
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState([{ type: 'paragraph', content: '' }]);
  const [imageUrls, setImageUrls] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Social media handles
  const [twitterHandle, setTwitterHandle] = useState('');
  const [facebookHandle, setFacebookHandle] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [linkedinHandle, setLinkedinHandle] = useState('');

  const fileInputRef = useRef();
  const contentImageRef = useRef();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuthContext();
  const token = localStorage.getItem('token');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login?redirect=/blog/write');
    }
  }, [isAuthenticated, setLocation]);

  // Handle cover image selection
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Submission failed",
          description: "Image too large. Please select an image under 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload for content
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image Upload failed",
        description: "Image too large. Please select an image under 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('Blogimage', file);
      
      // Upload image to server
      const response = await axios.post(`${API_URL}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      if (response.data.success) {
        const imageUrl = response.data.imageUrl;
        setImageUrls([...imageUrls, imageUrl]);
        
        // Add image block to content
        const newImageBlock = {
          type: 'image',
          url: imageUrl,
          caption: 'Image caption'
        };
        
        setContent([...content, newImageBlock]);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Update failed",
        description: error.message || "Error uploading image",
        variant: "destructive"
      });
      setUploadProgress(0);
    }
  };

  // Add a new content block
  const addContentBlock = (type, index) => {
    const newBlock = { type, content: '' };
    if (type === 'image') {
      fileInputRef.current.click();
      return;
    }
    
    const newContent = [...content];
    newContent.splice(index + 1, 0, newBlock);
    setContent(newContent);
  };

  // Update content block
  const updateContentBlock = (index, value) => {
    const newContent = [...content];
    newContent[index].content = value;
    setContent(newContent);
  };

  // Update image caption
  const updateImageCaption = (index, caption) => {
    const newContent = [...content];
    newContent[index].caption = caption;
    setContent(newContent);
  };

  // Delete content block
  const deleteContentBlock = (index) => {
    if (content.length <= 1) return;
    const newContent = [...content];
    newContent.splice(index, 1);
    setContent(newContent);
  };

  // Handle tag input
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Validate social media URLs
  const validateUrl = (url) => {
    if (!url) return url; // Allow empty URLs
    if (!/^https?:\/\//.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  // Submit blog
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!title || !excerpt) {
      toast({
        title: "Submission failed",
        description: "Please enter a title and excerpt for your blog.",
        variant: "destructive"
      });
      return;
    }
    
    if (content.filter(block => block.type === 'paragraph').every(block => !block.content.trim())) {
      toast({
        title: "Submission failed",
        description: "Please add some content to your blog.",
        variant: "destructive"
      });
      return;
    }
    
    if (!coverImage) {
      toast({
        title: "Submission failed",
        description: "Please upload a cover image for your blog.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Process social media handles
      const twitter = validateUrl(twitterHandle);
      const facebook = validateUrl(facebookHandle);
      const instagram = validateUrl(instagramHandle);
      const linkedin = validateUrl(linkedinHandle);
      
      // Create form data for blog submission
      const formData = new FormData();
      formData.append('title', title);
      formData.append('excerpt', excerpt);
      formData.append('content', JSON.stringify(content));
      formData.append('tags', JSON.stringify(tags));
      formData.append('templateId', selectedTemplate?.id || 'classic');
      formData.append('status', status);
      formData.append('BlogCoverImage', coverImage);
      
      // Add social media links
      if (twitter) formData.append('twitter', twitter);
      if (facebook) formData.append('facebook', facebook);
      if (instagram) formData.append('instagram', instagram);
      if (linkedin) formData.append('linkedin', linkedin);
      
      // Submit blog to server
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      if (response.data.success) {
        toast({
          title: "Congratulations!",
          description: "Your submission has been received. We will review it shortly.",
        });
        setLocation(`/blog/${response.data.blog.slug}`);
      }
    } catch (error) {
      console.error('Error submitting blog:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit your blog.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Enhanced Header with Gradient */}
      <section className="relative bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#8B2325] py-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <FiEdit3 className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {step === 1 ? 'Choose Your Style' : 'Create Your Masterpiece'}
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                {step === 1 
                  ? 'Select the perfect template to tell your story with impact and elegance'
                  : 'Share your insights and inspire others with compelling content'
                }
              </p>
              
              {/* Enhanced Progress Indicator */}
              <div className="flex items-center justify-center space-x-4">
                <motion.div 
                  className={`flex items-center space-x-3 px-6 py-3 rounded-full transition-all duration-500 ${
                    step >= 1 ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-white/10 text-white/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step >= 1 ? 'bg-white text-[#8B2325]' : 'bg-white/20 text-white/70'
                  }`}>
                    {step > 1 ? <FiCheck className="w-5 h-5" /> : <span className="font-bold">1</span>}
                  </div>
                  <span className="font-semibold">Choose Template</span>
                </motion.div>
                
                <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
                  step >= 2 ? 'bg-white' : 'bg-white/30'
                }`} />
                
                <motion.div 
                  className={`flex items-center space-x-3 px-6 py-3 rounded-full transition-all duration-500 ${
                    step >= 2 ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-white/10 text-white/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step >= 2 ? 'bg-white text-[#8B2325]' : 'bg-white/20 text-white/70'
                  }`}>
                    <span className="font-bold">2</span>
                  </div>
                  <span className="font-semibold">Write & Publish</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-lg" />
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 -mt-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="template-selection"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Template Selection Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 p-8 md:p-12 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#8B2325]/10 dark:bg-[#a32729]/10 rounded-xl flex items-center justify-center">
                      <FiBookOpen className="w-6 h-6 text-[#8B2325] dark:text-[#a32729]" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Select Your Template
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Choose the perfect layout for your story
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="p-6 bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FiType className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Professional Layout</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Clean typography and structured content</p>
                    </div>
                    
                    <div className="p-6 bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FiImage className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rich Media Support</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for image-heavy articles</p>
                    </div>
                    
                    <div className="p-6 bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FiEye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Optimized Reading</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Enhanced readability and engagement</p>
                    </div>
                  </div>
                </div>
                
                {/* Template Grid */}
                <div className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogTemplates.map(template => (
                      <motion.div
                        key={template.id}
                        className={`group relative cursor-pointer transition-all duration-300 ${
                          selectedTemplate?.id === template.id 
                            ? 'transform scale-105' 
                            : 'hover:transform hover:scale-102'
                        }`}
                        whileHover={{ y: -8 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className={`relative rounded-2xl overflow-hidden border-3 transition-all duration-300 ${
                          selectedTemplate?.id === template.id 
                            ? 'border-[#8B2325] dark:border-[#a32729] shadow-2xl shadow-[#8B2325]/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-lg hover:shadow-xl'
                        }`}>
                          {/* Template Preview */}
                          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                            <img 
                              src={template.preview} 
                              alt={template.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Selection Indicator */}
                            <AnimatePresence>
                              {selectedTemplate?.id === template.id && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  className="absolute top-4 right-4 w-10 h-10 bg-[#8B2325] rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <FiCheck className="w-5 h-5 text-white" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {/* Preview Button */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">Preview Template</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Template Info */}
                          <div className="p-6 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {template.name}
                              </h3>
                              {template.featured && (
                                <span className="px-2 py-1 bg-[#8B2325]/10 text-[#8B2325] dark:bg-[#a32729]/10 dark:text-[#a32729] text-xs font-semibold rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                              {template.description}
                            </p>
                            
                            {/* Features */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {template.features?.map((feature, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Continue Button */}
                  <motion.div 
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <motion.button
                      className={`group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                        selectedTemplate
                          ? 'bg-gradient-to-r from-[#8B2325] to-[#a32729] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!selectedTemplate}
                      onClick={() => setStep(2)}
                      whileHover={{ scale: selectedTemplate ? 1.05 : 1 }}
                      whileTap={{ scale: selectedTemplate ? 0.95 : 1 }}
                    >
                      <span>Continue with {selectedTemplate?.name || 'Selected Template'}</span>
                      <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    
                    {selectedTemplate && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 text-sm text-gray-600 dark:text-gray-400"
                      >
                        You can always change your template later
                      </motion.p>
                    )}
                  </motion.div>
                </div>              </motion.div>
            ) : (
              // Blog Writing Form
              <motion.div
                key="blog-writing"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <form onSubmit={handleSubmit}>
                  {/* Cover Image Section */}
                  <div className="relative">
                    {coverImagePreview ? (
                      <div className="relative h-80 md:h-96">
                        <img 
                          src={coverImagePreview} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Cover Image Controls */}
                        <div className="absolute top-6 right-6 flex gap-3">
                          <motion.button 
                            type="button" 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setCoverImage(null);
                              setCoverImagePreview('');
                            }}
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                          >
                            <FiX className="w-5 h-5" />
                          </motion.button>
                        </div>
                        
                        {/* Cover Image Info */}
                        <div className="absolute bottom-6 left-6 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <FiImage className="w-5 h-5" />
                            <span className="text-sm font-medium">Cover Image</span>
                          </div>
                          <p className="text-sm text-white/80">This will be the main image for your blog post</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-80 md:h-96 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                        <div className="text-center max-w-md mx-auto px-6">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-20 h-20 bg-[#8B2325]/10 dark:bg-[#a32729]/10 rounded-full flex items-center justify-center mx-auto mb-6"
                          >
                            <FiUpload className="w-10 h-10 text-[#8B2325] dark:text-[#a32729]" />
                          </motion.div>
                          
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                            Add Your Cover Image
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            Choose a compelling image that represents your blog post. This will be the first thing readers see.
                          </p>
                          
                          <label className="group cursor-pointer">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#8B2325] to-[#a32729] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <FiImage className="w-5 h-5" />
                              Choose Cover Image
                            </motion.div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverImageChange}
                            />
                          </label>
                          
                          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <FiSettings className="w-4 h-4" />
                              1200 × 630 px recommended
                            </div>
                            <div className="flex items-center gap-1">
                              <FiUpload className="w-4 h-4" />
                              Max 5MB
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                
                  {/* Blog content section */}
                  <div className="p-6 md:p-8">
                    {/* Title */}
                    <div className="mb-8">
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Blog Title
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B2325] dark:focus:ring-[#a32729] focus:border-transparent"
                        placeholder="Enter a compelling title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* Excerpt */}
                    <div className="mb-8">
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Blog Excerpt <span className="text-sm font-normal text-gray-500">(A brief summary of your blog)</span>
                      </label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B2325] dark:focus:ring-[#a32729] focus:border-transparent min-h-[100px] resize-none"
                        placeholder="Write a brief summary of your blog (max 500 characters)"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        maxLength={500}
                        required
                      />
                      <div className="mt-1 text-right text-sm text-gray-500 dark:text-gray-400">
                        {excerpt.length}/500 characters
                      </div>
                    </div>
                    
                    {/* Content blocks */}
                    <div className="mb-8">
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Content
                      </label>
                      <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                        {content.map((block, index) => (
                          <div 
                            key={index} 
                            className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 bg-white dark:bg-gray-800 ${
                              block.type === 'image' ? 'p-4' : 'p-0'
                            }`}
                          >
                            {block.type === 'paragraph' && (
                              <div className="relative">
                                <textarea 
                                  className="w-full px-4 py-3 bg-transparent resize-none text-gray-900 dark:text-white focus:outline-none min-h-[100px]"
                                  placeholder="Start writing your paragraph..."
                                  value={block.content}
                                  onChange={(e) => updateContentBlock(index, e.target.value)}
                                ></textarea>
                                <div className="absolute right-2 top-2 flex space-x-1">
                                  <button 
                                    type="button" 
                                    onClick={() => deleteContentBlock(index)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                  >
                                    <FiTrash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {block.type === 'heading' && (
                              <div className="relative">
                                <input 
                                  className="w-full px-4 py-3 bg-transparent text-xl md:text-2xl font-bold text-gray-900 dark:text-white focus:outline-none"
                                  placeholder="Heading"
                                  value={block.content}
                                  onChange={(e) => updateContentBlock(index, e.target.value)}
                                />
                                <div className="absolute right-2 top-2 flex space-x-1">
                                  <button 
                                    type="button" 
                                    onClick={() => deleteContentBlock(index)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                  >
                                    <FiTrash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {block.type === 'quote' && (
                              <div className="relative">
                                <div className="px-4 py-3">
                                  <textarea 
                                    className="w-full bg-transparent resize-none text-gray-900 dark:text-white focus:outline-none min-h-[80px] italic border-l-4 border-[#8B2325] dark:border-[#a32729] pl-4"
                                    placeholder="Enter a quote..."
                                    value={block.content}
                                    onChange={(e) => updateContentBlock(index, e.target.value)}
                                  ></textarea>
                                  <input 
                                    className="w-full bg-transparent text-sm text-gray-500 dark:text-gray-400 focus:outline-none ml-4 mt-1"
                                    placeholder="Quote author (optional)"
                                    value={block.author || ''}
                                    onChange={(e) => {
                                      const newContent = [...content];
                                      newContent[index].author = e.target.value;
                                      setContent(newContent);
                                    }}
                                  />
                                </div>
                                <div className="absolute right-2 top-2 flex space-x-1">
                                  <button 
                                    type="button" 
                                    onClick={() => deleteContentBlock(index)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                  >
                                    <FiTrash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {block.type === 'image' && (
                              <div>
                                <div className="relative rounded-lg overflow-hidden mb-3">
                                  <img 
                                    src={block.url} 
                                    alt={block.caption || 'Blog image'} 
                                    className="w-full object-contain"
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => deleteContentBlock(index)}
                                    className="absolute top-2 right-2 bg-gray-800/80 text-white p-1 rounded-full hover:bg-gray-900/80 transition-colors"
                                  >
                                    <FiX className="w-5 h-5" />
                                  </button>
                                </div>
                                <input 
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 focus:outline-none focus:border-[#8B2325] dark:focus:border-[#a32729]"
                                  placeholder="Image caption (optional)"
                                  value={block.caption || ''}
                                  onChange={(e) => updateImageCaption(index, e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Add content options */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => addContentBlock('paragraph', content.length - 1)}
                          className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <FiPlus className="w-4 h-4 mr-1" />
                          Paragraph
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock('heading', content.length - 1)}
                          className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <FiType className="w-4 h-4 mr-1" />
                          Heading
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock('quote', content.length - 1)}
                          className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <FiMessageSquare className="w-4 h-4 mr-1" />
                          Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock('image', content.length - 1)}
                          className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <FiImage className="w-4 h-4 mr-1" />
                          Image
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="mb-8">
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Tags (max 5)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map(tag => (
                          <div 
                            key={tag} 
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B2325] dark:focus:ring-[#a32729] focus:border-transparent"
                          placeholder="Add a tag and press Enter or comma"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          disabled={tags.length >= 5}
                        />
                        {tags.length >= 5 && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                            Maximum tags reached
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Blog Status */}
                    <div className="mb-8">
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Publish Status
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            className="hidden"
                            value="draft"
                            checked={status === 'draft'}
                            onChange={() => setStatus('draft')}
                          />
                          <div className={`w-5 h-5 rounded-full border ${status === 'draft' ? 'border-[#8B2325] bg-[#8B2325]' : 'border-gray-400 bg-white dark:bg-gray-700'} flex items-center justify-center mr-2`}>
                            {status === 'draft' && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">Save as Draft</span>
                        </label>
                        
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            className="hidden"
                            value="published"
                            checked={status === 'published'}
                            onChange={() => setStatus('published')}
                          />
                          <div className={`w-5 h-5 rounded-full border ${status === 'published' ? 'border-[#8B2325] bg-[#8B2325]' : 'border-gray-400 bg-white dark:bg-gray-700'} flex items-center justify-center mr-2`}>
                            {status === 'published' && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">Publish Now</span>
                        </label>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {status === 'draft' ? 'Your blog will be saved but not publicly visible until published.' : 'Your blog will be immediately available to readers.'}
                      </p>
                    </div>
                    
                    {/* Upload Progress */}
                    {uploadProgress > 0 && (
                      <div className="mb-8">
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8B2325] rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    {/* Social Media Handles */}
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                        Your Social Media Profiles (Optional)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Add your social media handles to help readers connect with you.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Twitter */}
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Twitter Profile
                          </label>
                          <div className="flex">
                            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-3 rounded-l-lg border border-gray-300 dark:border-gray-600">
                              <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                              </svg>
                            </div>
                            <input
                              type="text"
                              className="flex-1 px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#8B2325] dark:focus:ring-[#a32729]"
                              placeholder="twitter.com/username"
                              value={twitterHandle}
                              onChange={(e) => setTwitterHandle(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {/* Facebook */}
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Facebook Profile
                          </label>
                          <div className="flex">
                            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-3 rounded-l-lg border border-gray-300 dark:border-gray-600">
                              <svg className="w-5 h-5 text-[#4267B2]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              className="flex-1 px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#8B2325] dark:focus:ring-[#a32729]"
                              placeholder="facebook.com/username"
                              value={facebookHandle}
                              onChange={(e) => setFacebookHandle(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {/* Instagram */}
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Instagram Profile
                          </label>
                          <div className="flex">
                            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-3 rounded-l-lg border border-gray-300 dark:border-gray-600">
                              <svg className="w-5 h-5 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z"/>
                              </svg>
                            </div>
                            <input
                              type="text"
                              className="flex-1 px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#8B2325] dark:focus:ring-[#a32729]"
                              placeholder="instagram.com/username"
                              value={instagramHandle}
                              onChange={(e) => setInstagramHandle(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {/* LinkedIn */}
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            LinkedIn Profile
                          </label>
                          <div className="flex">
                            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-3 rounded-l-lg border border-gray-300 dark:border-gray-600">
                              <svg className="w-5 h-5 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.9 2H3.1A1.1 1.1 0 0 0 2 3.1v17.8A1.1 1.1 0 0 0 3.1 22h17.8a1.1 1.1 0 0 0 1.1-1.1V3.1A1.1 1.1 0 0 0 20.9 2zM8.9 18.3H5.7V9.8h3.2v8.5zm-1.6-9.7a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm11.6 9.7h-3.2v-5.5c0-1.2-.4-2-1.5-2a1.6 1.6 0 0 0-1.5 1.1 2 2 0 0 0-.1.8v5.6h-3.2V9.9h3.1v1.3a3 3 0 0 1 2.7-1.5c2 0 3.5 1.3 3.5 4v4.5h.2z" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              className="flex-1 px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#8B2325] dark:focus:ring-[#a32729]"
                              placeholder="linkedin.com/in/username"
                              value={linkedinHandle}
                              onChange={(e) => setLinkedinHandle(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Submit button */}
                    <div className="flex justify-between items-center mt-10">
                      <motion.button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex items-center text-gray-700 dark:text-gray-300 hover:text-[#8B2325] dark:hover:text-[#a32729] transition-colors"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiArrowLeft className="w-5 h-5 mr-1" />
                        Back to Templates
                      </motion.button>
                      
                      <motion.button
                        type="submit"
                        className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                          isSubmitting 
                            ? 'opacity-70 cursor-not-allowed bg-gray-400' 
                            : 'bg-gradient-to-r from-[#8B2325] to-[#a32729] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                        disabled={isSubmitting}
                        whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            {status === 'published' ? 'Publishing...' : 'Saving Draft...'}
                          </>
                        ) : (
                          <>
                            {status === 'published' ? (
                              <>
                                <FiSend className="w-5 h-5" />
                                Publish Blog
                              </>
                            ) : (
                              <>
                                <FiSave className="w-5 h-5" />
                                Save as Draft
                              </>
                            )}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WriteBlog;