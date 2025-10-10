const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const withdrawalRequestSchema = new Schema({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bankAccount: {
    type: Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: true,
    validate: {
      validator: async function(bankAccountId) {
        const BankAccount = mongoose.model('BankAccount');
        const account = await BankAccount.findById(bankAccountId);
        return account && account.userId.toString() === this.creator.toString() && 
               account.verificationStatus === 'verified' && account.isActive;
      },
      message: 'Bank account must be verified and belong to the campaign creator'
    }
  },
  requestedAmount: {
    type: Number,
    required: [true, 'Requested amount is required'],
    min: [1, 'Amount must be greater than 0']
  },
  availableAmount: {
    type: Number,
    required: true
  },
  withdrawalType: {
    type: String,
    enum: ['full', 'partial'],
    default: 'partial'
  },
  reason: {
    type: String,
    required: [true, 'Reason for withdrawal is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  // Employee department processing (Withdrawal Department approval)
  employeeProcessedBy: {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee'
    },
    employeeName: String,
    employeeDesignation: String,
    processedAt: Date,
    action: {
      type: String,
      enum: ['approved', 'rejected']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  },
  // Admin processing (Transaction Department final processing)
  adminResponse: {
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reviewedAt: Date,
    comments: {
      type: String,
      trim: true
    },
    action: {
      type: String,
      enum: ['approved', 'rejected','processing','completed','failed'],
    }
  },
  processingDetails: {
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'  
    },
    processedAt: Date,
    transactionReference: String,
    processingFee: {
      type: Number,
      default: 0
    },
    finalAmount: Number
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
// Compound index for status-based queries with sorting (CRITICAL for pagination)
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

// Compound indexes for employee department filtering
withdrawalRequestSchema.index({ campaign: 1, status: 1 });
withdrawalRequestSchema.index({ creator: 1, status: 1, createdAt: -1 });

// Index for transaction reference search (used by Transaction Management)
withdrawalRequestSchema.index({ 'processingDetails.transactionReference': 1 });

// Index for employee tracking
withdrawalRequestSchema.index({ 'employeeProcessedBy.employeeId': 1 });
withdrawalRequestSchema.index({ 'processingDetails.processedBy': 1 });

// Compound index for multi-status queries (approved, processing, completed, failed)
withdrawalRequestSchema.index({ status: 1, 'processingDetails.processedAt': -1 });

// Virtual for processing time elapsed
withdrawalRequestSchema.virtual('processingTimeElapsed').get(function() {
  if (this.status === 'completed' || this.status === 'failed') return null;
  
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
  
  if (diffInHours < 24) return `${diffInHours} hours`;
  return `${Math.floor(diffInHours / 24)} days`;
});

// Pre-save middleware to capture campaign progress
withdrawalRequestSchema.pre('save', async function(next) {
  if (this.isNew && this.campaign) {
    try {
      const Campaign = mongoose.model('Campaign');
      const campaign = await Campaign.findById(this.campaign);
      
      if (campaign) {
        // Update available amount
        this.availableAmount = campaign.amountRaised - (campaign.amountWithdrawn || 0) - (campaign.pendingWithdrawals || 0);
      }
    } catch (error) {
      console.error('Error capturing campaign progress:', error);
    }
  }
  next();
});

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = WithdrawalRequest;
