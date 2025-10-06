const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { protect } = require('../middlewares/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
// Import Turnstile middleware for security verification on financial operations
const { turnstileMiddleware } = require('../middlewares/turnstileMiddleware');
// Import withdrawal rate limiter for protection against abuse
const { withdrawalLimiter, adminLimiter } = require('../middlewares/advancedRateLimiter');

// User routes - require authentication
router.get('/campaign/:campaignId/summary', protect, withdrawalController.getWithdrawalSummary);
router.post('/request', protect, withdrawalLimiter, turnstileMiddleware, withdrawalController.createWithdrawalRequest); // Security verification + rate limiting
router.get('/my-requests', protect, withdrawalController.getMyWithdrawalRequests);
router.get('/request/:requestId', protect, withdrawalController.getWithdrawalRequestDetails);

// Admin routes - require admin authentication via cookies
router.get('/admin/all', adminAuth, adminLimiter, withdrawalController.getAllWithdrawalRequests);
router.patch('/admin/process/:requestId', adminAuth, adminLimiter, withdrawalController.processWithdrawalRequest);

module.exports = router;
