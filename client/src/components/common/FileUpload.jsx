/**
 * Universal File Upload Component using Presigned URLs
 * Supports drag & drop, progress tracking, and preview
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import uploadService from '../../services/uploadService';
import { useToast } from '@/hooks/use-toast';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const FileUpload = ({
  fileType,
  accept = 'image/*',
  maxFiles = 1,
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  disabled = false,
  className = '',
  children,
  showPreview = true,
  dragDropArea = true
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef();
  
  const [uploads, setUploads] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    
    // Validate file count
    if (maxFiles === 1 && fileArray.length > 1) {
      toast({
        title: "Too many files",
        description: `Only one file is allowed for ${fileType}`,
        variant: "destructive"
      });
      return;
    }

    if (fileArray.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    if (onUploadStart) onUploadStart(fileArray);

    // Create upload entries with previews
    const newUploads = await Promise.all(
      fileArray.map(async (file, index) => {
        const id = `${Date.now()}-${index}`;
        let preview = null;
        
        if (showPreview && file.type.startsWith('image/')) {
          try {
            preview = await uploadService.createPreview(file);
          } catch (error) {
            console.warn('Failed to create preview:', error);
          }
        }

        return {
          id,
          file,
          preview,
          progress: 0,
          status: 'uploading', // uploading, completed, error
          error: null,
          result: null
        };
      })
    );

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files
    try {
      const results = await uploadService.uploadFiles(
        fileArray,
        { fileType },
        (overallProgress, fileIndex, fileProgress) => {
          // Update progress for specific file
          setUploads(prev => prev.map((upload, index) => {
            const uploadIndex = prev.length - fileArray.length + fileIndex;
            if (index === uploadIndex) {
              return { ...upload, progress: fileProgress };
            }
            return upload;
          }));

          if (onUploadProgress) {
            onUploadProgress(overallProgress, fileIndex, fileProgress);
          }
        }
      );

      // Update upload status
      setUploads(prev => prev.map((upload, index) => {
        const resultIndex = index - (prev.length - results.length);
        const result = results[resultIndex];
        
        if (result) {
          return {
            ...upload,
            status: result.success ? 'completed' : 'error',
            error: result.success ? null : result.error,
            result: result.success ? result : null,
            progress: 100
          };
        }
        return upload;
      }));

      // Notify parent component
      if (onUploadComplete) {
        const successfulResults = results.filter(r => r.success);
        onUploadComplete(maxFiles === 1 ? successfulResults[0] : successfulResults);
      }

      // Show success toast
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        toast({
          title: "Upload successful",
          description: `${successCount} file(s) uploaded successfully`,
        });
      }

      // Show error toast if any failed
      const failedCount = results.filter(r => !r.success).length;
      if (failedCount > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failedCount} file(s) failed to upload`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      // Update all uploads to error state
      setUploads(prev => prev.map(upload => ({
        ...upload,
        status: 'error',
        error: error.message,
        progress: 0
      })));

      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [fileType, maxFiles, onUploadComplete, onUploadStart, onUploadProgress, showPreview, toast]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled && dragDropArea) {
      setIsDragging(true);
    }
  }, [disabled, dragDropArea]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || !dragDropArea) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, dragDropArea, handleFiles]);

  // Remove upload
  const removeUpload = (id) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };

  // Retry upload
  const retryUpload = async (id) => {
    const upload = uploads.find(u => u.id === id);
    if (!upload || upload.status !== 'error') return;

    setUploads(prev => prev.map(u => 
      u.id === id ? { ...u, status: 'uploading', progress: 0, error: null } : u
    ));

    try {
      const result = await uploadService.uploadFile(
        upload.file,
        { fileType },
        (progress) => {
          setUploads(prev => prev.map(u => 
            u.id === id ? { ...u, progress } : u
          ));
        }
      );

      setUploads(prev => prev.map(u => 
        u.id === id ? { 
          ...u, 
          status: 'completed', 
          result,
          progress: 100,
          error: null 
        } : u
      ));

      if (onUploadComplete) {
        onUploadComplete(result);
      }

      toast({
        title: "Upload successful",
        description: "File uploaded successfully",
      });

    } catch (error) {
      setUploads(prev => prev.map(u => 
        u.id === id ? { 
          ...u, 
          status: 'error', 
          error: error.message,
          progress: 0 
        } : u
      ));

      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* Upload Area */}
      {dragDropArea && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
            ${isDragging 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileInputChange}
            disabled={disabled}
          />

          <div className="flex flex-col items-center space-y-3">
            <div className={`
              p-3 rounded-full 
              ${isDragging 
                ? 'bg-primary-100 dark:bg-primary-800' 
                : 'bg-gray-100 dark:bg-gray-700'
              }
            `}>
              {accept.includes('image') ? (
                <PhotoIcon className="w-8 h-8 text-gray-400" />
              ) : (
                <DocumentIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {children || (
                  <>
                    Click to upload or drag and drop
                    <br />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {accept.includes('image') ? 'PNG, JPG, GIF up to 15MB' : 'Files up to 15MB'}
                      {maxFiles > 1 && ` (max ${maxFiles} files)`}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {isDragging && (
            <div className="absolute inset-0 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <p className="text-primary-700 dark:text-primary-300 font-medium">
                Drop files here
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload List */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-3"
          >
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                {/* Preview */}
                {upload.preview && (
                  <img
                    src={upload.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg mr-3"
                  />
                )}
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {/* Progress bar */}
                  {upload.status === 'uploading' && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {upload.status === 'error' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {upload.error}
                    </p>
                  )}
                </div>

                {/* Status icon and actions */}
                <div className="flex items-center space-x-2 ml-3">
                  {upload.status === 'uploading' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  )}
                  
                  {upload.status === 'completed' && (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  )}
                  
                  {upload.status === 'error' && (
                    <>
                      <button
                        onClick={() => retryUpload(upload.id)}
                        className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >
                        Retry
                      </button>
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    </>
                  )}
                  
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;