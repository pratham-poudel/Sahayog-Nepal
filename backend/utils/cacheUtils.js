const redis = require('./RedisClient');

/**
 * Utility functions for cache management
 */

/**
 * Clear all campaign-related cache entries
 * This is used when campaigns are created, updated, or deleted
 */
const clearCampaignCaches = async () => {
    try {
        // Get all keys that match campaign patterns
        const patterns = [
            'allCampaigns:*',
            'categoryCampaigns:*', 
            'campaignById:*',
            'featuredRotation:*',
            'hierarchical_category:*'
        ];

        for (const pattern of patterns) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                console.log(`🧹 Cleared ${keys.length} cache entries for pattern: ${pattern}`);
            }
        }
    } catch (error) {
        console.error('❌ Error clearing campaign caches:', error);
    }
};

/**
 * Clear user-specific campaign cache
 */
const clearUserCampaignCache = async (userId) => {
    try {
        const pattern = `userCampaigns:${userId}*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`🧹 Cleared user campaign cache for user: ${userId}`);
        }
    } catch (error) {
        console.error('❌ Error clearing user campaign cache:', error);
    }
};

/**
 * Clear category-specific campaign cache
 */
const clearCategoryCampaignCache = async (category) => {
    try {
        const patterns = [
            `categoryCampaigns:${category}*`,
            `hierarchical_category:${category}:*`
        ];

        for (const pattern of patterns) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                console.log(`🧹 Cleared category campaign cache for: ${category}`);
            }
        }
    } catch (error) {
        console.error('❌ Error clearing category campaign cache:', error);
    }
};

/**
 * Clear specific campaign cache
 */
const clearSpecificCampaignCache = async (campaignId) => {
    try {
        const pattern = `campaignById:${campaignId}*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`🧹 Cleared cache for campaign: ${campaignId}`);
        }
    } catch (error) {
        console.error('❌ Error clearing specific campaign cache:', error);
    }
};

module.exports = {
    clearCampaignCaches,
    clearUserCampaignCache,
    clearCategoryCampaignCache,
    clearSpecificCampaignCache
};