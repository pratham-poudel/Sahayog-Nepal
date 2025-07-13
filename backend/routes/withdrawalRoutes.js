const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { protect } = require('../middlewares/authMiddleware');
const adminAuth = require('../middleware/adminAuth');

// User routes - require authentication
router.get('/campaign/:campaignId/summary', protect, withdrawalController.getWithdrawalSummary);
router.post('/request', protect, withdrawalController.createWithdrawalRequest);
router.get('/my-requests', protect, withdrawalController.getMyWithdrawalRequests);
router.get('/request/:requestId', protect, withdrawalController.getWithdrawalRequestDetails);

// Admin routes - require admin authentication via cookies
router.get('/admin/all', adminAuth, withdrawalController.getAllWithdrawalRequests);
router.patch('/admin/process/:requestId', adminAuth, withdrawalController.processWithdrawalRequest);

module.exports = router;
