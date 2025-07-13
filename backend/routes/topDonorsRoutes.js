const express = require('express');
const router = express.Router();
const { getTopDonors, getDonorStats } = require('../controllers/topDonorsController');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { dataHeavyLimiter } = require('../middlewares/rateLimitMiddleware');

// Apply rate limiting to all routes in this router
router.use(dataHeavyLimiter);

// @route   GET /api/donors/top
// @desc    Get top donors globally
// @access  Public
router.get('/top', 
    cacheMiddleware((req) => {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        return `topDonors:page:${page}:limit:${limit}`;
    }), 
    getTopDonors
);

// @route   GET /api/donors/stats
// @desc    Get donor statistics
// @access  Public
router.get('/stats', 
    cacheMiddleware('donorStats:global'), 
    getDonorStats
);

module.exports = router;
