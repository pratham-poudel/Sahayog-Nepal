const Donation = require('../models/Donation');
const User = require('../models/User');
const redis = require('../utils/RedisClient');

// @desc    Get top donors globally for infinite horizontal scroll
// @route   GET /api/donors/top
// @access  Public
exports.getTopDonors = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        // Check cache first (including guest donors)
        const cacheKey = `topDonors:withGuests:limit:${limit}`;
        
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (cacheError) {
            console.warn('Cache read error:', cacheError);
        }

        // Use MongoDB aggregation for efficient processing - include both registered and guest donors
        const pipeline = [
            // Filter out anonymous donations
            {
                $match: {
                    anonymous: { $ne: true }
                }
            },
            // Group by donor (using donorId for registered users, donorEmail for guests)
            {
                $group: {
                    _id: {
                        $cond: [
                            { $ne: ['$donorId', null] },
                            '$donorId',
                            '$donorEmail'
                        ]
                    },
                    donorType: {
                        $first: {
                            $cond: [
                                { $ne: ['$donorId', null] },
                                'registered',
                                'guest'
                            ]
                        }
                    },
                    donorName: {
                        $first: {
                            $cond: [
                                { $ne: ['$donorId', null] },
                                null, // Will lookup from User model
                                '$donorName'
                            ]
                        }
                    },
                    donorEmail: {
                        $first: '$donorEmail'
                    },
                    totalDonated: { $sum: '$amount' },
                    donationCount: { $sum: 1 },
                    lastDonation: { $max: '$date' }
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
            // Lookup donor information for registered users
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                profilePictureUrl: 1,
                                bio: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            },
            // Project final structure with proper donor information
            {
                $project: {
                    _id: 1,
                    totalDonated: 1,
                    donationCount: 1,
                    lastDonation: 1,
                    donorType: 1,
                    donor: {
                        $cond: [
                            { $eq: ['$donorType', 'registered'] },
                            {
                                $ifNull: [
                                    { $arrayElemAt: ['$userInfo', 0] },
                                    {
                                        name: { $ifNull: ['$donorName', 'Anonymous Donor'] },
                                        profilePictureUrl: null,
                                        bio: null,
                                        createdAt: null,
                                        isGuest: true
                                    }
                                ]
                            },
                            {
                                name: { $ifNull: ['$donorName', 'Anonymous Donor'] },
                                profilePictureUrl: null,
                                bio: null,
                                createdAt: null,
                                isGuest: true
                            }
                        ]
                    }
                }
            },
            // Filter out any documents where donor is still null (shouldn't happen but safety check)
            {
                $match: {
                    donor: { $ne: null }
                }
            }
        ];

        const topDonorsResult = await Donation.aggregate(pipeline);

        // Add rank to each donor
        const topDonors = topDonorsResult.map((donor, index) => ({
            ...donor,
            rank: index + 1
        }));

        // Get total count of unique donors (both registered and guest) with non-anonymous donations
        const totalCountPipeline = [
            {
                $match: {
                    anonymous: { $ne: true }
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $ne: ['$donorId', null] },
                            '$donorId',
                            '$donorEmail'
                        ]
                    }
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
                    uniqueRegisteredDonors: { 
                        $addToSet: {
                            $cond: [
                                { $ne: ['$donorId', null] },
                                '$donorId',
                                null
                            ]
                        }
                    },
                    guestDonations: {
                        $sum: {
                            $cond: [{ $eq: ['$donorId', null] }, 1, 0]
                        }
                    },
                    averageDonation: { $avg: '$amount' }
                }
            },
            {
                $addFields: {
                    totalRegisteredDonors: { 
                        $size: { 
                            $filter: {
                                input: '$uniqueRegisteredDonors',
                                cond: { $ne: ['$$this', null] }
                            }
                        }
                    },
                    // Total donors includes registered donors + unique guest donations (approximate)
                    totalDonors: {
                        $add: [
                            { 
                                $size: { 
                                    $filter: {
                                        input: '$uniqueRegisteredDonors',
                                        cond: { $ne: ['$$this', null] }
                                    }
                                }
                            },
                            '$guestDonations'
                        ]
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
