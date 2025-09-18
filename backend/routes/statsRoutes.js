const express = require('express');
const router = express.Router();
const { 
    getHomeStats, 
    getLiveImpactStats, 
    clearStatsCache 
} = require('../controllers/statsController');

// Cache middleware for additional optimization
const cacheMiddleware = require('../middlewares/cacheMiddleware');

/**
 * @route   GET /api/stats/home
 * @desc    Get comprehensive homepage statistics
 * @access  Public
 * @cache   5 minutes
 */
router.get('/home', cacheMiddleware(300), getHomeStats);

/**
 * @route   GET /api/stats/live-impact
 * @desc    Get live impact statistics (for real-time display)
 * @access  Public
 * @cache   2 minutes
 */
router.get('/live-impact', cacheMiddleware(120), getLiveImpactStats);

/**
 * @route   POST /api/stats/clear-cache
 * @desc    Clear all stats cache (admin only)
 * @access  Private/Admin
 */
router.post('/clear-cache', clearStatsCache);

module.exports = router;