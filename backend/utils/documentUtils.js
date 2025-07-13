/**
 * Document management utility for bank account documents
 */
const { getPublicUrl } = require('../config/minioConfig');
const fileService = require('../services/fileService');

/**
 * Extract file key from MinIO URL
 * @param {string} url - The full MinIO URL
 * @returns {string} - The file key/path
 */
const extractKeyFromUrl = (url) => {
    if (!url) return null;
    return url.replace('http://127.0.0.1:9000/mybucket/', '');
};

/**
 * Validate document file type
 * @param {string} mimetype - The file mimetype
 * @returns {boolean} - Whether the file type is valid
 */
const isValidDocumentType = (mimetype) => {
    const validTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'application/pdf'
    ];
    return validTypes.includes(mimetype);
};

/**
 * Generate document metadata
 * @param {Object} file - The uploaded file object
 * @param {string} documentType - Type of document (license, citizenship, passport)
 * @param {string} userId - ID of the user uploading
 * @returns {Object} - Document metadata
 */
const generateDocumentMetadata = (file, documentType, userId) => {
    return {
        originalName: file.originalname,
        filename: file.filename || file.key,
        size: file.size,
        mimetype: file.mimetype,
        documentType,
        userId,
        uploadedAt: new Date(),
        isDocument: true
    };
};

/**
 * Get document folder structure info
 * @returns {Object} - Available document folders and their purposes
 */
const getDocumentFolderInfo = () => {
    return {
        'documents/licenses': {
            description: 'Driving licenses and ID cards',
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            maxSize: '10MB'
        },
        'documents/citizenship': {
            description: 'Citizenship certificates and national ID cards',
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            maxSize: '10MB'
        },
        'documents/passports': {
            description: 'Passport documents',
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            maxSize: '10MB'
        }
    };
};

/**
 * Clean up old document when replacing
 * @param {string} oldDocumentUrl - URL of the old document to delete
 * @returns {Promise<boolean>} - Success status
 */
const cleanupOldDocument = async (oldDocumentUrl) => {
    try {
        if (!oldDocumentUrl) return true;
        
        const fileKey = extractKeyFromUrl(oldDocumentUrl);
        if (!fileKey) return true;
        
        return await fileService.deleteFile(fileKey);
    } catch (error) {
        console.error('Error cleaning up old document:', error);
        return false;
    }
};

/**
 * Validate document upload requirements
 * @param {Object} file - The uploaded file
 * @param {string} documentType - The document type
 * @returns {Object} - Validation result with success status and message
 */
const validateDocumentUpload = (file, documentType) => {
    if (!file) {
        return {
            success: false,
            message: 'No file uploaded'
        };
    }

    if (!documentType || !['license', 'citizenship', 'passport'].includes(documentType)) {
        return {
            success: false,
            message: 'Invalid document type. Must be license, citizenship, or passport'
        };
    }

    if (!isValidDocumentType(file.mimetype)) {
        return {
            success: false,
            message: 'Invalid file type. Only JPEG, PNG, GIF images and PDF files are allowed'
        };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return {
            success: false,
            message: 'File size too large. Maximum size is 10MB'
        };
    }

    return {
        success: true,
        message: 'Document validation passed'
    };
};

module.exports = {
    extractKeyFromUrl,
    isValidDocumentType,
    generateDocumentMetadata,
    getDocumentFolderInfo,
    cleanupOldDocument,
    validateDocumentUpload
};
