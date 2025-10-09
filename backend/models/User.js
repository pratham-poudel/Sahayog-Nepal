const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    campaigns: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    }],
    profilePicture: {
        type: String,
        default: '' // Empty string for default (filename only)
    },
    profilePictureUrl: {
        type: String,
        default: '' // Full URL to profile picture (from presigned uploads)
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    notificationSettings: {
        emailUpdates: {
            type: Boolean,
            default: true
        },
        newDonations: {
            type: Boolean,
            default: true
        },
        marketingEmails: {
            type: Boolean,
            default: false
        }
    },
    isPremiumAndVerified: {
        type: Boolean,
        default: false
    },
    personalVerificationDocument: {
        type: String,
        default: '' // URL to citizenship or other verification document
    },
    riskScore: { type: Number, default: 0 },
    kycVerified: { type: Boolean, default: false },
    country: { type: String, default: null }, // For AML country check
    countryCode: { type: String, default: null } // For AML country check

}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Add indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Compound index for campaigns lookup
userSchema.index({ _id: 1, campaigns: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 