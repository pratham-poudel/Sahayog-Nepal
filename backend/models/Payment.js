const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Common payment fields
  amount: {
    type: Number,
    required: true,
    min: 10 // 10 NPR in paisa (minimum amount for Khalti)
  },
  currency: {
    type: String,
    default: 'NPR'
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  donorName: {
    type: String
  },
  donorEmail: {
    type: String,
    required: true
  },
  donorMessage: {
    type: String
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  platformFee: {
    type: Number,
    default: 0
  },
  platformFeePercentage: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Payment method fields
  paymentMethod: {
    type: String,
    enum: ['khalti', 'esewa', 'fonepay', 'card'],
    required: true
  },
  status: {
    type: String,
    enum: ['Initiated', 'Completed', 'Pending', 'Failed', 'Refunded', 'Expired', 'User canceled', 'Partially Refunded'],
    default: 'Initiated'
  },
  pidx: {
    type: String,
    unique: true,
    sparse: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  purchaseOrderId: {
    type: String,
    required: true
  },
  purchaseOrderName: {
    type: String,
    required: true
  },
  paymentUrl: {
    type: String
  },
  refunded: {
    type: Boolean,
    default: false
  },
  fee: {
    type: Number,
    default: 0
  },
  returningData: {
    type: Object
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  
  // Fonepay specific fields
  fonepayTraceId: {
    type: String,
    sparse: true
  },
  fonepayQrCode: {
    type: String
  },
  fonepayDeviceId: {
    type: String
  },
  fonepayWebSocketUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ userId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ campaignId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ purchaseOrderId: 1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 