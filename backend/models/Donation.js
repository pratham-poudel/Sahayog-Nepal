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
    required: [true, 'Donor ID is required']
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
  }
});

module.exports = mongoose.model('Donation', donationSchema);