/**
 * File service for handling file operations with MinIO
 */
const { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { 
  s3Client, 
  BUCKET_NAME, 
  getPublicUrl, 
  generateObjectKey 
} = require('../config/minioConfig');

/**
 * File service to handle operations with MinIO
 */
const fileService = {
  /**
   * Process uploaded files and return public URLs
   * @param {Object} file - The file object from multer middleware
   * @returns {Object} - Object with file details including public URL
   */
  processUploadedFile: (file) => {
    if (!file) return null;
    
    // Get the key from multer-s3
    const key = file.key;
    
    // Return file information including public URL
    return {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      key: key,
      url: getPublicUrl(key)
    };
  },
  
  /**
   * Process multiple uploaded files
   * @param {Array} files - Array of file objects from multer middleware
   * @returns {Array} - Array of file details including public URLs
   */
  processUploadedFiles: (files) => {
    if (!files || !Array.isArray(files)) return [];
    
    return files.map(file => fileService.processUploadedFile(file));
  },
  
  /**
   * Get a temporary signed URL for a file
   * Used for private files that require authenticated access
   * @param {string} key - The object key in MinIO
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} - The signed URL
   */
  getSignedUrl: async (key, expiresIn = 3600) => {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  },
  
  /**
   * Delete a file from MinIO
   * @param {string} key - The object key in MinIO
   * @returns {Promise<boolean>} - True if deletion succeeded
   */
  deleteFile: async (key) => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      
      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${key}:`, error);
      return false;
    }
  }
};

module.exports = fileService; 