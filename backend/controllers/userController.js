const User = require('../models/User');
const Payment = require('../models/Payment');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const redis = require('../utils/RedisClient');
const { clearCampaignCaches } = require('../utils/cacheUtils');
const { sendOtpEmail } = require('../utils/sendOtpEmail');
const { sendSmsOtp } = require('../utils/sendSmsOtp');
const { sendLoginWithOtp } = require('../utils/sendLoginWithOtp');
const { sendWelcomeEmail } = require('../utils/SendWelcomeEmail');
const { trackFailedOTPAttempt, clearOTPAttempts, logEmailAbuse, emailFrequencyProtection } = require('../middlewares/emailAbuseProtection');
const axios = require('axios');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '2h'
    });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// @desc    Send email or SMS verification OTP
// @route   POST /api/users/send-otp
// @access  Public
exports.sendEmailOtp = async (req, res) => {
    try {
        const { email, phone } = req.body;

        // Validate that at least one identifier is provided
        if (!email && !phone) {
            await logEmailAbuse(req, 'MISSING_IDENTIFIER', 'Neither email nor phone provided in OTP request');
            return res.status(400).json({
                success: false,
                message: 'Please provide either email or phone number',
                errorCode: 'IDENTIFIER_REQUIRED'
            });
        }

        let identifier = email || phone;
        let identifierType = email ? 'email' : 'phone';

        // Validate email format if email is provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await logEmailAbuse(req, 'INVALID_EMAIL_FORMAT', `Invalid email format: ${email}`);
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address',
                    errorCode: 'INVALID_EMAIL_FORMAT'
                });
            }
        }

        // Validate phone format if phone is provided
        if (phone) {
            // Basic phone validation (adjust regex based on your requirements)
            const phoneRegex = /^[0-9]{10,15}$/;
            const cleanPhone = phone.replace(/[\s\-\+]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                await logEmailAbuse(req, 'INVALID_PHONE_FORMAT', `Invalid phone format: ${phone}`);
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid phone number',
                    errorCode: 'INVALID_PHONE_FORMAT'
                });
            }
        }

        // Check if user already exists with this email or phone
        const query = email ? { email } : { phone };
        const existingUser = await User.findOne(query);
        if (existingUser) {
            await logEmailAbuse(req, 'EXISTING_USER_OTP_REQUEST', `OTP requested for existing user: ${identifier}`);
            return res.status(400).json({
                success: false,
                message: `User with this ${identifierType} already exists`,
                errorCode: 'USER_ALREADY_EXISTS'
            });
        }

        // Check if there's already a pending OTP for this identifier
        const existingOtp = await redis.get(`otp:${identifier}`);
        if (existingOtp) {
            const otpData = JSON.parse(existingOtp);
            // If OTP was generated less than 2 minutes ago, prevent resend
            if (otpData.timestamp && (Date.now() - otpData.timestamp) < 2 * 60 * 1000) {
                return res.status(429).json({
                    success: false,
                    message: 'OTP already sent. Please wait 2 minutes before requesting another.',
                    retryAfter: 120,
                    errorCode: 'OTP_RECENTLY_SENT'
                });
            }
        }        // Generate 6-digit OTP (e.g., 100000 to 999999)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
          // Store OTP with timestamp for better tracking
        const otpData = {
            otp: otp,
            timestamp: Date.now(),
            attempts: 0,
            ip: req.ip,
            type: identifierType,
            identifier: identifier
        };

        console.log('Storing OTP data:', otpData);
        console.log('OTP data as JSON:', JSON.stringify(otpData));

        // Store OTP in Redis with 10 minutes expiry
        await redis.set(`otp:${identifier}`, JSON.stringify(otpData), 'EX', 60 * 10);
        
        // Verify storage by reading it back
        const verifyStorage = await redis.get(`otp:${identifier}`);
        console.log('Verified stored data:', verifyStorage);

        // Send OTP via email or SMS based on identifier type
        if (identifierType === 'email') {
            await sendOtpEmail(email, otp);
            console.log(`[EMAIL OTP SENT] Email: ${email}, IP: ${req.ip}, Timestamp: ${new Date().toISOString()}`);
        } else {
            await sendSmsOtp(phone, otp);
            console.log(`[SMS OTP SENT] Phone: ${phone}, IP: ${req.ip}, Timestamp: ${new Date().toISOString()}`);
        }

        res.status(200).json({
            success: true,
            message: `OTP sent to ${identifierType} successfully`,
            expiresIn: 600, // 10 minutes in seconds
            identifierType: identifierType
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        await logEmailAbuse(req, 'OTP_SEND_ERROR', `Error sending OTP: ${error.message}`);
        
        res.status(500).json({
            success: false,
            message: 'Error sending OTP. Please try again later.',
            errorCode: 'OTP_SEND_FAILED'
        });
    }
};

// @desc    Verify OTP and register user
// @route   POST /api/users/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    try {
        const { email, phone, otp, name, password } = req.body;

        // Check if identifier (email or phone) is provided
        if (!email && !phone) {
            await logEmailAbuse(req, 'INCOMPLETE_VERIFICATION', 'Missing identifier in OTP verification');
            return res.status(400).json({
                success: false,
                message: 'Please provide either email or phone number',
                errorCode: 'MISSING_IDENTIFIER'
            });
        }

        // Check if all required fields are provided
        if (!otp || !name || !password) {
            await logEmailAbuse(req, 'INCOMPLETE_VERIFICATION', 'Missing required fields in OTP verification');
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                errorCode: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Validate email format if email is provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await logEmailAbuse(req, 'INVALID_EMAIL_VERIFICATION', `Invalid email in verification: ${email}`);
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address',
                    errorCode: 'INVALID_EMAIL_FORMAT'
                });
            }
        }

        // Validate phone format if phone is provided
        if (phone) {
            const phoneRegex = /^[0-9]{10,15}$/;
            const cleanPhone = phone.replace(/[\s\-\+]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                await logEmailAbuse(req, 'INVALID_PHONE_VERIFICATION', `Invalid phone in verification: ${phone}`);
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid phone number',
                    errorCode: 'INVALID_PHONE_FORMAT'
                });
            }
        }

        // Validate OTP format (should be 6 digits)
        if (!/^\d{6}$/.test(otp)) {
            await logEmailAbuse(req, 'INVALID_OTP_FORMAT', `Invalid OTP format: ${otp}`);
            return res.status(400).json({
                success: false,
                message: 'OTP must be a 6-digit number',
                errorCode: 'INVALID_OTP_FORMAT'
            });
        }

        // Try to find which identifier was used for OTP (check both if both are provided)
        let identifier = null;
        let identifierType = null;
        let storedOtpData = null;

        // First try phone if provided
        if (phone) {
            storedOtpData = await redis.get(`otp:${phone}`);
            if (storedOtpData) {
                identifier = phone;
                identifierType = 'phone';
            }
        }

        // If not found and email is provided, try email
        if (!storedOtpData && email) {
            storedOtpData = await redis.get(`otp:${email}`);
            if (storedOtpData) {
                identifier = email;
                identifierType = 'email';
            }
        }

        console.log('Looking for OTP with identifier:', identifier, 'type:', identifierType);
        console.log('Raw Redis data:', storedOtpData);
        
        if (!storedOtpData) {
            const attemptedIdentifier = phone || email;
            await logEmailAbuse(req, 'EXPIRED_OTP_ATTEMPT', `Attempted verification with expired OTP for: ${attemptedIdentifier}`);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired or does not exist. Please request a new one.',
                errorCode: 'OTP_EXPIRED'
            });
        }

        let otpData;
        try {
            otpData = JSON.parse(storedOtpData);
            console.log('Parsed OTP data:', otpData);
            console.log('OTP data type:', typeof otpData);
            
            // Ensure otpData is an object with the expected structure
            if (typeof otpData !== 'object' || otpData === null) {
                throw new Error('Invalid OTP data structure');
            }
            
            // If otpData is just a string/number (old format), convert it
            if (typeof otpData === 'string' || typeof otpData === 'number') {
                console.log('Converting old format OTP data');
                otpData = {
                    otp: String(otpData),
                    timestamp: Date.now(),
                    attempts: 0,
                    ip: req.ip,
                    type: identifierType,
                    identifier: identifier
                };
            }
            
        } catch (error) {
            console.log('JSON parse error:', error.message);
            await logEmailAbuse(req, 'CORRUPTED_OTP_DATA', `Corrupted OTP data for: ${identifier}`);
            await redis.del(`otp:${identifier}`); // Clean up corrupted data
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP data. Please request a new OTP.',
                errorCode: 'CORRUPTED_OTP_DATA'
            });
        }
        
        // Debug logging
        console.log('OTP Verification Debug:');
        console.log('Received OTP:', otp);
        console.log('Stored OTP:', otpData.otp);
        console.log('OTP Data:', otpData);
        console.log('OTP Match:', otpData.otp === otp);
        console.log('Type check - Received:', typeof otp, 'Stored:', typeof otpData.otp);
          // Check if OTP matches (convert both to strings for comparison)
        const receivedOtp = String(otp).trim();
        const storedOtp = String(otpData.otp).trim();
        
        if (storedOtp !== receivedOtp) {
            console.log('OTP mismatch - Received:', receivedOtp, 'Expected:', storedOtp);
            
            // Track failed attempt
            const failedAttempts = await trackFailedOTPAttempt(identifier);
            await logEmailAbuse(req, 'FAILED_OTP_VERIFICATION', `Failed OTP attempt ${failedAttempts} for: ${identifier}`);
            
            // Ensure attempts is a valid number, default to 0 if undefined/null
            const currentAttempts = Number(otpData.attempts) || 0;
            otpData.attempts = currentAttempts + 1;
            
            console.log('Current attempts:', currentAttempts, 'New attempts:', otpData.attempts);
            
            // Calculate remaining attempts
            const remainingAttempts = Math.max(0, 3 - otpData.attempts);
            
            console.log('Remaining attempts calculated:', remainingAttempts);
            
            // If too many failed attempts, invalidate the OTP
            if (otpData.attempts >= 3) {
                await redis.del(`otp:${identifier}`);
                return res.status(400).json({
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.',
                    errorCode: 'TOO_MANY_FAILED_ATTEMPTS'
                });
            } else {
                // Update the stored data with new attempt count
                await redis.set(`otp:${identifier}`, JSON.stringify(otpData), 'EX', 60 * 10);
                return res.status(400).json({
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
                    errorCode: 'INVALID_OTP',
                    attemptsRemaining: remainingAttempts
                });
            }
        }
        
        console.log('OTP verification successful!');

        // Check if user already exists with the verified identifier (double-check)
        const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };
        const existingUser = await User.findOne(query);
        if (existingUser) {
            await redis.del(`otp:${identifier}`); // Clean up OTP
            await logEmailAbuse(req, 'DUPLICATE_USER_CREATION', `Attempted to create duplicate user: ${identifier}`);
            return res.status(400).json({
                success: false,
                message: `User with this ${identifierType} already exists`,
                errorCode: 'USER_ALREADY_EXISTS'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email: email || undefined, // Only set if provided
            phone: phone || undefined, // Only set if provided
            password
        });

        // Clean up OTP and clear attempt counters
        await redis.del(`otp:${identifier}`);
        await clearOTPAttempts(identifier);

        // Generate token
        const token = generateToken(user._id);
        
        // Send welcome email (only if email is provided)
        if (email) {
            try {
                await sendWelcomeEmail(user.email, user.name);
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Don't fail registration if welcome email fails
            }
        }

        // Log successful registration
        console.log(`[USER REGISTERED] ${identifierType}: ${identifier}, Name: ${name}, IP: ${req.ip}, Timestamp: ${new Date().toISOString()}`);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        await logEmailAbuse(req, 'OTP_VERIFICATION_ERROR', `Error during OTP verification: ${error.message}`);
        
        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            const duplicateValue = error.keyValue[duplicateField];
            
            return res.status(400).json({
                success: false,
                message: `A user with this ${duplicateField} already exists. Please use a different ${duplicateField} or try logging in.`,
                errorCode: 'DUPLICATE_USER',
                field: duplicateField
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP. Please try again later.',
            errorCode: 'VERIFICATION_FAILED'
        });
    }
};


// @desc    Login user
// @route   POST /api/users/login
// @access  Public
// Note: Turnstile validation is now handled by middleware
exports.loginUser = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        
        // Validate that at least one identifier is provided
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Validate password is provided
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        // Build query to find user by email or phone
        const query = email ? { email } : { phone };
        const identifier = email || phone;
        const identifierType = email ? 'email' : 'phone';

        // Check if user exists
        const user = await User.findOne(query).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: `Invalid ${identifierType} or password`
            });
        }

        // Check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id);
        
        // Get profile picture URL if exists
        let profilePictureUrl = '';
        if (user.profilePicture) {
            // Check if it's already a full URL (from presigned uploads)
            if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
                profilePictureUrl = user.profilePicture;
            } else {
                // Legacy filename - process with fileService
                const fileService = require('../services/fileService');
                profilePictureUrl = fileService.processUploadedFile({ 
                    key: user.profilePicture,
                    originalname: user.profilePicture.split('/').pop() 
                }).url;
            }
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profilePicture: user.profilePicture || '',
                profilePictureUrl: profilePictureUrl
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Send OTP for login
// @route   POST /api/users/send-login-otp
// @access  Public
// Note: Turnstile validation is now handled by middleware
exports.sendLoginOtp = async (req, res) => {
    try {
        const { email, phone } = req.body;

        // Validate that at least one identifier is provided
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        const identifier = email || phone;
        const identifierType = email ? 'email' : 'phone';

        // Build query to find user by email or phone
        const query = email ? { email } : { phone };

        // Check if user exists
        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User not found with this ${identifierType}`
            });        }        // Generate 6-digit OTP (e.g., 100000 to 999999)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in Redis with 10 minutes expiry
        const otpData = {
            otp: otp,
            identifier: identifier,
            identifierType: identifierType,
            timestamp: Date.now(),
            attempts: 0,
            type: 'login'
        };
          await redis.set(`login-otp:${identifier}`, JSON.stringify(otpData), 'EX', 60 * 10);        
        
        // Send OTP via email or SMS based on identifier type
        if (identifierType === 'email') {
            await sendLoginWithOtp(email, otp);
        } else {
            await sendSmsOtp(phone, otp);
        }

        res.status(200).json({
            success: true,
            message: `OTP sent successfully to your ${identifierType}`,
            identifierType: identifierType
        });

    } catch (error) {
        console.error('Send login OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending OTP',
            error: error.message
        });
    }
};

// @desc    Login with OTP
// @route   POST /api/users/login-with-otp
// @access  Public
exports.loginWithOtp = async (req, res) => {
    try {
        const { email, phone, otp } = req.body;

        // Validate that at least one identifier is provided
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Validate OTP is provided
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required'
            });
        }

        // Determine identifier and type
        const identifier = email || phone;
        const identifierType = email ? 'email' : 'phone';
        const query = email ? { email } : { phone };

        // Find user
        const user = await User.findOne(query);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User not found with this ${identifierType}`
            });
        }

        // Get OTP data from Redis
        const storedOtpData = await redis.get(`login-otp:${identifier}`);
        
        if (!storedOtpData) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found or OTP has expired. Please request a new OTP.'
            });
        }

        let otpData;
        try {
            otpData = JSON.parse(storedOtpData);
        } catch (error) {
            await redis.del(`login-otp:${identifier}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP data. Please request a new OTP.'
            });
        }

        // Verify OTP
        if (otpData.otp !== otp) {
            // Track failed attempt
            const currentAttempts = Number(otpData.attempts) || 0;
            otpData.attempts = currentAttempts + 1;
            
            // If too many failed attempts, invalidate the OTP
            if (otpData.attempts >= 3) {
                await redis.del(`login-otp:${identifier}`);
                return res.status(400).json({
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.'
                });
            } else {
                // Update the stored data with new attempt count
                await redis.set(`login-otp:${identifier}`, JSON.stringify(otpData), 'EX', 60 * 10);
                const remainingAttempts = Math.max(0, 3 - otpData.attempts);
                return res.status(400).json({
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
                });
            }
        }

        // Clear OTP from Redis after successful verification
        await redis.del(`login-otp:${identifier}`);

        // Generate JWT token
       const token = generateToken(user._id);
        
        // Get profile picture URL if exists
        let profilePictureUrl = '';
        if (user.profilePicture) {
            // Check if it's already a full URL (from presigned uploads)
            if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
                profilePictureUrl = user.profilePicture;
            } else {
                // Legacy filename - process with fileService
                const fileService = require('../services/fileService');
                profilePictureUrl = fileService.processUploadedFile({ 
                    key: user.profilePicture,
                    originalname: user.profilePicture.split('/').pop() 
                }).url;
            }
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profilePicture: user.profilePicture || '',
                profilePictureUrl: profilePictureUrl
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = req.user
        
        
        // Get the profile picture URL if it exists
        let profilePictureUrl = '';
        if (user.profilePicture) {
            // Check if it's already a full URL (from presigned uploads)
            if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
                profilePictureUrl = user.profilePicture;
            } else {
                // Legacy filename - process with fileService
                const fileService = require('../services/fileService');
                // Add the folder prefix back when generating URL (use correct folder structure)
                const key = `users/profile-pictures/${user.profilePicture}`;
                profilePictureUrl = fileService.processUploadedFile({ 
                    key: key,
                    originalname: user.profilePicture
                }).url;
            }
            console.log('PROFILE API - User profile picture:', user.profilePicture);
            console.log('PROFILE API - Generated profilePictureUrl:', profilePictureUrl);
        }
        
        const responseObj = {
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                bio: user.bio || '',
                profilePicture: user.profilePicture || '',
                profilePictureUrl: profilePictureUrl,
                notificationSettings: user.notificationSettings || {
                    emailUpdates: true,
                    newDonations: true,
                    marketingEmails: false
                }
            }
        };
        
        console.log('PROFILE API - Response includes profilePictureUrl:', 
                   responseObj.user.profilePictureUrl ? 'YES' : 'NO');
        
        res.status(200).json(responseObj);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const { name, email, phone, bio, profilePicture, profilePictureUrl, personalVerificationDocument } = req.body;
        
        // Build update object
        const updateData = { name, email, phone, bio };
        
        // Add profile picture fields if provided
        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }
        if (profilePictureUrl) {
            updateData.profilePictureUrl = profilePictureUrl;
        }
        
        // Add personal verification document if provided
        if (personalVerificationDocument) {
            updateData.personalVerificationDocument = personalVerificationDocument;
        }
        
        // Find user and update
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );
        await redis.del(`profile:${req.user._id}`);
        
        // Clear campaign caches since user profile data affects campaign display
        await clearCampaignCaches();
        
        // Get the profile picture URL if it exists
        let responseProfilePictureUrl = '';
        if (user.profilePictureUrl) {
            // Use the stored URL (from presigned uploads)
            responseProfilePictureUrl = user.profilePictureUrl;
        } else if (user.profilePicture) {
            // Check if it's already a full URL (from presigned uploads)
            if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
                responseProfilePictureUrl = user.profilePicture;
            } else {
                // Legacy filename - process with fileService
                const fileService = require('../services/fileService');
                // Add the folder prefix back when generating URL (use correct folder structure)
                const key = `users/profile-pictures/${user.profilePicture}`;
                responseProfilePictureUrl = fileService.processUploadedFile({ 
                    key: key,
                    originalname: user.profilePicture
                }).url;
            }
        }
        
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bio: user.bio,
                role: user.role,
                profilePicture: user.profilePicture,
                profilePictureUrl: responseProfilePictureUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user profile',
            error: error.message
        });
    }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
    try {
        // Import fileService
        const fileService = require('../services/fileService');
        
        // Check if there's a file in the request
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Make sure the file is sent with the field name "profilePicture"'
            });
        }
        
        console.log('Profile upload file:', req.file);
        
        // Get the filename only without the folder path
        const filename = req.fileData?.profilePicture?.[0]?.filename || req.file.key.split('/').pop();
        
        // Process the uploaded file (using full path for MinIO)
        const fileData = fileService.processUploadedFile(req.file);
        
        // Update user with only the filename (not the full path)
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: filename },
            { new: true }
        );
        await redis.del(`profile:${req.user._id}`);
        
        // Clear campaign caches since profile picture affects campaign display
        await clearCampaignCaches();
        
        // Return success response with public URL
        res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profilePicture: user.profilePicture, // Just the filename
                    profilePictureUrl: fileData.url
                },
                file: fileData
            }
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile picture',
            error: error.message
        });
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Find user
        const user = await User.findById(req.user._id).select('+password');
        
        // Check if current password is correct
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        await redis.del(`profile:${req.user._id}`)
        
        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// @desc    Update notification settings
// @route   PUT /api/users/notification-settings
// @access  Private
exports.updateNotificationSettings = async (req, res) => {
    try {
        const { emailUpdates, newDonations, marketingEmails } = req.body;
        
        // Update notification settings
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                notificationSettings: {
                    emailUpdates: emailUpdates ?? true,
                    newDonations: newDonations ?? true,
                    marketingEmails: marketingEmails ?? false
                }
            }
        );
        await redis.del(`profile:${req.user._id}`)
        
        res.status(200).json({
            success: true,
            message: 'Notification settings updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating notification settings',
            error: error.message
        });
    }
}; 

module.exports.getMydonation = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('getMydonation called with userId:', userId);
        
        // Get pagination parameters from query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Use aggregation pipeline for better performance and data enrichment
        const pipeline = [
            {
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId), 
                    status: 'Completed' 
                }
            },
            {
                $lookup: {
                    from: 'campaigns',
                    localField: 'campaignId',
                    foreignField: '_id',
                    as: 'campaignDetails',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                coverImage: 1,
                                category: 1,
                                creator: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    campaignId: {
                        $cond: {
                            if: { $gt: [{ $size: '$campaignDetails' }, 0] },
                            then: {
                                _id: { $arrayElemAt: ['$campaignDetails._id', 0] },
                                title: { $arrayElemAt: ['$campaignDetails.title', 0] },
                                coverImage: { $arrayElemAt: ['$campaignDetails.coverImage', 0] },
                                category: { $arrayElemAt: ['$campaignDetails.category', 0] },
                                creator: { $arrayElemAt: ['$campaignDetails.creator', 0] }
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    amount: 1,
                    currency: 1,
                    campaignId: 1,
                    donorName: 1,
                    donorMessage: 1,
                    createdAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ];
        
        // Count pipeline for total
        const countPipeline = [
            {
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId), 
                    status: 'Completed' 
                }
            },
            {
                $count: 'total'
            }
        ];

        const [donations, countResult] = await Promise.all([
            Payment.aggregate(pipeline),
            Payment.aggregate(countPipeline)
        ]);
        
        const total = countResult.length > 0 ? countResult[0].total : 0;

        console.log(`Found ${donations.length} completed donations for user ${userId} (page ${page} of ${Math.ceil(total / limit)})`);
        console.log('Sample donation data structure:', donations.length > 0 ? donations[0] : 'No donations');

        if (!donations || donations.length === 0) {
            console.log('No completed donations found for userId:', userId);
            return res.status(200).json({
                success: true,
                message: 'No completed donations found for this user',
                donations: [],
                total: 0,
                page: page,
                limit: limit,
                totalPages: 0
            });
        }

        res.status(200).json({
            success: true,
            donations,
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        console.error('Error in getMydonation:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donations',
            error: error.message
        });
    }
};

// @desc    Get public user profile
// @route   GET /api/users/:id/profile
// @access  Public
exports.getPublicUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Find user with selected fields only (security)
        const user = await User.findById(id).select(
            'name email bio profilePicture profilePictureUrl createdAt isPremiumAndVerified'
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's campaign statistics
        const Campaign = require('../models/Campaign');
        const Donation = require('../models/Donation');

        // Get campaign stats efficiently
        const campaignStats = await Campaign.aggregate([
            { $match: { creator: user._id, status: { $ne: 'draft' } } },
            {
                $group: {
                    _id: null,
                    campaignCount: { $sum: 1 },
                    totalRaised: { $sum: '$amountRaised' }
                }
            }
        ]);

        // Get total donation count across all user's campaigns
        const donorStats = await Donation.aggregate([
            {
                $lookup: {
                    from: 'campaigns',
                    localField: 'campaignId', 
                    foreignField: '_id',
                    as: 'campaign'
                }
            },
            { $unwind: '$campaign' },
            { $match: { 'campaign.creator': user._id } },
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 }
                }
            }
        ]);

        const stats = {
            campaignCount: campaignStats[0]?.campaignCount || 0,
            totalRaised: campaignStats[0]?.totalRaised || 0,
            totalDonors: donorStats[0]?.totalDonations || 0
        };

        // Process profile picture URL
        let profilePictureUrl = '';
        if (user.profilePictureUrl) {
            profilePictureUrl = user.profilePictureUrl;
        } else if (user.profilePicture) {
            if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
                profilePictureUrl = user.profilePicture;
            } else {
                const fileService = require('../services/fileService');
                const key = `users/profile-pictures/${user.profilePicture}`;
                profilePictureUrl = fileService.processUploadedFile({ 
                    key: key,
                    originalname: user.profilePicture
                }).url;
            }
        }

        // Prepare user profile response
        const userProfile = {
            _id: user._id,
            name: user.name,
            bio: user.bio || `Passionate about making a difference in the world. Every small step counts towards building a better tomorrow.`,
            profilePicture: user.profilePicture,
            profilePictureUrl: profilePictureUrl,
            createdAt: user.createdAt,
            isPremiumAndVerified: user.isPremiumAndVerified,
            stats
        };

        res.status(200).json({
            success: true,
            user: userProfile
        });

    } catch (error) {
        console.error('Error fetching public user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

// @desc    Get user campaigns with pagination
// @route   GET /api/users/:id/campaigns
// @access  Public
exports.getUserCampaigns = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 50); // Max 50 campaigns per page
        const skip = (page - 1) * limit;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Check if user exists
        const userExists = await User.findById(id);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const Campaign = require('../models/Campaign');

        // Get campaigns with pagination
        const campaigns = await Campaign.find({
            creator: id,
            status: { $ne: 'draft' } // Exclude draft campaigns from public view
        })
        .select('title shortDescription coverImage amountRaised targetAmount donors status createdAt category subcategory endDate')
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(); // Use lean() for better performance

        // Process campaigns to add URLs and calculated fields
        const fileService = require('../services/fileService');
        const processedCampaigns = campaigns.map(campaign => {
            // Process cover image URL
            let thumbnailUrl = '';
            if (campaign.coverImage) {
                if (campaign.coverImage.startsWith('http://') || campaign.coverImage.startsWith('https://')) {
                    thumbnailUrl = campaign.coverImage;
                } else {
                    const key = `campaigns/cover-images/${campaign.coverImage}`;
                    thumbnailUrl = fileService.processUploadedFile({ 
                        key: key,
                        originalname: campaign.coverImage
                    }).url;
                }
            }

            // Calculate progress percentage
            const progress = campaign.targetAmount > 0 
                ? Math.round((campaign.amountRaised / campaign.targetAmount) * 100)
                : 0;

            // Calculate days left
            const today = new Date();
            const endDate = new Date(campaign.endDate);
            const timeDiff = endDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

            return {
                _id: campaign._id,
                title: campaign.title,
                description: campaign.shortDescription,
                coverImage: campaign.coverImage,
                thumbnail: thumbnailUrl,
                thumbnailUrl: thumbnailUrl, // Add this field as well for frontend compatibility
                raised: campaign.amountRaised,
                goal: campaign.targetAmount,
                progress,
                donors: campaign.donors,
                status: campaign.status,
                createdAt: campaign.createdAt,
                category: campaign.category,
                subcategory: campaign.subcategory,
                daysLeft: daysLeft > 0 ? daysLeft : 0
            };
        });

        // Get total count for pagination
        const totalCampaigns = await Campaign.countDocuments({
            creator: id,
            status: { $ne: 'draft' }
        });

        const totalPages = Math.ceil(totalCampaigns / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            success: true,
            campaigns: processedCampaigns,
            pagination: {
                currentPage: page,
                totalPages,
                totalCampaigns,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null
            }
        });

    } catch (error) {
        console.error('Error fetching user campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user campaigns',
            error: error.message
        });
    }
};
