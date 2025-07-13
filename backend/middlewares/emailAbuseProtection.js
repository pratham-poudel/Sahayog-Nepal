const redis = require('../utils/RedisClient.js');

/**
 * Advanced Email Abuse Protection Middleware
 * Provides comprehensive protection against email abuse patterns
 */

// Email frequency tracker - prevents rapid successive emails to same address
const emailFrequencyProtection = async (req, res, next) => {
    const email = req.body?.email;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required',
            errorCode: 'EMAIL_REQUIRED'
        });
    }

    const emailKey = `email-freq:${email}`;
    const lastEmailTime = await redis.get(emailKey);
      if (lastEmailTime) {
        const timeDiff = Date.now() - parseInt(lastEmailTime);
        const minInterval = 30 * 1000; // 30 seconds minimum between emails to same address (reduced from 1 minute)
        
        if (timeDiff < minInterval) {
            const remainingTime = Math.ceil((minInterval - timeDiff) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remainingTime} seconds before requesting another email to this address.`,
                retryAfter: remainingTime,
                errorCode: 'EMAIL_FREQUENCY_LIMIT'
            });
        }
    }
    
    // Set the timestamp for this email request
    await redis.set(emailKey, Date.now().toString(), 'EX', 180); // 3 minutes expiry (reduced from 5 minutes)
    next();
};

// OTP attempt tracking - prevents brute force OTP verification
const otpAttemptProtection = async (req, res, next) => {
    const email = req.body?.email;
    
    if (!email) {
        return next();
    }    const attemptKey = `otp-attempts:${email}`;
    const attempts = await redis.get(attemptKey);
    const maxAttempts = 8; // Maximum failed OTP attempts (increased from 5)
    const lockoutTime = 15 * 60; // 15 minutes lockout (reduced from 30 minutes)
    
    if (attempts && parseInt(attempts) >= maxAttempts) {
        return res.status(429).json({
            success: false,
            message: 'Too many failed OTP attempts. Account temporarily locked.',
            retryAfter: lockoutTime,
            errorCode: 'OTP_ATTEMPTS_EXCEEDED'
        });
    }
    
    // Add attempt tracking to request for use in controller
    req.otpAttemptKey = attemptKey;
    req.currentAttempts = attempts ? parseInt(attempts) : 0;
    next();
};

// Suspicious pattern detection
const suspiciousPatternDetection = async (req, res, next) => {
    const ip = req.ip;
    const email = req.body?.email;
    const userAgent = req.get('User-Agent') || '';
    
    // Track suspicious patterns
    const patternKey = `pattern:${ip}`;
    const pattern = await redis.get(patternKey);
    
    let patternData = pattern ? JSON.parse(pattern) : {
        emailsRequested: [],
        timestamps: [],
        userAgents: new Set()
    };
    
    // Convert userAgents back to Set if it was stored as array
    if (Array.isArray(patternData.userAgents)) {
        patternData.userAgents = new Set(patternData.userAgents);
    }
    
    // Add current request data
    patternData.emailsRequested.push(email);
    patternData.timestamps.push(Date.now());
    patternData.userAgents.add(userAgent);
    
    // Keep only last 20 requests for analysis
    if (patternData.emailsRequested.length > 20) {
        patternData.emailsRequested = patternData.emailsRequested.slice(-20);
        patternData.timestamps = patternData.timestamps.slice(-20);
    }
    
    // Detect suspicious patterns
    const now = Date.now();
    const recentRequests = patternData.timestamps.filter(t => now - t < 60 * 60 * 1000); // Last hour
    const uniqueEmails = new Set(patternData.emailsRequested.slice(-10)); // Last 10 requests
      // Pattern 1: Too many requests in short time
    if (recentRequests.length > 25) { // Increased from 15 to 25
        await redis.set(`blocked:${ip}`, 'suspicious_activity', 'EX', 30 * 60); // Block for 30 minutes (reduced from 1 hour)
        return res.status(429).json({
            success: false,
            message: 'Suspicious activity detected. Access temporarily blocked.',
            errorCode: 'SUSPICIOUS_ACTIVITY_DETECTED'
        });
    }
    
    // Pattern 2: Too many different emails from same IP
    if (uniqueEmails.size > 12) { // Increased from 8 to 12
        await redis.set(`blocked:${ip}`, 'email_enumeration', 'EX', 20 * 60); // Block for 20 minutes (reduced from 30 minutes)
        return res.status(429).json({
            success: false,
            message: 'Too many different email addresses. Access temporarily blocked.',
            errorCode: 'EMAIL_ENUMERATION_DETECTED'
        });
    }
    
    // Pattern 3: Multiple user agents (possible bot)
    if (patternData.userAgents.size > 8) { // Increased from 5 to 8
        await redis.set(`blocked:${ip}`, 'multiple_user_agents', 'EX', 30 * 60); // Block for 30 minutes (reduced from 1 hour)
        return res.status(429).json({
            success: false,
            message: 'Suspicious browser behavior detected. Access temporarily blocked.',
            errorCode: 'MULTIPLE_USER_AGENTS_DETECTED'
        });
    }
    
    // Store updated pattern data (convert Set to Array for JSON storage)
    const patternToStore = {
        ...patternData,
        userAgents: Array.from(patternData.userAgents)
    };
    
    await redis.set(patternKey, JSON.stringify(patternToStore), 'EX', 24 * 60 * 60); // 24 hours
    
    next();
};

// Check if IP is blocked
const checkBlockedIP = async (req, res, next) => {
    const ip = req.ip;
    const blocked = await redis.get(`blocked:${ip}`);
    
    if (blocked) {
        const ttl = await redis.ttl(`blocked:${ip}`);
        return res.status(429).json({
            success: false,
            message: 'Your IP address has been temporarily blocked due to suspicious activity.',
            retryAfter: ttl > 0 ? ttl : 3600,
            errorCode: 'IP_BLOCKED',
            reason: blocked
        });
    }
    
    next();
};

// Email domain validation and blacklist
const emailDomainProtection = async (req, res, next) => {
    const email = req.body?.email;
    
    if (!email) {
        return next();
    }
    
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format',
            errorCode: 'INVALID_EMAIL_FORMAT'
        });
    }
    
    // Common disposable email domains blacklist
    const disposableDomains = [
        '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
        'tempmail.org', 'temp-mail.org', 'yopmail.com', 'maildrop.cc',
        'throwaway.email', 'getnada.com', 'tempmail.email'
    ];
    
    if (disposableDomains.includes(domain)) {
        return res.status(400).json({
            success: false,
            message: 'Disposable email addresses are not allowed',
            errorCode: 'DISPOSABLE_EMAIL_NOT_ALLOWED'
        });
    }
    
    // Check for suspicious domain patterns
    if (domain.length < 4 || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email domain',
            errorCode: 'INVALID_EMAIL_DOMAIN'
        });
    }
    
    next();
};

// Track failed OTP verification attempts
const trackFailedOTPAttempt = async (email) => {
    const attemptKey = `otp-attempts:${email}`;
    const current = await redis.get(attemptKey);
    const attempts = current ? parseInt(current) + 1 : 1;
    
    await redis.set(attemptKey, attempts.toString(), 'EX', 15 * 60); // 15 minutes expiry (reduced from 30 minutes)
    
    return attempts;
};

// Clear OTP attempt counter on successful verification
const clearOTPAttempts = async (email) => {
    const attemptKey = `otp-attempts:${email}`;
    await redis.del(attemptKey);
};

// Honeypot field protection
const honeypotProtection = (req, res, next) => {
    // Check for honeypot fields that should be empty
    const honeypotFields = ['username', 'firstname', 'lastname', 'company'];
    
    for (const field of honeypotFields) {
        if (req.body[field] && req.body[field].trim() !== '') {
            // Suspicious bot activity - honeypot field filled
            return res.status(400).json({
                success: false,
                message: 'Invalid request',
                errorCode: 'HONEYPOT_TRIGGERED'
            });
        }
    }
    
    next();
};

// Log email abuse attempts for monitoring
const logEmailAbuse = async (req, type, details) => {
    const logData = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: req.body?.email,
        type: type,
        details: details,
        headers: {
            referer: req.get('Referer'),
            origin: req.get('Origin')
        }
    };
    
    // Store in Redis with a key that can be monitored
    const logKey = `abuse-log:${Date.now()}:${req.ip}`;
    await redis.set(logKey, JSON.stringify(logData), 'EX', 7 * 24 * 60 * 60); // 7 days
    
    // Also log to console for immediate monitoring
    console.warn('[EMAIL ABUSE DETECTED]', logData);
};

module.exports = {
    emailFrequencyProtection,
    otpAttemptProtection,
    suspiciousPatternDetection,
    checkBlockedIP,
    emailDomainProtection,
    trackFailedOTPAttempt,
    clearOTPAttempts,
    honeypotProtection,
    logEmailAbuse
};
