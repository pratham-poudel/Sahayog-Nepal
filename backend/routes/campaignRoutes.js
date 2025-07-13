const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { 
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    getUserCampaigns,
    addCampaignUpdate,
    updateCampaignStatus,
    addCampaignTags,
    deleteCampaign,
    updateCampaign,
    getCampaignsByCategory,
    searchCampaigns,
    getRotatingFeaturedCampaigns,
    getCategories,
    getCategoryHierarchy,
    getCampaignsByHierarchicalCategory
} = require('../controllers/campaignController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
const generateCampaignsCacheKey = (req) => {
    const queryString = Object.entries(req.query)
      .sort()
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  
    const hash = require('crypto')
      .createHash('md5')
      .update(queryString)
      .digest('hex');
  
    return `allCampaigns:${hash}`;  };
router.get('/', cacheMiddleware(generateCampaignsCacheKey), getAllCampaigns);

// Categories route with cache (long TTL since categories don't change often)
router.get('/categories', cacheMiddleware(() => 'categories', 3600), getCategories); // Cache for 1 hour

// Hierarchical categories route
router.get('/categories/hierarchy', cacheMiddleware(() => 'categories_hierarchy', 3600), getCategoryHierarchy); // Cache for 1 hour

// Get campaigns by hierarchical category (with optional subcategory)
router.get('/category/:category/:subcategory?', cacheMiddleware((req) => `hierarchical_category:${req.params.category}:${req.params.subcategory || 'all'}`, 300), getCampaignsByHierarchicalCategory); // Cache for 5 minutes
  
// Featured campaign rotation with cache (short TTL)
router.get('/featured/rotation', cacheMiddleware((req) => {
    const queryString = Object.entries(req.query)
      .sort()
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `featuredRotation:${queryString}`;
}, 60), getRotatingFeaturedCampaigns); // Cache for 60 seconds

router.get('/category/:category',cacheMiddleware((req) => `categoryCampaigns:${req.params.category}`), getCampaignsByCategory);
router.get('/search/:searchTerm', searchCampaigns);
router.get('/:id',cacheMiddleware((req) => `campaignById:${req.params.id}`) ,getCampaignById);

// Protected routes for campaign creators
router.post('/', 
    protect, 
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'additionalImages', maxCount: 3 }
    ]), 
    createCampaign
);

router.put('/:id', 
    protect, 
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'additionalImages', maxCount: 3 }
    ]), 
    updateCampaign
);

router.get('/user/campaigns', protect,getUserCampaigns);
router.post('/:id/updates', protect, addCampaignUpdate);
router.delete('/:id', protect, deleteCampaign);

// Admin routes
router.patch('/:id/status', protect, updateCampaignStatus);
router.patch('/:id/tags', protect, admin, addCampaignTags);

module.exports = router; 