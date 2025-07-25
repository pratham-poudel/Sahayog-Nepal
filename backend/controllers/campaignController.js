const Campaign = require('../models/Campaign');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');
const redis=require('../utils/RedisClient');
const axios = require('axios');

// Function to verify Turnstile token (exact copy from working userController.js)
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

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
    try {        // Extract data from request
        const { 
            title, 
            shortDescription, 
            story, 
            category,
            subcategory, 
            targetAmount, 
            endDate,
            turnstileToken
        } = req.body;// Validate required fields including Turnstile token
        if (!title || !shortDescription || !story || !category || !targetAmount || !endDate || !turnstileToken) {
            return res.status(400).json({
                success: false,
                message: 'All fields including security verification are required'
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

        // console.log('Turnstile validation successful:', turnstileValidation);
        
        // Process file uploads
        if (!req.files?.coverImage) {
            return res.status(400).json({
                success: false, 
                message: 'Cover image is required'
            });
        }
        
        // With S3 storage, we get key instead of filename
        // Extract just the filename without the folder path
        // Get the filename from the request fileData or extract from key
        let coverImage = '';
        if (req.fileData?.coverImage?.[0]?.filename) {
            coverImage = req.fileData.coverImage[0].filename;
        } else {
            // Fallback: Extract filename from key and use proper format
            const rawFilename = req.files.coverImage[0].key.split('/').pop();
            // Ensure it has the 'cover-' prefix but not 'campaign-cover-'
            if (rawFilename.startsWith('campaign-cover-')) {
                coverImage = rawFilename.replace('campaign-cover-', 'cover-');
            } else if (!rawFilename.startsWith('cover-')) {
                // If it doesn't have 'cover-' prefix, add it
                const timestamp = Date.now();
                const randomString = Math.round(Math.random() * 1E9);
                const extension = req.files.coverImage[0].originalname.split('.').pop();
                coverImage = `cover-${timestamp}-${randomString}.${extension}`;
            } else {
                coverImage = rawFilename;
            }
        }
        
        // Add additional images if any
        const campaignImages = [];
        if (req.files?.additionalImages) {
            req.files.additionalImages.forEach((file, index) => {
                // Store just the filename part, not the full S3 path
                const filename = req.fileData?.additionalImages?.[index]?.filename || file.key.split('/').pop();
                campaignImages.push(filename);
            });
        }
        
        // Get the S3 URLs for the frontend
        const coverImageUrl = fileService.processUploadedFile(req.files.coverImage[0]).url;
        const imageUrls = req.files?.additionalImages 
            ? req.files.additionalImages.map(file => fileService.processUploadedFile(file).url)
                        : [];
          
          // Create new campaign
        const campaign = await Campaign.create({
            title,
            shortDescription,
            story,
            category,
            subcategory: subcategory || null, // Optional subcategory
            targetAmount,
            endDate,
            coverImage,
            images: campaignImages,
            creator: req.user._id,
            featured: false // Always set to false now
        });
        
        // Add campaign to user's campaigns list
        await User.findByIdAndUpdate(req.user._id, {
            $push: { campaigns: campaign._id }
        });        await redis.del('allCampaigns'); // if you cached all campaigns
        await redis.del(`userCampaigns:${req.user.id}`);
        await redis.del(`categoryCampaigns:${campaign.category}`); // if you cached user-specific campaigns
        
        res.status(201).json({
            success: true,
            message: 'Campaign created successfully and submitted for review',
            campaignId: campaign._id,
            // Include S3 URLs for the frontend
            coverImageUrl,
            imageUrls
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating campaign',
            error: error.message
        });
    }
};

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
exports.getAllCampaigns = async (req, res) => {
    try {
        // Extract query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 9, 20); // Cap limit to 20
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const category = req.query.category || null;
        const subcategory = req.query.subcategory || null;
        const featured = req.query.featured === 'true' ? true : false;
        const urgentOnly = req.query.urgentOnly === 'true' ? true : false;
        const random = req.query.random === 'true' ? true : false;
        const exclude = req.query.exclude; // ID of campaign to exclude from results
          // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Build query object
        const query = { status: 'active' };
        
        // Add category filter if specified
        if (category && category !== 'All Campaigns') {
            query.category = category;
        }

        // Add subcategory filter if specified
        if (subcategory) {
            query.subcategory = subcategory;
        }
          // Add featured filter if specified
        if (featured) {
            query.featured = true;
        }
        
        // Add tags filter for urgent campaigns
        if (urgentOnly) {
            query.tags = { $in: ['Urgent'] };
        }
        
        // Exclude specific campaign if exclude parameter is provided
        if (exclude) {
            query._id = { $ne: exclude };
        }
          // Build sort object - add multiple sort criteria for more varied results
        const sort = {};
        
        // If random sorting is requested, we'll use aggregation with $sample
        if (random) {
            const pipeline = [
                { $match: query },
                { $sample: { size: limit } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'creator',
                        foreignField: '_id',
                        as: 'creator'
                    }
                },
                { $unwind: '$creator' },
                {
                    $project: {
                        'creator.password': 0,
                        'creator.resetPasswordToken': 0,
                        'creator.resetPasswordExpires': 0
                    }
                }
            ];
            
            const campaigns = await Campaign.aggregate(pipeline);
            const total = await Campaign.countDocuments(query);
            const totalPages = Math.ceil(total / limit);
            
            // Add URLs for each campaign's images using fileService
            const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
            
            return res.status(200).json({
                success: true,
                count: campaignsWithUrls.length,
                total,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    nextPage: page < totalPages ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                },
                campaigns: campaignsWithUrls
            });
        }
        
        // Primary sort
        sort[sortBy] = sortOrder;
        
        // Secondary sort by percentage raised (to prioritize campaigns close to their goal)
        if (sortBy !== 'percentageRaised') {
            sort.percentageRaised = -1;
        }
        
        // Tertiary sort by time left (to prioritize urgent campaigns)
        if (sortBy !== 'endDate') {
            sort.endDate = 1;
        }
        
        // Count total documents matching the query (for pagination info)
        const total = await Campaign.countDocuments(query);
        
        // Fetch campaigns with pagination, sorting, and filtering
        const campaigns = await Campaign.find(query)
            .populate('creator', 'name email profilePicture')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance when you don't need Mongoose document methods
        
        // Add URLs for each campaign's images using fileService
        const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
        
        // Calculate pagination details
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        res.status(200).json({
            success: true,
            count: campaignsWithUrls.length,
            total,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null
            },
            campaigns: campaignsWithUrls
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching campaigns',
            error: error.message
        });
    }
};

// Helper function to format campaign with image URLs
const formatCampaignWithUrls = (campaign) => {
    const formattedCampaign = { ...campaign };
    
    // Add cover image URL
    if (campaign.coverImage) {
        formattedCampaign.coverImageUrl = fileService.processUploadedFile({
            key: `uploads/${campaign.coverImage}`,
            originalname: campaign.coverImage
        }).url;
    }
    
    // Add image URLs
    if (campaign.images && campaign.images.length > 0) {
        formattedCampaign.imageUrls = campaign.images.map(image => 
            fileService.processUploadedFile({
                key: `uploads/${image}`,
                originalname: image
            }).url
        );
    }
    
    // Add creator profile picture URL
    if (campaign.creator && campaign.creator.profilePicture) {
        formattedCampaign.creator.profilePictureUrl = fileService.processUploadedFile({
            key: `profiles/${campaign.creator.profilePicture}`,
            originalname: campaign.creator.profilePicture
        }).url;
    }
    
    return formattedCampaign;
};


// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Public
exports.getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('creator', 'name email profilePicture');
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        res.status(200).json({
            success: true,
            campaign
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching campaign',
            error: error.message
        });
    }
};

// @desc    Get user campaigns
// @route   GET /api/campaigns/user
// @access  Private

exports.getUserCampaigns = async (req, res) => {
    try {
        const limit = 20; // AstraDB max per page
        let page = 0;
        let allCampaigns = [];
        let campaigns;

        do {
            campaigns = await Campaign.find({ creator: req.user._id })
                .select('title shortDescription story category targetAmount amountRaised amountWithdrawn pendingWithdrawals donors status percentageRaised startDate endDate createdAt updatedAt coverImage images featured')
                .sort({ createdAt: -1 })
                .skip(page * limit)
                .limit(limit)
                .lean(); // Use lean() for better performance

            allCampaigns = allCampaigns.concat(campaigns);
            page++;
        } while (campaigns.length === limit); // Continue if we hit the limit

        // Format campaigns with image URLs using fileService
        const campaignsWithUrls = allCampaigns.map(campaign => formatCampaignWithUrls(campaign));

        res.status(200).json({
            success: true,
            count: campaignsWithUrls.length,
            campaigns: campaignsWithUrls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user campaigns',
            error: error.message
        });
    }
};



// @desc    Add update to campaign
// @route   POST /api/campaigns/:id/updates
// @access  Private
exports.addCampaignUpdate = async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Update title and content are required'
            });
        }
        
        const campaign = await Campaign.findById(req.params.id);
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        // Check if user is the campaign creator
        if (campaign.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this campaign'
            });
        }
        
        // Add update to campaign
        campaign.updates.push({
            title,
            content,
            date: new Date()
        });
        
        await campaign.save();
        await redis.del('allCampaigns'); // if you cached all campaigns
        await redis.del(`userCampaigns:${req.user.id}`);
        await redis.del(`campaignById:${campaign._id}`);
        
        res.status(200).json({
            success: true,
            message: 'Campaign update added',
            update: campaign.updates[campaign.updates.length - 1]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding campaign update',
            error: error.message
        });
    }
};

// @desc    Update campaign status (admin) or cancel campaign (user delete)
// @route   PATCH /api/campaigns/:id/status
// @access  Private/Admin or Private/Owner (cancel/delete only)
exports.updateCampaignStatus = async (req, res) => {
    try {
        const { status, adminFeedback } = req.body;
        
        if (!status || !['pending', 'active', 'completed', 'cancelled', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }
        
        const campaign = await Campaign.findById(req.params.id);
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in to access this resource.'
            });
        }
        
        // Check if user is admin or campaign owner
        const isAdmin = req.user.role === 'admin';
        const isOwner = campaign.creator.toString() === req.user._id.toString();
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only modify your own campaigns.'
            });
        }
          // If user is not admin, they can only cancel pending campaigns (which will delete them)
        if (!isAdmin) {
            if (status !== 'cancelled') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only cancel your campaigns. Other status changes require admin approval.'
                });
            }
            
            if (campaign.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'You can only cancel campaigns that are still pending approval. Approved campaigns cannot be cancelled.'
                });
            }
              // For non-admin users cancelling pending campaigns, delete the campaign entirely
            try {
                // Delete associated files if they exist
                if (campaign.coverImage) {
                    // Note: File cleanup can be handled by a background job if needed
                    // For now, we'll just delete the database record
                }
                
                // Remove campaign from user's campaigns array (AstraDB compatible approach)
                const user = await User.findById(campaign.creator);
                if (user && user.campaigns) {
                    user.campaigns = user.campaigns.filter(
                        campaignId => campaignId.toString() !== campaign._id.toString()
                    );
                    await user.save();
                }
                
                // Delete the campaign from database
                await Campaign.findByIdAndDelete(req.params.id);
                
                // Clear related cache
                await redis.del('allCampaigns');
                await redis.del(`userCampaigns:${req.user.id}`);
                await redis.del(`categoryCampaigns:${campaign.category}`);
                await redis.del(`campaignById:${campaign._id}`);
                
                return res.status(200).json({
                    success: true,
                    message: 'Campaign cancelled and removed successfully',
                    deleted: true
                });
            } catch (deleteError) {
                console.error('Error deleting campaign:', deleteError);
                return res.status(500).json({
                    success: false,
                    message: 'Error cancelling campaign',
                    error: deleteError.message
                });
            }
        }
        
        // For admin users, they have full control over all status changes
        if (isAdmin) {
            // Store previous status for history tracking
            const previousStatus = campaign.status;
            
            // Update campaign status
            campaign.status = status;
            
            // Add admin feedback if provided
            if (adminFeedback) {
                campaign.adminFeedback = adminFeedback;
            }
            
            // Add to status history for audit trail
            campaign.statusHistory.push({
                status: status,
                changedBy: req.user._id,
                changedAt: new Date(),
                reason: adminFeedback || `Status changed from ${previousStatus} to ${status}`
            });
            
            await campaign.save();
            
            // Clear related cache
            await redis.del('allCampaigns');
            await redis.del(`userCampaigns:${campaign.creator}`);
            await redis.del(`categoryCampaigns:${campaign.category}`);
            await redis.del(`campaignById:${campaign._id}`);
            
            return res.status(200).json({
                success: true,
                message: `Campaign status updated from ${previousStatus} to ${status}`,
                campaign: {
                    ...campaign.toObject(),
                    previousStatus
                }
            });
        }
        
        // This should never be reached, but keeping as fallback
        return res.status(403).json({
            success: false,
            message: 'Unauthorized action'
        });
    } catch (error) {
        console.error('Error updating campaign status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating campaign status',
            error: error.message
        });
    }
};

// @desc    Add tags to campaign (admin)
// @route   PATCH /api/campaigns/:id/tags
// @access  Private/Admin
exports.addCampaignTags = async (req, res) => {
    try {
        const { tags } = req.body;
        
        if (!tags || !Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: 'Tags array is required'
            });
        }
        
        const campaign = await Campaign.findById(req.params.id);
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        // Update campaign tags - replace existing tags
        campaign.tags = tags;
        
        await campaign.save();
        
        res.status(200).json({
            success: true,
            message: 'Campaign tags updated',
            tags: campaign.tags
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating campaign tags',
            error: error.message
        });
    }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        // Check if user is the campaign creator
        if (campaign.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this campaign'
            });
        }
        
        // Only allow deletion of pending campaigns
        if (campaign.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending campaigns can be deleted'
            });
        }
        
        // Delete associated files
        if (campaign.coverImage) {
            const coverImagePath = path.join(__dirname, '../public/images/uploads', campaign.coverImage);
            if (fs.existsSync(coverImagePath)) {
                fs.unlinkSync(coverImagePath);
            }
        }
        
        if (campaign.images && campaign.images.length > 0) {
            campaign.images.forEach(image => {
                const imagePath = path.join(__dirname, '../public/images/uploads', image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
        }
        
        // Remove campaign from user's campaigns array
        await User.findByIdAndUpdate(
            campaign.creator,
            { $pull: { campaigns: campaign._id } }
        );
        
        // Delete the campaign
        await campaign.remove();
        await redis.del('allCampaigns'); // if you cached all campaigns
        await redis.del(`userCampaigns:${req.user.id}`);
        await redis.del('categoryCampaigns');
        await redis.del(`campaignById:${campaign._id}`);
        
        res.status(200).json({
            success: true,
            message: 'Campaign deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting campaign',
            error: error.message
        });
    }
};

// @desc    Update a campaign
// @route   PUT /api/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find campaign
        const campaign = await Campaign.findById(id);
        
        // Check if campaign exists
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        // Check if user is the campaign creator
        if (campaign.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this campaign'
            });
        }
        
        // Check if campaign is in 'pending' status (only pending campaigns can be edited)
        if (campaign.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only campaigns under review can be edited'
            });
        }
        
        // Get data from request body
        const { title, category, targetAmount, endDate, shortDescription, story } = req.body;
        
        // Process keepImages array
        let keepImages = [];
        if (req.body.keepImages) {
            keepImages = Array.isArray(req.body.keepImages) 
                ? req.body.keepImages 
                : [req.body.keepImages];
        }
        
        // Prepare additional images array
        let campaignImages = [];
        
        // Keep existing images that are in the keepImages array
        if (campaign.images && campaign.images.length > 0) {
            campaignImages = campaign.images.filter(img => 
                keepImages.includes(img)
            );
        }
        
        // Add new additional images if any
        if (req.files && req.files.additionalImages) {
            const newImages = Array.isArray(req.files.additionalImages)
                ? req.files.additionalImages.map((file, index) => {
                    // Get the filename from request fileData or extract from key
                    return req.fileData?.additionalImages?.[index]?.filename || file.key.split('/').pop();
                })
                : [req.fileData?.additionalImages?.[0]?.filename || req.files.additionalImages.key.split('/').pop()];
                
            campaignImages = [...campaignImages, ...newImages];
            // Limit to 3 images
            campaignImages = campaignImages.slice(0, 3);
        }
        
        // Prepare update object
        const updateData = {
            title,
            category,
            targetAmount,
            shortDescription,
            story,
            images: campaignImages
        };
        
        // Only update endDate if it's provided
        if (endDate) {
            // Convert both dates to Date objects for comparison
            const endDateObj = new Date(endDate);
            const startDateObj = new Date(campaign.startDate || Date.now());
            
            // Normalize dates by removing time component
            const normalizedEndDate = new Date(endDateObj.setHours(0, 0, 0, 0));
            const normalizedStartDate = new Date(startDateObj.setHours(0, 0, 0, 0));
            
            // Check if end date is at least the same day or later than start date
            if (normalizedEndDate >= normalizedStartDate) {
                updateData.endDate = endDate;
            } else {
                console.warn('Error updating campaign:', {
                    endDate: endDateObj,
                    startDate: startDateObj,
                    message: 'End date must be greater than start date'
                });
                
                return res.status(400).json({
                    success: false,
                    message: 'End date must be equal to or later than the start date'
                });
            }
        }
        
        // If cover image is uploaded, update it
        if (req.files && req.files.coverImage) {
            // Get the filename from fileData if available, otherwise extract from key
            if (req.fileData?.coverImage?.[0]?.filename) {
                updateData.coverImage = req.fileData.coverImage[0].filename;
            } else {
                // Fallback: Extract filename from key and use proper format
                const rawFilename = req.files.coverImage[0].key.split('/').pop();
                // Ensure it has the 'cover-' prefix but not 'campaign-cover-'
                if (rawFilename.startsWith('campaign-cover-')) {
                    updateData.coverImage = rawFilename.replace('campaign-cover-', 'cover-');
                } else if (!rawFilename.startsWith('cover-')) {
                    // If it doesn't have 'cover-' prefix, add it
                    const timestamp = Date.now();
                    const randomString = Math.round(Math.random() * 1E9);
                    const extension = req.files.coverImage[0].originalname.split('.').pop();
                    updateData.coverImage = `cover-${timestamp}-${randomString}.${extension}`;
                } else {
                    updateData.coverImage = rawFilename;
                }
            }
        }
        
        // Update campaign
        const updatedCampaign = await Campaign.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        await redis.del('allCampaigns'); // if you cached all campaigns
        await redis.del(`userCampaigns:${req.user.id}`);
        await redis.del('categoryCampaigns');
        await redis.del(`campaignById:${updatedCampaign._id}`); // Clear cache for this specific campaign
        
        res.status(200).json({
            success: true,
            message: 'Campaign updated successfully',
            campaign: updatedCampaign
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating campaign',
            error: error.message
        });
    }
};

// @desc    Get campaigns by category
// @route   GET /api/campaigns/category/:category
// @access  Public
exports.getCampaignsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 20; // Default to 20 if no limit is provided
        const exclude = req.query.exclude; // ID of campaign to exclude from results
        
        // If category is 'All Campaigns', show all active campaigns
        const query = { status: 'active' };

        if (category && category !== 'All Campaigns') {
            query.category = category; // Search by dynamic category
        }

        // Exclude the current campaign if exclude parameter is provided
        if (exclude) {
            query._id = { $ne: exclude };
        }

        const campaigns = await Campaign.find(query)
            .populate('creator', 'name email profilePicture')
            .sort({ createdAt: -1 })  // Sorting by creation date in descending order
            .limit(limit);  // Apply the limit

        res.status(200).json({
            success: true,
            count: campaigns.length,
            campaigns
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching campaigns by category',
            error: error.message
        });
    }
};



// @desc    Search campaigns
// @route   GET /api/campaigns/search/:searchTerm
// @access  Public
exports.searchCampaigns = async (req, res) => {
    try {
        const searchTerm = req.params.searchTerm;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const category = req.query.category || null;

        console.log('Search Term:', searchTerm);
        console.log('Category:', category);
        console.log('Sort By:', sortBy, 'Sort Order:', sortOrder);

        if (!searchTerm || searchTerm.trim() === "") {
            return res.status(400).json({
                success: false,
                message: 'Search term is required'
            });
        }

        // Retrieve all active campaigns for now (for debugging purposes)
        const campaigns = await Campaign.find({ status: 'active' }).populate('creator', 'name email profilePicture').lean();
        console.log('Total Active Campaigns:', campaigns.length);

        // Filter campaigns based on search term and category
        const filteredCampaigns = campaigns.filter(campaign => {
            const name = campaign.title || ''; // Default to empty string if undefined
            const description = campaign.shortDescription || ''; // Default to empty string if undefined
            const matchesSearchTerm = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (campaign.story && campaign.story.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = category ? campaign.category === category : true;
            return matchesSearchTerm && matchesCategory;
        });

        console.log('Filtered Campaigns:', filteredCampaigns.length);

        // Implement pagination
        const total = filteredCampaigns.length;
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;
        const paginatedCampaigns = filteredCampaigns.slice(skip, skip + limit);

        // Sort campaigns
        paginatedCampaigns.sort((a, b) => {
            if (sortBy === 'createdAt') {
                return sortOrder === 'asc' ? new Date(a.createdAt) - new Date(b.createdAt) :
                                              new Date(b.createdAt) - new Date(a.createdAt);
            }
            return 0;
        });

        res.status(200).json({
            success: true,
            count: paginatedCampaigns.length,
            total,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            campaigns: paginatedCampaigns
        });
    } catch (error) {
        console.error('Error searching campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching campaigns',
            error: error.message
        });
    }
};

// @desc    Get rotating featured campaigns
// @route   GET /api/campaigns/featured/rotation
// @access  Public
exports.getRotatingFeaturedCampaigns = async (req, res) => {
    try {
        // Extract query parameters
        const count = Math.min(parseInt(req.query.count) || 3, 5); // Default to 3, max 5
        const category = req.query.category || null;
        const page = parseInt(req.query.page) || 1;
        const strategy = req.query.strategy || null; // Optional specific strategy selection
        
        // Build query object for active and featured campaigns only
        const query = { status: 'active', featured: true };
        
        // Add category filter if specified
        if (category && category !== 'All Campaigns') {
            query.category = category;
        }
        
        console.log('Featured campaigns query:', JSON.stringify(query));
        
        // Count total documents matching the query first
        const total = await Campaign.countDocuments(query);
        console.log(`Found ${total} featured campaigns total`);
        
        // If no featured campaigns found, fallback to regular active campaigns
        if (total === 0) {
            console.log('No featured campaigns found, falling back to regular active campaigns');
            const fallbackQuery = { status: 'active' };
            
            // Add category filter if specified
            if (category && category !== 'All Campaigns') {
                fallbackQuery.category = category;
            }
            
            const fallbackTotal = await Campaign.countDocuments(fallbackQuery);
            const skip = (page - 1) * count;
            
            const campaigns = await Campaign.find(fallbackQuery)
                .populate('creator', 'name email profilePicture')
                .sort({ createdAt: -1 }) // Sort by newest first as fallback
                .skip(skip)
                .limit(count)
                .lean();
            
            const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
            const totalPages = Math.ceil(fallbackTotal / count);
            
            return res.status(200).json({
                success: true,
                count: campaignsWithUrls.length,
                total: fallbackTotal,
                strategy: 'Recently Added',
                isFallback: true,
                pagination: {
                    page,
                    count,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    nextPage: page < totalPages ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                },
                campaigns: campaignsWithUrls
            });
        }
        
        // Define possible selection strategies
        const selectionStrategies = [
            { sortBy: 'createdAt', sortOrder: -1, displayReason: 'Recently Added' }, // Newest campaigns
            { sortBy: 'amountRaised', sortOrder: -1, displayReason: 'Most Popular' }, // Most funded
            { sortBy: 'endDate', sortOrder: 1, displayReason: 'Ending Soon' }, // Ending soon
            { sortBy: 'percentageRaised', sortOrder: -1, displayReason: 'Nearly Funded' }, // Closest to goal
        ];
        
        // Choose a strategy - either specified or random
        let selectedStrategy;
        if (strategy && selectionStrategies.find(s => s.displayReason === strategy)) {
            selectedStrategy = selectionStrategies.find(s => s.displayReason === strategy);
        } else {
            // Choose a random strategy
            const randomIndex = Math.floor(Math.random() * selectionStrategies.length);
            selectedStrategy = selectionStrategies[randomIndex];
        }
        
        // Calculate skip for pagination
        const skip = (page - 1) * count;
        
        // Create sort object
        const sort = {};
        sort[selectedStrategy.sortBy] = selectedStrategy.sortOrder;
        
        console.log('Using sort strategy:', selectedStrategy.displayReason, 'with sort:', sort);
        
        // Fetch campaigns with sorting
        const campaigns = await Campaign.find(query)
            .populate('creator', 'name email profilePicture')
            .sort(sort)
            .skip(skip)
            .limit(count)
            .lean(); // Use lean() for better performance
        
        console.log(`Retrieved ${campaigns.length} featured campaigns for page ${page}`);
        
        // Add URLs for each campaign's images
        const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
        
        // Add the display reason to each campaign
        const campaignsWithReason = campaignsWithUrls.map(campaign => ({
            ...campaign,
            displayReason: selectedStrategy.displayReason
        }));
        
        // Calculate total pages
        const totalPages = Math.ceil(total / count);
        
        res.status(200).json({
            success: true,
            count: campaignsWithReason.length,
            total,
            strategy: selectedStrategy.displayReason,
            isFallback: false,
            pagination: {
                page,
                count,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            campaigns: campaignsWithReason
        });
    } catch (error) {
        console.error('Error fetching rotating featured campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rotating featured campaigns',
            error: error.message
        });
    }
};

// @desc    Get all unique categories from campaigns
// @route   GET /api/campaigns/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        // Get all campaigns and extract unique categories
        const campaigns = await Campaign.find({ status: 'active' }, 'category');
        
        // Extract unique categories using Set
        const categoriesSet = new Set();
        campaigns.forEach(campaign => {
            if (campaign.category && campaign.category.trim() !== '') {
                categoriesSet.add(campaign.category.trim());
            }
        });
        
        // Convert to array and sort alphabetically
        const uniqueCategories = Array.from(categoriesSet).sort();

        // If no categories found, return default categories as fallback
        const defaultCategories = [
            "Education", 
            "Healthcare", 
            "Disaster Relief", 
            "Community Development", 
            "Heritage Preservation", 
            "Environment", 
            "Water & Sanitation"
        ];

        const responseCategories = uniqueCategories.length > 0 ? uniqueCategories : defaultCategories;

        res.status(200).json({
            success: true,
            data: responseCategories,
            count: responseCategories.length
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get hierarchical category structure
// @route   GET /api/campaigns/categories/hierarchy
// @access  Public
exports.getCategoryHierarchy = async (req, res) => {
    try {
        // Define the hierarchical category structure
        const categoryHierarchy = {
            "Education": {
                icon: "🎓",
                subcategories: [
                    "Primary Education",
                    "Secondary Education", 
                    "Higher Education",
                    "Vocational Training",
                    "Educational Infrastructure",
                    "Scholarships",
                    "Adult Literacy"
                ]
            },
            "Healthcare": {
                icon: "🏥",
                subcategories: [
                    "Medical Treatment",
                    "Medical Equipment",
                    "Hospital Infrastructure",
                    "Mental Health",
                    "Emergency Medical",
                    "Child Healthcare",
                    "Senior Care"
                ]
            },
            "Animals": {
                icon: "🐾",
                subcategories: [
                    "Dogs",
                    "Cats", 
                    "Wildlife Conservation",
                    "Farm Animals",
                    "Animal Shelters",
                    "Veterinary Care",
                    "Animal Rescue"
                ]
            },
            "Environment": {
                icon: "🌱",
                subcategories: [
                    "Climate Action",
                    "Reforestation",
                    "Clean Energy",
                    "Pollution Control",
                    "Conservation",
                    "Sustainable Agriculture",
                    "Green Infrastructure"
                ]
            },
            "Disaster Relief": {
                icon: "🆘",
                subcategories: [
                    "Earthquake Relief",
                    "Flood Relief", 
                    "Fire Relief",
                    "Emergency Shelter",
                    "Food & Water",
                    "Medical Aid",
                    "Reconstruction"
                ]
            },
            "Community Development": {
                icon: "🏘️",
                subcategories: [
                    "Infrastructure",
                    "Youth Programs",
                    "Women Empowerment",
                    "Senior Services",
                    "Cultural Programs",
                    "Community Centers",
                    "Local Business Support"
                ]
            },
            "Water & Sanitation": {
                icon: "💧",
                subcategories: [
                    "Clean Water Access",
                    "Water Purification",
                    "Sanitation Facilities",
                    "Hygiene Programs",
                    "Water Infrastructure",
                    "Waste Management"
                ]
            }
        };

        res.status(200).json({
            success: true,
            data: categoryHierarchy,
            mainCategories: Object.keys(categoryHierarchy)
        });
    } catch (error) {
        console.error('Error fetching category hierarchy:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching category hierarchy',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get campaigns by category and optional subcategory
// @route   GET /api/campaigns/category/:category/:subcategory?
// @access  Public
exports.getCampaignsByHierarchicalCategory = async (req, res) => {
    try {
        const { category, subcategory } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;        // Build query - AstraDB doesn't support $regex, so we use exact matching
        // Convert category to proper case for matching
        const categoryFormatted = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace(/-/g, ' ');
        
        let query = { 
            status: 'active',
            category: categoryFormatted
        };

        // Add subcategory filter if provided
        if (subcategory) {
            // Format subcategory properly
            const subcategoryFormatted = subcategory.charAt(0).toUpperCase() + subcategory.slice(1).toLowerCase().replace(/-/g, ' ');
            query.subcategory = subcategoryFormatted;
        }

        // Get campaigns with pagination
        const campaigns = await Campaign.find(query)
            .populate('creator', 'name email profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count for pagination
        const totalCampaigns = await Campaign.countDocuments(query);
        const totalPages = Math.ceil(totalCampaigns / limit);

        // Format campaigns with URLs
        const formatCampaignWithUrls = (campaign) => {
            if (campaign.coverImage) {
                campaign.coverImageUrl = `/uploads/${campaign.coverImage}`;
            }
            if (campaign.images && campaign.images.length > 0) {
                campaign.imageUrls = campaign.images.map(img => `/uploads/${img}`);
            }
            return campaign;
        };

        const campaignsWithUrls = campaigns.map(formatCampaignWithUrls);

        res.status(200).json({
            success: true,
            count: campaignsWithUrls.length,
            total: totalCampaigns,
            category: category,
            subcategory: subcategory || null,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            campaigns: campaignsWithUrls
        });
    } catch (error) {
        console.error('Error fetching campaigns by hierarchical category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching campaigns',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};



