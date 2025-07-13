import React, { useState, useEffect } from 'react';
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

const EditBankAccount = ({ account, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data with existing account data
  const [formData, setFormData] = useState({
    bankName: account?.bankName || '',
    accountNumber: account?.accountNumber || '',
    accountName: account?.accountName || '',
    associatedPhoneNumber: account?.associatedPhoneNumber || '',
    documentType: account?.documentType || '',
    documentNumber: account?.documentNumber || '',
    isPrimary: account?.isPrimary || false
  });

  // Document upload state
  const [documentFile, setDocumentFile] = useState({
    file: null,
    preview: account?.documentImage || null
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  const steps = [
    { number: 1, title: 'Bank Details', description: 'Update your bank account information' },
    { number: 2, title: 'Document Upload', description: 'Update verification document' },
    { number: 3, title: 'Review', description: 'Review and submit your changes' }
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, JPEG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setDocumentFile({
        file: file,
        preview: e.target.result
      });
    };
    reader.readAsDataURL(file);

    // Clear file error
    if (errors.documentFile) {
      setErrors(prev => ({
        ...prev,
        documentFile: ''
      }));
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setDocumentFile({
      file: null,
      preview: account?.documentImage || null // Revert to original if exists
    });
  };

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.accountName.trim()) newErrors.accountName = 'Account holder name is required';
    if (!formData.associatedPhoneNumber.trim()) newErrors.associatedPhoneNumber = 'Phone number is required';
    if (!formData.documentType.trim()) newErrors.documentType = 'Document type is required';
    if (!formData.documentNumber.trim()) newErrors.documentNumber = 'Document number is required';
    
    // Validate account number format
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
    
    // For edit, document is optional if already exists
    if (!documentFile.file && !documentFile.preview) {
      newErrors.documentFile = 'Document image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        submitFormData.append(key, formData[key]);
      });

      // Append document file if new one is uploaded
      if (documentFile.file) {
        submitFormData.append('documentImage', documentFile.file);
      }

      const response = await fetch(`${API_BASE_URL}/api/bank/accounts/${account._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitFormData
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Bank account updated successfully. It's now pending verification.",
        });
        
        if (onSuccess) onSuccess(data.data);
        if (onClose) onClose();
      } else {
        throw new Error(data.message || 'Failed to update bank account');
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update bank account. Please try again.",
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
              </div>

              <div>
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
                  placeholder="e.g., +977-9812345678"
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
                    <option key={doc.value} value={doc.value}>
                      {doc.label}
                    </option>
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
                />
                {errors.documentNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.documentNumber}</p>
                )}
              </div>
            </div>

            {/* Primary Account Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrimary"
                name="isPrimary"
                checked={formData.isPrimary}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Set as primary account (recommended for receiving donations)
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
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Document Upload
              </h3>
              
              {selectedDocType && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{selectedDocType.label}</strong> - {selectedDocType.description}
                  </p>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                {!documentFile.preview ? (
                  <div className="text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                          Upload document image
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG, JPEG up to 5MB
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={documentFile.preview}
                      alt="Document preview"
                      className="max-w-full h-64 object-contain mx-auto rounded-lg"
                    />
                    <div className="mt-4 flex justify-center space-x-4">
                      <button
                        type="button"
                        onClick={() => window.open(documentFile.preview, '_blank')}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                      <label
                        htmlFor="file-upload-replace"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                      >
                        <DocumentIcon className="h-4 w-4 mr-2" />
                        Replace
                      </label>
                      <input
                        id="file-upload-replace"
                        name="file-upload-replace"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                )}
              </div>

              {errors.documentFile && (
                <p className="mt-2 text-sm text-red-600">{errors.documentFile}</p>
              )}
            </div>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Review Your Information
            </h3>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Bank Name</label>
                  <p className="text-gray-900 dark:text-white">{formData.bankName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Account Number</label>
                  <p className="text-gray-900 dark:text-white">{formData.accountNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Account Holder</label>
                  <p className="text-gray-900 dark:text-white">{formData.accountName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
                  <p className="text-gray-900 dark:text-white">{formData.associatedPhoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Document Type</label>
                  <p className="text-gray-900 dark:text-white capitalize">{formData.documentType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Document Number</label>
                  <p className="text-gray-900 dark:text-white">{formData.documentNumber}</p>
                </div>
              </div>

              {formData.isPrimary && (
                <div className="flex items-center text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  This will be set as your primary account
                </div>
              )}

              {documentFile.preview && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Document Image
                  </label>
                  <img
                    src={documentFile.preview}
                    alt="Document preview"
                    className="max-w-xs h-32 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Your account will be set to "pending" status and require admin verification</li>
                    <li>Please ensure all information is accurate to avoid delays</li>
                    <li>You'll receive a notification once verification is complete</li>
                  </ul>
                </div>
              </div>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Bank Account
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your bank account information
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

        {/* Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.number
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {step.number}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`ml-8 w-20 h-0.5 ${
                    currentStep > step.number
                      ? 'bg-primary-600'
                      : 'bg-gray-200 dark:bg-gray-700'
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
        <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevious}
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
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Account'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBankAccount;
