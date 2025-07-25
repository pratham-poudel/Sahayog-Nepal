const User = require('../models/User');
const Payment = require('../models/Payment');
const jwt = require('jsonwebtoken');
const redis = require('../utils/RedisClient');
const { sendOtpEmail } = require('../utils/sendOtpEmail');
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

// @desc    Send email verification OTP
// @route   POST /api/users/send-otp
// @access  Public
exports.sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            await logEmailAbuse(req, 'MISSING_EMAIL', 'Email field missing in OTP request');
            return res.status(400).json({
                success: false,
                message: 'Email is required',
                errorCode: 'EMAIL_REQUIRED'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await logEmailAbuse(req, 'INVALID_EMAIL_FORMAT', `Invalid email format: ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
                errorCode: 'INVALID_EMAIL_FORMAT'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await logEmailAbuse(req, 'EXISTING_USER_OTP_REQUEST', `OTP requested for existing user: ${email}`);
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
                errorCode: 'USER_ALREADY_EXISTS'
            });
        }

        // Check if there's already a pending OTP for this email
        const existingOtp = await redis.get(`otp:${email}`);
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
            ip: req.ip
        };

        console.log('Storing OTP data:', otpData);
        console.log('OTP data as JSON:', JSON.stringify(otpData));

        // Store OTP in Redis with 10 minutes expiry
        await redis.set(`otp:${email}`, JSON.stringify(otpData), 'EX', 60 * 10);
        
        // Verify storage by reading it back
        const verifyStorage = await redis.get(`otp:${email}`);
        console.log('Verified stored data:', verifyStorage);

        // Send OTP email
        await sendOtpEmail(email, otp);

        // Log successful OTP generation
        console.log(`[OTP SENT] Email: ${email}, IP: ${req.ip}, Timestamp: ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent to email successfully',
            expiresIn: 600 // 10 minutes in seconds
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
        const { email, otp, name, phone, password } = req.body;

        // Check if all required fields are provided
        if (!email || !otp || !name || !password) {
            await logEmailAbuse(req, 'INCOMPLETE_VERIFICATION', 'Missing required fields in OTP verification');
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                errorCode: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await logEmailAbuse(req, 'INVALID_EMAIL_VERIFICATION', `Invalid email in verification: ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
                errorCode: 'INVALID_EMAIL_FORMAT'
            });
        }        // Validate OTP format (should be 6 digits)
        if (!/^\d{6}$/.test(otp)) {
            await logEmailAbuse(req, 'INVALID_OTP_FORMAT', `Invalid OTP format: ${otp}`);
            return res.status(400).json({
                success: false,
                message: 'OTP must be a 6-digit number',
                errorCode: 'INVALID_OTP_FORMAT'
            });
        }// Get OTP data from Redis
        const storedOtpData = await redis.get(`otp:${email}`);
        
        console.log('Raw Redis data:', storedOtpData);
        
        if (!storedOtpData) {
            await logEmailAbuse(req, 'EXPIRED_OTP_ATTEMPT', `Attempted verification with expired OTP for: ${email}`);
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
                    ip: req.ip
                };
            }
            
        } catch (error) {
            console.log('JSON parse error:', error.message);
            await logEmailAbuse(req, 'CORRUPTED_OTP_DATA', `Corrupted OTP data for: ${email}`);
            await redis.del(`otp:${email}`); // Clean up corrupted data
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
            const failedAttempts = await trackFailedOTPAttempt(email);
            await logEmailAbuse(req, 'FAILED_OTP_VERIFICATION', `Failed OTP attempt ${failedAttempts} for: ${email}`);
            
            // Ensure attempts is a valid number, default to 0 if undefined/null
            const currentAttempts = Number(otpData.attempts) || 0;
            otpData.attempts = currentAttempts + 1;
            
            console.log('Current attempts:', currentAttempts, 'New attempts:', otpData.attempts);
            
            // Calculate remaining attempts
            const remainingAttempts = Math.max(0, 3 - otpData.attempts);
            
            console.log('Remaining attempts calculated:', remainingAttempts);
            
            // If too many failed attempts, invalidate the OTP
            if (otpData.attempts >= 3) {
                await redis.del(`otp:${email}`);
                return res.status(400).json({
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.',
                    errorCode: 'TOO_MANY_FAILED_ATTEMPTS'
                });
            } else {
                // Update the stored data with new attempt count
                await redis.set(`otp:${email}`, JSON.stringify(otpData), 'EX', 60 * 10);
                return res.status(400).json({
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
                    errorCode: 'INVALID_OTP',
                    attemptsRemaining: remainingAttempts
                });
            }
        }
        
        console.log('OTP verification successful!');

        // Check if user already exists (double-check)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await redis.del(`otp:${email}`); // Clean up OTP
            await logEmailAbuse(req, 'DUPLICATE_USER_CREATION', `Attempted to create duplicate user: ${email}`);
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
                errorCode: 'USER_ALREADY_EXISTS'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            phone
        });

        // Clean up OTP and clear attempt counters
        await redis.del(`otp:${email}`);
        await clearOTPAttempts(email);

        // Generate token
        const token = generateToken(user._id);
        
        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't fail registration if welcome email fails
        }

        // Log successful registration
        console.log(`[USER REGISTERED] Email: ${email}, Name: ${name}, IP: ${req.ip}, Timestamp: ${new Date().toISOString()}`);

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
const validateTurnstileToken = async (token, remoteip = null) => {
    try {
        // Prepare form data for Cloudflare API
        const formData = new URLSearchParams();
        formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAABeptpJznEzP7L6YNrikPDLjnx4');
        formData.append('response', token);
        if (remoteip) {
            formData.append('remoteip', remoteip);
        }

        const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        console.log('Turnstile validation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Turnstile validation error:', error);
        return { success: false, 'error-codes': ['network-error'] };
    }
};

// Updated login function
exports.loginUser = async (req, res) => {
    try {
        const { email, password, turnstileToken } = req.body;
        
        // Validate required fields
        if (!email || !password || !turnstileToken) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and security verification are required'
            });
        }

        // Validate Turnstile token
        const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const turnstileValidation = await validateTurnstileToken(turnstileToken, clientIp);
        
        if (!turnstileValidation.success) {
            console.log('Turnstile validation failed:', turnstileValidation);
            return res.status(400).json({
                success: false,
                message: 'Security verification failed. Please try again.',
                turnstileError: turnstileValidation['error-codes']
            });
        }

        console.log('Turnstile validation successful:', turnstileValidation);

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
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
            const fileService = require('../services/fileService');
            profilePictureUrl = fileService.processUploadedFile({ 
                key: user.profilePicture,
                originalname: user.profilePicture.split('/').pop() 
            }).url;
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
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
exports.sendLoginOtp = async (req, res) => {
    try {
        const { email, turnstileToken } = req.body;

        // Validate required fields
        if (!email || !turnstileToken) {
            return res.status(400).json({
                success: false,
                message: 'Email and Turnstile token are required'
            });
        }

        // Verify Turnstile token
        const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
        });

        const turnstileResult = await turnstileResponse.json();
        
        if (!turnstileResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Turnstile verification failed. Please try again.'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email address'
            });        }        // Generate 6-digit OTP (e.g., 100000 to 999999)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in Redis with 10 minutes expiry
        const otpData = {
            otp: otp,
            email: email,
            timestamp: Date.now(),
            attempts: 0,
            type: 'login'
        };
          await redis.set(`login-otp:${email}`, JSON.stringify(otpData), 'EX', 60 * 10);        // Send OTP email
        await sendLoginWithOtp(email, otp);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your email'
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
        const { email, otp } = req.body;

        // Validate required fields
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }// Find user
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

       

        // Get OTP data from Redis
        const storedOtpData = await redis.get(`login-otp:${email}`);
        
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
            await redis.del(`login-otp:${email}`);
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
                await redis.del(`login-otp:${email}`);
                return res.status(400).json({
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.'
                });
            } else {
                // Update the stored data with new attempt count
                await redis.set(`login-otp:${email}`, JSON.stringify(otpData), 'EX', 60 * 10);
                const remainingAttempts = Math.max(0, 3 - otpData.attempts);
                return res.status(400).json({
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
                });
            }
        }

        // Clear OTP from Redis after successful verification
        await redis.del(`login-otp:${email}`);

        // Generate JWT token
       const token = generateToken(user._id);
        
        // Get profile picture URL if exists
        let profilePictureUrl = '';
        if (user.profilePicture) {
            const fileService = require('../services/fileService');
            profilePictureUrl = fileService.processUploadedFile({ 
                key: user.profilePicture,
                originalname: user.profilePicture.split('/').pop() 
            }).url;
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
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
            const fileService = require('../services/fileService');
            // Add the folder prefix back when generating URL
            const key = `profiles/${user.profilePicture}`;
            profilePictureUrl = fileService.processUploadedFile({ 
                key: key,
                originalname: user.profilePicture
            }).url;
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
        const { name, email, phone, bio } = req.body;
        
        // Find user and update
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, email, phone, bio },
            { new: true, runValidators: true }
        );
        await redis.del(`profile:${req.user._id}`)
        
        // Get the profile picture URL if it exists
        let profilePictureUrl = '';
        if (user.profilePicture) {
            const fileService = require('../services/fileService');
            // Add the folder prefix back when generating URL
            const key = `profiles/${user.profilePicture}`;
            profilePictureUrl = fileService.processUploadedFile({ 
                key: key,
                originalname: user.profilePicture
            }).url;
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
                profilePictureUrl: profilePictureUrl
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
        await redis.del(`profile:${req.user._id}`)
        
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

        // Fetch only Completed donations for the user
        const donations = await Payment.find({ 
            userId, 
            status: 'Completed' 
        })
        .populate('campaignId', '_id title coverImage')
        .select('_id amount currency campaignId donorName donorMessage createdAt');

        console.log(`Found ${donations.length} completed donations for user ${userId}`);

        if (!donations || donations.length === 0) {
            console.log('No completed donations found for userId:', userId);
            return res.status(200).json({
                success: true,
                message: 'No completed donations found for this user',
                donations: []
            });
        }

        res.status(200).json({
            success: true,
            donations
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
