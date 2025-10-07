const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campaignSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [250, 'Short description cannot be more than 250 characters']
  },
  story: {
    type: String,
    required: [true, 'Campaign story is required'],
    trim: true
  },  category: {
    type: String,
    required: [true, 'Category is required'],
    // Main category like 'Healthcare', 'Education', 'Animals', etc.
  },
  subcategory: {
    type: String,
    // Optional subcategory like 'Dogs', 'Primary Education', etc.
    default: null
  },
  tags: {
    type: [String],
    default: [],
    // Tags like "Featured", "Urgent", etc. will be added by admins
  },
  featured: {
    type: Boolean,
    default: false,
    description: 'Whether the campaign should be featured on the homepage and get priority in indexing'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [10000, 'Minimum fundraising amount is NPR 10,000'],
    max: [10000000, 'Maximum fundraising amount is NPR 1 crore']
  },  amountRaised: {
    type: Number,
    default: 0
  },
  amountWithdrawn: {
    type: Number,
    default: 0
  },
  pendingWithdrawals: {
    type: Number,
    default: 0
  },
  withdrawalRequests: [{
    type: Schema.Types.ObjectId,
    ref: 'WithdrawalRequest'
  }],
  donors: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        // Normalize dates by removing time component
        const endDate = new Date(value);
        endDate.setHours(0, 0, 0, 0);
        
        const startDate = new Date(this.startDate || Date.now());
        startDate.setHours(0, 0, 0, 0);
        
        // Allow end date to be on the same day or later
        return endDate >= startDate;
      },
      message: 'End date must be equal to or later than the start date'
    }
  },
  coverImage: {
    type: String,
    required: [true, 'Cover image is required']
  },
  images: [String],
  verificationDocuments: {
    type: [String],
    default: [],
    description: 'Optional verification documents (medical reports, certificates, etc.) that support campaign authenticity'
  },
  lapLetter: {
    type: String,
    required: [true, 'Local Authority Permission (LAP) Letter is required'],
    description: 'Local Authority Permission Letter - Required document for campaign verification'
  },
  donations: [{
    type: Schema.Types.ObjectId,
    ref: 'Donation'
  }],
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updates: [{
    date: {
      type: Date,
      default: Date.now
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  }],  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled', 'rejected'],
      required: true
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: ''
    }
  }],
  rejectionReason: {
    type: String,
    default: ''
  },
  adminFeedback: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Virtual property for percentage raised
campaignSchema.virtual('percentageRaised').get(function() {
  return Math.round((this.amountRaised / this.targetAmount) * 100);
});

// Virtual property for available withdrawal amount
campaignSchema.virtual('availableForWithdrawal').get(function() {
  return Math.max(0, this.amountRaised - this.amountWithdrawn - this.pendingWithdrawals);
});

// Virtual property to check if campaign is ended (completed or past endDate)
campaignSchema.virtual('isCampaignEnded').get(function() {
  if (this.status === 'completed') return true;
  
  const today = new Date();
  const endDate = new Date(this.endDate);
  return endDate < today;
});

// Virtual property to check if withdrawal is eligible
// For ended campaigns: any amount > 0 is eligible
// For active campaigns: >= 10,000 is required
campaignSchema.virtual('isWithdrawalEligible').get(function() {
  if (this.isCampaignEnded) {
    return this.availableForWithdrawal > 0;
  }
  return this.availableForWithdrawal >= 10000;
});

// Virtual property for withdrawal percentage
campaignSchema.virtual('withdrawalPercentage').get(function() {
  if (this.amountRaised === 0) return 0;
  return Math.round(((this.amountWithdrawn + this.pendingWithdrawals) / this.amountRaised) * 100);
});

// Virtual property for days left
campaignSchema.virtual('daysLeft').get(function() {
  const today = new Date();
  const endDate = new Date(this.endDate);
  const timeDiff = endDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff > 0 ? daysDiff : 0;
});

// Set toJSON option to include virtuals
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

// Create text index for efficient searching
campaignSchema.index(
  { 
    title: 'text', 
    shortDescription: 'text', 
    story: 'text',
    category: 'text' 
  }, 
  {
    weights: {
      title: 10,        // Title is most important
      shortDescription: 5, // Short description is next most important
      category: 3,      // Category is somewhat important
      story: 1          // Story content is least important
    },
    name: "campaign_search_index"
  }
);

// Index for category-based filtering (commonly used)
campaignSchema.index({ category: 1, status: 1 });

// Index for sorting by createdAt (commonly used)
campaignSchema.index({ createdAt: -1 });

// Index for tag-based filtering
campaignSchema.index({ tags: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign; 