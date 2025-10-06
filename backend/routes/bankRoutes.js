const express = require('express');
const router = express.Router();

// Import middlewares
const { protect } = require('../middlewares/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const { bankAccountLimiter, uploadLimiter, adminLimiter } = require('../middlewares/advancedRateLimiter');

// Import bank controller functions
const {
    createBankAccount,
    getUserBankAccounts,
    getBankAccount,
    updateBankAccount,
    uploadBankAccountDocument,
    getDocumentInfo,    deleteBankAccount,
    getAllBankAccounts,
    getAdminBankAccount,
    verifyBankAccount,
    rejectBankAccount,
    updateBankAccountStatus,
    getBankAccountStats,
    adminDeleteBankAccount
} = require('../controllers/bankController');

// ============= USER ROUTES =============

// @route   GET /api/bank/document-info
// @desc    Get document upload information and requirements
// @access  Private (User)
router.get('/document-info', protect, getDocumentInfo);

// @route   POST /api/bank/accounts
// @desc    Create a new bank account
// @access  Private (User)
router.post('/accounts', protect, bankAccountLimiter, createBankAccount);

// @route   GET /api/bank/accounts
// @desc    Get user's bank accounts
// @access  Private (User)
router.get('/accounts', protect, getUserBankAccounts);

// @route   GET /api/bank/accounts/:id
// @desc    Get single bank account
// @access  Private (User)
router.get('/accounts/:id', protect, getBankAccount);

// @route   PUT /api/bank/accounts/:id
// @desc    Update bank account
// @access  Private (User)
router.put('/accounts/:id', protect, bankAccountLimiter, updateBankAccount);

// @route   POST /api/bank/accounts/:id/upload-document
// @desc    Upload/Update document for bank account
// @access  Private (User)
router.post('/accounts/:id/upload-document',
    protect,
    uploadLimiter,
    uploadBankAccountDocument
);

// @route   DELETE /api/bank/accounts/:id
// @desc    Delete bank account (soft delete)
// @access  Private (User)
router.delete('/accounts/:id', protect, bankAccountLimiter, deleteBankAccount);

// ============= ADMIN ROUTES =============

// @route   GET /api/bank/admin/accounts
// @desc    Get all bank accounts with filtering and pagination
// @access  Private (Admin)
router.get('/admin/accounts', adminAuth, adminLimiter, getAllBankAccounts);

// @route   GET /api/bank/admin/accounts/:id
// @desc    Get bank account by ID
// @access  Private (Admin)
router.get('/admin/accounts/:id', adminAuth, getAdminBankAccount);

// @route   POST /api/bank/admin/accounts/:id/verify
// @desc    Verify bank account
// @access  Private (Admin)
router.post('/admin/accounts/:id/verify', adminAuth, adminLimiter, verifyBankAccount);

// @route   POST /api/bank/admin/accounts/:id/reject
// @desc    Reject bank account
// @access  Private (Admin)
router.post('/admin/accounts/:id/reject', adminAuth, adminLimiter, rejectBankAccount);

// @route   PUT /api/bank/admin/accounts/:id/status
// @desc    Update bank account status
// @access  Private (Admin)
router.put('/admin/accounts/:id/status', adminAuth, adminLimiter, updateBankAccountStatus);

// @route   DELETE /api/bank/admin/accounts/:id
// @desc    Delete bank account (Admin)
// @access  Private (Admin)
router.delete('/admin/accounts/:id', adminAuth, adminLimiter, adminDeleteBankAccount);

// @route   GET /api/bank/admin/stats
// @desc    Get bank accounts statistics
// @access  Private (Admin)
router.get('/admin/stats', adminAuth, getBankAccountStats);

module.exports = router;
