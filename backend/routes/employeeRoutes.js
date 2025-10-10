const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const BankAccount = require('../models/BankAccount');
const Campaign = require('../models/Campaign');
const { employeeAuth, restrictToDepartment } = require('../middleware/employeeAuth');
const { sendSmsOtp } = require('../utils/sendSmsOtp');
const { sendWithdrawStatusEmail } = require('../utils/SendWithDrawEmail');
const { clearSpecificCampaignCache } = require('../utils/cacheUtils');
const redis = require('../utils/RedisClient');
const { strictAuthLimiter } = require('../middlewares/advancedRateLimiter');

// Step 1: Validate Access Code and Request OTP for Employee Login
router.post('/request-login-otp', strictAuthLimiter, async (req, res) => {
    try {
        const { designationNumber, phone, accessCode } = req.body;

        if (!designationNumber || !phone || !accessCode) {
            return res.status(400).json({
                success: false,
                message: 'Designation number, phone number, and access code are required'
            });
        }

        // Validate access code format (5 digits)
        if (!/^\d{5}$/.test(accessCode)) {
            return res.status(400).json({
                success: false,
                message: 'Access code must be exactly 5 digits'
            });
        }

        // Find employee by designation number and phone
        const employee = await Employee.findOne({ 
            designationNumber: designationNumber.toUpperCase(),
            phone: phone.trim(),
            isActive: true
        }).select('+accessCode');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Invalid credentials. Please check your designation number and phone number.'
            });
        }

        // Verify access code
        const isAccessCodeValid = await employee.compareAccessCode(accessCode);
        
        if (!isAccessCodeValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid access code. Please try again.'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in Redis (expires in 10 minutes)
        const otpKey = `employee_otp:${employee._id}`;
        await redis.setex(otpKey, 600, otp);

        // Send OTP via SMS
        await sendSmsOtp(phone, otp);

        console.log(`[EMPLOYEE OTP] Sent to ${phone} for ${designationNumber}`);

        res.json({
            success: true,
            message: 'Access code verified. OTP sent to your registered phone number',
            employeeId: employee._id,
            department: employee.department
        });

    } catch (error) {
        console.error('Error requesting employee login OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.'
        });
    }
});

// Step 2: Verify OTP and Complete Login
router.post('/verify-otp-login', strictAuthLimiter, async (req, res) => {
    try {
        const { employeeId, otp } = req.body;

        if (!employeeId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and OTP are required'
            });
        }

        // Verify OTP from Redis
        const otpKey = `employee_otp:${employeeId}`;
        const storedOtp = await redis.get(otpKey);

        if (!storedOtp) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or invalid'
            });
        }

        if (storedOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Get employee details
        const employee = await Employee.findById(employeeId);

        if (!employee || !employee.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Employee account not found or inactive'
            });
        }

        // Delete OTP from Redis
        await redis.del(otpKey);

        // Update last login
        employee.lastLogin = new Date();
        await employee.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: employee._id, department: employee.department },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Set cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            path: '/'
        };

        if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
            cookieOptions.domain = process.env.COOKIE_DOMAIN;
        }

        res.cookie('employeeToken', token, cookieOptions);

        res.json({
            success: true,
            message: 'Login successful',
            token: token, // Include token in response for localStorage storage
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                department: employee.department,
                designationNumber: employee.designationNumber,
                statistics: employee.statistics
            }
        });

    } catch (error) {
        console.error('Error verifying employee OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
});

// Check if employee is authenticated
router.get('/check-auth', employeeAuth, (req, res) => {
    res.json({
        success: true,
        employee: {
            id: req.employee._id,
            name: req.employee.name,
            email: req.employee.email,
            department: req.employee.department,
            designationNumber: req.employee.designationNumber,
            statistics: req.employee.statistics
        }
    });
});

// Get current employee (me endpoint)
router.get('/me', employeeAuth, (req, res) => {
    res.json({
        success: true,
        employee: {
            id: req.employee._id,
            name: req.employee.name,
            email: req.employee.email,
            phone: req.employee.phone,
            department: req.employee.department,
            designationNumber: req.employee.designationNumber,
            statistics: req.employee.statistics,
            isActive: req.employee.isActive,
            lastLogin: req.employee.lastLogin
        }
    });
});

// Get employee profile
router.get('/profile', employeeAuth, (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.employee._id,
            name: req.employee.name,
            email: req.employee.email,
            phone: req.employee.phone,
            department: req.employee.department,
            designationNumber: req.employee.designationNumber,
            statistics: req.employee.statistics,
            isActive: req.employee.isActive
        }
    });
});

// Employee logout
router.post('/logout', (req, res) => {
    res.clearCookie('employeeToken', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
});

// ============= USER KYC VERIFIER DEPARTMENT ROUTES =============

// Get users with advanced filtering and search (for KYC verification)
router.get('/kyc/users', 
    employeeAuth, 
    restrictToDepartment('USER_KYC_VERIFIER'),
    async (req, res) => {
        try {
            const { 
                search = '', 
                kycStatus = 'all', // 'verified', 'unverified', 'all'
                page = 1, 
                limit = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const query = {};

            // Build query based on KYC status filter
            if (kycStatus === 'verified') {
                query.kycVerified = true;
            } else if (kycStatus === 'unverified') {
                query.kycVerified = false;
            }

            // Text search if search term provided
            if (search && search.trim()) {
                query.$text = { $search: search.trim() };
            }

            // Build sort object
            const sortOptions = {};
            if (search && search.trim()) {
                sortOptions.score = { $meta: 'textScore' };
            }
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const [users, total] = await Promise.all([
                User.find(query)
                    .select('name email phone profilePictureUrl bio isPremiumAndVerified kycVerified personalVerificationDocument country riskScore kycVerifiedBy kycVerifiedAt kycVerificationNotes createdAt')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                User.countDocuments(query)
            ]);

            res.json({
                success: true,
                users,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    hasMore: skip + users.length < total
                }
            });

        } catch (error) {
            console.error('Error fetching users for KYC:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users'
            });
        }
    }
);

// Get single user details for KYC verification
router.get('/kyc/users/:userId',
    employeeAuth,
    restrictToDepartment('USER_KYC_VERIFIER'),
    async (req, res) => {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId)
                .select('name email phone profilePictureUrl bio isPremiumAndVerified kycVerified personalVerificationDocument country countryCode riskScore kycVerifiedBy kycVerifiedAt kycVerificationNotes campaigns createdAt updatedAt')
                .populate('campaigns', 'title status goalAmount raisedAmount')
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user
            });

        } catch (error) {
            console.error('Error fetching user details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user details'
            });
        }
    }
);

// Verify user KYC and update premium status
router.post('/kyc/verify-user/:userId',
    employeeAuth,
    restrictToDepartment('USER_KYC_VERIFIER'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { isPremiumAndVerified, verificationNotes = '' } = req.body;

            if (typeof isPremiumAndVerified !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'isPremiumAndVerified must be a boolean value'
                });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update user KYC status
            user.kycVerified = true;
            user.isPremiumAndVerified = isPremiumAndVerified;
            user.kycVerifiedBy = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                designationNumber: req.employee.designationNumber
            };
            user.kycVerifiedAt = new Date();
            user.kycVerificationNotes = verificationNotes;

            await user.save();

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalKycVerified': 1 }
            });

            // Send notification email to user
            // TODO: Implement email notification for KYC verification
            console.log(`[KYC VERIFIED] User: ${user.email} by Employee: ${req.employee.designationNumber}`);

            res.json({
                success: true,
                message: 'User KYC verified successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    kycVerified: user.kycVerified,
                    isPremiumAndVerified: user.isPremiumAndVerified
                }
            });

        } catch (error) {
            console.error('Error verifying user KYC:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify user KYC'
            });
        }
    }
);

// Update user KYC status (reject or revoke verification)
router.put('/kyc/update-status/:userId',
    employeeAuth,
    restrictToDepartment('USER_KYC_VERIFIER'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { kycVerified, isPremiumAndVerified, verificationNotes = '' } = req.body;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update fields
            if (typeof kycVerified === 'boolean') {
                user.kycVerified = kycVerified;
            }
            if (typeof isPremiumAndVerified === 'boolean') {
                user.isPremiumAndVerified = isPremiumAndVerified;
            }
            
            user.kycVerifiedBy = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                designationNumber: req.employee.designationNumber
            };
            user.kycVerifiedAt = new Date();
            user.kycVerificationNotes = verificationNotes;

            await user.save();

            res.json({
                success: true,
                message: 'User KYC status updated successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    kycVerified: user.kycVerified,
                    isPremiumAndVerified: user.isPremiumAndVerified
                }
            });

        } catch (error) {
            console.error('Error updating user KYC status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user KYC status'
            });
        }
    }
);

// Get KYC verification statistics for employee dashboard
router.get('/kyc/statistics',
    employeeAuth,
    restrictToDepartment('USER_KYC_VERIFIER'),
    async (req, res) => {
        try {
            const [
                totalUsers,
                verifiedUsers,
                unverifiedUsers,
                premiumUsers,
                myVerifications
            ] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ kycVerified: true }),
                User.countDocuments({ kycVerified: false }),
                User.countDocuments({ isPremiumAndVerified: true }),
                User.countDocuments({ 'kycVerifiedBy.employeeId': req.employee._id })
            ]);

            res.json({
                success: true,
                statistics: {
                    totalUsers,
                    verifiedUsers,
                    unverifiedUsers,
                    premiumUsers,
                    myVerifications,
                    pendingVerifications: unverifiedUsers
                }
            });

        } catch (error) {
            console.error('Error fetching KYC statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    }
);

// ============= CAMPAIGN VERIFIER DEPARTMENT ROUTES =============

// Get campaigns with advanced filtering and search
router.get('/campaigns',
    employeeAuth,
    restrictToDepartment('CAMPAIGN_VERIFIER'),
    async (req, res) => {
        try {
            const {
                search = '',
                status = 'all', // 'pending', 'active', 'rejected', 'completed', 'all'
                category = 'all',
                page = 1,
                limit = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const query = {};

            // Filter by status
            if (status !== 'all') {
                query.status = status;
            }

            // Filter by category
            if (category !== 'all') {
                query.category = category;
            }

            // Text search if search term provided
            if (search && search.trim()) {
                query.$text = { $search: search.trim() };
            }

            // Build sort object
            const sortOptions = {};
            if (search && search.trim()) {
                sortOptions.score = { $meta: 'textScore' };
            }
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const [campaigns, total] = await Promise.all([
                Campaign.find(query)
                    .select('title shortDescription category subcategory tags featured targetAmount amountRaised donors status coverImage lapLetter verificationDocuments creator verifiedBy verificationNotes createdAt endDate')
                    .populate('creator', 'name email phone kycVerified isPremiumAndVerified profilePictureUrl')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Campaign.countDocuments(query)
            ]);

            res.json({
                success: true,
                campaigns,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    hasMore: skip + campaigns.length < total
                }
            });

        } catch (error) {
            console.error('Error fetching campaigns:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch campaigns'
            });
        }
    }
);

// Get single campaign details for verification
router.get('/campaigns/:campaignId',
    employeeAuth,
    restrictToDepartment('CAMPAIGN_VERIFIER'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;

            const campaign = await Campaign.findById(campaignId)
                .populate('creator', 'name email phone kycVerified isPremiumAndVerified profilePictureUrl bio country createdAt')
                .lean();

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found'
                });
            }

            res.json({
                success: true,
                campaign
            });

        } catch (error) {
            console.error('Error fetching campaign details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch campaign details'
            });
        }
    }
);

// Verify and activate campaign (with tags assignment)
router.post('/campaigns/:campaignId/verify',
    employeeAuth,
    restrictToDepartment('CAMPAIGN_VERIFIER'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { tags = [], verificationNotes = '', featured = false } = req.body;

            const campaign = await Campaign.findById(campaignId).populate('creator', 'kycVerified');

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found'
                });
            }

            // Check if campaign creator's KYC is verified
            if (!campaign.creator.kycVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot verify campaign. Creator KYC is not verified. Please ensure the campaign creator completes KYC verification first.'
                });
            }

            // Check if campaign is already verified
            if (campaign.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Campaign is already verified and active'
                });
            }

            // Update campaign status and verification details
            campaign.status = 'active';
            campaign.tags = tags;
            campaign.featured = featured;
            campaign.verificationNotes = verificationNotes;
            campaign.verifiedBy = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                employeeDesignation: req.employee.designationNumber,
                verifiedAt: new Date()
            };

            // Add to status history
            campaign.statusHistory.push({
                status: 'active',
                changedBy: req.employee._id,
                changedAt: new Date(),
                reason: `Campaign verified and activated by ${req.employee.designationNumber}`
            });

            await campaign.save();

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalCampaignsVerified': 1 }
            });

            // TODO: Send notification email to campaign creator
            console.log(`[CAMPAIGN VERIFIED] ID: ${campaign._id} by Employee: ${req.employee.designationNumber}`);

            res.json({
                success: true,
                message: 'Campaign verified and activated successfully',
                campaign: {
                    id: campaign._id,
                    title: campaign.title,
                    status: campaign.status,
                    tags: campaign.tags,
                    featured: campaign.featured
                }
            });

        } catch (error) {
            console.error('Error verifying campaign:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify campaign'
            });
        }
    }
);

// Reject campaign
router.post('/campaigns/:campaignId/reject',
    employeeAuth,
    restrictToDepartment('CAMPAIGN_VERIFIER'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { rejectionReason, verificationNotes = '' } = req.body;

            if (!rejectionReason || !rejectionReason.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found'
                });
            }

            // Update campaign status
            campaign.status = 'rejected';
            campaign.rejectionReason = rejectionReason;
            campaign.verificationNotes = verificationNotes;
            campaign.verifiedBy = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                employeeDesignation: req.employee.designationNumber,
                verifiedAt: new Date()
            };

            // Add to status history
            campaign.statusHistory.push({
                status: 'rejected',
                changedBy: req.employee._id,
                changedAt: new Date(),
                reason: rejectionReason
            });

            await campaign.save();

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalCampaignsRejected': 1 }
            });

            // TODO: Send notification email to campaign creator
            console.log(`[CAMPAIGN REJECTED] ID: ${campaign._id} by Employee: ${req.employee.designationNumber}`);

            res.json({
                success: true,
                message: 'Campaign rejected successfully',
                campaign: {
                    id: campaign._id,
                    title: campaign.title,
                    status: campaign.status,
                    rejectionReason: campaign.rejectionReason
                }
            });

        } catch (error) {
            console.error('Error rejecting campaign:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject campaign'
            });
        }
    }
);

// Mark campaign as completed
router.post('/campaigns/:campaignId/complete',
    employeeAuth,
    restrictToDepartment('CAMPAIGN_VERIFIER'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { verificationNotes = '' } = req.body;

            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found'
                });
            }

            if (campaign.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Only active campaigns can be marked as completed'
                });
            }

            // Update campaign status
            campaign.status = 'completed';
            campaign.verificationNotes = verificationNotes;

            // Add to status history
            campaign.statusHistory.push({
                status: 'completed',
                changedBy: req.employee._id,
                changedAt: new Date(),
                reason: `Campaign marked as completed by ${req.employee.designationNumber}`
            });

            await campaign.save();

            // TODO: Send notification email to campaign creator
            console.log(`[CAMPAIGN COMPLETED] ID: ${campaign._id} by Employee: ${req.employee.designationNumber}`);

            res.json({
                success: true,
                message: 'Campaign marked as completed successfully',
                campaign: {
                    id: campaign._id,
                    title: campaign.title,
                    status: campaign.status
                }
            });

        } catch (error) {
            console.error('Error completing campaign:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark campaign as completed'
            });
        }
    }
);

// Revert campaign from active to pending (for re-verification)
router.post('/campaigns/:campaignId/revert-to-pending',
    employeeAuth,
    restrictToDepartment('CAMPAIGN_VERIFIER'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { reason, verificationNotes = '' } = req.body;

            if (!reason || !reason.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Reason for reversion is required'
                });
            }

            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found'
                });
            }

            if (campaign.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Only active campaigns can be reverted to pending'
                });
            }

            // Store previous verification info
            const previousVerification = campaign.verifiedBy ? { ...campaign.verifiedBy } : null;

            // Update campaign status
            campaign.status = 'pending';
            campaign.verificationNotes = verificationNotes;
            
            // Clear featured status and tags when reverting
            campaign.featured = false;
            campaign.tags = [];

            // Add to status history
            campaign.statusHistory.push({
                status: 'pending',
                changedBy: req.employee._id,
                changedAt: new Date(),
                reason: `Reverted to pending for re-verification by ${req.employee.designationNumber}. Reason: ${reason}`
            });

            await campaign.save();

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalCampaignsReverted': 1 }
            });

            // Log the reversion
            console.log(`[CAMPAIGN REVERTED] ID: ${campaign._id} from ACTIVE to PENDING by Employee: ${req.employee.designationNumber}`);
            console.log(`Reversion Reason: ${reason}`);

            res.json({
                success: true,
                message: 'Campaign reverted to pending status successfully',
                campaign: {
                    id: campaign._id,
                    title: campaign.title,
                    status: campaign.status,
                    previousVerification
                }
            });

        } catch (error) {
            console.error('Error reverting campaign:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to revert campaign to pending'
            });
        }
    }
);

// Get campaign verification statistics
router.get('/campaigns/stats/overview',
    employeeAuth,
    restrictToDepartment('CAMPAIGN_VERIFIER'),
    async (req, res) => {
        try {
            const [
                totalCampaigns,
                pendingCampaigns,
                activeCampaigns,
                rejectedCampaigns,
                completedCampaigns,
                featuredCampaigns,
                myVerifications
            ] = await Promise.all([
                Campaign.countDocuments(),
                Campaign.countDocuments({ status: 'pending' }),
                Campaign.countDocuments({ status: 'active' }),
                Campaign.countDocuments({ status: 'rejected' }),
                Campaign.countDocuments({ status: 'completed' }),
                Campaign.countDocuments({ featured: true }),
                Campaign.countDocuments({ 'verifiedBy.employeeId': req.employee._id })
            ]);

            res.json({
                success: true,
                statistics: {
                    totalCampaigns,
                    pendingCampaigns,
                    activeCampaigns,
                    rejectedCampaigns,
                    completedCampaigns,
                    featuredCampaigns,
                    myVerifications
                }
            });

        } catch (error) {
            console.error('Error fetching campaign statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    }
);

// ============================================
// WITHDRAWAL DEPARTMENT ROUTES (WITHDRAWAL PROCESSOR)
// ============================================

/**
 * Get all withdrawal requests with comprehensive filtering
 * Department: WITHDRAWAL_DEPARTMENT
 * 
 * Query Parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 20)
 * - status: Filter by status (pending, approved, rejected)
 * - search: Search in campaign title, creator name/email/phone, bank details
 * - startDate: Filter requests from this date
 * - endDate: Filter requests until this date
 * - sortBy: Sort by field (default: createdAt)
 * - sortOrder: asc or desc (default: desc)
 */
router.get(
    '/withdrawals',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                search,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const query = {};

            // Status filter
            if (status) {
                query.status = status;
            }

            // Date range filter
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query with population
            const withdrawals = await WithdrawalRequest.find(query)
                .populate({
                    path: 'campaign',
                    select: 'title slug coverImage creator targetAmount amountRaised amountWithdrawn category status'
                })
                .populate({
                    path: 'creator',
                    select: 'name email phone profilePicture kycVerified kycDetails'
                })
                .populate({
                    path: 'bankAccount',
                    select: 'bankName accountNumber accountName associatedPhoneNumber documentType documentNumber verificationStatus documentImage isActive'
                })
                .populate('employeeProcessedBy.employeeId', 'name designationNumber department')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean();

            // Apply search filter (in-memory for better matching)
            let filteredWithdrawals = withdrawals;
            if (search && search.trim()) {
                const searchTerm = search.trim().toLowerCase();
                filteredWithdrawals = withdrawals.filter(withdrawal => {
                    return (
                        withdrawal.campaign?.title?.toLowerCase().includes(searchTerm) ||
                        withdrawal.creator?.name?.toLowerCase().includes(searchTerm) ||
                        withdrawal.creator?.email?.toLowerCase().includes(searchTerm) ||
                        withdrawal.creator?.phone?.includes(searchTerm) ||
                        withdrawal.bankAccount?.bankName?.toLowerCase().includes(searchTerm) ||
                        withdrawal.bankAccount?.accountNumber?.includes(searchTerm) ||
                        withdrawal.bankAccount?.accountName?.toLowerCase().includes(searchTerm)
                    );
                });
            }

            // Get total count
            const total = await WithdrawalRequest.countDocuments(query);

            res.json({
                success: true,
                data: filteredWithdrawals,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / limit),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: page * limit < total
                }
            });

        } catch (error) {
            console.error('Error fetching withdrawal requests:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch withdrawal requests'
            });
        }
    }
);

/**
 * Get detailed withdrawal request information
 * Department: WITHDRAWAL_DEPARTMENT
 */
router.get(
    '/withdrawals/:id',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;

            const withdrawal = await WithdrawalRequest.findById(id)
                .populate({
                    path: 'campaign',
                    select: 'title slug description coverImage images creator targetAmount amountRaised amountWithdrawn category tags featured status createdAt'
                })
                .populate({
                    path: 'creator',
                    select: 'name email phone bio profilePicture kycVerified kycDetails createdAt'
                })
                .populate({
                    path: 'bankAccount',
                    select: 'bankName accountNumber accountName ifscCode accountType associatedPhoneNumber documentType documentNumber verificationStatus verificationDate documentImage isPrimary isActive'
                })
                .populate('employeeProcessedBy.employeeId', 'name email designationNumber department')
                .populate('adminResponse.reviewedBy', 'username email')
                .populate('processingDetails.processedBy', 'username email')
                .lean();

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Withdrawal request not found'
                });
            }

            res.json({
                success: true,
                data: withdrawal
            });

        } catch (error) {
            console.error('Error fetching withdrawal details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch withdrawal details'
            });
        }
    }
);

/**
 * Approve withdrawal request
 * Department: WITHDRAWAL_DEPARTMENT
 * 
 * Body:
 * - notes: Optional notes for approval
 */
router.post(
    '/withdrawals/:id/approve',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { notes } = req.body;

            // Find withdrawal request
            const withdrawal = await WithdrawalRequest.findById(id)
                .populate('campaign', 'title amountRaised amountWithdrawn')
                .populate('creator', 'name email');

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Withdrawal request not found'
                });
            }

            // Verify status is pending
            if (withdrawal.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot approve withdrawal with status: ${withdrawal.status}. Only pending requests can be approved.`
                });
            }

            // Check if already processed by an employee
            if (withdrawal.employeeProcessedBy && withdrawal.employeeProcessedBy.employeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'This withdrawal has already been processed by an employee'
                });
            }

            // Update withdrawal with employee approval
            withdrawal.status = 'approved';
            withdrawal.employeeProcessedBy = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                employeeDesignation: req.employee.designationNumber,
                processedAt: new Date(),
                action: 'approved',
                notes: notes || ''
            };

            // Save with validateModifiedOnly to skip bankAccount validation since we're not changing it
            await withdrawal.save({ validateModifiedOnly: true });

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalWithdrawalsApproved': 1 }
            });

            // Log the approval
            console.log(`[WITHDRAWAL APPROVED] ID: ${withdrawal._id} by Employee: ${req.employee.designationNumber}`);

            res.json({
                success: true,
                message: 'Withdrawal request approved successfully',
                data: withdrawal
            });

        } catch (error) {
            console.error('Error approving withdrawal:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve withdrawal request'
            });
        }
    }
);

/**
 * Reject withdrawal request
 * Department: WITHDRAWAL_DEPARTMENT
 * 
 * Body:
 * - reason: Required reason for rejection
 */
router.post(
    '/withdrawals/:id/reject',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Validate reason
            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            if (reason.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason must be at least 10 characters long'
                });
            }

            // Find withdrawal request
            const withdrawal = await WithdrawalRequest.findById(id)
                .populate('campaign', 'title amountRaised amountWithdrawn')
                .populate('creator', 'name email');

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Withdrawal request not found'
                });
            }

            // Verify status is pending
            if (withdrawal.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot reject withdrawal with status: ${withdrawal.status}. Only pending requests can be rejected.`
                });
            }

            // Check if already processed by an employee
            if (withdrawal.employeeProcessedBy && withdrawal.employeeProcessedBy.employeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'This withdrawal has already been processed by an employee'
                });
            }

            // Update withdrawal with employee rejection
            withdrawal.status = 'rejected';
            withdrawal.employeeProcessedBy = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                employeeDesignation: req.employee.designationNumber,
                processedAt: new Date(),
                action: 'rejected',
                notes: reason.trim()
            };

            // Save with validateModifiedOnly to skip bankAccount validation since we're not changing it
            await withdrawal.save({ validateModifiedOnly: true });

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalWithdrawalsRejected': 1 }
            });

            // Log the rejection
            console.log(`[WITHDRAWAL REJECTED] ID: ${withdrawal._id} by Employee: ${req.employee.designationNumber}`);
            console.log(`Rejection Reason: ${reason}`);

            res.json({
                success: true,
                message: 'Withdrawal request rejected successfully',
                data: withdrawal
            });

        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject withdrawal request'
            });
        }
    }
);

/**
 * Get withdrawal statistics overview
 * Department: WITHDRAWAL_DEPARTMENT
 */
router.get(
    '/withdrawals-stats/overview',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            // Get total counts by status
            const totalPending = await WithdrawalRequest.countDocuments({ status: 'pending' });
            const totalApproved = await WithdrawalRequest.countDocuments({ status: 'approved' });
            const totalRejected = await WithdrawalRequest.countDocuments({ status: 'rejected' });
            const totalProcessing = await WithdrawalRequest.countDocuments({ status: 'processing' });
            const totalCompleted = await WithdrawalRequest.countDocuments({ status: 'completed' });
            const totalFailed = await WithdrawalRequest.countDocuments({ status: 'failed' });

            // Get total amounts by status
            const pendingRequests = await WithdrawalRequest.find({ status: 'pending' }).select('requestedAmount');
            const approvedRequests = await WithdrawalRequest.find({ status: 'approved' }).select('requestedAmount');
            const rejectedRequests = await WithdrawalRequest.find({ status: 'rejected' }).select('requestedAmount');
            const processingRequests = await WithdrawalRequest.find({ status: 'processing' }).select('requestedAmount');
            const completedRequests = await WithdrawalRequest.find({ status: 'completed' }).select('requestedAmount');

            const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalApprovedAmount = approvedRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalRejectedAmount = rejectedRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalProcessingAmount = processingRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalCompletedAmount = completedRequests.reduce((sum, req) => sum + req.requestedAmount, 0);

            // Get employee's personal statistics
            const myApprovals = await WithdrawalRequest.countDocuments({
                'employeeProcessedBy.employeeId': req.employee._id,
                'employeeProcessedBy.action': 'approved'
            });

            const myRejections = await WithdrawalRequest.countDocuments({
                'employeeProcessedBy.employeeId': req.employee._id,
                'employeeProcessedBy.action': 'rejected'
            });

            // Get recent activity (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentRequests = await WithdrawalRequest.countDocuments({
                createdAt: { $gte: yesterday }
            });

            const recentApprovals = await WithdrawalRequest.countDocuments({
                'employeeProcessedBy.processedAt': { $gte: yesterday },
                'employeeProcessedBy.action': 'approved'
            });

            res.json({
                success: true,
                statistics: {
                    total: totalPending + totalApproved + totalRejected + totalProcessing + totalCompleted + totalFailed,
                    pending: {
                        count: totalPending,
                        amount: totalPendingAmount
                    },
                    approved: {
                        count: totalApproved,
                        amount: totalApprovedAmount
                    },
                    rejected: {
                        count: totalRejected,
                        amount: totalRejectedAmount
                    },
                    processing: {
                        count: totalProcessing,
                        amount: totalProcessingAmount
                    },
                    completed: {
                        count: totalCompleted,
                        amount: totalCompletedAmount
                    },
                    failed: {
                        count: totalFailed
                    },
                    myActivity: {
                        totalApprovals: myApprovals,
                        totalRejections: myRejections,
                        totalProcessed: myApprovals + myRejections
                    },
                    recentActivity: {
                        newRequests24h: recentRequests,
                        approvals24h: recentApprovals
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching withdrawal statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    }
);

// ============================================
// BANK ACCOUNT VERIFICATION ROUTES (WITHDRAWAL DEPARTMENT)
// ============================================

/**
 * Get all bank accounts for verification
 * Department: WITHDRAWAL_DEPARTMENT
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - status: Filter by verification status (pending, verified, rejected)
 * - search: Search in bank name, account number, account name, user details
 * - sortBy: Sort by field (default: createdAt)
 * - sortOrder: asc or desc (default: desc)
 */
router.get(
    '/bank-accounts',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const query = { isActive: true };

            // Status filter
            if (status) {
                query.verificationStatus = status;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query with population
            const bankAccounts = await BankAccount.find(query)
                .populate({
                    path: 'userId',
                    select: 'name email phone country countryCode profilePictureUrl kycVerified isPremiumAndVerified personalVerificationDocument'
                })
                .populate('verifiedBy', 'username email')
                .populate('lastModifiedBy', 'name email')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean();

            // Rename userId to user for frontend consistency
            bankAccounts.forEach(account => {
                if (account.userId) {
                    account.user = account.userId;
                    delete account.userId;
                }
            });

            // Apply search filter (in-memory for better matching)
            let filteredAccounts = bankAccounts;
            if (search && search.trim()) {
                const searchTerm = search.trim().toLowerCase();
                filteredAccounts = bankAccounts.filter(account => {
                    return (
                        account.bankName?.toLowerCase().includes(searchTerm) ||
                        account.accountNumber?.includes(searchTerm) ||
                        account.accountName?.toLowerCase().includes(searchTerm) ||
                        account.user?.name?.toLowerCase().includes(searchTerm) ||
                        account.user?.email?.toLowerCase().includes(searchTerm) ||
                        account.user?.phone?.includes(searchTerm)
                    );
                });
            }

            // Get total count
            const total = await BankAccount.countDocuments(query);

            res.json({
                success: true,
                data: filteredAccounts,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / limit),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: page * limit < total
                }
            });

        } catch (error) {
            console.error('Error fetching bank accounts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch bank accounts'
            });
        }
    }
);

/**
 * Get detailed bank account information
 * Department: WITHDRAWAL_DEPARTMENT
 */
router.get(
    '/bank-accounts/:id',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;

            const bankAccount = await BankAccount.findById(id)
                .populate({
                    path: 'userId',
                    select: 'name email phone country countryCode bio profilePictureUrl kycVerified isPremiumAndVerified personalVerificationDocument kycVerifiedBy kycVerifiedAt createdAt'
                })
                .populate('verifiedBy', 'username email role')
                .populate('lastModifiedBy', 'name email')
                .lean();

            if (!bankAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Bank account not found'
                });
            }

            // Rename userId to user for frontend consistency
            if (bankAccount.userId) {
                bankAccount.user = bankAccount.userId;
                delete bankAccount.userId;
            }

            res.json({
                success: true,
                data: bankAccount
            });

        } catch (error) {
            console.error('Error fetching bank account details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch bank account details'
            });
        }
    }
);

/**
 * Verify bank account
 * Department: WITHDRAWAL_DEPARTMENT
 * 
 * Body:
 * - notes: Optional notes for verification
 */
router.post(
    '/bank-accounts/:id/verify',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { notes } = req.body;

            // Find bank account
            const bankAccount = await BankAccount.findById(id)
                .populate('userId', 'name email');

            if (!bankAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Bank account not found'
                });
            }

            // Update bank account with employee verification
            bankAccount.verificationStatus = 'verified';
            bankAccount.verificationDate = new Date();
            bankAccount.verifiedBy = req.employee._id; // Employee ID
            bankAccount.rejectionReason = undefined;
            if (notes) bankAccount.notes = notes;

            // Add employee verification tracking
            if (!bankAccount.employeeVerification) {
                bankAccount.employeeVerification = {};
            }
            bankAccount.employeeVerification = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                employeeDesignation: req.employee.designationNumber,
                verifiedAt: new Date(),
                notes: notes || ''
            };

            await bankAccount.save();

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalBankAccountsVerified': 1 }
            });

            // Log the verification
            console.log(`[BANK ACCOUNT VERIFIED] ID: ${bankAccount._id} by Employee: ${req.employee.designationNumber}`);

            res.json({
                success: true,
                message: 'Bank account verified successfully',
                data: bankAccount
            });

        } catch (error) {
            console.error('Error verifying bank account:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify bank account'
            });
        }
    }
);

/**
 * Reject bank account
 * Department: WITHDRAWAL_DEPARTMENT
 * 
 * Body:
 * - reason: Required reason for rejection
 */
router.post(
    '/bank-accounts/:id/reject',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Validate reason
            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            if (reason.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason must be at least 10 characters long'
                });
            }

            // Find bank account
            const bankAccount = await BankAccount.findById(id)
                .populate('userId', 'name email');

            if (!bankAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Bank account not found'
                });
            }

            // Update bank account with employee rejection
            bankAccount.verificationStatus = 'rejected';
            bankAccount.verificationDate = new Date();
            bankAccount.verifiedBy = req.employee._id; // Employee ID
            bankAccount.rejectionReason = reason.trim();

            // Add employee verification tracking
            if (!bankAccount.employeeVerification) {
                bankAccount.employeeVerification = {};
            }
            bankAccount.employeeVerification = {
                employeeId: req.employee._id,
                employeeName: req.employee.name,
                employeeDesignation: req.employee.designationNumber,
                verifiedAt: new Date(),
                action: 'rejected',
                reason: reason.trim()
            };

            await bankAccount.save();

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalBankAccountsRejected': 1 }
            });

            // Log the rejection
            console.log(`[BANK ACCOUNT REJECTED] ID: ${bankAccount._id} by Employee: ${req.employee.designationNumber}`);
            console.log(`Rejection Reason: ${reason}`);

            res.json({
                success: true,
                message: 'Bank account rejected successfully',
                data: bankAccount
            });

        } catch (error) {
            console.error('Error rejecting bank account:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject bank account'
            });
        }
    }
);

/**
 * Get bank account statistics overview
 * Department: WITHDRAWAL_DEPARTMENT
 */
router.get(
    '/bank-accounts-stats/overview',
    employeeAuth,
    restrictToDepartment('WITHDRAWAL_DEPARTMENT'),
    async (req, res) => {
        try {
            // Get total counts by status
            const totalPending = await BankAccount.countDocuments({ 
                verificationStatus: 'pending',
                isActive: true 
            });
            const totalVerified = await BankAccount.countDocuments({ 
                verificationStatus: 'verified',
                isActive: true 
            });
            const totalRejected = await BankAccount.countDocuments({ 
                verificationStatus: 'rejected',
                isActive: true 
            });
            const totalUnderReview = await BankAccount.countDocuments({ 
                verificationStatus: 'under_review',
                isActive: true 
            });

            // Get employee's personal statistics
            const myVerifications = await BankAccount.countDocuments({
                'employeeVerification.employeeId': req.employee._id,
                'employeeVerification.action': { $ne: 'rejected' }
            });

            const myRejections = await BankAccount.countDocuments({
                'employeeVerification.employeeId': req.employee._id,
                'employeeVerification.action': 'rejected'
            });

            // Get recent activity (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentAccounts = await BankAccount.countDocuments({
                createdAt: { $gte: yesterday },
                isActive: true
            });

            const recentVerifications = await BankAccount.countDocuments({
                'employeeVerification.verifiedAt': { $gte: yesterday }
            });

            res.json({
                success: true,
                statistics: {
                    total: totalPending + totalVerified + totalRejected + totalUnderReview,
                    pending: totalPending,
                    verified: totalVerified,
                    rejected: totalRejected,
                    underReview: totalUnderReview,
                    myActivity: {
                        totalVerifications: myVerifications,
                        totalRejections: myRejections,
                        totalProcessed: myVerifications + myRejections
                    },
                    recentActivity: {
                        newAccounts24h: recentAccounts,
                        verifications24h: recentVerifications
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching bank account statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    }
);

// ============================================
// TRANSACTION MANAGEMENT DEPARTMENT ROUTES
// ============================================

/**
 * Get withdrawals for transaction processing
 * Department: TRANSACTION_MANAGEMENT
 * Shows withdrawals that are approved/processing/completed/failed
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - status: Filter by status (approved, processing, completed, failed)
 * - search: Search in campaign title, creator details, transaction reference
 * - sortBy: Sort by field (default: createdAt)
 * - sortOrder: asc or desc (default: desc)
 */
router.get(
    '/transactions',
    employeeAuth,
    restrictToDepartment('TRANSACTION_MANAGEMENT'),
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                status = 'approved',
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build optimized query with proper indexes
            const query = { status: { $in: ['approved', 'processing', 'completed', 'failed'] } };

            // Status filter
            if (status && status !== 'all') {
                query.status = status;
            }

            // OPTIMIZED SEARCH: Use MongoDB $or query instead of in-memory filtering
            if (search && search.trim()) {
                const searchRegex = new RegExp(search.trim(), 'i');
                
                // First, get IDs from related collections for search
                const Campaign = mongoose.model('Campaign');
                const User = mongoose.model('User');
                const BankAccount = mongoose.model('BankAccount');
                
                const [campaignIds, userIds, bankIds] = await Promise.all([
                    Campaign.find({ title: searchRegex }).distinct('_id').lean(),
                    User.find({ 
                        $or: [
                            { name: searchRegex },
                            { email: searchRegex },
                            { phone: searchRegex }
                        ]
                    }).distinct('_id').lean(),
                    BankAccount.find({
                        $or: [
                            { bankName: searchRegex },
                            { accountNumber: searchRegex }
                        ]
                    }).distinct('_id').lean()
                ]);

                // Add search conditions to main query
                query.$or = [
                    { campaign: { $in: campaignIds } },
                    { creator: { $in: userIds } },
                    { bankAccount: { $in: bankIds } },
                    { 'processingDetails.transactionReference': searchRegex }
                ];
            }

            // Build sort object with compound index support
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // OPTIMIZATION: Run count and data fetch in parallel
            const [withdrawals, total] = await Promise.all([
                WithdrawalRequest.find(query)
                    .populate({
                        path: 'campaign',
                        select: 'title slug coverImage targetAmount amountRaised amountWithdrawn creator'
                    })
                    .populate({
                        path: 'creator',
                        select: 'name email phone profilePictureUrl kycVerified isPremiumAndVerified'
                    })
                    .populate({
                        path: 'bankAccount',
                        select: 'bankName accountNumber accountName associatedPhoneNumber documentType documentNumber documentImage verificationStatus'
                    })
                    .populate('employeeProcessedBy.employeeId', 'name designationNumber')
                    .populate('processingDetails.processedBy', 'name designationNumber')
                    .sort(sort)
                    .limit(parseInt(limit))
                    .skip((parseInt(page) - 1) * parseInt(limit))
                    .lean(),
                WithdrawalRequest.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: withdrawals,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / limit),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: parseInt(page) * parseInt(limit) < total
                }
            });

        } catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transactions'
            });
        }
    }
);

/**
 * Get detailed transaction information
 * Department: TRANSACTION_MANAGEMENT
 */
router.get(
    '/transactions/:id',
    employeeAuth,
    restrictToDepartment('TRANSACTION_MANAGEMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;

            const withdrawal = await WithdrawalRequest.findById(id)
                .populate({
                    path: 'campaign',
                    select: 'title slug description coverImage targetAmount amountRaised amountWithdrawn pendingWithdrawals creator createdAt'
                })
                .populate({
                    path: 'creator',
                    select: 'name email phone bio profilePictureUrl kycVerified isPremiumAndVerified country createdAt'
                })
                .populate({
                    path: 'bankAccount',
                    select: 'bankName accountNumber accountName ifscCode associatedPhoneNumber documentType documentNumber documentImage verificationStatus verificationDate isPrimary isActive'
                })
                .populate('employeeProcessedBy.employeeId', 'name email designationNumber department')
                .populate('processingDetails.processedBy', 'name email designationNumber department')
                .lean();

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            res.json({
                success: true,
                data: withdrawal
            });

        } catch (error) {
            console.error('Error fetching transaction details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transaction details'
            });
        }
    }
);

/**
 * Mark transaction as processing
 * Department: TRANSACTION_MANAGEMENT
 * 
 * Body:
 * - notes: Optional notes
 */
router.post(
    '/transactions/:id/mark-processing',
    employeeAuth,
    restrictToDepartment('TRANSACTION_MANAGEMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { notes } = req.body;

            // Find withdrawal
            const withdrawal = await WithdrawalRequest.findById(id)
                .populate('campaign', 'title')
                .populate('creator', 'name email');

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Verify status is approved
            if (withdrawal.status !== 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Only approved transactions can be marked as processing'
                });
            }

            // Update status to processing
            withdrawal.status = 'processing';
            
            // Initialize processingDetails if not exists
            if (!withdrawal.processingDetails) {
                withdrawal.processingDetails = {};
            }
            
            withdrawal.processingDetails.processedBy = req.employee._id;
            withdrawal.processingDetails.processedAt = new Date();
            
            // Save with validateModifiedOnly
            await withdrawal.save({ validateModifiedOnly: true });

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalTransactionsProcessing': 1 }
            });

            console.log(`[TRANSACTION PROCESSING] ID: ${withdrawal._id} by Employee: ${req.employee.designationNumber}`);

            res.json({
                success: true,
                message: 'Transaction marked as processing',
                data: withdrawal
            });

        } catch (error) {
            console.error('Error marking transaction as processing:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update transaction status'
            });
        }
    }
);

/**
 * Complete transaction (final step)
 * Department: TRANSACTION_MANAGEMENT
 * 
 * Body:
 * - transactionReference: Required bank transaction reference
 * - processingFee: Optional processing fee (default: 0)
 * - notes: Optional notes
 */
router.post(
    '/transactions/:id/complete',
    employeeAuth,
    restrictToDepartment('TRANSACTION_MANAGEMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { transactionReference, processingFee = 0, notes } = req.body;

            // Validate transaction reference
            if (!transactionReference || transactionReference.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction reference is required'
                });
            }

            // Find withdrawal with campaign
            const withdrawal = await WithdrawalRequest.findById(id)
                .populate('campaign')
                .populate('creator', 'name email')
                .populate('bankAccount', 'bankName accountName accountNumber');

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Verify status is approved or processing
            if (!['approved', 'processing'].includes(withdrawal.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Only approved or processing transactions can be completed'
                });
            }

            // Calculate final amount
            const finalAmount = withdrawal.requestedAmount - (processingFee || 0);

            // Update withdrawal status and processing details
            withdrawal.status = 'completed';
            withdrawal.processingDetails = {
                processedBy: req.employee._id,
                processedAt: new Date(),
                transactionReference: transactionReference.trim(),
                processingFee: processingFee || 0,
                finalAmount: finalAmount
            };

            // Save with validateModifiedOnly
            await withdrawal.save({ validateModifiedOnly: true });

            // Update campaign amounts
            const campaign = withdrawal.campaign;
            campaign.amountWithdrawn += withdrawal.requestedAmount;
            campaign.pendingWithdrawals -= withdrawal.requestedAmount;

            // Auto-create campaign update for transparency
            const updateContent = `A withdrawal of NPR ${withdrawal.requestedAmount.toLocaleString()} has been successfully processed and transferred to the campaign creator's bank account.`
                + (processingFee && processingFee > 0 ? ` Processing fee: NPR ${processingFee.toLocaleString()}, Final amount transferred: NPR ${finalAmount.toLocaleString()}.` : '')
                + ` This ensures transparency in how the funds raised are being utilized for the campaign's stated purpose.`;

            campaign.updates.push({
                date: new Date(),
                title: 'Withdrawal Completed',
                content: updateContent
            });

            await campaign.save();

            // Clear campaign cache
            await clearSpecificCampaignCache(campaign._id);

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 
                    'statistics.totalTransactionsCompleted': 1,
                    'statistics.totalAmountProcessed': withdrawal.requestedAmount
                }
            });

            // Send success email
            try {
                await sendWithdrawStatusEmail(withdrawal.creator.email, {
                    status: 'completed',
                    requestedAmount: withdrawal.requestedAmount,
                    campaignTitle: campaign.title,
                    bankAccountName: withdrawal.bankAccount.accountName,
                    bankName: withdrawal.bankAccount.bankName,
                    accountNumber: withdrawal.bankAccount.accountNumber,
                    reason: withdrawal.reason,
                    requestId: withdrawal._id.toString().slice(-8).toUpperCase(),
                    withdrawalId: withdrawal._id.toString(),
                    comments: notes,
                    transactionReference: transactionReference,
                    processingFee: processingFee,
                    finalAmount: finalAmount,
                    processedDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Don't fail the request if email fails
            }

            console.log(`[TRANSACTION COMPLETED] ID: ${withdrawal._id} by Employee: ${req.employee.designationNumber}`);
            console.log(`Transaction Reference: ${transactionReference}`);

            res.json({
                success: true,
                message: 'Transaction completed successfully',
                data: withdrawal
            });

        } catch (error) {
            console.error('Error completing transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete transaction'
            });
        }
    }
);

/**
 * Mark transaction as failed
 * Department: TRANSACTION_MANAGEMENT
 * 
 * Body:
 * - reason: Required failure reason
 */
router.post(
    '/transactions/:id/mark-failed',
    employeeAuth,
    restrictToDepartment('TRANSACTION_MANAGEMENT'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Validate reason
            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Failure reason is required'
                });
            }

            if (reason.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Failure reason must be at least 10 characters'
                });
            }

            // Find withdrawal with campaign
            const withdrawal = await WithdrawalRequest.findById(id)
                .populate('campaign')
                .populate('creator', 'name email')
                .populate('bankAccount', 'bankName accountName accountNumber');

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Verify status is approved or processing
            if (!['approved', 'processing'].includes(withdrawal.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Only approved or processing transactions can be marked as failed'
                });
            }

            // Update withdrawal status
            withdrawal.status = 'failed';
            withdrawal.processingDetails = {
                processedBy: req.employee._id,
                processedAt: new Date(),
                failureReason: reason.trim()
            };

            // Save with validateModifiedOnly
            await withdrawal.save({ validateModifiedOnly: true });

            // Release pending amount back to available
            const campaign = withdrawal.campaign;
            campaign.pendingWithdrawals -= withdrawal.requestedAmount;
            await campaign.save();

            // Update employee statistics
            await Employee.findByIdAndUpdate(req.employee._id, {
                $inc: { 'statistics.totalTransactionsFailed': 1 }
            });

            // Send failure email
            try {
                await sendWithdrawStatusEmail(withdrawal.creator.email, {
                    status: 'failed',
                    requestedAmount: withdrawal.requestedAmount,
                    campaignTitle: campaign.title,
                    bankAccountName: withdrawal.bankAccount.accountName,
                    bankName: withdrawal.bankAccount.bankName,
                    accountNumber: withdrawal.bankAccount.accountNumber,
                    reason: withdrawal.reason,
                    requestId: withdrawal._id.toString().slice(-8).toUpperCase(),
                    withdrawalId: withdrawal._id.toString(),
                    comments: reason,
                    processedDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Don't fail the request if email fails
            }

            console.log(`[TRANSACTION FAILED] ID: ${withdrawal._id} by Employee: ${req.employee.designationNumber}`);
            console.log(`Failure Reason: ${reason}`);

            res.json({
                success: true,
                message: 'Transaction marked as failed',
                data: withdrawal
            });

        } catch (error) {
            console.error('Error marking transaction as failed:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update transaction status'
            });
        }
    }
);

/**
 * Get transaction statistics overview
 * Department: TRANSACTION_MANAGEMENT
 */
router.get(
    '/transactions-stats/overview',
    employeeAuth,
    restrictToDepartment('TRANSACTION_MANAGEMENT'),
    async (req, res) => {
        try {
            // Get total counts by status
            const totalApproved = await WithdrawalRequest.countDocuments({ status: 'approved' });
            const totalProcessing = await WithdrawalRequest.countDocuments({ status: 'processing' });
            const totalCompleted = await WithdrawalRequest.countDocuments({ status: 'completed' });
            const totalFailed = await WithdrawalRequest.countDocuments({ status: 'failed' });

            // Get total amounts
            const approvedRequests = await WithdrawalRequest.find({ status: 'approved' }).select('requestedAmount');
            const processingRequests = await WithdrawalRequest.find({ status: 'processing' }).select('requestedAmount');
            const completedRequests = await WithdrawalRequest.find({ status: 'completed' }).select('requestedAmount processingDetails');
            const failedRequests = await WithdrawalRequest.find({ status: 'failed' }).select('requestedAmount');

            const totalApprovedAmount = approvedRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalProcessingAmount = processingRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalCompletedAmount = completedRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalFailedAmount = failedRequests.reduce((sum, req) => sum + req.requestedAmount, 0);
            const totalProcessingFees = completedRequests.reduce((sum, req) => sum + (req.processingDetails?.processingFee || 0), 0);

            // Get employee's personal statistics
            const myCompleted = await WithdrawalRequest.countDocuments({
                'processingDetails.processedBy': req.employee._id,
                status: 'completed'
            });

            const myFailed = await WithdrawalRequest.countDocuments({
                'processingDetails.processedBy': req.employee._id,
                status: 'failed'
            });

            const myProcessing = await WithdrawalRequest.countDocuments({
                'processingDetails.processedBy': req.employee._id,
                status: 'processing'
            });

            // Get recent activity (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentCompleted = await WithdrawalRequest.countDocuments({
                'processingDetails.processedAt': { $gte: yesterday },
                status: 'completed'
            });

            res.json({
                success: true,
                statistics: {
                    approved: {
                        count: totalApproved,
                        amount: totalApprovedAmount
                    },
                    processing: {
                        count: totalProcessing,
                        amount: totalProcessingAmount
                    },
                    completed: {
                        count: totalCompleted,
                        amount: totalCompletedAmount,
                        totalFees: totalProcessingFees
                    },
                    failed: {
                        count: totalFailed,
                        amount: totalFailedAmount
                    },
                    myActivity: {
                        completed: myCompleted,
                        failed: myFailed,
                        processing: myProcessing,
                        totalProcessed: myCompleted + myFailed + myProcessing
                    },
                    recentActivity: {
                        completed24h: recentCompleted
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching transaction statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    }
);

module.exports = router;
