/**
 * Centralized Upload Service using Presigned URLs
 * Handles file uploads directly to S3-compatible storage (Cloudflare R2, AWS S3, MinIO)
 */
import { API_BASE_URL } from '../config/index.js';

class UploadService {
  constructor() {
    this.apiUrl = API_BASE_URL;
  }

  /**
   * Get authentication token from localStorage
   * @returns {string|null} JWT token
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Get presigned URL for file upload
   * @param {Object} options Upload configuration
   * @param {string} options.fileType Type of file (profile-picture, campaign-cover, etc.)
   * @param {string} options.contentType MIME type of the file
   * @param {string} options.originalName Original filename
   * @param {Object} options.metadata Additional metadata
   * @returns {Promise<Object>} Presigned URL data
   */
  async getPresignedUrl({ fileType, contentType, originalName, metadata = {} }) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

    const response = await fetch(`${this.apiUrl}/api/uploads/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fileType,
        contentType,
        originalName,
        metadata
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to generate presigned URL');
    }

    return result.data;
  }

  /**
   * Upload file directly to S3 using presigned URL
   * @param {File} file The file to upload
   * @param {Object} presignedData Presigned URL data from getPresignedUrl
   * @param {Function} onProgress Progress callback (optional)
   * @returns {Promise<string>} Public URL of uploaded file
   */
  async uploadToStorage(file, presignedData, onProgress = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(presignedData.publicUrl);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out'));
      });

      // Set timeout (30 seconds)
      xhr.timeout = 30000;

      // Check if this is a PUT upload (Cloudflare R2) or POST upload (S3/MinIO)
      const method = presignedData.method || 'POST';
      
      if (method === 'PUT') {
        // For Cloudflare R2 - direct PUT upload
        xhr.open('PUT', presignedData.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      } else {
        // For S3/MinIO - POST with form data
        const formData = new FormData();
        
        // Add all the presigned fields first
        Object.entries(presignedData.formData || {}).forEach(([key, value]) => {
          formData.append(key, value);
        });
        
        // Add the file last (important for some S3-compatible services)
        formData.append('file', file);

        xhr.open('POST', presignedData.uploadUrl);
        xhr.send(formData);
      }
    });
  }

  /**
   * Confirm upload completion with backend
   * @param {string} key File key in storage
   * @param {string} fileType Type of file
   * @param {Object} metadata Additional metadata
   * @returns {Promise<Object>} Confirmation data
   */
  async confirmUpload(key, fileType, metadata = {}) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

    const response = await fetch(`${this.apiUrl}/api/uploads/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        key,
        fileType,
        metadata
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to confirm upload');
    }

    return result.data;
  }

  /**
   * Complete file upload process (get presigned URL + upload + confirm)
   * @param {File} file The file to upload
   * @param {Object} options Upload configuration
   * @param {Function} onProgress Progress callback (optional)
   * @returns {Promise<Object>} Upload result with public URL
   */
  async uploadFile(file, options, onProgress = null) {
    try {
      // Validate file
      this.validateFile(file, options.fileType);

      // Step 1: Get presigned URL
      const presignedData = await this.getPresignedUrl({
        fileType: options.fileType,
        contentType: file.type,
        originalName: file.name,
        metadata: options.metadata || {}
      });

      // Step 2: Upload to storage
      const publicUrl = await this.uploadToStorage(file, presignedData, onProgress);

      // Step 3: Confirm with backend
      const confirmData = await this.confirmUpload(
        presignedData.key, 
        options.fileType, 
        {
          originalName: file.name,
          size: file.size,
          contentType: file.type,
          ...options.metadata
        }
      );

      return {
        success: true,
        publicUrl: confirmData.publicUrl,
        key: confirmData.key,
        metadata: confirmData
      };

    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Validate file before upload
   * @param {File} file The file to validate
   * @param {string} fileType Type of file being uploaded
   */
  validateFile(file, fileType) {
    // Check file size (15MB max)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 15MB.');
    }

    // Check file type based on fileType
    const allowedTypes = this.getAllowedTypes(fileType);
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  /**
   * Get allowed MIME types for a file type
   * @param {string} fileType Type of file
   * @returns {Array<string>} Allowed MIME types
   */
  getAllowedTypes(fileType) {
    const typeMap = {
      'profile-picture': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      'campaign-cover': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      'campaign-image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      'blog-cover': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      'blog-image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      'document-license': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'],
      'document-citizenship': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'],
      'document-passport': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'],
    };

    return typeMap[fileType] || ['image/jpeg', 'image/jpg', 'image/png'];
  }

  /**
   * Upload multiple files in parallel
   * @param {Array<File>} files Array of files to upload
   * @param {Object} options Upload configuration
   * @param {Function} onProgress Progress callback (optional)
   * @returns {Promise<Array<Object>>} Array of upload results
   */
  async uploadFiles(files, options, onProgress = null) {
    const results = [];
    const totalFiles = files.length;
    let completedFiles = 0;

    const uploadPromises = files.map(async (file, index) => {
      try {
        const result = await this.uploadFile(file, options, (fileProgress) => {
          if (onProgress) {
            const overallProgress = ((completedFiles / totalFiles) + (fileProgress / 100 / totalFiles)) * 100;
            onProgress(overallProgress, index, fileProgress);
          }
        });
        
        completedFiles++;
        return result;
      } catch (error) {
        completedFiles++;
        return {
          success: false,
          error: error.message,
          file: file.name
        };
      }
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Create a preview URL for a file
   * @param {File} file The file to preview
   * @returns {Promise<string>} Preview URL
   */
  createPreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Create singleton instance
const uploadService = new UploadService();

// Export both the class and the instance
export default uploadService;
export { UploadService };

// Export convenient methods for common use cases
export const uploadProfilePicture = (file, onProgress) => 
  uploadService.uploadFile(file, { fileType: 'profile-picture' }, onProgress);

export const uploadCampaignCover = (file, onProgress) => 
  uploadService.uploadFile(file, { fileType: 'campaign-cover' }, onProgress);

export const uploadCampaignImages = (files, onProgress) => 
  uploadService.uploadFiles(files, { fileType: 'campaign-image' }, onProgress);

export const uploadBlogCover = (file, onProgress) => 
  uploadService.uploadFile(file, { fileType: 'blog-cover' }, onProgress);

export const uploadBlogImage = (file, onProgress) => 
  uploadService.uploadFile(file, { fileType: 'blog-image' }, onProgress);

export const uploadDocument = (file, documentType, onProgress) => 
  uploadService.uploadFile(file, { fileType: `document-${documentType}` }, onProgress);