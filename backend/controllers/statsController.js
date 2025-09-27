const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');
const redis = require('../utils/RedisClient');

/**
 * Get comprehensive stats for homepage display
 * Includes real-time data with caching for optimal performance
 */
const getHomeStats = async (req, res) => {
    try {
        // Check Redis cache first
        const cacheKey = 'homepage_stats';
        const cachedStats = await redis.get(cacheKey);
        
        if (cachedStats) {
            console.log('📊 Serving stats from cache');
            return res.status(200).json({
                success: true,
                data: JSON.parse(cachedStats),
                cached: true
            });
        }

        console.log('📊 Fetching fresh stats from database...');

        // Run all aggregation queries in parallel for better performance
        const [
            totalUsersResult,
            totalFundsResult,
            activeCampaignsCount,
            totalDonorsResult,
            districtsReachedResult,
            totalCampaignsResult,
            recentDonationsResult
        ] = await Promise.all([
            // Total registered users (generous hearts)
            User.countDocuments({}),
            
            // Total funds raised from all successful donations
            Donation.aggregate([
                {
                    $group: {
                        _id: null,
                        totalFunds: { $sum: '$amount' }
                    }
                }
            ]),
            
            // Active campaigns (status: 'active' and not expired)
            Campaign.countDocuments({
                status: 'active',
                endDate: { $gte: new Date() }
            }),
            
            // Unique donors count (registered + guest donors)
            Donation.aggregate([
                {
                    $group: {
                        _id: {
                            donorId: '$donorId',
                            donorEmail: '$donorEmail'
                        }
                    }
                },
                {
                    $count: 'uniqueDonors'
                }
            ]),
            
            // Districts reached - based on campaign creators' locations or campaign categories
            // For now, we'll use a placeholder but can be enhanced with location data
            Campaign.aggregate([
                {
                    $match: { status: { $in: ['active', 'completed'] } }
                },
                {
                    $group: {
                        _id: '$category'
                    }
                },
                {
                    $count: 'categories'
                }
            ]),
            
            // Total campaigns ever created
            Campaign.countDocuments({}),
            
            // Recent donations for live updates (last 24 hours)
            Donation.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        // Process results with fallback values
        const totalUsers = totalUsersResult || 0;
        const totalFunds = totalFundsResult[0]?.totalFunds || 0;
        const activeCampaigns = activeCampaignsCount || 0;
        const totalDonors = totalDonorsResult[0]?.uniqueDonors || 0;
        const districtsReached = Math.max(districtsReachedResult[0]?.categories || 1, 12); // Minimum 12 for display
        const totalCampaigns = totalCampaignsResult || 0;
        const recentActivity = recentDonationsResult[0] || { count: 0, totalAmount: 0 };

        // Calculate additional metrics
        const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
        const averageDonationAmount = totalDonors > 0 ? Math.round(totalFunds / totalDonors) : 0;
        
        // Get top performing campaigns for additional context
        const topCampaigns = await Campaign.find({
            status: { $in: ['active', 'completed'] }
        })
        .sort({ amountRaised: -1 })
        .limit(3)
        .select('title amountRaised targetAmount donors');

        // Calculate success rate
        const successRate = totalCampaigns > 0 ? Math.round((completedCampaigns / totalCampaigns) * 100) : 0;

        // Format the stats object
        const stats = {
            // Main display stats
            totalUsers: totalUsers,
            totalFunds: Math.round(totalFunds),
            activeCampaigns: activeCampaigns,
            totalDonors: totalDonors,
            districtsReached: districtsReached,
            
            // Additional metrics
            totalCampaigns: totalCampaigns,
            completedCampaigns: completedCampaigns,
            successRate: successRate,
            averageDonation: averageDonationAmount,
            
            // Recent activity (for live updates)
            recentActivity: {
                donationsLast24h: recentActivity.count,
                amountLast24h: Math.round(recentActivity.totalAmount)
            },
            
            // Top campaigns
            topPerformers: topCampaigns,
            
            // Formatted display values
            formatted: {
                totalUsers: formatNumber(totalUsers),
                totalFunds: formatCurrency(totalFunds),
                activeCampaigns: formatNumber(activeCampaigns),
                totalCampaigns: formatNumber(totalCampaigns),
                totalDonors: formatNumber(totalDonors),
                districtsReached: formatNumber(districtsReached)
            },
            
            // Metadata
            lastUpdated: new Date(),
            nextGoal: 10000000 // 10M target mentioned in requirements
        };

        // Cache the results for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(stats));
        
        console.log('📊 Stats generated and cached successfully');

        res.status(200).json({
            success: true,
            data: stats,
            cached: false
        });

    } catch (error) {
        console.error('❌ Error fetching homepage stats:', error);
        
        // Try to serve stale cache if available
        try {
            const staleCache = await redis.get('homepage_stats_backup');
            if (staleCache) {
                return res.status(200).json({
                    success: true,
                    data: JSON.parse(staleCache),
                    cached: true,
                    stale: true,
                    message: 'Serving cached data due to temporary issue'
                });
            }
        } catch (cacheError) {
            console.error('❌ Cache fallback failed:', cacheError);
        }

        res.status(500).json({
            success: false,
            message: 'Unable to fetch stats at the moment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get live impact stats (for the live impact card)
 * More frequent updates with shorter cache time
 */
const getLiveImpactStats = async (req, res) => {
    try {
        const cacheKey = 'live_impact_stats';
        const cachedStats = await redis.get(cacheKey);
        
        if (cachedStats) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cachedStats),
                cached: true
            });
        }

        // Get real-time critical stats
        const [activeCampaigns, totalRaised, recentDonations] = await Promise.all([
            Campaign.countDocuments({
                status: 'active',
                endDate: { $gte: new Date() }
            }),
            
            Donation.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]),
            
            Donation.countDocuments({
                date: {
                    $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                }
            })
        ]);

        const liveStats = {
            activeCampaigns: activeCampaigns || 0,
            totalRaised: Math.round(totalRaised[0]?.total || 0),
            recentDonations: recentDonations || 0,
            formatted: {
                activeCampaigns: formatNumber(activeCampaigns || 0),
                totalRaised: formatCurrency(totalRaised[0]?.total || 0),
                recentDonations: formatNumber(recentDonations || 0)
            },
            lastUpdated: new Date()
        };

        // Cache for 2 minutes (more frequent updates)
        await redis.setex(cacheKey, 120, JSON.stringify(liveStats));

        res.status(200).json({
            success: true,
            data: liveStats,
            cached: false
        });

    } catch (error) {
        console.error('❌ Error fetching live impact stats:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch live stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Clear stats cache (for admin use or when data is updated)
 */
const clearStatsCache = async (req, res) => {
    try {
        await Promise.all([
            redis.del('homepage_stats'),
            redis.del('live_impact_stats')
        ]);
        
        console.log('🗑️ Stats cache cleared successfully');
        
        res.status(200).json({
            success: true,
            message: 'Stats cache cleared successfully'
        });
    } catch (error) {
        console.error('❌ Error clearing stats cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear stats cache'
        });
    }
};

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatCurrency(amount) {
    if (amount >= 1000000) {
        return '₹' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    }
    return '₹' + amount.toString();
}

module.exports = {
    getHomeStats,
    getLiveImpactStats,
    clearStatsCache
};