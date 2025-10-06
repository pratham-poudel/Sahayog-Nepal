const rateLimit = require('express-rate-limit');
const redis = require('../utils/RedisClient');

/**
 * Advanced Rate Limiting Strategy for API Protection
 * 
 * Features:
 * - Redis-based distributed rate limiting
 * - Custom key generators for user-based limiting
 * - Tiered rate limits for different endpoint types
 * - Detailed logging for abuse detection
 * - Graceful fallback when Redis is unavailable
 */

// Redis Store Configuration (with fallback to memory)
let redisStore;
try {
    if (redis && redis.status === 'ready') {
        // Use Redis for distributed rate limiting
        const RedisStore = require('rate-limit-redis');
        redisStore = new RedisStore({
            client: redis,
            prefix: 'rl:', // Rate limit prefix
        });
        console.log('✅ Redis-based rate limiting enabled');
    }
} catch (error) {
    console.warn('⚠️ Redis rate limiting unavailable, using memory store:', error.message);
}

// Helper to create custom key generators
const createKeyGenerator = (prefix) => {
    return (req) => {
        // Prioritize authenticated user, then IP
        const userId = req.user?.id || req.user?._id;
        const identifier = userId || req.ip;
        return `${prefix}:${identifier}`;
    };
};

// Log rate limit violations
const logRateLimitViolation = (req, limit) => {
    const userId = req.user?.id || req.user?._id || 'anonymous';
    const endpoint = req.originalUrl || req.url;
    console.warn(`⚠️ RATE LIMIT VIOLATION - User: ${userId}, IP: ${req.ip}, Endpoint: ${endpoint}, Limit: ${limit}`);
};

// ====================
// 1. GLOBAL API LIMITER
// ====================
const globalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per 15 minutes per IP/user
    message: {
        success: false,
        message: 'Too many requests. Please slow down and try again later.',
        retryAfter: 15 * 60,
        errorCode: 'GLOBAL_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('global'),
    handler: (req, res) => {
        logRateLimitViolation(req, '200/15min');
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please slow down and try again later.',
            retryAfter: 15 * 60,
            errorCode: 'GLOBAL_RATE_LIMIT_EXCEEDED'
        });
    }
});

// ====================
// 2. AUTHENTICATION LIMITER (Strict)
// ====================
const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many login attempts. Please wait 15 minutes before trying again.',
        retryAfter: 15 * 60,
        errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    skipSuccessfulRequests: true, // Don't count successful logins
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown';
        return `auth:${req.ip}:${email}`;
    },
    handler: (req, res) => {
        logRateLimitViolation(req, '5/15min-auth');
        res.status(429).json({
            success: false,
            message: 'Too many login attempts. Account temporarily locked for security.',
            retryAfter: 15 * 60,
            errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
        });
    }
});

// ====================
// 3. CAMPAIGN CREATION LIMITER
// ====================
const campaignCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 campaigns per hour per user
    message: {
        success: false,
        message: 'Campaign creation limit reached. Please wait before creating another campaign.',
        retryAfter: 60 * 60,
        errorCode: 'CAMPAIGN_CREATION_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('campaign-create'),
    handler: (req, res) => {
        logRateLimitViolation(req, '3/hour-campaign');
        res.status(429).json({
            success: false,
            message: 'Campaign creation limit reached. Please wait before creating another campaign.',
            retryAfter: 60 * 60,
            errorCode: 'CAMPAIGN_CREATION_LIMIT_EXCEEDED'
        });
    }
});

// ====================
// 4. DONATION/PAYMENT LIMITER
// ====================
const donationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Max 30 donations per hour per user
    message: {
        success: false,
        message: 'Too many donation attempts. Please try again later.',
        retryAfter: 60 * 60,
        errorCode: 'DONATION_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('donation'),
    handler: (req, res) => {
        logRateLimitViolation(req, '30/hour-donation');
        res.status(429).json({
            success: false,
            message: 'Too many donation attempts. Please try again later.',
            retryAfter: 60 * 60,
            errorCode: 'DONATION_RATE_LIMIT_EXCEEDED'
        });
    }
});

// ====================
// 5. WITHDRAWAL REQUEST LIMITER
// ====================
const withdrawalLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // Max 5 withdrawal requests per day per user
    message: {
        success: false,
        message: 'Withdrawal request limit reached. Please try again tomorrow.',
        retryAfter: 24 * 60 * 60,
        errorCode: 'WITHDRAWAL_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('withdrawal'),
    handler: (req, res) => {
        logRateLimitViolation(req, '5/day-withdrawal');
        res.status(429).json({
            success: false,
            message: 'Withdrawal request limit reached. Please try again tomorrow.',
            retryAfter: 24 * 60 * 60,
            errorCode: 'WITHDRAWAL_RATE_LIMIT_EXCEEDED'
        });
    }
});

// ====================
// 6. FILE UPLOAD LIMITER
// ====================
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Max 50 uploads per hour per user
    message: {
        success: false,
        message: 'Upload limit reached. Please try again later.',
        retryAfter: 60 * 60,
        errorCode: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('upload'),
    handler: (req, res) => {
        logRateLimitViolation(req, '50/hour-upload');
        res.status(429).json({
            success: false,
            message: 'Upload limit reached. Please try again later.',
            retryAfter: 60 * 60,
            errorCode: 'UPLOAD_RATE_LIMIT_EXCEEDED'
        });
    }
});

// ====================
// 7. SEARCH/QUERY LIMITER
// ====================
const searchLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Max 100 searches per 10 minutes per user
    message: {
        success: false,
        message: 'Too many search requests. Please try again later.',
        retryAfter: 10 * 60,
        errorCode: 'SEARCH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('search'),
});

// ====================
// 8. ADMIN OPERATIONS LIMITER
// ====================
const adminLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Max 100 admin operations per 5 minutes
    message: {
        success: false,
        message: 'Too many admin operations. Please slow down.',
        retryAfter: 5 * 60,
        errorCode: 'ADMIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('admin'),
});

// ====================
// 9. DATA EXPORT LIMITER
// ====================
const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 exports per hour per user
    message: {
        success: false,
        message: 'Export limit reached. Please try again later.',
        retryAfter: 60 * 60,
        errorCode: 'EXPORT_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('export'),
});

// ====================
// 10. PASSWORD RESET LIMITER
// ====================
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 password reset attempts per hour
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again later.',
        retryAfter: 60 * 60,
        errorCode: 'PASSWORD_RESET_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown';
        return `pwd-reset:${req.ip}:${email}`;
    },
    handler: (req, res) => {
        logRateLimitViolation(req, '3/hour-password-reset');
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts. Please try again later.',
            retryAfter: 60 * 60,
            errorCode: 'PASSWORD_RESET_LIMIT_EXCEEDED'
        });
    }
});

// ====================
// 11. PUBLIC READ LIMITER (Lenient)
// ====================
const publicReadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 300, // Max 300 read requests per 10 minutes per IP
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: 10 * 60,
        errorCode: 'PUBLIC_READ_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: (req) => `public:${req.ip}`,
});

// ====================
// 12. BANK ACCOUNT OPERATIONS LIMITER
// ====================
const bankAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 bank account operations per hour
    message: {
        success: false,
        message: 'Too many bank account operations. Please try again later.',
        retryAfter: 60 * 60,
        errorCode: 'BANK_ACCOUNT_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: createKeyGenerator('bank-account'),
});

module.exports = {
    globalApiLimiter,
    strictAuthLimiter,
    campaignCreationLimiter,
    donationLimiter,
    withdrawalLimiter,
    uploadLimiter,
    searchLimiter,
    adminLimiter,
    exportLimiter,
    passwordResetLimiter,
    publicReadLimiter,
    bankAccountLimiter
};
