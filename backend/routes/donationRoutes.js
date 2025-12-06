const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { protect, checkBanStatus } = require('../middlewares/authMiddleware');


// GET /api/donations/campaign/:campaignId - Get donations by campaign ID with pagination
router.get('/campaign/:campaignId', protect, checkBanStatus, donationController.getDonationsByCampaign);

// GET /api/donations/campaign/:campaignId/recent - Get recent donations (limited to 7) for a campaign
router.get('/campaign/:campaignId/recent', checkBanStatus, donationController.getRecentDonations);

// GET /api/donations/campaign/:campaignId/top-donor - Get top donor for a campaign
router.get('/campaign/:campaignId/top', checkBanStatus, donationController.getTopDonor);

// GET /api/donations/user/:userId/recent - Get recent donations made to user's campaigns
router.get('/user/:userId/recent', protect, checkBanStatus, donationController.getRecentDonationsToUserCampaigns);

// New routes for detailed statistics
// GET /api/donations/campaign/:campaignId/statistics - Get comprehensive campaign statistics
router.get('/campaign/:campaignId/statistics', protect, checkBanStatus, donationController.getCampaignStatistics);

// GET /api/donations/campaign/:campaignId/trends - Get donation trends and analytics
router.get('/campaign/:campaignId/trends', protect, checkBanStatus, donationController.getDonationTrends);

// GET /api/donations/campaign/:campaignId/donors - Get all donors with pagination for infinite scroll
router.get('/campaign/:campaignId/donors', protect, checkBanStatus, donationController.getAllDonors);

module.exports = router;