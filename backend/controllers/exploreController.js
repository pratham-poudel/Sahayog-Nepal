const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');
const fileService = require('../services/fileService');

// Helper function to format campaign with image URLs
const formatCampaignWithUrls = (campaign) => {
    // Campaign already has full URLs stored in DB, just return as is
    // The URLs are already complete from the database:
    // - coverImage contains full URL
    // - images array contains full URLs
    // - creator.profilePictureUrl contains full URL
    return campaign;
};

/**
 * Smart Explore Algorithm for Regular Tab
 * This algorithm ensures all campaigns get visibility while prioritizing important ones
 * 
 * Strategy:
 * - Featured campaigns: 20% of results (randomly selected from featured pool)
 * - High engagement (many donors/high amount): 25% of results
 * - Less funded (need attention): 20% of results
 * - Ending soon: 15% of results
 * - Random recent: 20% of results
 * 
 * @route   GET /api/explore/regular
 * @access  Public
 */
exports.getRegularExplore = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 24); // Cap at 24 for infinite scroll
        const category = req.query.category || null;
        const subcategory = req.query.subcategory || null;
        const searchTerm = req.query.search || null;
        const sortBy = req.query.sortBy || 'smart'; // smart, newest, endingSoon, leastFunded, mostFunded
        
        // Calculate the date 10 days ago
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        // Build base match stage
        // Show active campaigns AND campaigns that ended within last 10 days
        const baseMatch = { 
            status: 'active',
            endDate: { $gte: tenDaysAgo } // Only show campaigns that haven't been expired for more than 10 days
        };
        
        if (category && category !== 'All Campaigns') {
            baseMatch.category = category;
        }
        if (subcategory) {
            baseMatch.subcategory = subcategory;
        }
        
        // Enhanced search functionality
        let textSearchScore = null;
        let searchStages = [];
        
        if (searchTerm && searchTerm.trim()) {
            // Create a search regex for flexible matching
            const searchRegex = new RegExp(searchTerm.trim(), 'i');
            
            // First, lookup creator info for searching
            searchStages = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'creator',
                        foreignField: '_id',
                        as: 'creator',
                        pipeline: [
                            {
                                $project: {
                                    name: 1,
                                    profilePicture: 1,
                                    profilePictureUrl: 1,
                                    isPremiumAndVerified: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: '$creator' },
                {
                    $match: {
                        $or: [
                            { title: searchRegex },
                            { shortDescription: searchRegex },
                            { story: searchRegex },
                            { category: searchRegex },
                            { subcategory: searchRegex },
                            { tags: { $in: [searchRegex] } },
                            { 'creator.name': searchRegex }
                        ]
                    }
                },
                // Add scoring based on match quality
                {
                    $addFields: {
                        searchScore: {
                            $add: [
                                // Title match gets highest score (100)
                                { $cond: [{ $regexMatch: { input: '$title', regex: searchRegex } }, 100, 0] },
                                // Creator name match gets high score (80)
                                { $cond: [{ $regexMatch: { input: '$creator.name', regex: searchRegex } }, 80, 0] },
                                // Category match gets good score (60)
                                { $cond: [{ $regexMatch: { input: '$category', regex: searchRegex } }, 60, 0] },
                                // Subcategory match gets decent score (50)
                                { $cond: [{ $regexMatch: { input: { $ifNull: ['$subcategory', ''] }, regex: searchRegex } }, 50, 0] },
                                // Tags match gets moderate score (40)
                                { $cond: [{ $gt: [{ $size: { $filter: { input: '$tags', as: 'tag', cond: { $regexMatch: { input: '$$tag', regex: searchRegex } } } } }, 0] }, 40, 0] },
                                // Short description match gets low score (20)
                                { $cond: [{ $regexMatch: { input: '$shortDescription', regex: searchRegex } }, 20, 0] },
                                // Story match gets minimal score (10)
                                { $cond: [{ $regexMatch: { input: '$story', regex: searchRegex } }, 10, 0] }
                            ]
                        }
                    }
                }
            ];
        } else {
            // No search term, just do normal lookup
            searchStages = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'creator',
                        foreignField: '_id',
                        as: 'creator',
                        pipeline: [
                            {
                                $project: {
                                    name: 1,
                                    profilePicture: 1,
                                    profilePictureUrl: 1,
                                    isPremiumAndVerified: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: '$creator' }
            ];
        }
        
        // Common addFields stages
        const commonAddFieldsStages = [
            {
                $project: {
                    amountWithdrawn: 0,
                    pendingWithdrawals: 0,
                    withdrawalRequests: 0
                }
            },
            {
                $addFields: {
                    percentageRaised: {
                        $multiply: [
                            { $divide: ['$amountRaised', '$targetAmount'] },
                            100
                        ]
                    },
                    daysLeft: {
                        $max: [
                            0,
                            {
                                $ceil: {
                                    $divide: [
                                        { $subtract: ['$endDate', new Date()] },
                                        86400000
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        ];
        
        const commonStages = [...searchStages, ...commonAddFieldsStages];
        
        // If search is active, use enhanced search with scoring
        if (searchTerm && searchTerm.trim()) {
            const skip = (page - 1) * limit;
            
            const pipeline = [
                { $match: baseMatch },
                ...commonStages,
                { $sort: { searchScore: -1, amountRaised: -1, donors: -1 } }, // Sort by search relevance, then by engagement
                { $skip: skip },
                { $limit: limit }
            ];
            
            // For counting, we need a similar pipeline but without skip/limit
            const countPipeline = [
                { $match: baseMatch },
                ...searchStages,
                { $count: 'total' }
            ];
            
            const [campaigns, countResult] = await Promise.all([
                Campaign.aggregate(pipeline),
                Campaign.aggregate(countPipeline)
            ]);
            
            const total = countResult.length > 0 ? countResult[0].total : 0;
            
            const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            
            return res.status(200).json({
                success: true,
                count: campaignsWithUrls.length,
                total,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    hasNextPage,
                    hasPrevPage: page > 1,
                    nextPage: hasNextPage ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                },
                campaigns: campaignsWithUrls
            });
        }
        
        // Handle different sorting options
        if (sortBy !== 'smart') {
            const skip = (page - 1) * limit;
            let sortStage = {};
            
            switch (sortBy) {
                case 'newest':
                    sortStage = { createdAt: -1 };
                    break;
                case 'endingSoon':
                    sortStage = { endDate: 1 };
                    break;
                case 'leastFunded':
                    sortStage = { percentageRaised: 1, amountRaised: 1 };
                    break;
                case 'mostFunded':
                    sortStage = { amountRaised: -1 };
                    break;
                default:
                    sortStage = { createdAt: -1 };
            }
            
            const pipeline = [
                { $match: baseMatch },
                ...commonStages,
                { $sort: sortStage },
                { $skip: skip },
                { $limit: limit }
            ];
            
            const campaigns = await Campaign.aggregate(pipeline);
            const total = await Campaign.countDocuments(baseMatch);
            
            const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            
            return res.status(200).json({
                success: true,
                count: campaignsWithUrls.length,
                total,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    hasNextPage,
                    hasPrevPage: page > 1,
                    nextPage: hasNextPage ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                },
                campaigns: campaignsWithUrls
            });
        }
        
        // For page 1, create a smart mix
        if (page === 1) {
            // Calculate how many campaigns for each category
            const featuredCount = Math.ceil(limit * 0.20);
            const highEngagementCount = Math.ceil(limit * 0.25);
            const lessFundedCount = Math.ceil(limit * 0.20);
            const endingSoonCount = Math.ceil(limit * 0.15);
            const randomRecentCount = limit - (featuredCount + highEngagementCount + lessFundedCount + endingSoonCount);
            
            // Track used IDs to avoid duplicates
            let usedIds = [];
            let allCampaigns = [];
            
            // 1. Get Featured Campaigns (randomly selected)
            const featuredMatch = { ...baseMatch, featured: true };
            const featuredPipeline = [
                { $match: featuredMatch },
                ...commonStages,
                { $sample: { size: featuredCount * 2 } }, // Get more than needed
                { $limit: featuredCount }
            ];
            
            const featuredCampaigns = await Campaign.aggregate(featuredPipeline);
            usedIds.push(...featuredCampaigns.map(c => c._id.toString()));
            allCampaigns.push(...featuredCampaigns);
            
            // 2. Get High Engagement Campaigns (high donors or high amount)
            const highEngagementMatch = { 
                ...baseMatch, 
                _id: { $nin: usedIds.map(id => new mongoose.Types.ObjectId(id)) },
                $or: [
                    { donors: { $gte: 10 } },
                    { amountRaised: { $gte: 50000 } }
                ]
            };
            const highEngagementPipeline = [
                { $match: highEngagementMatch },
                ...commonStages,
                { $sort: { donors: -1, amountRaised: -1 } },
                { $limit: highEngagementCount }
            ];
            
            const highEngagementCampaigns = await Campaign.aggregate(highEngagementPipeline);
            usedIds.push(...highEngagementCampaigns.map(c => c._id.toString()));
            allCampaigns.push(...highEngagementCampaigns);
            
            // 3. Get Less Funded Campaigns (need attention)
            const lessFundedMatch = { 
                ...baseMatch,
                _id: { $nin: usedIds.map(id => new mongoose.Types.ObjectId(id)) }
            };
            const lessFundedPipeline = [
                { $match: lessFundedMatch },
                ...commonStages,
                { $sort: { percentageRaised: 1, createdAt: -1 } },
                { $limit: lessFundedCount }
            ];
            
            const lessFundedCampaigns = await Campaign.aggregate(lessFundedPipeline);
            usedIds.push(...lessFundedCampaigns.map(c => c._id.toString()));
            allCampaigns.push(...lessFundedCampaigns);
            
            // 4. Get Ending Soon Campaigns
            const endingSoonMatch = { 
                ...baseMatch,
                _id: { $nin: usedIds.map(id => new mongoose.Types.ObjectId(id)) }
            };
            const endingSoonPipeline = [
                { $match: endingSoonMatch },
                ...commonStages,
                { $sort: { endDate: 1 } },
                { $limit: endingSoonCount }
            ];
            
            const endingSoonCampaigns = await Campaign.aggregate(endingSoonPipeline);
            usedIds.push(...endingSoonCampaigns.map(c => c._id.toString()));
            allCampaigns.push(...endingSoonCampaigns);
            
            // 5. Get Random Recent Campaigns to fill remaining slots
            const randomRecentMatch = { 
                ...baseMatch,
                _id: { $nin: usedIds.map(id => new mongoose.Types.ObjectId(id)) }
            };
            const randomRecentPipeline = [
                { $match: randomRecentMatch },
                ...commonStages,
                { $sample: { size: randomRecentCount } }
            ];
            
            const randomRecentCampaigns = await Campaign.aggregate(randomRecentPipeline);
            allCampaigns.push(...randomRecentCampaigns);
            
            // Shuffle all campaigns to mix different types
            const shuffledCampaigns = allCampaigns.sort(() => Math.random() - 0.5);
            
            // Get total count
            const total = await Campaign.countDocuments(baseMatch);
            
            // Format campaigns with URLs
            const campaignsWithUrls = shuffledCampaigns.map(campaign => formatCampaignWithUrls(campaign));
            
            // Calculate pagination
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            
            res.status(200).json({
                success: true,
                count: campaignsWithUrls.length,
                total,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    hasNextPage,
                    hasPrevPage: page > 1,
                    nextPage: hasNextPage ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                },
                campaigns: campaignsWithUrls,
                debug: {
                    featured: featuredCampaigns.length,
                    highEngagement: highEngagementCampaigns.length,
                    lessFunded: lessFundedCampaigns.length,
                    endingSoon: endingSoonCampaigns.length,
                    randomRecent: randomRecentCampaigns.length
                }
            });
        } else {
            // For subsequent pages, use regular pagination with some randomness
            const skip = (page - 1) * limit;
            
            const pipeline = [
                { $match: baseMatch },
                ...commonStages,
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ];
            
            const campaigns = await Campaign.aggregate(pipeline);
            const total = await Campaign.countDocuments(baseMatch);
            
            // Format campaigns with URLs
            const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
            
            // Calculate pagination
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            
            res.status(200).json({
                success: true,
                count: campaignsWithUrls.length,
                total,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    hasNextPage,
                    hasPrevPage: page > 1,
                    nextPage: hasNextPage ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                },
                campaigns: campaignsWithUrls
            });
        }
    } catch (error) {
        console.error('Error fetching regular explore:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching campaigns',
            error: error.message
        });
    }
};

/**
 * Urgent Tab - Shows only campaigns with "Urgent" tag
 * Prioritizes by days left and percentage raised
 * 
 * @route   GET /api/explore/urgent
 * @access  Public
 */
exports.getUrgentExplore = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 24);
        const category = req.query.category || null;
        const subcategory = req.query.subcategory || null;
        const searchTerm = req.query.search || null;
        const sortBy = req.query.sortBy || 'urgency'; // urgency, newest, endingSoon, leastFunded, mostFunded
        
        const skip = (page - 1) * limit;
        
        // Calculate the date 10 days ago
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        // Build match stage for urgent campaigns
        const matchStage = { 
            status: 'active',
            tags: { $in: ['Urgent', 'urgent'] },
            endDate: { $gte: tenDaysAgo } // Only show campaigns that haven't been expired for more than 10 days
        };
        
        if (category && category !== 'All Campaigns') {
            matchStage.category = category;
        }
        if (subcategory) {
            matchStage.subcategory = subcategory;
        }
        
        // Enhanced search functionality for urgent campaigns
        let searchStages = [];
        
        if (searchTerm && searchTerm.trim()) {
            // Create a search regex for flexible matching
            const searchRegex = new RegExp(searchTerm.trim(), 'i');
            
            // First, lookup creator info for searching
            searchStages = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'creator',
                        foreignField: '_id',
                        as: 'creator',
                        pipeline: [
                            {
                                $project: {
                                    name: 1,
                                    profilePicture: 1,
                                    profilePictureUrl: 1,
                                    isPremiumAndVerified: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: '$creator' },
                {
                    $match: {
                        $or: [
                            { title: searchRegex },
                            { shortDescription: searchRegex },
                            { story: searchRegex },
                            { category: searchRegex },
                            { subcategory: searchRegex },
                            { tags: { $in: [searchRegex] } },
                            { 'creator.name': searchRegex }
                        ]
                    }
                },
                // Add scoring based on match quality
                {
                    $addFields: {
                        searchScore: {
                            $add: [
                                // Title match gets highest score (100)
                                { $cond: [{ $regexMatch: { input: '$title', regex: searchRegex } }, 100, 0] },
                                // Creator name match gets high score (80)
                                { $cond: [{ $regexMatch: { input: '$creator.name', regex: searchRegex } }, 80, 0] },
                                // Category match gets good score (60)
                                { $cond: [{ $regexMatch: { input: '$category', regex: searchRegex } }, 60, 0] },
                                // Subcategory match gets decent score (50)
                                { $cond: [{ $regexMatch: { input: { $ifNull: ['$subcategory', ''] }, regex: searchRegex } }, 50, 0] },
                                // Tags match gets moderate score (40)
                                { $cond: [{ $gt: [{ $size: { $filter: { input: '$tags', as: 'tag', cond: { $regexMatch: { input: '$$tag', regex: searchRegex } } } } }, 0] }, 40, 0] },
                                // Short description match gets low score (20)
                                { $cond: [{ $regexMatch: { input: '$shortDescription', regex: searchRegex } }, 20, 0] },
                                // Story match gets minimal score (10)
                                { $cond: [{ $regexMatch: { input: '$story', regex: searchRegex } }, 10, 0] }
                            ]
                        }
                    }
                }
            ];
        } else {
            // No search term, just do normal lookup
            searchStages = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'creator',
                        foreignField: '_id',
                        as: 'creator',
                        pipeline: [
                            {
                                $project: {
                                    name: 1,
                                    profilePicture: 1,
                                    profilePictureUrl: 1,
                                    isPremiumAndVerified: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: '$creator' }
            ];
        }
        
        // Common addFields stages
        const commonAddFieldsStages = [
            {
                $project: {
                    amountWithdrawn: 0,
                    pendingWithdrawals: 0,
                    withdrawalRequests: 0
                }
            },
            {
                $addFields: {
                    percentageRaised: {
                        $multiply: [
                            { $divide: ['$amountRaised', '$targetAmount'] },
                            100
                        ]
                    },
                    daysLeft: {
                        $max: [
                            0,
                            {
                                $ceil: {
                                    $divide: [
                                        { $subtract: ['$endDate', new Date()] },
                                        86400000
                                    ]
                                }
                            }
                        ]
                    },
                    // Urgency score: prioritize campaigns with fewer days left and lower percentage
                    urgencyScore: {
                        $add: [
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            {
                                                $max: [
                                                    0,
                                                    {
                                                        $ceil: {
                                                            $divide: [
                                                                { $subtract: ['$endDate', new Date()] },
                                                                86400000
                                                            ]
                                                        }
                                                    }
                                                ]
                                            },
                                            30
                                        ]
                                    },
                                    -50 // Weight for days left (negative because fewer days = more urgent)
                                ]
                            },
                            {
                                $multiply: [
                                    {
                                        $subtract: [
                                            100,
                                            {
                                                $multiply: [
                                                    { $divide: ['$amountRaised', '$targetAmount'] },
                                                    100
                                                ]
                                            }
                                        ]
                                    },
                                    -0.3 // Weight for percentage remaining
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        
        const commonStages = [...searchStages, ...commonAddFieldsStages];
        
        // Determine sort stage based on sortBy parameter
        let sortStage = {};
        
        if (searchTerm && searchTerm.trim()) {
            // When searching, prioritize search score
            sortStage = { searchScore: -1, urgencyScore: -1, amountRaised: -1 };
        } else {
            switch (sortBy) {
                case 'newest':
                    sortStage = { createdAt: -1 };
                    break;
                case 'endingSoon':
                    sortStage = { endDate: 1 };
                    break;
                case 'leastFunded':
                    sortStage = { percentageRaised: 1, amountRaised: 1 };
                    break;
                case 'mostFunded':
                    sortStage = { amountRaised: -1 };
                    break;
                case 'urgency':
                default:
                    sortStage = { urgencyScore: -1, daysLeft: 1, percentageRaised: 1 };
                    break;
            }
        }
        
        // Build pipeline
        const pipeline = [
            { $match: matchStage },
            ...commonStages,
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit }
        ];
        
        // For counting with search, we need a similar pipeline
        let total;
        if (searchTerm && searchTerm.trim()) {
            const countPipeline = [
                { $match: matchStage },
                ...searchStages,
                { $count: 'total' }
            ];
            const countResult = await Campaign.aggregate(countPipeline);
            total = countResult.length > 0 ? countResult[0].total : 0;
        } else {
            total = await Campaign.countDocuments(matchStage);
        }
        
        // Execute aggregation
        const campaigns = await Campaign.aggregate(pipeline);
        
        // Format campaigns with URLs
        const campaignsWithUrls = campaigns.map(campaign => formatCampaignWithUrls(campaign));
        
        // Calculate pagination
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        
        res.status(200).json({
            success: true,
            count: campaignsWithUrls.length,
            total,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage: page > 1,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            campaigns: campaignsWithUrls
        });
    } catch (error) {
        console.error('Error fetching urgent explore:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching urgent campaigns',
            error: error.message
        });
    }
};

module.exports = exports;
