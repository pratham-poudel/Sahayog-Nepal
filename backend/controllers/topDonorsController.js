const Donation = require('../models/Donation');
const User = require('../models/User');
const redis = require('../utils/RedisClient');

// @desc    Get top donors globally for infinite horizontal scroll
// @route   GET /api/donors/top
// @access  Public
exports.getTopDonors = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50; // Get more donors for infinite scroll

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
        }        // Since AstraDB doesn't support aggregation and has sort limitations, 
        // we'll fetch ALL donations in batches (including anonymous ones for total calculation)
        let allDonations = [];
        let hasMore = true;
        let lastId = null;
        
        console.log('Starting to fetch all donations for top donors...');
        
        // Fetch ALL donations in batches to work around AstraDB limitations
        // Increased limits to ensure we get ALL possible donors
        while (hasMore && allDonations.length < 10000) { // Increased safety limit significantly
            const query = {};
            
            if (lastId) {
                query._id = { $gt: lastId };
            }
              const batch = await Donation.find(query)
                .populate('donorId', 'name profilePicture bio createdAt')
                .limit(50); // Increased batch size to get more data per query
            
            console.log(`Fetched batch of ${batch.length} donations. Total so far: ${allDonations.length}`);
            
            if (batch.length === 0) {
                hasMore = false;
            } else {                allDonations = allDonations.concat(batch);
                lastId = batch[batch.length - 1]._id;
                
                // If we got less than 50, we've reached the end
                if (batch.length < 50) {
                    hasMore = false;
                }
            }
        }
          console.log(`Total donations fetched: ${allDonations.length}`);

        // Group donations by donor and calculate totals in memory
        // Include ALL donations for total calculation, but track anonymous status
        const donorMap = new Map();
        
        allDonations.forEach(donation => {
            if (!donation.donorId) {
                console.log('Skipping donation without donorId:', donation._id);
                return; // Skip if donor doesn't exist
            }
            
            const donorId = donation.donorId._id.toString();
            
            if (donorMap.has(donorId)) {
                const existing = donorMap.get(donorId);
                existing.totalDonated += donation.amount;
                existing.donationCount += 1;
                
                // Track if donor has ANY non-anonymous donations
                if (!donation.anonymous) {
                    existing.hasNonAnonymousDonations = true;
                }
                
                // Keep the most recent donation date
                if (donation.date > existing.lastDonation) {
                    existing.lastDonation = donation.date;
                }
            } else {                donorMap.set(donorId, {
                    _id: donorId,
                    totalDonated: donation.amount,
                    donationCount: 1,
                    hasNonAnonymousDonations: !donation.anonymous, // True if this donation is not anonymous
                    lastDonation: donation.date,
                    donor: {
                        _id: donation.donorId._id,
                        name: donation.donorId.name,
                        profilePicture: donation.donorId.profilePicture,
                        bio: donation.donorId.bio,
                        createdAt: donation.donorId.createdAt
                    }
                });
            }        });
        
        console.log(`Total unique donors found: ${donorMap.size}`);

        // Convert map to array, filter out donors who made ALL donations anonymously, 
        // then sort by total donated
        const sortedDonors = Array.from(donorMap.values())
            .filter(donor => donor.hasNonAnonymousDonations) // Only show donors with at least one non-anonymous donation
            .sort((a, b) => b.totalDonated - a.totalDonated);
        
        console.log(`Donors with non-anonymous donations: ${sortedDonors.length}`);// Add rank to each donor and limit results for infinite scroll
        const topDonors = sortedDonors
            .slice(0, limit)
            .map((donor, index) => ({
                _id: donor._id,
                totalDonated: donor.totalDonated,
                donationCount: donor.donationCount,
                lastDonation: donor.lastDonation,
                donor: donor.donor,
                rank: index + 1
            }));

        const response = {
            success: true,
            data: topDonors,
            total: sortedDonors.length,
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
        }        // Since AstraDB doesn't support aggregation, calculate stats in memory
        // Fetch all donations in batches to avoid AstraDB limitations
        let allDonations = [];
        let hasMore = true;
        let lastId = null;
        
        while (hasMore && allDonations.length < 10000) { // Increased safety limit
            const query = {};
            
            if (lastId) {
                query._id = { $gt: lastId };
            }
            
            const batch = await Donation.find(query).limit(50); // Increased batch size
            
            if (batch.length === 0) {
                hasMore = false;
            } else {
                allDonations = allDonations.concat(batch);
                lastId = batch[batch.length - 1]._id;
                
                if (batch.length < 50) {
                    hasMore = false;
                }
            }
        }
        
        if (allDonations.length === 0) {
            const response = {
                success: true,
                data: {
                    totalDonors: 0,
                    totalDonations: 0,
                    totalAmount: 0,
                    averageDonation: 0
                }
            };
            
            // Cache for 30 minutes
            try {
                await redis.set(cacheKey, JSON.stringify(response), 'EX', 1800);
            } catch (cacheError) {
                console.warn('Cache write error:', cacheError);
            }
            
            return res.status(200).json(response);
        }

        // Calculate stats in memory
        const uniqueDonors = new Set();
        let totalAmount = 0;
        
        allDonations.forEach(donation => {
            if (donation.donorId) {
                uniqueDonors.add(donation.donorId.toString());
            }
            totalAmount += donation.amount;
        });

        const stats = {
            totalDonors: uniqueDonors.size,
            totalDonations: allDonations.length,
            totalAmount: totalAmount,
            averageDonation: allDonations.length > 0 ? Math.round((totalAmount / allDonations.length) * 100) / 100 : 0
        };        const response = {
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
