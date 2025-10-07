const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Donation = require('../models/Donation');
const adminAuth = require('../middleware/adminAuth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { sendVerificationEmail } = require('../utils/SendVerificationEmail');
const { clearCampaignCaches } = require('../utils/cacheUtils');
const { sendAdminOtpEmail } = require('../utils/sendAdminOtpEmail');
const redis = require('../utils/RedisClient');
const { 
    adminLimiter, 
    strictAuthLimiter, 
    exportLimiter 
} = require('../middlewares/advancedRateLimiter');

// Import email abuse monitoring routes
const emailAbuseMonitoring = require('./emailAbuseMonitoring');

// Use email abuse monitoring routes
router.use('/', emailAbuseMonitoring);



// Check if admin is authenticated
router.get('/check-auth', adminAuth, (req, res) => {
    res.json({
        success: true,
        admin: {
            id: req.admin._id,
            username: req.admin.username,
            role: req.admin.role
        }
    });
});

// Step 1: Validate Access Code
router.post('/validate-access-code', strictAuthLimiter, async (req, res) => {
    try {
        const { accessCode } = req.body;
        const VALID_ACCESS_CODE = '250529';
        
        if (!accessCode) {
            return res.status(400).json({
                success: false,
                message: 'Access code is required'
            });
        }
        
        if (accessCode !== VALID_ACCESS_CODE) {
            return res.status(401).json({
                success: false,
                message: 'Invalid access code'
            });
        }
        
        res.json({
            success: true,
            message: 'Access code validated successfully'
        });
    } catch (error) {
        console.error('Access code validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Step 2: Verify Admin Credentials and Send OTP
router.post('/verify-credentials', strictAuthLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        if (!admin.email) {
            return res.status(500).json({
                success: false,
                message: 'Admin email not configured. Please contact system administrator.'
            });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in Redis with 10 minutes expiry
        const otpKey = `admin_otp:${admin._id}`;
        await redis.setex(otpKey, 600, otp); // 10 minutes = 600 seconds
        
        // Send OTP email
        await sendAdminOtpEmail(admin.email, otp);
        
        res.json({
            success: true,
            message: 'OTP sent to admin email',
            adminId: admin._id,
            maskedEmail: admin.email.replace(/(.{2})(.*)(@.*)/, '$1****$3')
        });
    } catch (error) {
        console.error('Credential verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Step 3: Verify OTP and Complete Login
router.post('/verify-otp-login', strictAuthLimiter, async (req, res) => {
    try {
        const { adminId, otp } = req.body;
        
        if (!adminId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID and OTP are required'
            });
        }
        
        // Get stored OTP from Redis
        const otpKey = `admin_otp:${adminId}`;
        const storedOtp = await redis.get(otpKey);
        
        if (!storedOtp) {
            return res.status(401).json({
                success: false,
                message: 'OTP expired or invalid'
            });
        }
        
        if (storedOtp !== otp) {
            return res.status(401).json({
                success: false,
                message: 'Invalid OTP'
            });
        }
        
        // OTP is valid, proceed with login
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate token
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        // Clear OTP from Redis
        await redis.del(otpKey);

        res.json({
            success: true,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { adminId } = req.body;
        
        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID is required'
            });
        }
        
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        if (!admin.email) {
            return res.status(500).json({
                success: false,
                message: 'Admin email not configured'
            });
        }
        
        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store new OTP in Redis with 10 minutes expiry
        const otpKey = `admin_otp:${admin._id}`;
        await redis.setex(otpKey, 600, otp); // 10 minutes = 600 seconds
        
        // Send OTP email
        await sendAdminOtpEmail(admin.email, otp);
        
        res.json({
            success: true,
            message: 'New OTP sent to admin email',
            maskedEmail: admin.email.replace(/(.{2})(.*)(@.*)/, '$1****$3')
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Create admin user with authpass check
router.post('/create-admin', async (req, res) => {
    try {
        // Check if the 'authpass' matches the predefined password
        const { authpass, email } = req.body;
        const predefinedPassword = 'heelothisispassword';  // This should be stored securely in production (like in .env file)
        
        if (authpass !== predefinedPassword) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for admin user'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin user already exists'
            });
        }

        // Create admin user (without manually hashing the password)
        const admin = new Admin({
            username: 'admin',
            email: email,
            password: 'admin123',  // Plaintext password will be hashed in the model's 'pre' hook
            role: 'super_admin'
        });

        await admin.save();

        res.json({
            success: true,
            message: 'Admin user created successfully',
            adminCredentials: {
                username: 'admin',
                email: email,
                password: 'admin123' // Only showing this in development
            }
        });
    } catch (error) {
        console.error('Error occurred during admin creation:', error);  // Log the error
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message // Include the error message for better debugging
        });
    }
});




// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Dont Match'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate token
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({
            success: true,
            message: 'Login successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get pending campaigns
router.get('/campaigns/pending', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  // Default to page 1
        const limit = parseInt(req.query.limit) || 20;  // Default to 20 records per page

        const campaigns = await Campaign.find({ status: 'pending' })
            .populate('creator', 'name email')
            .sort('-createdAt')
            .skip((page - 1) * limit)  // Skip previous pages
            .limit(limit);  // Limit the number of records per page

        res.json({
            success: true,
            data: campaigns,
            pagination: {
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching pending campaigns:', error);  // Log the error
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});


// Get active campaigns
router.get('/campaigns/active', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  // Default to page 1
        const limit = parseInt(req.query.limit) || 20;  // Default to 20 records per page

        const campaigns = await Campaign.find({ status: 'active' })
            .populate('creator', 'name email')
            .sort('-createdAt')
            .skip((page - 1) * limit)  // Skip previous pages
            .limit(limit);  // Limit the number of records per page

        res.json({
            success: true,
            data: campaigns,
            pagination: {
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching active campaigns:', error);  // Log the error
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});


// Get rejected campaigns
router.get('/campaigns/rejected', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  // Default to page 1
        const limit = parseInt(req.query.limit) || 20;  // Default to 20 records per page

        const campaigns = await Campaign.find({ status: { $in: ['rejected', 'cancelled'] } })
            .populate('creator', 'name email')
            .sort('-createdAt')
            .skip((page - 1) * limit)  // Skip previous pages
            .limit(limit);  // Limit the number of records per page

        res.json({
            success: true,
            data: campaigns,
            pagination: {
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching rejected campaigns:', error);  // Log the error
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});


// Helper function to format campaign with image URLs (copied from campaignController)
const fileService = require('../services/fileService');
const formatCampaignWithUrls = (campaign) => {
    const formattedCampaign = { ...campaign };
    
    // Add cover image URL
    if (campaign.coverImage) {
        // Check if it's already a full URL (from presigned uploads)
        if (campaign.coverImage.startsWith('http://') || campaign.coverImage.startsWith('https://')) {
            formattedCampaign.coverImageUrl = campaign.coverImage;
        } else {
            // Legacy filename - add the correct folder prefix
            formattedCampaign.coverImageUrl = fileService.processUploadedFile({
                key: `campaigns/covers/${campaign.coverImage}`,
                originalname: campaign.coverImage
            }).url;
        }
    }
    
    // Add image URLs
    if (campaign.images && campaign.images.length > 0) {
        formattedCampaign.imageUrls = campaign.images.map(image => {
            // Check if it's already a full URL (from presigned uploads)
            if (image.startsWith('http://') || image.startsWith('https://')) {
                return image;
            } else {
                // Legacy filename - add the correct folder prefix
                return fileService.processUploadedFile({
                    key: `campaigns/images/${image}`,
                    originalname: image
                }).url;
            }
        });
    }
    
    // Add creator profile picture URL
    if (campaign.creator && campaign.creator.profilePicture) {
        // Check if it's already a full URL (from presigned uploads)
        if (campaign.creator.profilePicture.startsWith('http://') || campaign.creator.profilePicture.startsWith('https://')) {
            formattedCampaign.creator.profilePictureUrl = campaign.creator.profilePicture;
        } else {
            // Legacy filename - add the correct folder prefix
            formattedCampaign.creator.profilePictureUrl = fileService.processUploadedFile({
                key: `users/profile-pictures/${campaign.creator.profilePicture}`,
                originalname: campaign.creator.profilePicture
            }).url;
        }
    }
    
    return formattedCampaign;
};

// Get campaign details by ID
router.get('/campaigns/:id', adminAuth, async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('creator', 'name email phone')
            .populate('donations');
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Format campaign with proper image URLs
        const formattedCampaign = formatCampaignWithUrls(campaign.toObject());

        res.json({
            success: true,
            data: formattedCampaign
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Approve/Reject/Cancel campaign
router.put('/campaigns/:id/status', adminAuth, async (req, res) => {
    try {
        const { status, reason, tags } = req.body;
        const campaign = await Campaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Check if tags are provided when approving
        if (status === 'active' && (!tags || tags.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Tags are required to approve a campaign'
            });
        }

        campaign.status = status;
        
        if (status === 'rejected' || status === 'cancelled') {
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: `Reason is required for ${status} status`
                });
            }
            campaign.rejectionReason = reason;
        }

        if (status === 'active' && tags && tags.length > 0) {
            campaign.tags = tags;
        }

        // Add status change history
        campaign.statusHistory = campaign.statusHistory || [];
        campaign.statusHistory.push({
            status,
            changedBy: req.admin._id,
            changedAt: new Date(),
            reason: reason || 'Status updated by admin'
        });

        await campaign.save();

        res.json({
            success: true,
            message: `Campaign ${status} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
        // Get all data we need with simple queries instead of aggregation
        const [
            allCampaigns,
            allUsers,
            completedPayments,
            allDonations
        ] = await Promise.all([
            Campaign.find({}),
            User.find({}),
            Payment.find({ status: 'Completed' }),
            Donation.find({})
        ]);

        // Calculate campaign statistics manually
        const campaignStats = {};
        let totalTargetAmount = 0;
        let totalRaisedAmount = 0;
        
        allCampaigns.forEach(campaign => {
            const status = campaign.status || 'unknown';
            if (!campaignStats[status]) {
                campaignStats[status] = { count: 0, totalTargetAmount: 0, totalRaisedAmount: 0 };
            }
            campaignStats[status].count++;
            campaignStats[status].totalTargetAmount += campaign.targetAmount || 0;
            campaignStats[status].totalRaisedAmount += campaign.amountRaised || 0;
            totalTargetAmount += campaign.targetAmount || 0;
            totalRaisedAmount += campaign.amountRaised || 0;
        });

        // Calculate user statistics manually
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newUsersThisMonth = allUsers.filter(user => 
            user.createdAt && user.createdAt >= firstDayOfMonth
        ).length;

        // Calculate payment statistics manually
        let totalPayments = completedPayments.length;
        let totalAmount = 0;
        let totalPlatformFees = 0;
        
        completedPayments.forEach(payment => {
            totalAmount += payment.amount || 0;
            totalPlatformFees += payment.platformFee || 0;
        });
        
        const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

        // Calculate donation statistics manually
        let totalDonations = allDonations.length;
        let totalDonationAmount = 0;
        
        allDonations.forEach(donation => {
            totalDonationAmount += donation.amount || 0;
        });
        
        const averageDonation = totalDonations > 0 ? totalDonationAmount / totalDonations : 0;

        // Calculate monthly revenue manually
        const monthlyRevenue = {};
        const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        
        completedPayments
            .filter(payment => payment.createdAt >= lastYear)
            .forEach(payment => {
                const date = new Date(payment.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyRevenue[monthKey]) {
                    monthlyRevenue[monthKey] = { revenue: 0, transactions: 0, totalAmount: 0 };
                }
                
                monthlyRevenue[monthKey].revenue += payment.platformFee || 0;
                monthlyRevenue[monthKey].transactions += 1;
                monthlyRevenue[monthKey].totalAmount += payment.amount || 0;
            });

        // Convert monthly revenue to array format
        const monthlyRevenueArray = Object.keys(monthlyRevenue)
            .sort()
            .map(monthKey => {
                const [year, month] = monthKey.split('-');
                return {
                    _id: { year: parseInt(year), month: parseInt(month) },
                    ...monthlyRevenue[monthKey]
                };
            });

        // Campaign status distribution
        const campaignStatusDistribution = Object.keys(campaignStats).map(status => ({
            _id: status,
            count: campaignStats[status].count
        }));

        // Recent activity - get latest campaigns with creator info
        const recentCampaigns = await Campaign.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('creator', 'name');

        const recentActivity = recentCampaigns.map(campaign => ({
            _id: campaign._id,
            title: campaign.title,
            status: campaign.status,
            createdAt: campaign.createdAt,
            amountRaised: campaign.amountRaised,
            targetAmount: campaign.targetAmount,
            creator: campaign.creator?.name || 'Unknown'
        }));

        // Format the response
        const stats = {
            campaigns: {
                total: allCampaigns.length,
                pending: campaignStats.pending?.count || 0,
                active: campaignStats.active?.count || 0,
                completed: campaignStats.completed?.count || 0,
                rejected: campaignStats.rejected?.count || 0,
                cancelled: campaignStats.cancelled?.count || 0,
                totalTargetAmount: totalTargetAmount,
                totalRaisedAmount: totalRaisedAmount
            },
            users: {
                total: allUsers.length,
                newThisMonth: newUsersThisMonth
            },
            payments: {
                total: totalPayments,
                totalAmount: totalAmount,
                totalPlatformFees: totalPlatformFees,
                averagePayment: averagePayment
            },
            donations: {
                total: totalDonations,
                totalAmount: totalDonationAmount,
                average: averageDonation
            },
            monthlyRevenue: monthlyRevenueArray,
            campaignStatusDistribution,
            recentActivity
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all campaigns with advanced filtering
router.get('/campaigns', adminAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            category, 
            search, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            startDate,
            endDate
        } = req.query;

        console.log('Admin campaigns query:', req.query);

        const filter = {};
        
        // Add filters only if they have values
        if (status && status.trim()) filter.status = status.trim();
        if (category && category.trim()) filter.category = category.trim();
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                try {
                    filter.createdAt.$gte = new Date(startDate);
                } catch (error) {
                    console.error('Invalid startDate:', startDate);
                }
            }
            if (endDate) {
                try {
                    filter.createdAt.$lte = new Date(endDate);
                } catch (error) {
                    console.error('Invalid endDate:', endDate);
                }
            }
        }
        
        // MongoDB Text Search - more robust search
        if (search && search.trim()) {
            const searchTerm = search.trim();
            console.log('Using MongoDB text search for:', searchTerm);
            filter.$text = { $search: searchTerm };
        }

        console.log('MongoDB filter:', JSON.stringify(filter));

        // Build sort options
        const sortOptions = {};
        
        // If using text search, sort by text score first for relevance
        if (search && search.trim()) {
            sortOptions.score = { $meta: 'textScore' };
        }
        
        // Add secondary sort
        if (sortBy && ['createdAt', 'title', 'status', 'amountRaised', 'targetAmount'].includes(sortBy)) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1; // Default sort
        }

        console.log('Sort options:', sortOptions);

        // Parse pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(Math.max(1, parseInt(limit)), 100);
        const skip = (pageNum - 1) * limitNum;

        console.log('Pagination:', { pageNum, limitNum, skip });

        // Execute query with text search
        try {
            let query = Campaign.find(filter)
                .populate('creator', 'name email phone');

            // Add text score projection if using text search
            if (search && search.trim()) {
                query = query.select({ score: { $meta: 'textScore' } });
            }

            // For queries with text search or small limits, execute directly
            if (search?.trim() || limitNum <= 20) {
                const [campaigns, total] = await Promise.all([
                    query
                        .sort(sortOptions)
                        .limit(limitNum)
                        .skip(skip)
                        .lean(),
                    Campaign.countDocuments(filter)
                ]);

                console.log('Query results:', { campaignsCount: campaigns.length, total });

                res.json({
                    success: true,
                    data: campaigns,
                    pagination: {
                        current: pageNum,
                        pages: Math.ceil(total / limitNum),
                        total,
                        limit: limitNum
                    }
                });
            } else {
                // For large queries without search, use batch fetching to avoid AstraDB limitations
                let allCampaigns = [];
                let hasMore = true;
                let batchCount = 0;
                const maxBatches = Math.ceil(limitNum / 20) + 5;
                
                console.log('Fetching campaigns in batches for large query...');
                
                while (hasMore && batchCount < maxBatches && allCampaigns.length < limitNum + skip) {
                    try {
                        const batch = await Campaign.find(filter)
                            .populate('creator', 'name email phone')
                            .limit(20)
                            .skip(batchCount * 20)
                            .lean();
                        
                        if (batch.length === 0) {
                            hasMore = false;
                        } else {
                            allCampaigns = allCampaigns.concat(batch);
                            batchCount++;
                            
                            if (batch.length < 20) {
                                hasMore = false;
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching batch ${batchCount + 1}:`, error);
                        hasMore = false;
                    }
                }
                
                // Sort in memory
                allCampaigns.sort((a, b) => {
                    let aValue = a[sortBy];
                    let bValue = b[sortBy];
                    
                    if (sortBy === 'createdAt' && aValue && bValue) {
                        aValue = new Date(aValue);
                        bValue = new Date(bValue);
                    }
                    
                    if (aValue == null && bValue == null) return 0;
                    if (aValue == null) return sortOrder === 'desc' ? 1 : -1;
                    if (bValue == null) return sortOrder === 'desc' ? -1 : 1;
                    
                    if (sortOrder === 'desc') {
                        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                    } else {
                        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                    }
                });
                
                // Apply pagination
                const campaigns = allCampaigns.slice(skip, skip + limitNum);
                const total = await Campaign.countDocuments(filter);
                
                console.log('Batch query results:', { campaignsCount: campaigns.length, total });

                res.json({
                    success: true,
                    data: campaigns,
                    pagination: {
                        current: pageNum,
                        pages: Math.ceil(total / limitNum),
                        total,
                        limit: limitNum
                    }
                });
            }
        } catch (queryError) {
            // If text search fails (e.g., index not available), fall back to regex search
            if (search && search.trim() && queryError.message.includes('text')) {
                console.log('Text search failed, falling back to regex search');
                delete filter.$text;
                
                const searchTerm = search.trim();
                filter.$or = [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { shortDescription: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } }
                ];
                
                const [campaigns, total] = await Promise.all([
                    Campaign.find(filter)
                        .populate('creator', 'name email phone')
                        .sort(sortOptions)
                        .limit(limitNum)
                        .skip(skip)
                        .lean(),
                    Campaign.countDocuments(filter)
                ]);

                res.json({
                    success: true,
                    data: campaigns,
                    pagination: {
                        current: pageNum,
                        pages: Math.ceil(total / limitNum),
                        total,
                        limit: limitNum
                    }
                });
            } else {
                throw queryError;
            }
        }
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});// Get all users with filtering
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        const filter = {};
        
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        if (search && search.trim()) {
            // Handle search with in-memory filtering for AstraDB compatibility
            const searchTerm = search.trim().toLowerCase();
            
            // Get all users first
            const allUsers = await User.find({})
                .populate('campaigns', 'title status amountRaised targetAmount')
                .sort(sortOptions)
                .select('-password')
                .lean();
            
            // Filter users in memory based on search term
            const filteredUsers = allUsers.filter(user => {
                const name = (user.name || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                
                return name.includes(searchTerm) || email.includes(searchTerm);
            });
            
            // Apply pagination to filtered results
            const total = filteredUsers.length;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const users = filteredUsers.slice(skip, skip + limitNum);

            res.json({
                success: true,
                data: users,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    limit: limitNum
                }
            });
        } else {
            // Normal query without search
            const users = await User.find(filter)
                .populate('campaigns', 'title status amountRaised targetAmount')
                .sort(sortOptions)
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .select('-password');

            const total = await User.countDocuments(filter);

            res.json({
                success: true,
                data: users,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                }
            });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get user details with campaign and donation history
router.get('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('campaigns')
            .select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }        // Get user's donations (AstraDB requires limit with sort)
        const donations = await Donation.find({ donorId: user._id })
            .populate('campaignId', 'title status')
            .sort('-date')
            .limit(20);

        // Get user's payments (AstraDB requires limit with sort)
        const payments = await Payment.find({ userId: user._id })
            .populate('campaignId', 'title')
            .sort('-createdAt')
            .limit(20);

        // Import required models
        const BankAccount = require('../models/BankAccount');
        const WithdrawalRequest = require('../models/WithdrawalRequest');

        // Get user's bank accounts
        const bankAccounts = await BankAccount.find({ userId: user._id })
            .populate('verifiedBy', 'username')
            .sort({ isPrimary: -1, createdAt: -1 });

        // Map bank accounts with document URLs (already stored as full URLs)
        const bankAccountsWithUrls = bankAccounts.map((account) => {
            const accountObj = account.toObject();
            // documentImage already contains the full URL
            accountObj.documentImageUrl = account.documentImage;
            return accountObj;
        });

        // Get user's withdrawal requests
        const withdrawalRequests = await WithdrawalRequest.find({ creator: user._id })
            .populate('campaign', 'title targetAmount amountRaised')
            .populate('bankAccount')
            .populate('adminResponse.reviewedBy', 'username')
            .populate('processingDetails.processedBy', 'username')
            .sort('-createdAt')
            .limit(50);

        // User's verification document URL (already stored as full URL)
        const verificationDocumentUrl = user.personalVerificationDocument || null;

        const userStats = {
            totalCampaigns: user.campaigns.length,
            totalDonations: donations.length,
            totalDonated: donations.reduce((sum, donation) => sum + donation.amount, 0),
            totalPayments: payments.length,
            totalPaid: payments.filter(p => p.status === 'Completed').reduce((sum, payment) => sum + payment.amount, 0),
            totalBankAccounts: bankAccounts.length,
            verifiedBankAccounts: bankAccounts.filter(acc => acc.verificationStatus === 'verified').length,
            totalWithdrawals: withdrawalRequests.length,
            totalWithdrawn: withdrawalRequests
                .filter(w => w.status === 'completed')
                .reduce((sum, w) => sum + (w.processingDetails?.finalAmount || w.requestedAmount), 0),
            pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending').length
        };

        res.json({
            success: true,
            data: {
                user: {
                    ...user.toObject(),
                    verificationDocumentUrl
                },
                donations,
                payments,
                bankAccounts: bankAccountsWithUrls,
                withdrawalRequests,
                stats: userStats
            }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all payments with filtering
router.get('/payments', adminAuth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            paymentMethod, 
            search, 
            startDate, 
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        
        if (status) filter.status = status;
        if (paymentMethod) filter.paymentMethod = paymentMethod;
          if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        if (search && search.trim()) {
            // Handle search with in-memory filtering for AstraDB compatibility
            const searchTerm = search.trim().toLowerCase();
            
            // Get all payments matching non-search filters first
            const allPayments = await Payment.find(filter)
                .populate('campaignId', 'title status')
                .populate('userId', 'name email')
                .sort(sortOptions)
                .lean();
            
            // Filter payments in memory based on search term
            const filteredPayments = allPayments.filter(payment => {
                const donorEmail = (payment.donorEmail || '').toLowerCase();
                const donorName = (payment.donorName || '').toLowerCase();
                const transactionId = (payment.transactionId || '').toLowerCase();
                const purchaseOrderId = (payment.purchaseOrderId || '').toLowerCase();
                
                return donorEmail.includes(searchTerm) || 
                       donorName.includes(searchTerm) || 
                       transactionId.includes(searchTerm) ||
                       purchaseOrderId.includes(searchTerm);
            });
            
            // Apply pagination to filtered results
            const total = filteredPayments.length;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const payments = filteredPayments.slice(skip, skip + limitNum);

            res.json({
                success: true,
                data: payments,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    limit: limitNum
                }
            });
        } else {
            // Normal query without search
            const payments = await Payment.find(filter)
                .populate('campaignId', 'title status')                .populate('userId', 'name email')
                .sort(sortOptions)
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Payment.countDocuments(filter);

            res.json({
                success: true,
                data: payments,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                    limit: parseInt(limit)
                }
            });        }
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get payment details
router.get('/payments/:id', adminAuth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('campaignId')
            .populate('userId', 'name email phone');
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get campaign financial details
router.get('/campaigns/:id/finances', adminAuth, async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Get all payments for this campaign
        const payments = await Payment.find({ 
            campaignId: req.params.id,
            status: 'Completed'
        });

        // Get all donations for this campaign
        const donations = await Donation.find({ campaignId: req.params.id })
            .populate('donorId', 'name email');

        const financialSummary = {
            totalRaised: campaign.amountRaised,
            targetAmount: campaign.targetAmount,
            totalPayments: payments.length,
            totalDonations: donations.length,
            platformFeesCollected: payments.reduce((sum, payment) => sum + (payment.platformFee || 0), 0),
            averageDonation: donations.length > 0 ? donations.reduce((sum, donation) => sum + donation.amount, 0) / donations.length : 0,
            topDonations: donations.sort((a, b) => b.amount - a.amount).slice(0, 10),
            paymentMethodBreakdown: payments.reduce((acc, payment) => {
                acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
                return acc;
            }, {}),
            monthlyBreakdown: payments.reduce((acc, payment) => {
                const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM format
                if (!acc[month]) {
                    acc[month] = { amount: 0, count: 0, platformFees: 0 };
                }
                acc[month].amount += payment.amount;
                acc[month].count += 1;
                acc[month].platformFees += payment.platformFee || 0;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            data: {
                campaign: {
                    title: campaign.title,
                    status: campaign.status,
                    createdAt: campaign.createdAt
                },
                financialSummary,
                payments,
                donations
            }
        });
    } catch (error) {
        console.error('Error fetching campaign finances:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update campaign featured status
router.put('/campaigns/:id/featured', adminAuth, async (req, res) => {
    try {
        const { featured } = req.body;
        
        const campaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            { featured: Boolean(featured) },
            { new: true }
        );

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        res.json({
            success: true,
            message: `Campaign ${featured ? 'featured' : 'unfeatured'} successfully`,
            data: campaign
        });
    } catch (error) {
        console.error('Error updating featured status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get analytics data
router.get('/analytics/overview', adminAuth, async (req, res) => {
    try {
        const { timeframe = 'month' } = req.query;
        const WithdrawalRequest = require('../models/WithdrawalRequest');
        
        let dateFilter = {};
        let groupByFormat = '';
        const now = new Date();
        
        // Determine date filter and grouping format based on timeframe
        switch (timeframe) {
            case 'day':
                // Last 30 days, group by day
                dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                groupByFormat = 'day';
                break;
            case 'month':
                // Last 12 months, group by month
                dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                groupByFormat = 'month';
                break;
            case 'year':
                // Last 5 years, group by year
                dateFilter = { $gte: new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000) };
                groupByFormat = 'year';
                break;
            default:
                // Default to month
                dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                groupByFormat = 'month';
        }

        const [
            allCampaigns,
            allPayments,
            allUsers,
            allWithdrawals
        ] = await Promise.all([
            Campaign.find({ createdAt: dateFilter }),
            Payment.find({ createdAt: dateFilter, status: 'Completed' }),
            User.find({ createdAt: dateFilter }),
            WithdrawalRequest.find({ 
                createdAt: dateFilter, 
                status: { $in: ['completed', 'approved', 'processing'] }
            })
        ]);

        // Helper function to format date based on grouping
        const formatDateKey = (date) => {
            const d = new Date(date);
            if (groupByFormat === 'day') {
                return d.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (groupByFormat === 'month') {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            } else {
                return `${d.getFullYear()}`; // YYYY
            }
        };

        // Calculate campaign trends manually
        const campaignTrendsMap = {};
        allCampaigns.forEach(campaign => {
            const dateKey = formatDateKey(campaign.createdAt);
            if (!campaignTrendsMap[dateKey]) {
                campaignTrendsMap[dateKey] = { count: 0, totalTarget: 0, totalRaised: 0 };
            }
            campaignTrendsMap[dateKey].count++;
            campaignTrendsMap[dateKey].totalTarget += campaign.targetAmount || 0;
            campaignTrendsMap[dateKey].totalRaised += campaign.amountRaised || 0;
        });

        const campaignTrends = Object.keys(campaignTrendsMap)
            .sort()
            .map(date => ({
                _id: date,
                ...campaignTrendsMap[date]
            }));

        // Calculate payment trends manually
        const paymentTrendsMap = {};
        allPayments.forEach(payment => {
            const dateKey = formatDateKey(payment.createdAt);
            if (!paymentTrendsMap[dateKey]) {
                paymentTrendsMap[dateKey] = { count: 0, amount: 0, platformFees: 0 };
            }
            paymentTrendsMap[dateKey].count++;
            paymentTrendsMap[dateKey].amount += payment.amount || 0;
            paymentTrendsMap[dateKey].platformFees += payment.platformFee || 0;
        });

        const paymentTrends = Object.keys(paymentTrendsMap)
            .sort()
            .map(date => ({
                _id: date,
                ...paymentTrendsMap[date]
            }));

        // Calculate user growth manually
        const userGrowthMap = {};
        allUsers.forEach(user => {
            const dateKey = formatDateKey(user.createdAt);
            if (!userGrowthMap[dateKey]) {
                userGrowthMap[dateKey] = { count: 0 };
            }
            userGrowthMap[dateKey].count++;
        });

        const userGrowth = Object.keys(userGrowthMap)
            .sort()
            .map(date => ({
                _id: date,
                ...userGrowthMap[date]
            }));

        // Calculate withdrawal trends manually
        const withdrawalTrendsMap = {};
        allWithdrawals.forEach(withdrawal => {
            // Use processingDetails.processedAt if completed, otherwise createdAt
            const dateToUse = withdrawal.status === 'completed' && withdrawal.processingDetails?.processedAt
                ? withdrawal.processingDetails.processedAt
                : withdrawal.createdAt;
            
            const dateKey = formatDateKey(dateToUse);
            if (!withdrawalTrendsMap[dateKey]) {
                withdrawalTrendsMap[dateKey] = { count: 0, amount: 0 };
            }
            withdrawalTrendsMap[dateKey].count++;
            withdrawalTrendsMap[dateKey].amount += withdrawal.requestedAmount || 0;
        });

        const withdrawalTrends = Object.keys(withdrawalTrendsMap)
            .sort()
            .map(date => ({
                _id: date,
                ...withdrawalTrendsMap[date]
            }));

        res.json({
            success: true,
            data: {
                campaignTrends,
                paymentTrends,
                userGrowth,
                withdrawalTrends,
                timeframe: groupByFormat
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Bulk campaign actions
router.post('/campaigns/bulk-action', adminAuth, async (req, res) => {
    try {
        const { action, campaignIds, data = {} } = req.body;
        
        if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Campaign IDs are required'
            });
        }

        let updateData = {};
        let message = '';

        switch (action) {
            case 'approve':
                updateData = { status: 'active' };
                message = 'Campaigns approved successfully';
                break;
            case 'reject':
                updateData = { 
                    status: 'rejected',
                    rejectionReason: data.reason || 'Bulk rejection'
                };
                message = 'Campaigns rejected successfully';
                break;
            case 'feature':
                updateData = { featured: true };
                message = 'Campaigns featured successfully';
                break;
            case 'unfeature':
                updateData = { featured: false };
                message = 'Campaigns unfeatured successfully';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }

        const result = await Campaign.updateMany(
            { _id: { $in: campaignIds } },
            updateData
        );

        res.json({
            success: true,
            message,
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Error performing bulk action:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Export data endpoints
router.get('/export/campaigns', adminAuth, exportLimiter, async (req, res) => {
    try {
        const { format = 'json', status } = req.query;
        
        const filter = {};
        if (status) filter.status = status;

        const campaigns = await Campaign.find(filter)
            .populate('creator', 'name email')
            .select('-__v')
            .lean();

        if (format === 'csv') {
            // Convert to CSV format
            const fields = ['title', 'category', 'status', 'targetAmount', 'amountRaised', 'creator.name', 'creator.email', 'createdAt'];
            const csv = campaigns.map(campaign => 
                fields.map(field => {
                    const value = field.includes('.') 
                        ? field.split('.').reduce((obj, key) => obj?.[key], campaign)
                        : campaign[field];
                    return JSON.stringify(value || '');
                }).join(',')
            ).join('\n');
            
            const header = fields.join(',');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=campaigns_${Date.now()}.csv`);
            res.send(header + '\n' + csv);
        } else {
            res.json({
                success: true,
                data: campaigns
            });
        }
    } catch (error) {
        console.error('Error exporting campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Platform settings management
router.get('/settings', adminAuth, async (req, res) => {
    try {
        // This would typically come from a Settings model
        // For now, returning mock settings
        const settings = {
            platformFeePercentage: 5,
            minimumCampaignAmount: 10000,
            maximumCampaignAmount: 10000000,
            featuredCampaignLimit: 10,
            autoApprovalEnabled: false,
            maintenanceMode: false,
            allowAnonymousDonations: true
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Activity logs
router.get('/activity-logs', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        // Get recent campaign status changes
        const recentCampaigns = await Campaign.find({
            'statusHistory.0': { $exists: true }
        })
        .populate('statusHistory.changedBy', 'username')
        .sort('-updatedAt')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

        const activities = recentCampaigns.flatMap(campaign => 
            campaign.statusHistory.map(history => ({
                type: 'campaign_status_change',
                entityId: campaign._id,
                entityTitle: campaign.title,
                action: `Status changed to ${history.status}`,
                performedBy: history.changedBy?.username || 'System',
                timestamp: history.changedAt,
                details: history.reason
            }))
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            data: activities.slice(0, parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});


// Admin campaign tag management
router.put('/campaigns/:id/tags', adminAuth, async (req, res) => {
    try {
        const { tags } = req.body;
        
        if (!Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: 'Tags must be an array'
            });
        }

        const campaign = await Campaign.findById(req.params.id);
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Update tags
        campaign.tags = tags;
        await campaign.save();

        res.json({
            success: true,
            message: 'Campaign tags updated successfully',
            tags: campaign.tags
        });
    } catch (error) {
        console.error('Error updating campaign tags:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Promote user to verified/premium status
router.put('/users/:id/promote', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { sendEmail = true } = req.body;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already verified
        if (user.isPremiumAndVerified) {
            return res.status(400).json({
                success: false,
                message: 'User is already verified and premium'
            });
        }

        // Update user status
        user.isPremiumAndVerified = true;
        await user.save();

        // Clear campaign caches since user verification status affects campaign display
        await clearCampaignCaches();

        // Send verification email if requested
        if (sendEmail) {
            try {
                await sendVerificationEmail(
                    user.email, 
                    user.name, 
                    req.ip || req.connection.remoteAddress
                );
            } catch (emailError) {
                console.error('Error sending verification email:', emailError);
                // Don't fail the promotion if email fails
            }
        }

        res.json({
            success: true,
            message: `User ${user.name} has been successfully promoted to verified premium partner`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isPremiumAndVerified: user.isPremiumAndVerified
            }
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while promoting user'
        });
    }
});

// Remove verified status from user
router.put('/users/:id/demote', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is not verified
        if (!user.isPremiumAndVerified) {
            return res.status(400).json({
                success: false,
                message: 'User is not verified'
            });
        }

        // Update user status
        user.isPremiumAndVerified = false;
        await user.save();

        // Clear campaign caches since user verification status affects campaign display
        await clearCampaignCaches();

        res.json({
            success: true,
            message: `Verified status removed from user ${user.name}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isPremiumAndVerified: user.isPremiumAndVerified
            }
        });
    } catch (error) {
        console.error('Error demoting user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while removing verification'
        });
    }
});

// Admin logout
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;