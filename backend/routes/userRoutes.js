const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middlewares/cacheMiddleware');

// Import rate limiting middleware
const { 
    authLimiter, 
    emailLimiter, 
    otpLimiter, 
    otpResendLimiter, 
    dailyEmailLimiter 
} = require('../middlewares/rateLimitMiddleware');

// Import email abuse protection middleware
const {
    emailFrequencyProtection,
    otpAttemptProtection,
    suspiciousPatternDetection,
    checkBlockedIP,
    emailDomainProtection,
    honeypotProtection
} = require('../middlewares/emailAbuseProtection');

// Import Turnstile middleware for security verification
const { turnstileMiddleware } = require('../middlewares/turnstileMiddleware');

const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile,
    sendEmailOtp,
    verifyOtp,
    sendLoginOtp,
    loginWithOtp,
    uploadProfilePicture,
    changePassword,
    updateNotificationSettings,
    getMydonation

} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.post('/register', authLimiter, registerUser);
router.post('/login', 
    authLimiter, 
    turnstileMiddleware,         // Security verification required for login
    loginUser
);

// OTP Login routes with comprehensive protection
router.post('/send-login-otp', 
    // Apply multiple layers of protection
    dailyEmailLimiter,           // Daily email limit per IP
    emailLimiter,                // General email rate limiting
    otpLimiter,                  // OTP-specific rate limiting
    checkBlockedIP,              // Check if IP is blocked for suspicious activity
    honeypotProtection,          // Bot detection
    emailDomainProtection,       // Validate email domain and block disposable emails
    suspiciousPatternDetection,  // Detect suspicious patterns
    emailFrequencyProtection,    // Prevent rapid emails to same address
    turnstileMiddleware,         // Security verification required for OTP requests
    sendLoginOtp
);

router.post('/login-with-otp', 
    authLimiter,
    checkBlockedIP,
    otpAttemptProtection,        // Track and limit failed OTP attempts
    loginWithOtp
);

// OTP routes with comprehensive protection
router.post('/send-otp', 
    // Apply multiple layers of protection
    dailyEmailLimiter,           // Daily email limit per IP
    emailLimiter,                // General email rate limiting
    otpLimiter,                  // OTP-specific rate limiting
    checkBlockedIP,              // Check if IP is blocked for suspicious activity
    honeypotProtection,          // Bot detection
    emailDomainProtection,       // Validate email domain and block disposable emails
    suspiciousPatternDetection,  // Detect suspicious patterns
    emailFrequencyProtection,    // Prevent rapid emails to same address
    sendEmailOtp
);

// OTP verification with attempt tracking
router.post('/verify-otp', 
    authLimiter,
    checkBlockedIP,
    otpAttemptProtection,        // Track and limit failed OTP attempts
    verifyOtp
);

// Resend OTP with stricter limits
router.post('/resend-otp', 
    dailyEmailLimiter,
    otpResendLimiter,            // Very strict resend limits
    checkBlockedIP,
    emailFrequencyProtection,
    sendEmailOtp
);

// Protected routes
router.get('/profile', protect,cacheMiddleware((req) => `profile:${req.user._id}`), getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);
router.put('/change-password', protect, changePassword);
router.put('/notification-settings', protect, updateNotificationSettings);
router.get('/mydonation/:id', protect, getMydonation);

module.exports = router; 


