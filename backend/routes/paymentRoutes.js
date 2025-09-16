const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
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

// Public routes - Allow guest donations
router.post('/khalti/initiate', initiateKhaltiPayment);
router.post('/khalti/verify', verifyKhaltiPayment);
router.get('/khalti/callback', handleKhaltiCallback);

// eSewa routes - Allow guest donations
router.post('/esewa/initiate', initiateEsewaPayment);
router.post('/esewa/verify', verifyEsewaPayment);
router.get('/esewa/callback', handleEsewaCallback);

// Allow payment verification for both authenticated and guest users
router.get('/:id', getPaymentById);

// Protected routes (require login)
router.get('/user/payments', protect, getUserPayments);
router.get('/campaign/:campaignId', protect, getCampaignPayments);

router.post('/fonepay/initiate', initiateFonepayPayment);
router.post('/fonepay/status', checkFonepayStatus); // Changed to POST and allow guest access
router.get('/fonepay/callback', handleFonepayCallback);

// Admin routes
// Add admin-specific routes here if needed

module.exports = router; 