/**
 * Centralized S3-Compatible Storage Configuration
 * Supports MinIO (local), Cloudflare R2, AWS S3, and other S3-compatible storage
 */
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load configuration from environment variables with fallbacks
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || 'http://127.0.0.1:9000/';
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY || 'minioadmin';
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY || 'minioadmin';
const STORAGE_REGION = process.env.STORAGE_REGION || 'auto'; // 'auto' for Cloudflare R2, 'us-east-1' for AWS
const BUCKET_NAME = process.env.BUCKET_NAME || 'mybucket';
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || 'http://127.0.0.1:9000/mybucket';

// Detect storage provider based on endpoint
const isCloudflareR2 = STORAGE_ENDPOINT.includes('cloudflarestorage.com');
const isAWSS3 = STORAGE_ENDPOINT.includes('amazonaws.com');
const isMinIO = STORAGE_ENDPOINT.includes('127.0.0.1') || STORAGE_ENDPOINT.includes('localhost');

console.log(`Storage Provider Detected: ${
  isCloudflareR2 ? 'Cloudflare R2' : 
  isAWSS3 ? 'AWS S3' : 
  isMinIO ? 'MinIO (Local)' : 
  'S3-Compatible'
}`);
console.log(`Public URL Base: ${PUBLIC_URL_BASE}`);

// Configure S3 client based on storage provider
const s3ClientConfig = {
  credentials: {
    accessKeyId: STORAGE_ACCESS_KEY,
    secretAccessKey: STORAGE_SECRET_KEY,
  },
  region: STORAGE_REGION,
};

// Provider-specific configurations
if (isCloudflareR2) {
  // Cloudflare R2 configuration
  s3ClientConfig.endpoint = STORAGE_ENDPOINT;
  s3ClientConfig.forcePathStyle = true; // R2 works better with path-style for presigned URLs
  s3ClientConfig.signatureVersion = 'v4';
} else if (isMinIO) {
  // MinIO configuration
  s3ClientConfig.endpoint = STORAGE_ENDPOINT;
  s3ClientConfig.forcePathStyle = true; // MinIO requires path-style
  s3ClientConfig.tls = false; // Disable TLS for local development
} else {
  // AWS S3 or other S3-compatible services
  if (STORAGE_ENDPOINT !== 'https://s3.amazonaws.com') {
    s3ClientConfig.endpoint = STORAGE_ENDPOINT;
  }
  s3ClientConfig.forcePathStyle = false; // AWS S3 prefers virtual-hosted style
}

const s3Client = new S3Client(s3ClientConfig);

/**
 * Get a public URL for a file stored in S3-compatible storage
 * @param {string} key - The object key in storage
 * @returns {string} - The public URL
 */
const getPublicUrl = (key) => {
  if (!key) return null;
  
  // For Cloudflare R2 with custom domain, use the custom domain
  if (isCloudflareR2 && PUBLIC_URL_BASE) {
    return `${PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`;
  }
  
  // For other providers, construct the URL based on the pattern
  return `${PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`;
};

/**
 * Generate an object key for storing a file
 * @param {string} originalName - The original filename or file object
 * @param {string} fileType - The type of file (profile, campaign, etc.)
 * @param {string} userId - Optional user ID for file organization
 * @returns {string} - The object key to use in storage
 */
const generateObjectKey = (originalName, fileType, userId = null) => {
  // Extract extension from filename
  const extension = path.extname(typeof originalName === 'string' ? originalName : originalName.originalname || '.jpg');
  const timestamp = Date.now();
  const randomString = uuidv4().split('-')[0]; // Use first part of UUID for shorter names
  const userPrefix = userId ? `user-${userId}` : 'anonymous';
  
  // Define the folder structure for each file type
  const folders = {
    'profile-picture': 'users/profile-pictures',
    'campaign-cover': 'campaigns/covers',
    'campaign-image': 'campaigns/images', 
    'blog-cover': 'blogs/covers',
    'blog-image': 'blogs/images',
    'document-license': 'documents/licenses',
    'document-citizenship': 'documents/citizenship',
    'document-passport': 'documents/passports',
    'other': 'misc'
  };

  const folder = folders[fileType] || folders.other;
  
  // Determine filename with proper prefix
  let filename = '';
  if (fileType === 'campaign-cover') {
    filename = `cover-${userPrefix}-${timestamp}-${randomString}${extension}`;
  } else if (fileType === 'profile-picture') {
    filename = `profile-${userPrefix}-${timestamp}-${randomString}${extension}`;
  } else {
    filename = `${userPrefix}-${timestamp}-${randomString}${extension}`;
  }
  
  return `${folder}/${filename}`;
};

/**
 * Generate a presigned URL for uploading files directly to S3
 * @param {string} key - The object key
 * @param {string} contentType - The MIME type of the file
 * @param {number} expiresIn - Expiration time in seconds (default: 15 minutes)
 * @returns {Promise<Object>} - Object containing presigned URL and fields
 */
const generatePresignedUploadUrl = async (key, contentType, expiresIn = 900) => {
  try {
    console.log('Generating presigned URL for:', {
      key,
      contentType,
      expiresIn,
      isCloudflareR2,
      isAWSS3,
      isMinIO,
      bucketName: BUCKET_NAME,
      endpoint: STORAGE_ENDPOINT
    });

    // For Cloudflare R2, use PutObject presigned URL instead of presigned POST
    if (isCloudflareR2) {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
      
      console.log('Generated Cloudflare R2 presigned URL:', {
        uploadUrl: uploadUrl,
        method: 'PUT',
        publicUrl: getPublicUrl(key)
      });
      
      return {
        url: uploadUrl,
        fields: {},
        key: key,
        publicUrl: getPublicUrl(key),
        method: 'PUT' // Important: R2 uses PUT, not POST
      };
    }
    
    // For AWS S3 and MinIO, use presigned POST
    const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
    
    const presignedPost = await createPresignedPost(s3Client, {
      Bucket: BUCKET_NAME,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 15 * 1024 * 1024], // 15MB max
        ['starts-with', '$Content-Type', contentType.split('/')[0] + '/'], // Ensure content type matches
        { 'Content-Type': contentType },
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: expiresIn,
    });

    console.log('Generated S3/MinIO presigned POST:', {
      url: presignedPost.url,
      fields: presignedPost.fields,
      method: 'POST',
      publicUrl: getPublicUrl(key)
    });

    return {
      url: presignedPost.url,
      fields: presignedPost.fields,
      key: key,
      publicUrl: getPublicUrl(key),
      method: 'POST'
    };
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

module.exports = {
  s3Client,
  BUCKET_NAME,
  getPublicUrl,
  generateObjectKey,
  generatePresignedUploadUrl,
  STORAGE_ENDPOINT,
  PUBLIC_URL_BASE,
  isCloudflareR2,
  isAWSS3,
  isMinIO
}; 