/**
 * Upload Progress Modal Component
 * Shows beautiful professional loading with real-time upload progress
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const UploadProgressModal = ({ 
  isOpen, 
  uploadStages = [], 
  currentStage = '', 
  overallProgress = 0, 
  errors = [] 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-white border-t-transparent rounded-full"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Creating Your Campaign
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we upload your files and process your campaign
                </p>
              </div>

              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {Math.round(overallProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Current Stage */}
              {currentStage && (
                <div className="mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {currentStage}
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Stages */}
              <div className="space-y-3 mb-6">
                {uploadStages.map((stage, index) => (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    {stage.status === 'completed' ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : stage.status === 'error' ? (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : stage.status === 'uploading' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        stage.status === 'completed' 
                          ? 'text-green-700 dark:text-green-400'
                          : stage.status === 'error'
                          ? 'text-red-700 dark:text-red-400'
                          : stage.status === 'uploading'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {stage.name}
                      </p>
                      
                      {/* Individual progress bar for uploading stages */}
                      {stage.status === 'uploading' && stage.progress !== undefined && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <motion.div
                              className="bg-blue-500 h-1.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${stage.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {Math.round(stage.progress)}% completed
                          </p>
                        </div>
                      )}
                      
                      {stage.status === 'error' && stage.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {stage.error}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Errors Section */}
              {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                    Upload Errors
                  </h4>
                  <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer Message */}
              <div className="text-center mt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This may take a few moments depending on file sizes
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadProgressModal;