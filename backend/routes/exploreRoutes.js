const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { 
    getRegularExplore,
    getUrgentExplore
} = require('../controllers/exploreController');

// Generate cache key for explore routes
const generateExploreCacheKey = (type) => (req) => {
    const queryString = Object.entries(req.query)
        .sort()
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
    
    const hash = require('crypto')
        .createHash('md5')
        .update(queryString)
        .digest('hex');
    
    return `explore:${type}:${hash}`;
};

// Regular explore route - shorter cache (60 seconds) for dynamic content mixing
router.get('/regular', 
    cacheMiddleware(generateExploreCacheKey('regular'), 60), 
    getRegularExplore
);

// Urgent explore route - slightly longer cache (120 seconds) since urgent campaigns are more stable
router.get('/urgent', 
    cacheMiddleware(generateExploreCacheKey('urgent'), 120), 
    getUrgentExplore
);

module.exports = router;
