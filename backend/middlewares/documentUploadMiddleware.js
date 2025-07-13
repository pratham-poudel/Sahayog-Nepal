/**
 * Document upload middleware specifically for bank account documents
 * Handles license, citizenship, and passport documents with proper folder segregation
 */
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { s3Client, BUCKET_NAME } = require('../config/minioConfig');

// Document type to folder mapping
const getDocumentFolder = (documentType) => {
  const folderMap = {
    'license': 'documents/licenses',
    'citizenship': 'documents/citizenship',
    'passport': 'documents/passports'
  };
  return folderMap[documentType] || 'documents/other';
};

// Validate file types for documents
const fileFilter = (req, file, cb) => {
  // Allowed file types for documents
  const allowedTypes = /jpeg|jpg|png|pdf|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG, GIF) and PDF files are allowed for documents'));
  }
};

// Configure storage with multer-s3 for documents
const documentStorage = multerS3({
  s3: s3Client,
  bucket: BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, { 
      fieldName: file.fieldname,
      documentType: req.body.documentType || 'other',
      uploadedBy: req.user?.id || 'unknown',
      uploadDate: new Date().toISOString()
    });
  },
  key: (req, file, cb) => {
    const documentType = req.body.documentType || 'other';
    const folder = getDocumentFolder(documentType);
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname) || '.jpg';
    
    // Create descriptive filename
    const userId = req.user?.id || 'unknown';
    const filename = `${documentType}-${userId}-${timestamp}-${randomString}${extension}`;
    const fullPath = `${folder}/${filename}`;

    // Save file data to request object for later use
    req.fileData = req.fileData || {};
    req.fileData[file.fieldname] = {
      filename,
      folder,
      fullPath,
      documentType,
      originalName: file.originalname
    };

    cb(null, fullPath);
  }
});

// Create document uploader with validation
const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for documents
    files: 1 // Only one document per upload
  },
  fileFilter: fileFilter
});

// Middleware to validate document type before upload
const validateDocumentType = (req, res, next) => {
  const { documentType } = req.body;
  const validTypes = ['license', 'citizenship', 'passport'];
  
  if (!documentType) {
    return res.status(400).json({
      success: false,
      message: 'Document type is required'
    });
  }
  
  if (!validTypes.includes(documentType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid document type. Must be license, citizenship, or passport'
    });
  }
  
  next();
};

// Middleware to process uploaded document
const processDocumentUpload = (req, res, next) => {
  if (req.file && req.fileData) {
    const fileData = req.fileData[req.file.fieldname];
    
    // Add processed file info to request
    req.uploadedDocument = {
      filename: fileData.filename,
      originalName: fileData.originalName,
      folder: fileData.folder,
      fullPath: fileData.fullPath,
      documentType: fileData.documentType,
      url: `http://127.0.0.1:9000/mybucket/${fileData.fullPath}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };
  }
  
  next();
};

module.exports = {
  uploadDocument,
  validateDocumentType,
  processDocumentUpload,
  getDocumentFolder
};
