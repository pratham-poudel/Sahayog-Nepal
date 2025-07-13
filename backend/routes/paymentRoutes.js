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

// Public routes
router.post('/khalti/initiate',protect, initiateKhaltiPayment);
router.post('/khalti/verify', verifyKhaltiPayment);
router.get('/khalti/callback', handleKhaltiCallback);

// eSewa routes
router.post('/esewa/initiate', protect, initiateEsewaPayment);
router.post('/esewa/verify', verifyEsewaPayment);
router.get('/esewa/callback', handleEsewaCallback);

router.get('/:id',protect,cacheMiddleware((req) => `${req.user._id}:${req.params.id}`), getPaymentById);

// Protected routes (require login)
router.get('/user/payments', protect, getUserPayments);
router.get('/campaign/:campaignId', protect, getCampaignPayments);

router.post('/fonepay/initiate',protect, initiateFonepayPayment);
router.get('/fonepay/status/:transactionId', protect, checkFonepayStatus);
router.get('/fonepay/callback', handleFonepayCallback);

// Admin routes
// Add admin-specific routes here if needed

module.exports = router; 