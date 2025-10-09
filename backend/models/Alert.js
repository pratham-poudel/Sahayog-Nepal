const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  riskScore: { type: Number, required: true },
  indicators: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  reviewed: { type: Boolean, default: false },
  outcome: { type: String, enum: ['reported','dismissed','under_review','none'], default: 'none' },
  reportType: { type: String, enum: ['STR','TTR','none'], default: 'none' },
  metadata: { type: Object, default: {} }
});

alertSchema.index({ riskScore: -1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
