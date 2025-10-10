const WithdrawalRequest = require('../models/WithdrawalRequest');
const Campaign = require('../models/Campaign');
const BankAccount = require('../models/BankAccount');
const mongoose = require('mongoose');
const { sendWithdrawalRequestEmail,sendWithdrawStatusEmail } = require('../utils/SendWithDrawEmail');
const { clearSpecificCampaignCache } = require('../utils/cacheUtils');


// Get withdrawal summary for a campaign
const getWithdrawalSummary = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;

    // Get campaign with withdrawal info
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (campaign.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Get user's verified bank accounts
    const verifiedBankAccounts = await BankAccount.find({
      userId: userId,
      verificationStatus: 'verified',
      isActive: true
    }).select('bankName accountNumber accountName documentType isPrimary');

    // Get pending withdrawal requests for this campaign
    const pendingRequests = await WithdrawalRequest.find({
      campaign: campaignId,
      status: { $in: ['pending', 'approved', 'processing'] }
    }).populate('bankAccount', 'bankName accountNumber accountName');

    // Check if campaign is ended
    const isCampaignEnded = campaign.status === 'completed' || new Date(campaign.endDate) < new Date();
    
    const withdrawalSummary = {
      campaign: {
        id: campaign._id,
        title: campaign.title,
        targetAmount: campaign.targetAmount,
        amountRaised: campaign.amountRaised,
        amountWithdrawn: campaign.amountWithdrawn,
        pendingWithdrawals: campaign.pendingWithdrawals,
        availableForWithdrawal: campaign.availableForWithdrawal,
        isWithdrawalEligible: campaign.isWithdrawalEligible,
        withdrawalPercentage: campaign.withdrawalPercentage,
        isCampaignEnded: isCampaignEnded
      },
      verifiedBankAccounts,
      pendingRequests,
      withdrawalRules: {
        minimumAmount: isCampaignEnded ? 1 : 10000,
        processingTime: '3-5 business days',
        processingFee: 0, // or percentage
        note: isCampaignEnded 
          ? 'Campaign has ended - you can withdraw any available amount' 
          : 'Campaign is active - minimum NPR 10,000 required for withdrawal'
      }
    };

    res.json({
      success: true,
      data: withdrawalSummary
    });

  } catch (error) {
    console.error('Get withdrawal summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create withdrawal request
// Note: Turnstile validation is now handled by middleware for financial operations security
const createWithdrawalRequest = async (req, res) => {
  try {
    const { campaignId, bankAccountId, requestedAmount, reason, withdrawalType } = req.body;
    const userId = req.user.id;

    // Validate campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (campaign.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Validate LAP letter exists
    if (!campaign.lapLetter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Local Authority Permission (LAP) Letter is required before processing withdrawals for this campaign. Please upload the LAP letter first.' 
      });
    }

    // Check campaign end status for flexible withdrawal rules
    const isCampaignEnded = campaign.status === 'completed' || new Date(campaign.endDate) < new Date();
    
    // For ended campaigns: allow any amount > 0
    // For active campaigns: require minimum 10,000 NPR
    const minimumAmount = isCampaignEnded ? 1 : 10000;
    
    // Check if campaign has minimum amount for withdrawal
    if (campaign.availableForWithdrawal < minimumAmount) {
      return res.status(400).json({ 
        success: false, 
        message: isCampaignEnded 
          ? 'No funds available for withdrawal'
          : 'Minimum NPR 10,000 required for withdrawal from active campaigns',
        availableAmount: campaign.availableForWithdrawal,
        campaignEnded: isCampaignEnded
      });
    }

    // Validate requested amount
    if (requestedAmount > campaign.availableForWithdrawal) {
      return res.status(400).json({
        success: false,
        message: 'Requested amount exceeds available balance',
        availableAmount: campaign.availableForWithdrawal
      });
    }

    // Validate minimum requested amount
    const minimumRequestAmount = isCampaignEnded ? 1 : 1000;
    
    if (requestedAmount < minimumRequestAmount) {
      return res.status(400).json({
        success: false,
        message: isCampaignEnded 
          ? 'Minimum withdrawal amount is NPR 1'
          : 'Minimum withdrawal amount is NPR 1,000 for active campaigns'
      });
    }    // Validate bank account
    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount || bankAccount.userId.toString() !== userId || 
        bankAccount.verificationStatus !== 'verified' || !bankAccount.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or unverified bank account selected' 
      });
    }    // Check for existing pending withdrawal requests for this campaign
    const existingPendingRequest = await WithdrawalRequest.findOne({
      campaign: campaignId,
      creator: userId,
      status: { $in: ['pending', 'processing'] }
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request for this campaign. Please wait for it to be processed before submitting a new request.',
        existingRequest: {
          id: existingPendingRequest._id,
          amount: existingPendingRequest.requestedAmount,
          status: existingPendingRequest.status,
          createdAt: existingPendingRequest.createdAt
        }
      });
    }    // Calculate actual available balance (considering pending withdrawals)
    const pendingWithdrawals = await WithdrawalRequest.find({
      campaign: campaign._id,
      status: { $in: ['pending', 'processing'] }
    });

    const totalPendingWithdrawals = pendingWithdrawals.reduce((sum, req) => sum + (req.requestedAmount || 0), 0);
    const actualAvailableBalance = campaign.availableForWithdrawal - totalPendingWithdrawals;

    // Validate requested amount against actual available balance
    if (requestedAmount > actualAvailableBalance) {
      return res.status(400).json({
        success: false,
        message: `Requested amount exceeds available balance. Available: NPR ${actualAvailableBalance.toLocaleString()} (after considering pending withdrawals)`,
        availableAmount: actualAvailableBalance,
        pendingWithdrawals: totalPendingWithdrawals
      });
    }// Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      campaign: campaignId,
      creator: userId,
      bankAccount: bankAccountId,
      requestedAmount,
      availableAmount: campaign.availableForWithdrawal,
      reason,
      withdrawalType: withdrawalType || 'partial'
    });

    await withdrawalRequest.save();

    // Update campaign's pending withdrawals
    campaign.pendingWithdrawals += requestedAmount;
    campaign.withdrawalRequests.push(withdrawalRequest._id);
    await campaign.save();

    // Populate response
    await withdrawalRequest.populate([
      { path: 'campaign', select: 'title targetAmount amountRaised' },
      { path: 'bankAccount', select: 'bankName accountNumber accountName' }
    ]);

      try {
      await sendWithdrawalRequestEmail(req.user.email, {
        requestedAmount,
        campaignTitle: campaign.title,
        bankAccountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        reason,
        requestId: withdrawalRequest._id.toString().slice(-8).toUpperCase(),
        withdrawalId: withdrawalRequest._id.toString()
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawalRequest
    });

  } catch (error) {
    console.error('Create withdrawal request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's withdrawal requests
const getMyWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { creator: userId };
    if (status) query.status = status;

    // Let's debug this step by step
    console.log('=== DEBUGGING WITHDRAWAL REQUESTS ===');
    console.log('User ID:', userId);
    console.log('Query:', query);

    // First, get raw withdrawal requests
    const rawRequests = await WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('Raw requests count:', rawRequests.length);
    console.log('Raw requests campaign IDs:', rawRequests.map(r => r.campaign));

    // Check if campaigns exist in database
    const campaignIds = rawRequests.map(r => r.campaign).filter(Boolean);
    console.log('Campaign IDs to lookup:', campaignIds);

    if (campaignIds.length > 0) {
      const existingCampaigns = await Campaign.find({ _id: { $in: campaignIds } });
      console.log('Found campaigns:', existingCampaigns.length);
      console.log('Campaign details:', existingCampaigns.map(c => ({
        id: c._id,
        title: c.title,
        status: c.status
      })));
    }

    // Now try the regular populate
    const requests = await WithdrawalRequest.find(query)
      .populate('campaign', 'title targetAmount amountRaised coverImage')
      .populate('bankAccount', 'bankName accountNumber accountName')
      .populate('adminResponse.reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('After populate - campaign results:', requests.map(r => ({
      id: r._id,
      campaign: r.campaign
    })));

    const total = await WithdrawalRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get my withdrawal requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all withdrawal requests with comprehensive data
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;

    // Build comprehensive query
    let query = {};
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get requests with comprehensive populated data
    const requests = await WithdrawalRequest.find(query)
      .populate({
        path: 'campaign', 
        select: 'title creator targetAmount amountRaised coverImage'
      })
      .populate({
        path: 'creator', 
        select: 'name email phone bio profilePicture createdAt'
      })
      .populate({
        path: 'bankAccount',
        select: 'bankName accountNumber accountName associatedPhoneNumber documentType documentNumber verificationStatus verificationDate isPrimary isActive documentImage'
      })
      .populate('adminResponse.reviewedBy', 'username')
      .populate('processingDetails.processedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Apply search filter if provided (search in memory for better matching)
    let filteredRequests = requests;
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredRequests = requests.filter(request => {
        return (
          (request.campaign?.title?.toLowerCase().includes(searchTerm)) ||
          (request.creator?.name?.toLowerCase().includes(searchTerm)) ||
          (request.creator?.email?.toLowerCase().includes(searchTerm)) ||
          (request.creator?.phone?.toLowerCase().includes(searchTerm)) ||
          (request.bankAccount?.bankName?.toLowerCase().includes(searchTerm)) ||
          (request.bankAccount?.accountNumber?.toLowerCase().includes(searchTerm)) ||
          (request.bankAccount?.accountName?.toLowerCase().includes(searchTerm))
        );
      });
    }

    const total = await WithdrawalRequest.countDocuments(query);    // Get summary stats using regular queries
    const stats = {};
    const statuses = ['pending', 'approved', 'processing', 'completed', 'rejected', 'failed'];
    
    for (const status of statuses) {
      const count = await WithdrawalRequest.countDocuments({ status });
      if (count > 0) {
        const statusRequests = await WithdrawalRequest.find({ status });
        const totalAmount = statusRequests.reduce((sum, req) => sum + (req.requestedAmount || 0), 0);
        stats[status] = {
          count,
          totalAmount
        };
      } else {
        stats[status] = { count: 0, totalAmount: 0 };
      }
    }    res.json({
      success: true,
      data: filteredRequests, // Use filtered results for search
      stats,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Process withdrawal request
// Process withdrawal request (Admin only)
const processWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, comments, transactionReference, processingFee } = req.body;
    const adminId = req.admin?.id || req.admin?._id; // Use admin from adminAuth middleware

    const request = await WithdrawalRequest.findById(requestId)
      .populate('campaign');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const previousStatus = request.status;
    request.status = action;

    if (action === 'approved') {
      request.adminResponse = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        comments,
        action: 'approved'
      };
    } else if (action === 'rejected') {
      request.adminResponse = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        comments,
        action: 'rejected'
      };
      
      // Release pending amount
      const campaign = request.campaign;
      campaign.pendingWithdrawals -= request.requestedAmount;
      await campaign.save();
      
    } else if (action === 'processing') {
      request.adminResponse = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        comments,
        action: 'processing'
      };
      
    } else if (action === 'completed') {
      request.processingDetails = {
        processedBy: adminId,
        processedAt: new Date(),
        transactionReference,
        processingFee: processingFee || 0,
        finalAmount: request.requestedAmount - (processingFee || 0)
      };

      // Update campaign amounts
      const campaign = request.campaign;
      campaign.amountWithdrawn += request.requestedAmount;
      campaign.pendingWithdrawals -= request.requestedAmount;
      
      // Auto-create campaign update for transparency
      const finalAmount = request.requestedAmount - (processingFee || 0);
      const updateContent = `A withdrawal of NPR ${request.requestedAmount.toLocaleString()} has been successfully processed and transferred to the campaign creator's bank account.`
        + (processingFee && processingFee > 0 ? ` Processing fee: NPR ${processingFee.toLocaleString()}, Final amount transferred: NPR ${finalAmount.toLocaleString()}.` : '')
        + ` This ensures transparency in how the funds raised are being utilized for the campaign's stated purpose.`;
      
      campaign.updates.push({
        date: new Date(),
        title: 'Withdrawal Completed',
        content: updateContent
      });
      
      await campaign.save();
      
      // Clear campaign cache to ensure updates are visible immediately
      await clearSpecificCampaignCache(campaign._id);
      
    } else if (action === 'failed') {
      request.adminResponse = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        comments,
        action: 'failed'
      };
      
      // Release pending amount back to available for withdrawal
      const campaign = request.campaign;
      campaign.pendingWithdrawals -= request.requestedAmount;
      await campaign.save();
    }

    await request.save();
    // Send status update email
    if (['completed', 'rejected', 'failed'].includes(action)) {
      try {
        // Get user email - you'll need to populate the creator
        const requestWithUser = await WithdrawalRequest.findById(requestId)
          .populate('creator', 'email')
          .populate('campaign', 'title')
          .populate('bankAccount', 'accountName bankName accountNumber');

        await sendWithdrawStatusEmail(requestWithUser.creator.email, {
          status: action,
          requestedAmount: request.requestedAmount,
          campaignTitle: requestWithUser.campaign.title,
          bankAccountName: requestWithUser.bankAccount.accountName,
          bankName: requestWithUser.bankAccount.bankName,
          accountNumber: requestWithUser.bankAccount.accountNumber,
          reason: request.reason,
          requestId: request._id.toString().slice(-8).toUpperCase(),
          withdrawalId: request._id.toString(),
          comments: comments,
          transactionReference: transactionReference,
          processingFee: processingFee,
          finalAmount: request.processingDetails?.finalAmount,
          processedDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        });
      } catch (emailError) {
        console.error('Status email sending failed:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: `Withdrawal request ${action} successfully`,
      data: request
    });

  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single withdrawal request details
const getWithdrawalRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await WithdrawalRequest.findById(requestId)
      .populate('campaign', 'title targetAmount amountRaised coverImage creator')
      .populate('bankAccount', 'bankName accountNumber accountName')
      .populate('adminResponse.reviewedBy', 'username')
      .populate('processingDetails.processedBy', 'username');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    // Check if user owns this request (unless admin)
    if (request.creator.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Get withdrawal request details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWithdrawalSummary,
  createWithdrawalRequest,
  getMyWithdrawalRequests,
  getAllWithdrawalRequests,
  processWithdrawalRequest,
  getWithdrawalRequestDetails
};
