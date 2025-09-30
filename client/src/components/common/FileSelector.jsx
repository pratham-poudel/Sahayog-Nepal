/**
 * File Selection Component (No Upload)
 * Allows users to select files without immediately uploading them
 * Supports drag & drop, preview, and multiple files
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoIcon, DocumentIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';

const FileSelector = ({
  fileType,
  accept = 'image/*',
  maxFiles = 1,
  onFilesSelected,
  disabled = false,
  className = '',
  children,
  showPreview = true,
  dragDropArea = true,
  selectedFiles = []
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef();
  
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState({});

  // Generate preview for image files
  const generatePreview = useCallback(async (file) => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
    return null;
  }, []);

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

    const totalFiles = (selectedFiles?.length || 0) + fileArray.length;
    if (totalFiles > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed (currently have ${selectedFiles?.length || 0})`,
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes and types
    const validFiles = [];
    const maxSize = 15 * 1024 * 1024; // 15MB

    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 15MB`,
          variant: "destructive"
        });
        continue;
      }

      // Basic MIME type validation
      if (accept !== '*/*' && !accept.split(',').some(type => {
        const cleanType = type.trim();
        if (cleanType === 'image/*') return file.type.startsWith('image/');
        if (cleanType === 'application/*') return file.type.startsWith('application/');
        return file.type === cleanType;
      })) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an allowed file type`,
          variant: "destructive"
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Generate previews for valid files
    const newPreviews = { ...previews };
    for (const file of validFiles) {
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      if (showPreview && !newPreviews[fileId]) {
        newPreviews[fileId] = await generatePreview(file);
      }
    }
    setPreviews(newPreviews);

    // Add unique IDs to files for tracking - Keep original File objects
    const filesWithIds = validFiles.map(file => {
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      // Add properties to the File object instead of spreading it
      file.id = fileId;
      file.preview = newPreviews[fileId];
      return file;
    });

    // Notify parent component
    if (onFilesSelected) {
      if (maxFiles === 1) {
        onFilesSelected(filesWithIds[0]);
      } else {
        onFilesSelected([...(selectedFiles || []), ...filesWithIds]);
      }
    }

    toast({
      title: "Files selected",
      description: `${validFiles.length} file(s) selected successfully`,
    });

  }, [fileType, maxFiles, onFilesSelected, selectedFiles, showPreview, toast, accept, previews, generatePreview]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
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

  // Remove selected file
  const removeFile = (fileId) => {
    if (maxFiles === 1) {
      onFilesSelected(null);
    } else {
      const updatedFiles = (selectedFiles || []).filter(file => file.id !== fileId);
      onFilesSelected(updatedFiles);
    }
  };

  // Get file icon based on type
  const getFileIcon = (file) => {
    // Debug log to understand the file structure
    if (!file) {
      console.warn('getFileIcon called with undefined file');
      return <DocumentIcon className="w-6 h-6 text-gray-400" />;
    }
    
    if (!file.type) {
      console.warn('File object missing type property:', file);
      return <DocumentIcon className="w-6 h-6 text-gray-400" />;
    }
    
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="w-6 h-6 text-gray-400" />;
    } else {
      return <DocumentIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const displayFiles = maxFiles === 1 ? (selectedFiles ? [selectedFiles] : []) : (selectedFiles || []);

  return (
    <div className={`file-selector ${className}`}>
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
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {children || (
                  <>
                    Click to select files or drag and drop
                    <br />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {accept.includes('image') ? 'PNG, JPG, GIF up to 15MB' : 'Files up to 15MB'}
                      {maxFiles > 1 && ` (max ${maxFiles} files)`}
                    </span>
                  </>
                )}
              </div>
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

      {/* Selected Files List */}
      <AnimatePresence>
        {displayFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-3"
          >
            {displayFiles.map((file) => {
              // Skip if file is invalid
              if (!file || !file.id) return null;
              
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {/* Preview */}
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg mr-3 flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                  
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name || 'Unknown file'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-3">
                    {file.preview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement preview modal
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Preview"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Remove"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            }).filter(Boolean)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File count indicator */}
      {maxFiles > 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {displayFiles.length} / {maxFiles} files selected
        </div>
      )}
    </div>
  );
};

export default FileSelector;