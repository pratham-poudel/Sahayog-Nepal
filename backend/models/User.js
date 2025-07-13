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
    createdAt: {
        type: Date,
        default: Date.now
    },
    profilePicture: {
        type: String,
        default: '' // Empty string for default
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
    }
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

const User = mongoose.model('User', userSchema);

module.exports = User; 