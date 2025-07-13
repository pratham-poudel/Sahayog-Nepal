/**
 * Centralized MinIO configuration
 * This file contains all MinIO/S3 related configuration to ensure consistency
 */
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// MinIO server information
const MINIO_ENDPOINT = 'http://127.0.0.1:9000/';
const MINIO_ACCESS_KEY = 'minioadmin';
const MINIO_SECRET_KEY = 'minioadmin';
const MINIO_REGION = 'us-east-1';
const BUCKET_NAME = 'mybucket';

// Public URL format for frontend use
const PUBLIC_URL_BASE = 'http://127.0.0.1:9000/mybucket';

// Configure S3 client
const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  region: MINIO_REGION,
  forcePathStyle: true,
  tls: false,
});

/**
 * Get a public URL for a file stored in MinIO
 * @param {string} key - The object key in MinIO
 * @returns {string} - The public URL
 */
const getPublicUrl = (key) => {
  if (!key) return null;
  return `${PUBLIC_URL_BASE}/${key}`;
};

/**
 * Generate an object key for storing a file
 * @param {string} file - The file object
 * @param {string} fileType - The type of file (profile, campaign, etc.)
 * @returns {string} - The object key to use in MinIO
 */
const generateObjectKey = (file, fileType) => {
  const extension = path.extname(file.originalname);
  const timestamp = Date.now();
  const randomString = Math.round(Math.random() * 1E9);
    // Define the folder structure for each file type
  const folders = {
    'profile-picture': 'users/profile-pictures',
    'campaign-cover': 'uploads',
    'campaign-image': 'uploads',
    'blog-image': 'blog/images',
    'product-image': 'products/images',
    'document-license': 'documents/licenses',
    'document-citizenship': 'documents/citizenship',
    'document-passport': 'documents/passports',
    'other': 'misc'
  };

  const folder = folders[fileType] || folders.other;
  
  // Determine filename with proper prefix
  let filename = '';
  if (fileType === 'campaign-cover') {
    filename = `cover-${timestamp}-${randomString}${extension}`;
  } else {
    filename = `${timestamp}-${randomString}${extension}`;
  }
  
  return `${folder}/${filename}`;
};

module.exports = {
  s3Client,
  BUCKET_NAME,
  getPublicUrl,
  generateObjectKey,
  MINIO_ENDPOINT
}; 