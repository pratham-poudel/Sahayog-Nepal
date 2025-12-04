const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middlewares/cacheMiddleware');

// Import rate limiting middleware
const { 
    emailLimiter, 
    otpLimiter, 
    otpResendLimiter, 
    dailyEmailLimiter,
    publicProfileLimiter 
} = require('../middlewares/rateLimitMiddleware');
// Import stricter rate limiters from advanced rate limiter
const { 
    strictAuthLimiter, 
    passwordResetLimiter 
} = require('../middlewares/advancedRateLimiter');

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
    getMydonation,
    getPublicUserProfile,
    getUserCampaigns,
    sendEmailChangeOtp,
    verifyEmailChangeOtp

} = require('../controllers/userController');
const { protect, checkBanStatus } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.post('/register', strictAuthLimiter, registerUser);
router.post('/login', 
    strictAuthLimiter, 
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
    strictAuthLimiter,
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
    strictAuthLimiter,
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

// Protected routes - Apply ban check to all protected routes
router.get('/profile', protect, checkBanStatus, cacheMiddleware((req) => `profile:${req.user._id}`), getUserProfile);
router.put('/profile', protect, checkBanStatus, updateUserProfile);
router.post('/profile-picture', protect, checkBanStatus, upload.single('profilePicture'), uploadProfilePicture);
router.put('/change-password', protect, checkBanStatus, passwordResetLimiter, changePassword);
router.put('/notification-settings', protect, checkBanStatus, updateNotificationSettings);
router.get('/mydonation/:id', protect, checkBanStatus, getMydonation);

// Email change routes with protection
router.post('/send-email-change-otp', 
    protect, 
    checkBanStatus,
    dailyEmailLimiter,
    emailLimiter,
    otpLimiter,
    checkBlockedIP,
    emailDomainProtection,
    emailFrequencyProtection,
    sendEmailChangeOtp
);
router.post('/verify-email-change-otp', 
    protect, 
    checkBanStatus,
    strictAuthLimiter,
    checkBlockedIP,
    otpAttemptProtection,
    verifyEmailChangeOtp
);

// Public profile routes with rate limiting and caching
router.get('/:id/profile', 
    publicProfileLimiter, 
    cacheMiddleware((req) => `user_profile:${req.params.id}`, 300), 
    getPublicUserProfile
);
router.get('/:id/campaigns', 
    publicProfileLimiter, 
    cacheMiddleware((req) => `user_campaigns:${req.params.id}:page:${req.query.page || 1}`, 300), 
    getUserCampaigns
);

module.exports = router; 


