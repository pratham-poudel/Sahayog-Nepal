const axios = require('axios');
const redis = require('../utils/RedisClient');
const crypto = require('crypto');

/**
 * Secure Turnstile Middleware
 * 
 * This middleware provides secure validation of Cloudflare Turnstile tokens with:
 * - Token reuse prevention (each token can only be used once)
 * - Rate limiting per IP
 * - Token expiry tracking
 * - Proper error handling
 */

// Redis key prefixes for organizing data
const USED_TOKENS_PREFIX = 'turnstile_used:';
const IP_RATE_LIMIT_PREFIX = 'turnstile_ip:';
const VALIDATION_CACHE_PREFIX = 'turnstile_cache:';

// Configuration
const TOKEN_EXPIRY_MINUTES = 10; // How long tokens remain valid
const RATE_LIMIT_WINDOW_MINUTES = 15; // Rate limit window
const MAX_REQUESTS_PER_WINDOW = 10; // Max turnstile requests per IP per window
const USED_TOKEN_CACHE_HOURS = 24; // How long to remember used tokens

/**
 * Validates a Turnstile token with Cloudflare's API
 * @param {string} token - The turnstile response token
 * @param {string} remoteip - The client's IP address
 * @returns {Object} Validation result from Cloudflare
 */
const validateWithCloudflare = async (token, remoteip = null) => {
    try {
        const formData = new URLSearchParams();
        formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
        formData.append('response', token);
        
        if (remoteip) {
            formData.append('remoteip', remoteip);
        }

        const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 10000 // 10 second timeout
        });

        return response.data;
    } catch (error) {
        console.error('Turnstile validation network error:', error.message);
        return { 
            success: false, 
            'error-codes': ['network-error'],
            message: 'Failed to connect to verification service'
        };
    }
};

/**
 * Generates a hash of the token for secure storage
 * @param {string} token - The turnstile token
 * @returns {string} SHA-256 hash of the token
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Checks if an IP has exceeded rate limits
 * @param {string} clientIp - The client's IP address
 * @returns {Object} Rate limit status
 */
const checkRateLimit = async (clientIp) => {
    try {
        const key = `${IP_RATE_LIMIT_PREFIX}${clientIp}`;
        const requests = await redis.get(key);
        const requestCount = requests ? parseInt(requests) : 0;

        if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
            const ttl = await redis.ttl(key);
            return {
                allowed: false,
                remainingTime: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_MINUTES * 60,
                requestCount
            };
        }

        // Increment counter
        const newCount = requestCount + 1;
        if (newCount === 1) {
            // First request, set expiry
            await redis.set(key, newCount, 'EX', RATE_LIMIT_WINDOW_MINUTES * 60);
        } else {
            // Subsequent requests, just increment
            await redis.incr(key);
        }

        return {
            allowed: true,
            requestCount: newCount,
            remainingRequests: MAX_REQUESTS_PER_WINDOW - newCount
        };
    } catch (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request (fail open)
        return { allowed: true, requestCount: 0 };
    }
};

/**
 * Checks if a token has already been used
 * @param {string} tokenHash - Hash of the turnstile token
 * @returns {boolean} True if token was already used
 */
const isTokenUsed = async (tokenHash) => {
    try {
        const key = `${USED_TOKENS_PREFIX}${tokenHash}`;
        const exists = await redis.exists(key);
        return exists === 1;
    } catch (error) {
        console.error('Token usage check error:', error);
        // On error, assume token is not used (fail open)
        return false;
    }
};

/**
 * Marks a token as used
 * @param {string} tokenHash - Hash of the turnstile token
 */
const markTokenAsUsed = async (tokenHash) => {
    try {
        const key = `${USED_TOKENS_PREFIX}${tokenHash}`;
        // Store for 24 hours to prevent reuse
        await redis.set(key, Date.now(), 'EX', USED_TOKEN_CACHE_HOURS * 60 * 60);
    } catch (error) {
        console.error('Failed to mark token as used:', error);
        // This is a critical security feature, but we don't fail the request
        // as Redis might be temporarily unavailable
    }
};

/**
 * Main Turnstile validation middleware
 * Usage: app.use('/protected-route', turnstileMiddleware, routeHandler)
 */
const turnstileMiddleware = async (req, res, next) => {
    try {
        const startTime = Date.now();
        const { turnstileToken } = req.body;
        const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';

        // Log validation attempt
        console.log(`[TURNSTILE] Validation attempt from IP: ${clientIp}, Token present: ${!!turnstileToken}`);

        // Check if token is provided
        if (!turnstileToken) {
            return res.status(400).json({
                success: false,
                message: 'Security verification is required',
                error: 'TURNSTILE_TOKEN_MISSING',
                code: 'MISSING_TOKEN'
            });
        }

        // Validate token format (basic check)
        if (typeof turnstileToken !== 'string' || turnstileToken.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid security verification format',
                error: 'TURNSTILE_TOKEN_INVALID_FORMAT',
                code: 'INVALID_FORMAT'
            });
        }

        // Check rate limits
        const rateLimitResult = await checkRateLimit(clientIp);
        if (!rateLimitResult.allowed) {
            const waitMinutes = Math.ceil(rateLimitResult.remainingTime / 60);
            return res.status(429).json({
                success: false,
                message: `Too many verification attempts. Please wait ${waitMinutes} minutes before trying again.`,
                error: 'RATE_LIMIT_EXCEEDED',
                code: 'RATE_LIMITED',
                retryAfter: rateLimitResult.remainingTime
            });
        }

        // Hash the token for secure storage
        const tokenHash = hashToken(turnstileToken);

        // Check if token was already used
        const wasTokenUsed = await isTokenUsed(tokenHash);
        if (wasTokenUsed) {
            console.log(`[TURNSTILE] Token reuse attempt detected from IP: ${clientIp}`);
            return res.status(400).json({
                success: false,
                message: 'Security verification has expired. Please refresh the page and try again.',
                error: 'TURNSTILE_TOKEN_REUSED',
                code: 'TOKEN_REUSED'
            });
        }

        // Validate with Cloudflare
        console.log(`[TURNSTILE] Validating with Cloudflare API...`);
        const validationResult = await validateWithCloudflare(turnstileToken, clientIp);

        const validationTime = Date.now() - startTime;
        console.log(`[TURNSTILE] Validation completed in ${validationTime}ms, Success: ${validationResult.success}`);

        if (!validationResult.success) {
            const errorCodes = validationResult['error-codes'] || ['unknown-error'];
            console.log(`[TURNSTILE] Validation failed with codes: ${errorCodes.join(', ')}`);
            
            // Map Cloudflare error codes to user-friendly messages
            let userMessage = 'Security verification failed. Please try again.';
            let errorCode = 'VALIDATION_FAILED';

            if (errorCodes.includes('timeout-or-duplicate')) {
                userMessage = 'Security verification has expired. Please refresh the page and try again.';
                errorCode = 'TOKEN_EXPIRED';
            } else if (errorCodes.includes('invalid-input-response')) {
                userMessage = 'Invalid security verification. Please refresh the page and try again.';
                errorCode = 'INVALID_TOKEN';
            } else if (errorCodes.includes('invalid-input-secret')) {
                userMessage = 'Security verification service is temporarily unavailable. Please try again later.';
                errorCode = 'SERVICE_ERROR';
            }

            return res.status(400).json({
                success: false,
                message: userMessage,
                error: 'TURNSTILE_VALIDATION_FAILED',
                code: errorCode,
                cloudflareErrors: errorCodes
            });
        }

        // Mark token as used to prevent reuse
        await markTokenAsUsed(tokenHash);

        // Add validation info to request for potential logging
        req.turnstileValidation = {
            success: true,
            ip: clientIp,
            timestamp: new Date(),
            validationTime,
            rateLimitInfo: {
                requestCount: rateLimitResult.requestCount,
                remainingRequests: rateLimitResult.remainingRequests
            }
        };

        console.log(`[TURNSTILE] Validation successful for IP: ${clientIp}`);
        next();

    } catch (error) {
        console.error(`[TURNSTILE] Middleware error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Security verification service is temporarily unavailable. Please try again later.',
            error: 'TURNSTILE_SERVICE_ERROR',
            code: 'SERVICE_ERROR'
        });
    }
};

/**
 * Optional middleware for routes that need Turnstile but should gracefully degrade
 * If Turnstile fails, the request continues but with reduced privileges
 */
const optionalTurnstileMiddleware = async (req, res, next) => {
    try {
        req.turnstileValidated = false;
        
        if (req.body.turnstileToken) {
            // Try to validate, but don't block on failure
            await turnstileMiddleware(req, res, (error) => {
                if (!error) {
                    req.turnstileValidated = true;
                }
                next();
            });
        } else {
            next();
        }
    } catch (error) {
        // Continue without Turnstile validation
        req.turnstileValidated = false;
        next();
    }
};

module.exports = {
    turnstileMiddleware,
    optionalTurnstileMiddleware,
    validateWithCloudflare,
    checkRateLimit
};