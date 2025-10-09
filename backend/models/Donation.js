const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const donationSchema = new Schema({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign ID is required']
  },
  donorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest donations without user ID
  },
  donorName: {
    type: String,
    trim: true,
    maxlength: [100, 'Donor name cannot be more than 100 characters']
  },
  donorEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  donorPhone: {
    type: String,
    trim: true,
    required: [true, 'Phone number is required']
  },
  amount: {
    type: Number,
    required: true, 
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  date: {
    type: Date,
    default: Date.now
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  riskScore: { type: Number, default: 0 },
flags: { type: [String], default: [] }

}, {
  timestamps: true
});

// Indexes for efficient queries
donationSchema.index({ campaignId: 1, date: -1 });
donationSchema.index({ donorId: 1, date: -1 });
donationSchema.index({ campaignId: 1, anonymous: 1, date: -1 });
donationSchema.index({ campaignId: 1, amount: -1 });
donationSchema.index({ date: -1 });
donationSchema.index({ amount: -1 });

// Compound indexes for common aggregation queries
donationSchema.index({ campaignId: 1, donorId: 1 });

module.exports = mongoose.model('Donation', donationSchema);