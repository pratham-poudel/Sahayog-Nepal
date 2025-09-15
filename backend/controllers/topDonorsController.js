const Donation = require('../models/Donation');
const User = require('../models/User');
const redis = require('../utils/RedisClient');

// @desc    Get top donors globally for infinite horizontal scroll
// @route   GET /api/donors/top
// @access  Public
exports.getTopDonors = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        // Check cache first
        const cacheKey = `topDonors:all:limit:${limit}`;
        
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (cacheError) {
            console.warn('Cache read error:', cacheError);
        }

        // Use MongoDB aggregation for efficient processing
        const pipeline = [
            // Match only donations with donors (exclude null donors)
            {
                $match: {
                    donorId: { $exists: true, $ne: null }
                }
            },
            // Group by donor and calculate statistics
            {
                $group: {
                    _id: '$donorId',
                    totalDonated: { $sum: '$amount' },
                    donationCount: { $sum: 1 },
                    lastDonation: { $max: '$date' },
                    hasNonAnonymousDonations: {
                        $max: {
                            $cond: [{ $ne: ['$anonymous', true] }, 1, 0]
                        }
                    }
                }
            },
            // Filter out donors who made only anonymous donations
            {
                $match: {
                    hasNonAnonymousDonations: 1
                }
            },
            // Sort by total donated (descending)
            {
                $sort: { totalDonated: -1 }
            },
            // Limit results
            {
                $limit: limit
            },
            // Lookup donor information
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'donor',
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                profilePicture: 1,
                                bio: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$donor'
            },
            // Add rank field
            {
                $addFields: {
                    rank: { $add: [{ $indexOfArray: [[], null] }, 1] }
                }
            },
            // Project final structure
            {
                $project: {
                    _id: 1,
                    totalDonated: 1,
                    donationCount: 1,
                    lastDonation: 1,
                    donor: 1
                }
            }
        ];

        const topDonorsResult = await Donation.aggregate(pipeline);

        // Add rank to each donor
        const topDonors = topDonorsResult.map((donor, index) => ({
            ...donor,
            rank: index + 1
        }));

        // Get total count of unique donors with non-anonymous donations
        const totalCountPipeline = [
            {
                $match: {
                    donorId: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$donorId',
                    hasNonAnonymousDonations: {
                        $max: {
                            $cond: [{ $ne: ['$anonymous', true] }, 1, 0]
                        }
                    }
                }
            },
            {
                $match: {
                    hasNonAnonymousDonations: 1
                }
            },
            {
                $count: "total"
            }
        ];

        const totalResult = await Donation.aggregate(totalCountPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        const response = {
            success: true,
            data: topDonors,
            total: total,
            showing: topDonors.length
        };

        // Cache the result for 10 minutes
        try {
            await redis.set(cacheKey, JSON.stringify(response), 'EX', 600);
        } catch (cacheError) {
            console.warn('Cache write error:', cacheError);
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching top donors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top donors',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get donor statistics
// @route   GET /api/donors/stats
// @access  Public
exports.getDonorStats = async (req, res) => {
    try {
        const cacheKey = 'donorStats:global';
        
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (cacheError) {
            console.warn('Cache read error:', cacheError);
        }

        // Use MongoDB aggregation for efficient statistics calculation
        const pipeline = [
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    uniqueDonors: { $addToSet: '$donorId' },
                    averageDonation: { $avg: '$amount' }
                }
            },
            {
                $addFields: {
                    totalDonors: { 
                        $size: { 
                            $filter: {
                                input: '$uniqueDonors',
                                cond: { $ne: ['$$this', null] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalDonors: 1,
                    totalDonations: 1,
                    totalAmount: { $round: ['$totalAmount', 2] },
                    averageDonation: { $round: ['$averageDonation', 2] }
                }
            }
        ];

        const result = await Donation.aggregate(pipeline);
        
        const stats = result.length > 0 ? result[0] : {
            totalDonors: 0,
            totalDonations: 0,
            totalAmount: 0,
            averageDonation: 0
        };

        const response = {
            success: true,
            data: stats
        };

        // Cache for 30 minutes
        try {
            await redis.set(cacheKey, JSON.stringify(response), 'EX', 1800);
        } catch (cacheError) {
            console.warn('Cache write error:', cacheError);
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching donor stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donor statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
