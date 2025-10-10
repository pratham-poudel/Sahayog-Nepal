const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Employee name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: 'Phone number must be 10 digits'
        }
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: [
            'USER_KYC_VERIFIER',
            'CAMPAIGN_VERIFIER',
            'WITHDRAWAL_DEPARTMENT',
            'TRANSACTION_MANAGEMENT',
            'LEGAL_AUTHORITY_DEPARTMENT'
        ]
    },
    accessCode: {
        type: String,
        required: [true, 'Access code is required'],
        select: false,
        validate: {
            validator: function(v) {
                return /^\d{5}$/.test(v);
            },
            message: 'Access code must be exactly 5 digits'
        }
    },
    designationNumber: {
        type: String,
        required: [true, 'Designation number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    // Statistics for employee performance tracking
    statistics: {
        totalKycVerified: { type: Number, default: 0 },
        totalCampaignsVerified: { type: Number, default: 0 },
        totalCampaignsRejected: { type: Number, default: 0 },
        totalCampaignsReverted: { type: Number, default: 0 },
        totalBankAccountsVerified: { type: Number, default: 0 },
        totalBankAccountsRejected: { type: Number, default: 0 },
        totalWithdrawalsApproved: { type: Number, default: 0 },
        totalWithdrawalsRejected: { type: Number, default: 0 },
        // Transaction Management statistics
        totalTransactionsProcessing: { type: Number, default: 0 },
        totalTransactionsCompleted: { type: Number, default: 0 },
        totalTransactionsFailed: { type: Number, default: 0 },
        totalAmountProcessed: { type: Number, default: 0 },
        // Legal department statistics
        totalLegalCasesHandled: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Hash access code before saving
employeeSchema.pre('save', async function(next) {
    if (!this.isModified('accessCode')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.accessCode = await bcrypt.hash(this.accessCode, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare access code
employeeSchema.methods.compareAccessCode = async function(candidateAccessCode) {
    return await bcrypt.compare(candidateAccessCode, this.accessCode);
};

// Indexes for performance
employeeSchema.index({ department: 1, isActive: 1 });
employeeSchema.index({ designationNumber: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ phone: 1 });
employeeSchema.index({ createdAt: -1 });

// Compound index for filtering active employees by department
employeeSchema.index({ department: 1, isActive: 1, createdAt: -1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
