/**
 * Simple upload middleware for handling file uploads to MinIO
 */
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { s3Client, BUCKET_NAME } = require('../config/minioConfig');

// Helper to get file config
const getFileConfig = (fieldname) => {
  const configMap = {
    profilePicture: { fileType: 'profile-picture', folder: 'profiles' },
    coverImage: { fileType: 'cover', folder: 'uploads' },
    campaignImages: { fileType: 'campaign-image', folder: 'uploads' },
    additionalImages: { fileType: 'campaign-image', folder: 'uploads' },
    BlogCoverImage: { fileType: 'BlogCoverImage', folder: 'blogs' },
    Blogimage: { fileType: 'Blogimage', folder: 'blogs' },
    documentImage: { fileType: 'document', folder: 'documents' }, // Generic document
    licenseDocument: { fileType: 'document-license', folder: 'documents/licenses' },
    citizenshipDocument: { fileType: 'document-citizenship', folder: 'documents/citizenship' },
    passportDocument: { fileType: 'document-passport', folder: 'documents/passports' },
  };
  return configMap[fieldname] || { fileType: 'other', folder: 'uploads' };
};

// Configure storage with multer-s3
const s3Storage = multerS3({
  s3: s3Client,
  bucket: BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const { folder } = getFileConfig(file.fieldname);
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname) || '.jpg';

    const filenamePrefix = file.fieldname === 'coverImage' ? 'cover-' : '';
    const filename = `${filenamePrefix}${timestamp}-${randomString}${extension}`;
    const fullPath = `${folder}/${filename}`;

    // Save file data to request object
    req.fileData = req.fileData || {};
    req.fileData[file.fieldname] = req.fileData[file.fieldname] || [];
    req.fileData[file.fieldname].push({ filename, folder, fullPath });

    cb(null, fullPath);
  }
});

// Create and export multer uploader
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB max file size
  }
});

module.exports = upload;
