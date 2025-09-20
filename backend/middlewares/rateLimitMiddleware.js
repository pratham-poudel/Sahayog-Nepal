const rateLimit = require('express-rate-limit');

// General API rate limit
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 // 15 minutes
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limit for data-heavy endpoints like top donors
const dataHeavyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests for this resource, please try again later.',
        retryAfter: 10 * 60 // 10 minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Authentication endpoints rate limit
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Payment endpoints rate limit
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 payment requests per hour
    message: {
        success: false,
        message: 'Too many payment requests, please try again later.',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Email rate limiter - Relaxed limits for better user experience
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 email requests per hour (increased from 10)
    message: {
        success: false,
        message: 'Too many email requests. Please try again later to prevent spam.',
        retryAfter: 60 * 60, // 1 hour
        errorCode: 'EMAIL_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP + email combination for more accurate limiting
        const email = req.body?.email || 'unknown';
        return `${req.ip}:${email}`;
    },
    skipFailedRequests: false, // Count failed requests too
    skipSuccessfulRequests: false // Count all requests
});

// OTP specific rate limiter - More reasonable limits for legitimate users
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP+email to 5 OTP requests per 15 minutes (increased from 3)
    message: {
        success: false,
        message: 'Too many OTP requests. Please wait before requesting another OTP.',
        retryAfter: 15 * 60, // 15 minutes
        errorCode: 'OTP_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP + email combination for more accurate limiting
        const email = req.body?.email || 'unknown';
        return `otp:${req.ip}:${email}`;
    },
    skipFailedRequests: false,
    skipSuccessfulRequests: false
});

// OTP resend limiter - More user-friendly resend limits
const otpResendLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes (reduced from 5 minutes)
    max: 3, // 3 resend attempts per 3 minutes per email (increased from 2)
    message: {
        success: false,
        message: 'Too many resend attempts. Please wait before trying to resend OTP.',
        retryAfter: 3 * 60, // 3 minutes
        errorCode: 'OTP_RESEND_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown';
        return `otp-resend:${req.ip}:${email}`;
    },
    skipFailedRequests: false,
    skipSuccessfulRequests: false
});

// Global email abuse prevention - More reasonable daily limits
const dailyEmailLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 100, // Maximum 100 email requests per IP per day (increased from 50)
    message: {
        success: false,
        message: 'Daily email limit exceeded. Please try again tomorrow.',
        retryAfter: 24 * 60 * 60, // 24 hours
        errorCode: 'DAILY_EMAIL_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `daily-email:${req.ip}`,
    skipFailedRequests: false,
    skipSuccessfulRequests: false
});

// Transaction email limiter - For transaction confirmations
const transactionEmailLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 20, // Max 20 transaction emails per 30 minutes per IP
    message: {
        success: false,
        message: 'Too many transaction email requests. Please wait.',
        retryAfter: 30 * 60,
        errorCode: 'TRANSACTION_EMAIL_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `transaction-email:${req.ip}`,
});

// Public profile access limiter - Prevent profile scraping
const publicProfileLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 profile requests per 10 minutes
    message: {
        success: false,
        message: 'Too many profile requests. Please try again later.',
        retryAfter: 10 * 60,
        errorCode: 'PROFILE_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `profile:${req.ip}`,
});

module.exports = {
    generalApiLimiter,
    dataHeavyLimiter,
    authLimiter,
    paymentLimiter,
    emailLimiter,
    otpLimiter,
    otpResendLimiter,
    dailyEmailLimiter,
    transactionEmailLimiter,
    publicProfileLimiter
};
