const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getPublicUrl } = require('../config/minioConfig');
const fileService = require('../services/fileService');
const { sendBankAccountEmail, sendBankAccountStatusEmail } = require('../utils/SendBankAccountEmail');

// @desc    Create a new bank account
// @route   POST /api/bank/accounts
// @access  Private (User)
exports.createBankAccount = async (req, res) => {
    try {
        const {
            bankName,
            accountNumber,
            accountName,
            associatedPhoneNumber,
            documentType,
            documentNumber,
            documentImageUrl,
            documentImage,
            isPrimary = false,
            notes
        } = req.body;

        // Validate required fields
        if (!bankName || !accountNumber || !accountName || !associatedPhoneNumber || 
            !documentType || !documentNumber) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Check if document was uploaded (either URL or key)
        if (!documentImageUrl && !documentImage) {
            return res.status(400).json({
                success: false,
                message: 'Document image is required'
            });
        }

        // Check if account number already exists
        const existingAccount = await BankAccount.findOne({ accountNumber });
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'Account number already exists'
            });
        }

        // Check if user exists
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create new bank account with document image URL from presigned upload
        const bankAccount = new BankAccount({
            userId: req.user.id,
            bankName,
            accountNumber,
            accountName,
            associatedPhoneNumber,
            documentType,
            documentNumber,
            documentImage: documentImageUrl || documentImage,
            isPrimary,
            notes,
            lastModifiedBy: req.user.id
        });

        await bankAccount.save();        // Populate user data for response
        await bankAccount.populate('userId', 'name email');

        // Send verification email to the user
        try {
            await sendBankAccountEmail(user.email, {
                accountName,
                bankName,
                accountNumber,
                documentType,
                documentNumber,
                submissionDate: new Date()
            });
            console.log(`Bank account verification email sent to: ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail the bank account creation if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Bank account created successfully',
            data: bankAccount.toObject()
        });

    } catch (error) {
        console.error('Create bank account error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating bank account'
        });
    }
};

// @desc    Get user's bank accounts
// @route   GET /api/bank/accounts
// @access  Private (User)
exports.getUserBankAccounts = async (req, res) => {
    try {
        const { status, primary, page = 1, limit = 10 } = req.query;
        
        // Build query
        let query = { userId: req.user.id, isActive: true };
        
        if (status) {
            query.verificationStatus = status;
        }
        
        if (primary === 'true') {
            query.isPrimary = true;
        }
        
        // Convert to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Get total count
        const total = await BankAccount.countDocuments(query);
        
        const bankAccounts = await BankAccount.find(query)
            .populate('userId', 'name email')
            .populate('verifiedBy', 'username')
            .sort({ isPrimary: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            count: bankAccounts.length,
            total: total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            data: bankAccounts
        });

    } catch (error) {
        console.error('Get user bank accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bank accounts'
        });
    }
};

// @desc    Get single bank account
// @route   GET /api/bank/accounts/:id
// @access  Private (User)
exports.getBankAccount = async (req, res) => {
    try {
        const bankAccount = await BankAccount.findOne({
            _id: req.params.id,
            userId: req.user.id,
            isActive: true
        })
        .populate('userId', 'name email')
        .populate('verifiedBy', 'username')
        .populate('lastModifiedBy', 'name email');

        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bankAccount
        });

    } catch (error) {
        console.error('Get bank account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bank account'
        });
    }
};

// @desc    Update bank account
// @route   PUT /api/bank/accounts/:id
// @access  Private (User)
exports.updateBankAccount = async (req, res) => {
    try {
        const allowedUpdates = [
            'bankName', 'accountName', 'associatedPhoneNumber', 
            'documentType', 'documentNumber', 'isPrimary', 'notes'
        ];
        
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });        updates.lastModifiedBy = req.user.id;

        // Find the existing bank account
        const existingAccount = await BankAccount.findOne({
            _id: req.params.id,
            userId: req.user.id,
            isActive: true
        });

        if (!existingAccount) {
            // Clean up uploaded file if account not found
            if (req.uploadedDocument) {
                await fileService.deleteFile(req.uploadedDocument.fullPath);
            }
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // If the account was rejected and is being updated, reset status to pending for re-review
        if (existingAccount.verificationStatus === 'rejected') {
            updates.verificationStatus = 'pending';
            updates.rejectionReason = null; // Clear rejection reason
            updates.verifiedBy = null; // Clear previous verifier
        }

        // Handle document image update
        if (req.uploadedDocument) {
            // Validate document type if provided
            if (updates.documentType && req.uploadedDocument.documentType !== updates.documentType) {
                await fileService.deleteFile(req.uploadedDocument.fullPath);
                return res.status(400).json({
                    success: false,
                    message: 'Document type mismatch. Please ensure the document type matches the uploaded file'
                });
            }

            // Delete old document image if it exists
            if (existingAccount.documentImage) {
                const oldImageKey = existingAccount.documentImage.replace('http://127.0.0.1:9000/mybucket/', '');
                await fileService.deleteFile(oldImageKey);
            }

            // Update with new document image
            updates.documentImage = req.uploadedDocument.url;
        }

        const bankAccount = await BankAccount.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id, isActive: true },
            updates,
            { new: true, runValidators: true }
        )
        .populate('userId', 'name email')
        .populate('verifiedBy', 'username');

        const responseData = {
            ...bankAccount.toObject()
        };

        // Add uploaded document info to response if new document was uploaded
        if (req.uploadedDocument) {
            responseData.uploadedDocument = {
                filename: req.uploadedDocument.filename,
                folder: req.uploadedDocument.folder,
                url: req.uploadedDocument.url,
                documentType: req.uploadedDocument.documentType
            };
        }

        res.status(200).json({
            success: true,
            message: 'Bank account updated successfully',
            data: responseData
        });

    } catch (error) {
        // Clean up uploaded file if update fails
        if (req.uploadedDocument) {
            await fileService.deleteFile(req.uploadedDocument.fullPath);
        }
        
        console.error('Update bank account error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating bank account'
        });
    }
};

// @desc    Delete bank account (soft delete)
// @route   DELETE /api/bank/accounts/:id
// @access  Private (User)
exports.deleteBankAccount = async (req, res) => {
    try {
        const bankAccount = await BankAccount.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isActive: false, lastModifiedBy: req.user.id },
            { new: true }
        );

        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bank account deleted successfully'
        });

    } catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting bank account'
        });
    }
};

// ============= ADMIN ROUTES =============

// @desc    Get all bank accounts (Admin)
// @route   GET /api/bank/admin/accounts
// @access  Private (Admin)
exports.getAllBankAccounts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            bankName, 
            userId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};
        
        if (status) {
            query.verificationStatus = status;
        }
        
        if (bankName) {
            query.bankName = { $regex: bankName, $options: 'i' };
        }
        
        if (userId) {
            query.userId = userId;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const bankAccounts = await BankAccount.find(query)
            .populate('userId', 'name email phone')
            .populate('verifiedBy', 'username')
            .populate('lastModifiedBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        const total = await BankAccount.countDocuments(query);

        res.status(200).json({
            success: true,
            count: bankAccounts.length,
            total,
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: bankAccounts
        });

    } catch (error) {
        console.error('Get all bank accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bank accounts'
        });
    }
};

// @desc    Get bank account by ID (Admin)
// @route   GET /api/bank/admin/accounts/:id
// @access  Private (Admin)
exports.getAdminBankAccount = async (req, res) => {
    try {
        const bankAccount = await BankAccount.findById(req.params.id)
            .populate('userId', 'name email phone createdAt')
            .populate('verifiedBy', 'username role')
            .populate('lastModifiedBy', 'name email');

        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bankAccount
        });

    } catch (error) {
        console.error('Get admin bank account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bank account'
        });
    }
};

// @desc    Verify bank account (Admin)
// @route   POST /api/bank/admin/accounts/:id/verify
// @access  Private (Admin)
exports.verifyBankAccount = async (req, res) => {
    try {
        const { notes } = req.body;
        
        const bankAccount = await BankAccount.findById(req.params.id);
        
        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }        // Allow re-verification (admin can verify even already verified accounts)
        await bankAccount.verify(req.admin.id, notes);

        // Populate for response
        await bankAccount.populate('userId', 'name email');
        await bankAccount.populate('verifiedBy', 'username');

        // Send verification success email
        try {
            await sendBankAccountStatusEmail(bankAccount.userId.email, {
                status: 'verified',
                accountName: bankAccount.accountName,
                bankName: bankAccount.bankName,
                accountNumber: bankAccount.accountNumber,
                documentType: bankAccount.documentType,
                verificationDate: bankAccount.verificationDate,
                verifiedBy: bankAccount.verifiedBy?.username || req.admin.username || 'Admin',
                adminNotes: notes
            });
            console.log(`Bank account verification email sent to: ${bankAccount.userId.email}`);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail the verification if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Bank account verified successfully',
            data: bankAccount
        });

    } catch (error) {
        console.error('Verify bank account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying bank account'
        });
    }
};

// @desc    Reject bank account (Admin)
// @route   POST /api/bank/admin/accounts/:id/reject
// @access  Private (Admin)
exports.rejectBankAccount = async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const bankAccount = await BankAccount.findById(req.params.id);
        
        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }        // Allow re-rejection (admin can reject even already rejected accounts)

        await bankAccount.reject(req.admin.id, reason);

        // Populate for response
        await bankAccount.populate('userId', 'name email');
        await bankAccount.populate('verifiedBy', 'username');        // Send rejection email
        try {
            await sendBankAccountStatusEmail(bankAccount.userId.email, {
                status: 'rejected',
                accountName: bankAccount.accountName,
                bankName: bankAccount.bankName,
                accountNumber: bankAccount.accountNumber,
                documentType: bankAccount.documentType,
                rejectionReason: reason,
                verificationDate: new Date(),
                verifiedBy: bankAccount.verifiedBy?.username || req.admin.username || 'Admin'
            });
            console.log(`Bank account rejection email sent to: ${bankAccount.userId.email}`);
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
            // Don't fail the rejection if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Bank account rejected successfully',
            data: bankAccount
        });

    } catch (error) {
        console.error('Reject bank account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting bank account'
        });
    }
};

// @desc    Update bank account status (Admin)
// @route   PUT /api/bank/admin/accounts/:id/status
// @access  Private (Admin)
exports.updateBankAccountStatus = async (req, res) => {
    try {
        const { verificationStatus, notes } = req.body;
        
        const validStatuses = ['pending', 'verified', 'rejected', 'under_review'];
        if (!validStatuses.includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification status'
            });
        }

        const updateData = {
            verificationStatus,
            lastModifiedBy: req.admin.id
        };

        if (verificationStatus === 'verified' || verificationStatus === 'rejected') {
            updateData.verificationDate = new Date();
            updateData.verifiedBy = req.admin.id;
        }

        if (notes) {
            updateData.notes = notes;
        }        const bankAccount = await BankAccount.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('userId', 'name email')
        .populate('verifiedBy', 'username');

        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // Send status update email
        try {
            await sendBankAccountStatusEmail(bankAccount.userId.email, {
                status: verificationStatus,
                accountName: bankAccount.accountName,
                bankName: bankAccount.bankName,
                accountNumber: bankAccount.accountNumber,
                documentType: bankAccount.documentType,
                verificationDate: bankAccount.verificationDate,
                verifiedBy: bankAccount.verifiedBy?.username || req.admin.username || 'Admin',
                adminNotes: notes,
                rejectionReason: verificationStatus === 'rejected' ? (notes || 'No specific reason provided') : null
            });
            console.log(`Bank account status update email sent to: ${bankAccount.userId.email}`);
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError);
            // Don't fail the status update if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Bank account status updated successfully',
            data: bankAccount
        });

    } catch (error) {
        console.error('Update bank account status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating bank account status'
        });
    }
};

// @desc    Get bank accounts statistics (Admin)
// @route   GET /api/bank/admin/stats
// @access  Private (Admin)
exports.getBankAccountStats = async (req, res) => {
    try {
        const stats = await BankAccount.aggregate([
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalAccounts = await BankAccount.countDocuments();
        const activeAccounts = await BankAccount.countDocuments({ isActive: true });
        const primaryAccounts = await BankAccount.countDocuments({ isPrimary: true });

        // Format stats
        const statusStats = {};
        stats.forEach(stat => {
            statusStats[stat._id] = stat.count;
        });

        res.status(200).json({
            success: true,
            data: {
                total: totalAccounts,
                active: activeAccounts,
                primary: primaryAccounts,
                byStatus: statusStats
            }
        });

    } catch (error) {
        console.error('Get bank account stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bank account statistics'
        });
    }
};

// @desc    Delete bank account (Admin)
// @route   DELETE /api/bank/admin/accounts/:id
// @access  Private (Admin)
exports.adminDeleteBankAccount = async (req, res) => {
    try {
        const bankAccount = await BankAccount.findById(req.params.id);
        
        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // Store user ID and primary status for later processing
        const userId = bankAccount.userId;
        const wasPrimary = bankAccount.isPrimary;

        // Delete the document file from storage if it exists
        if (bankAccount.documentImage) {
            try {
                const documentKey = bankAccount.documentImage.replace('http://127.0.0.1:9000/mybucket/', '');
                await fileService.deleteFile(documentKey);
            } catch (fileError) {
                console.warn('Could not delete document file:', fileError.message);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Permanently delete the bank account from database
        await BankAccount.findByIdAndDelete(req.params.id);

        // If this was a primary account, set another account as primary
        if (wasPrimary) {
            const anotherAccount = await BankAccount.findOne({
                userId: userId,
                verificationStatus: 'verified',
                isActive: true
            }).sort({ createdAt: -1 });

            if (anotherAccount) {
                anotherAccount.isPrimary = true;
                await anotherAccount.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Bank account permanently deleted from database'
        });

    } catch (error) {
        console.error('Admin delete bank account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting bank account'
        });
    }
};

// @desc    Upload document for bank account
// @route   POST /api/bank/accounts/:id/upload-document
// @access  Private (User)
exports.uploadBankAccountDocument = async (req, res) => {
    try {
        const { documentType } = req.body;

        // Validate required fields
        if (!documentType) {
            if (req.uploadedDocument) {
                await fileService.deleteFile(req.uploadedDocument.fullPath);
            }
            return res.status(400).json({
                success: false,
                message: 'Document type is required'
            });
        }

        // Check if document was uploaded
        if (!req.uploadedDocument) {
            return res.status(400).json({
                success: false,
                message: 'Document image is required'
            });
        }

        // Find the bank account
        const bankAccount = await BankAccount.findOne({
            _id: req.params.id,
            userId: req.user.id,
            isActive: true
        });

        if (!bankAccount) {
            await fileService.deleteFile(req.uploadedDocument.fullPath);
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // Delete old document image if it exists
        if (bankAccount.documentImage) {
            const oldImageKey = bankAccount.documentImage.replace('http://127.0.0.1:9000/mybucket/', '');
            await fileService.deleteFile(oldImageKey);
        }

        // Update bank account with new document
        bankAccount.documentImage = req.uploadedDocument.url;
        bankAccount.documentType = documentType;
        bankAccount.lastModifiedBy = req.user.id;
        
        // Reset verification status since document changed
        bankAccount.verificationStatus = 'pending';
        bankAccount.verificationDate = null;
        bankAccount.verifiedBy = null;
        bankAccount.rejectionReason = undefined;

        await bankAccount.save();

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                documentImage: req.uploadedDocument.url,
                documentType: req.uploadedDocument.documentType,
                uploadedDocument: {
                    filename: req.uploadedDocument.filename,
                    folder: req.uploadedDocument.folder,
                    url: req.uploadedDocument.url,
                    documentType: req.uploadedDocument.documentType,
                    size: req.uploadedDocument.size,
                    uploadedAt: req.uploadedDocument.uploadedAt
                }
            }
        });

    } catch (error) {
        // Clean up uploaded file if operation fails
        if (req.uploadedDocument) {
            await fileService.deleteFile(req.uploadedDocument.fullPath);
        }

        console.error('Upload bank account document error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading document'
        });
    }
};

// @desc    Get document upload information
// @route   GET /api/bank/document-info
// @access  Private (User)
exports.getDocumentInfo = async (req, res) => {
    try {
        const { getDocumentFolderInfo } = require('../utils/documentUtils');
        
        const documentInfo = {
            allowedTypes: ['license', 'citizenship', 'passport'],
            maxFileSize: '10MB',
            allowedFormats: ['JPEG', 'JPG', 'PNG', 'GIF', 'PDF'],
            folders: getDocumentFolderInfo(),
            uploadEndpoints: {
                create: 'POST /api/bank/accounts (with documentImage file)',
                update: 'PUT /api/bank/accounts/:id (with documentImage file)',
                uploadOnly: 'POST /api/bank/accounts/:id/upload-document (with documentImage file)'
            },
            requiredFields: [
                'documentType (license|citizenship|passport)',
                'documentImage (file upload)'
            ]
        };

        res.status(200).json({
            success: true,
            data: documentInfo
        });

    } catch (error) {
        console.error('Get document info error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching document information'
        });
    }
};
