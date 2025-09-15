import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BanknotesIcon,
  DocumentIcon,
  CheckCircleIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '../../config';
import uploadService from '../../services/uploadService';

const AddBankAccount = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Form data - only required fields from backend
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    associatedPhoneNumber: '',
    documentType: '',
    documentNumber: '',
    isPrimary: false
  });

  // Single document upload state
  const [documentFile, setDocumentFile] = useState({
    file: null,
    preview: null
  });

  // Upload state for presigned URLs
  const [documentUpload, setDocumentUpload] = useState({
    isUploading: false,
    progress: 0,
    publicUrl: null,
    key: null,
    error: null
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  const steps = [
    { number: 1, title: 'Bank Details', description: 'Enter your bank account information' },
    { number: 2, title: 'Document Upload', description: 'Upload verification document' },
    { number: 3, title: 'Review', description: 'Review and submit your information' }
  ];

  const documentTypes = [
    { 
      value: 'license', 
      label: 'Driving License',
      placeholder: 'Enter your license number',
      description: 'Upload a clear photo of your driving license'
    },
    { 
      value: 'citizenship', 
      label: 'Citizenship Certificate',
      placeholder: 'Enter your citizenship number',
      description: 'Upload a clear photo of your citizenship certificate'
    },
    { 
      value: 'passport', 
      label: 'Passport',
      placeholder: 'Enter your passport number', 
      description: 'Upload a clear photo of your passport'
    }
  ];
  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.accountName.trim()) newErrors.accountName = 'Account holder name is required';
    if (!formData.associatedPhoneNumber.trim()) newErrors.associatedPhoneNumber = 'Phone number is required';
    if (!formData.documentType.trim()) newErrors.documentType = 'Document type is required';
    if (!formData.documentNumber.trim()) newErrors.documentNumber = 'Document number is required';
    
    // Validate account number format (basic validation)
    if (formData.accountNumber && !/^\d{8,20}$/.test(formData.accountNumber.replace(/\s/g, ''))) {
      newErrors.accountNumber = 'Account number must be 8-20 digits';
    }

    // Validate phone number format
    if (formData.associatedPhoneNumber && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.associatedPhoneNumber)) {
      newErrors.associatedPhoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!documentFile.file || !documentUpload.publicUrl) {
      newErrors.documentFile = 'Document image is required and must be uploaded successfully';
    }

    if (documentUpload.error) {
      newErrors.documentFile = documentUpload.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        documentFile: 'Please upload a valid image (JPEG, PNG, GIF) or PDF file'
      }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        documentFile: 'File size must be less than 10MB'
      }));
      return;
    }

    // Create preview for images
    let preview = null;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setDocumentFile({
      file,
      preview
    });

    // Clear error
    setErrors(prev => ({ ...prev, documentFile: '' }));

    // Start upload immediately
    try {
      setDocumentUpload(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const result = await uploadService.uploadFile(
        file, 
        { fileType: `document-${formData.documentType}` },
        (progress) => {
          setDocumentUpload(prev => ({ ...prev, progress }));
        }
      );

      setDocumentUpload(prev => ({
        ...prev,
        isUploading: false,
        publicUrl: result.publicUrl,
        key: result.key,
        progress: 100
      }));

      toast({
        title: "Upload successful",
        description: "Document uploaded successfully"
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      setDocumentUpload(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: error.message || 'Upload failed'
      }));
      
      toast({
        title: "Upload failed",
        description: error.message || 'Failed to upload document',
        variant: "destructive"
      });
    }
  };

  // Remove selected file
  const removeFile = () => {
    if (documentFile.preview) {
      URL.revokeObjectURL(documentFile.preview);
    }
    
    setDocumentFile({ file: null, preview: null });
    setDocumentUpload({
      isUploading: false,
      progress: 0,
      publicUrl: null,
      key: null,
      error: null
    });
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit bank account
  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare bank account data with uploaded document URL
      const bankAccountData = {
        ...formData,
        documentImageUrl: documentUpload.publicUrl,
        documentImage: documentUpload.key
      };

      const response = await fetch(`${API_BASE_URL}/api/bank/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bankAccountData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Bank account added successfully. It's now pending verification.",
        });
        
        if (onSuccess) onSuccess(data.data);
        if (onClose) onClose();
      } else {
        throw new Error(data.message || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add bank account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected document type info
  const selectedDocType = documentTypes.find(doc => doc.value === formData.documentType);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.bankName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Nepal Bank Limited"
                />
                {errors.bankName && (
                  <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your account number"
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                )}
              </div>              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.accountName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Full name as on bank account"
                />
                {errors.accountName && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Associated Phone Number *
                </label>
                <input
                  type="tel"
                  name="associatedPhoneNumber"
                  value={formData.associatedPhoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.associatedPhoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Phone number associated with account"
                />
                {errors.associatedPhoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.associatedPhoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Type *
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.documentType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select document type</option>
                  {documentTypes.map(doc => (
                    <option key={doc.value} value={doc.value}>{doc.label}</option>
                  ))}
                </select>
                {errors.documentType && (
                  <p className="mt-1 text-sm text-red-600">{errors.documentType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Number *
                </label>
                <input
                  type="text"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.documentNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={selectedDocType?.placeholder || "Enter document number"}
                />                {errors.documentNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.documentNumber}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPrimary"
                checked={formData.isPrimary}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Set as primary account for receiving funds
              </label>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Document Upload
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {selectedDocType ? selectedDocType.description : 'Please select a document type first'}
                  </p>
                </div>
              </div>
            </div>

            {formData.documentType ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <DocumentIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedDocType?.label} *
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDocType?.description}
                    </p>
                  </div>
                </div>

                {documentFile.file ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {documentFile.preview ? (
                          <img
                            src={documentFile.preview}
                            alt="Document preview"
                            className="h-16 w-16 object-cover rounded-lg mr-4"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mr-4">
                            <DocumentIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {documentFile.file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(documentFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {/* Upload Progress */}
                          {documentUpload.isUploading && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-600 dark:text-blue-400">Uploading...</span>
                                <span className="text-blue-600 dark:text-blue-400">{documentUpload.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${documentUpload.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          {/* Upload Success */}
                          {documentUpload.publicUrl && !documentUpload.isUploading && (
                            <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Upload complete
                            </div>
                          )}
                          {/* Upload Error */}
                          {documentUpload.error && (
                            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                              {documentUpload.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {documentFile.preview && (
                          <button
                            type="button"
                            onClick={() => window.open(documentFile.preview)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={removeFile}
                          disabled={documentUpload.isUploading}
                          className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="document-file"
                    />
                    <label
                      htmlFor="document-file"
                      className={`block w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        errors.documentFile 
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Click to upload {selectedDocType?.label.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF or PDF up to 10MB
                      </p>
                    </label>
                  </div>
                )}

                {errors.documentFile && (
                  <p className="mt-2 text-sm text-red-600">{errors.documentFile}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Please select a document type in the previous step first
                </p>
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Please review your information before submitting. Once submitted, your account will be reviewed for verification.
                </p>
              </div>
            </div>            {/* Review Bank Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bank Account Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Account Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    •••• •••• {formData.accountNumber.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Account Holder</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.accountName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.associatedPhoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Document Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedDocType?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Document Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.documentNumber}</p>
                </div>
                {formData.isPrimary && (
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                      Primary Account
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Review Document */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Uploaded Document</h3>
              {documentFile.file && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedDocType?.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {documentFile.file.name}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-4">
              <BanknotesIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Bank Account</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add your bank account for receiving donations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.number === currentStep 
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : step.number < currentStep
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {step.number < currentStep ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step.number === currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 ml-6 ${
                    step.number < currentStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || documentUpload.isUploading}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : documentUpload.isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBankAccount;
