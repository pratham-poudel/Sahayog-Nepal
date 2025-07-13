const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const auth = require('../middleware/adminAuth'); // Assuming you have auth middleware

// GET /api/donations/campaign/:campaignId - Get donations by campaign ID with pagination
router.get('/campaign/:campaignId', donationController.getDonationsByCampaign);

// GET /api/donations/campaign/:campaignId/recent - Get recent donations (limited to 7) for a campaign
router.get('/campaign/:campaignId/recent', donationController.getRecentDonations);

// GET /api/donations/campaign/:campaignId/top-donor - Get top donor for a campaign
router.get('/campaign/:campaignId/top', donationController.getTopDonor);

// GET /api/donations/user/:userId/recent - Get recent donations made to user's campaigns
router.get('/user/:userId/recent', donationController.getRecentDonationsToUserCampaigns);

// New routes for detailed statistics
// GET /api/donations/campaign/:campaignId/statistics - Get comprehensive campaign statistics
router.get('/campaign/:campaignId/statistics', donationController.getCampaignStatistics);

// GET /api/donations/campaign/:campaignId/trends - Get donation trends and analytics
router.get('/campaign/:campaignId/trends', donationController.getDonationTrends);

// GET /api/donations/campaign/:campaignId/donors - Get all donors with pagination for infinite scroll
router.get('/campaign/:campaignId/donors', donationController.getAllDonors);

module.exports = router;