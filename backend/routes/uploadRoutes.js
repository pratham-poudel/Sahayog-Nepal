/**
 * Routes for handling file upload operations using presigned URLs
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  generatePresignedUploadUrl, 
  generateObjectKey,
  getPublicUrl 
} = require('../config/minioConfig');

/**
 * Generate presigned URL for file upload
 * POST /api/upload/presigned-url
 */
router.post('/presigned-url', protect, async (req, res) => {
  try {
    const { fileType, contentType, originalName, metadata = {} } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!fileType || !contentType || !originalName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fileType, contentType, and originalName are required'
      });
    }

    // Validate file type
    const allowedFileTypes = [
      'profile-picture',
      'campaign-cover', 
      'campaign-image',
      'blog-cover',
      'blog-image',
      'document-license',
      'document-citizenship', 
      'document-passport'
    ];

    if (!allowedFileTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedFileTypes.join(', ')}`
      });
    }

    // Validate content type
    const allowedContentTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf' // For documents
    ];

    if (!allowedContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid content type. Allowed types: ${allowedContentTypes.join(', ')}`
      });
    }

    // Generate unique object key
    const objectKey = generateObjectKey(originalName, fileType, userId);
    
    // Generate presigned upload URL
    const presignedData = await generatePresignedUploadUrl(objectKey, contentType);
    
    // Store metadata for later verification (optional)
    // This could be stored in Redis or database for validation after upload
    const uploadMetadata = {
      userId,
      fileType,
      originalName,
      contentType,
      objectKey,
      timestamp: Date.now(),
      ...metadata
    };

    res.json({
      success: true,
      data: {
        uploadUrl: presignedData.url,
        formData: presignedData.fields,
        key: objectKey,
        publicUrl: presignedData.publicUrl,
        method: presignedData.method || 'POST',
        metadata: uploadMetadata
      },
      message: 'Presigned URL generated successfully'
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate presigned URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Confirm file upload completion
 * POST /api/upload/confirm
 */
router.post('/confirm', protect, async (req, res) => {
  try {
    const { key, fileType, metadata = {} } = req.body;
    const userId = req.user?.id;

    if (!key || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: key and fileType are required'
      });
    }

    // Generate public URL for the uploaded file
    const publicUrl = getPublicUrl(key);

    // Here you could add additional logic like:
    // - Updating database records
    // - Virus scanning
    // - Image optimization
    // - Metadata extraction

    res.json({
      success: true,
      data: {
        key,
        publicUrl,
        fileType,
        uploadedBy: userId,
        timestamp: Date.now(),
        ...metadata
      },
      message: 'File upload confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get public URL for an existing file
 * GET /api/upload/url/:key
 */
router.get('/url/:key(*)', (req, res) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'File key is required'
      });
    }

    const publicUrl = getPublicUrl(key);
    
    res.json({
      success: true,
      data: {
        key,
        publicUrl
      }
    });

  } catch (error) {
    console.error('Error getting file URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;