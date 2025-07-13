const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');

// Get donations by campaign ID with pagination
exports.getDonationsByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    const donations = await Donation.find({ campaignId })
      .populate('donorId', 'name email profilePicture')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Donation.countDocuments({ campaignId });
    
    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get recent donations (limited to 7) for a campaign
exports.getRecentDonations = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    const donations = await Donation.find({ campaignId })
      .populate('donorId', 'name email profilePicture')
      .sort({ date: -1 })
      .limit(7);
    
    res.status(200).json({
      success: true,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get top donor for a campaign (highest amount)
exports.getTopDonor = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    const topDonor = await Donation.findOne({ campaignId })
      .populate('donorId', 'name email profilePicture')
      .sort({ amount: -1 });
    
    res.status(200).json({
      success: true,
      data: topDonor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get recent donations made to user's campaigns
exports.getRecentDonationsToUserCampaigns = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // First, get all campaigns created by the user
    const userCampaigns = await Campaign.find({ creator: userId }).select('_id title');
    const campaignIds = userCampaigns.map(campaign => campaign._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get recent donations to these campaigns, excluding donations made by the user themselves
    const donations = await Donation.find({ 
      campaignId: { $in: campaignIds },
      donorId: { $ne: userId } // Exclude donations made by the user themselves
    })
      .populate('donorId', 'name email profilePicture')
      .populate('campaignId', 'title')
      .sort({ date: -1 })
      .limit(4); // Limit to 4 donations

    res.status(200).json({
      success: true,
      data: donations
    });
  } catch (error) {
    console.error('Error fetching recent donations to user campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get comprehensive campaign statistics
exports.getCampaignStatistics = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    // Get campaign details
    const campaign = await Campaign.findById(campaignId)
      .populate('creator', 'name email profilePicture');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Get donation statistics
    const donationStats = await Donation.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalDonors: { $sum: 1 },
          averageDonation: { $avg: '$amount' },
          maxDonation: { $max: '$amount' },
          minDonation: { $min: '$amount' },
          anonymousDonors: {
            $sum: { $cond: [{ $eq: ['$anonymous', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get donation distribution by amount ranges
    const donationDistribution = await Donation.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      {
        $bucket: {
          groupBy: '$amount',
          boundaries: [0, 100, 500, 1000, 5000, 10000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      }
    ]);

    const stats = donationStats[0] || {
      totalAmount: 0,
      totalDonors: 0,
      averageDonation: 0,
      maxDonation: 0,
      minDonation: 0,
      anonymousDonors: 0
    };

    res.status(200).json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          title: campaign.title,
          targetAmount: campaign.targetAmount,
          amountRaised: campaign.amountRaised,
          creator: campaign.creator,
          startDate: campaign.createdAt,
          endDate: campaign.endDate
        },
        statistics: {
          ...stats,
          completionPercentage: Math.round((campaign.amountRaised / campaign.targetAmount) * 100),
          remainingAmount: Math.max(0, campaign.targetAmount - campaign.amountRaised),
          publicDonors: stats.totalDonors - stats.anonymousDonors
        },
        distribution: donationDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching campaign statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get donation trends and analytics
exports.getDonationTrends = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { period = '30' } = req.query; // Default to 30 days
    
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get daily donation trends
    const dailyTrends = await Donation.aggregate([
      { 
        $match: { 
          campaignId: new mongoose.Types.ObjectId(campaignId),
          date: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          dailyAmount: { $sum: '$amount' },
          dailyDonors: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get hourly distribution (for activity patterns)
    const hourlyDistribution = await Donation.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: { $hour: '$date' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get top donation days
    const topDonationDays = await Donation.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          dailyAmount: { $sum: '$amount' },
          dailyDonors: { $sum: 1 }
        }
      },
      { $sort: { dailyAmount: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyTrends,
        hourlyDistribution,
        topDonationDays,
        period: daysBack
      }
    });
  } catch (error) {
    console.error('Error fetching donation trends:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get all donors with pagination for infinite scroll
exports.getAllDonors = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    // Get donations with donor information, including anonymous ones
    const donations = await Donation.find({ campaignId })
      .populate({
        path: 'donorId',
        select: 'name email profilePicture',
        // Don't fail if donor is null (anonymous donation)
        options: { strictPopulate: false }
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({ campaignId });
    
    // Format the response to handle anonymous donations
    const formattedDonations = donations.map(donation => ({
      _id: donation._id,
      amount: donation.amount,
      message: donation.message,
      date: donation.date,
      anonymous: donation.anonymous,
      donor: donation.anonymous 
        ? { name: 'Anonymous Donor', profilePicture: null }
        : donation.donorId || { name: 'Unknown Donor', profilePicture: null }
    }));
    
    res.status(200).json({
      success: true,
      data: formattedDonations,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching all donors:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};