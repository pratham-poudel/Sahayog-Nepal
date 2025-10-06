const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { donationLimiter, publicReadLimiter } = require('../middlewares/advancedRateLimiter');
const { 
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  handleKhaltiCallback,
  initiateEsewaPayment,
  verifyEsewaPayment,
  handleEsewaCallback,
  getPaymentById,
  getUserPayments,
  getCampaignPayments,
  initiateFonepayPayment,
  checkFonepayStatus,
  handleFonepayCallback

} = require('../controllers/paymentController');

// Public routes - Allow guest donations with rate limiting
router.post('/khalti/initiate', donationLimiter, initiateKhaltiPayment);
router.post('/khalti/verify', verifyKhaltiPayment);
router.get('/khalti/callback', handleKhaltiCallback);

// eSewa routes - Allow guest donations with rate limiting
router.post('/esewa/initiate', donationLimiter, initiateEsewaPayment);
router.post('/esewa/verify', verifyEsewaPayment);
router.get('/esewa/callback', handleEsewaCallback);

// Fonepay routes - Allow guest donations with rate limiting
router.post('/fonepay/initiate', donationLimiter, initiateFonepayPayment);
router.post('/fonepay/status', checkFonepayStatus);
router.get('/fonepay/callback', handleFonepayCallback);

// Allow payment verification for both authenticated and guest users
router.get('/:id', publicReadLimiter, getPaymentById);

// Protected routes (require login)
router.get('/user/payments', protect, getUserPayments);
router.get('/campaign/:campaignId', protect, getCampaignPayments);

router.post('/fonepay/initiate', initiateFonepayPayment);
router.post('/fonepay/status', checkFonepayStatus); // Changed to POST and allow guest access
router.get('/fonepay/callback', handleFonepayCallback);

// Admin routes
// Add admin-specific routes here if needed

module.exports = router; 