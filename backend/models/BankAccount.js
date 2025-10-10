const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    
    // Bank Details
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true,
        maxlength: [100, 'Bank name cannot exceed 100 characters']
    },
    
    accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
        trim: true,
        unique: true,
        minlength: [8, 'Account number must be at least 8 characters'],
        maxlength: [20, 'Account number cannot exceed 20 characters'],
        validate: {
            validator: function(v) {
                return /^[0-9]+$/.test(v); // Only numbers allowed
            },
            message: 'Account number must contain only numbers'
        }
    },
    
    accountName: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true,
        maxlength: [100, 'Account name cannot exceed 100 characters']
    },
    
    // Contact Information
    associatedPhoneNumber: {
        type: String,
        required: [true, 'Associated phone number is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^[\+]?[0-9\s\-\(\)]{10,15}$/.test(v);
            },
            message: 'Please provide a valid phone number'
        }
    },
    
    // Document Information
    documentType: {
        type: String,
        required: [true, 'Document type is required'],
        enum: {
            values: ['license', 'citizenship', 'passport'],
            message: 'Document type must be either license, citizenship, or passport'
        }
    },
    
    documentNumber: {
        type: String,
        required: [true, 'Document number is required'],
        trim: true,
        maxlength: [50, 'Document number cannot exceed 50 characters']
    },
    
    documentImage: {
        type: String,
        required: [true, 'Document image is required'],
        validate: {
            validator: function(v) {
                // Check if it's a valid URL or file path
                return v && v.length > 0;
            },
            message: 'Document image path/URL is required'
        }
    },
    
    // Verification Status
    verificationStatus: {
        type: String,
        enum: {
            values: ['pending', 'verified', 'rejected', 'under_review'],
            message: 'Verification status must be pending, verified, rejected, or under_review'
        },
        default: 'pending'
    },
    
    verificationDate: {
        type: Date,
        default: null
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'verifiedByModel',
        default: null
    },
    
    verifiedByModel: {
        type: String,
        enum: ['User', 'Admin', 'Employee'],
        default: null
    },
    
    // Employee verification tracking (for Withdrawal Department)
    employeeVerification: {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        employeeName: String,
        employeeDesignation: String,
        verifiedAt: Date,
        action: {
            type: String,
            enum: ['verified', 'rejected']
        },
        reason: String,
        notes: String
    },
    
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    
    // Additional Security
    isActive: {
        type: Boolean,
        default: true
    },
    
    isPrimary: {
        type: Boolean,
        default: false
    },
    
    // Metadata
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
    
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
bankAccountSchema.index({ userId: 1, isPrimary: 1 });
bankAccountSchema.index({ verificationStatus: 1 });
bankAccountSchema.index({ bankName: 1 });
bankAccountSchema.index({ createdAt: -1 });

// Virtual for full document info
bankAccountSchema.virtual('documentInfo').get(function() {
    return {
        type: this.documentType,
        number: this.documentNumber,
        image: this.documentImage
    };
});

// Pre-save middleware to ensure only one primary account per user
bankAccountSchema.pre('save', async function(next) {
    if (this.isPrimary && this.isModified('isPrimary')) {
        // If this account is being set as primary, unset all other primary accounts for this user
        await mongoose.model('BankAccount').updateMany(
            { 
                userId: this.userId, 
                _id: { $ne: this._id },
                isPrimary: true 
            },
            { isPrimary: false }
        );
    }
    next();
});

// Instance method to verify account
bankAccountSchema.methods.verify = function(verifiedByUserId, notes = '') {
    this.verificationStatus = 'verified';
    this.verificationDate = new Date();
    this.verifiedBy = verifiedByUserId;
    this.rejectionReason = undefined;
    if (notes) this.notes = notes;
    return this.save();
};

// Instance method to reject account
bankAccountSchema.methods.reject = function(rejectedByUserId, reason) {
    this.verificationStatus = 'rejected';
    this.verificationDate = new Date();
    this.verifiedBy = rejectedByUserId;
    this.rejectionReason = reason;
    return this.save();
};

// Static method to find user's primary account
bankAccountSchema.statics.findPrimaryAccount = function(userId) {
    return this.findOne({ userId, isPrimary: true, isActive: true });
};

// Static method to find verified accounts for a user
bankAccountSchema.statics.findVerifiedAccounts = function(userId) {
    return this.find({ 
        userId, 
        verificationStatus: 'verified', 
        isActive: true 
    }).sort({ isPrimary: -1, createdAt: -1 });
};

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;