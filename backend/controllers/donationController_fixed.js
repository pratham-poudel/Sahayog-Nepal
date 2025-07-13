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

// Get comprehensive campaign statistics (without aggregation)
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

    // Get all donations for this campaign
    const donations = await Donation.find({ campaignId }).sort({ date: -1 });

    // Calculate statistics manually
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const totalDonors = donations.length;
    const averageDonation = totalDonors > 0 ? totalAmount / totalDonors : 0;
    const maxDonation = donations.length > 0 ? Math.max(...donations.map(d => d.amount)) : 0;
    const minDonation = donations.length > 0 ? Math.min(...donations.map(d => d.amount)) : 0;

    // Get anonymous vs named donors count
    const anonymousCount = donations.filter(d => d.anonymous === true).length;
    const namedCount = donations.filter(d => d.anonymous === false).length;

    // Calculate donation distribution by amount ranges
    const ranges = [
      { min: 0, max: 100, label: '$0-$100' },
      { min: 100, max: 500, label: '$100-$500' },
      { min: 500, max: 1000, label: '$500-$1000' },
      { min: 1000, max: 5000, label: '$1000-$5000' },
      { min: 5000, max: 10000, label: '$5000-$10000' },
      { min: 10000, max: Infinity, label: '$10000+' }
    ];

    const distribution = ranges.map(range => {
      const donationsInRange = donations.filter(d => d.amount >= range.min && d.amount < range.max);
      return {
        _id: range.label,
        count: donationsInRange.length,
        totalAmount: donationsInRange.reduce((sum, d) => sum + d.amount, 0)
      };
    });

    const statistics = {
      totalAmount,
      totalDonors,
      averageDonation,
      maxDonation,
      minDonation,
      anonymousDonors: anonymousCount,
      publicDonors: namedCount,
      completionPercentage: campaign.targetAmount > 0 ? 
        Math.round((totalAmount / campaign.targetAmount) * 100) : 0,
      remainingAmount: Math.max(0, campaign.targetAmount - totalAmount)
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
        statistics,
        distribution
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

// Get donation trends and analytics (without aggregation)
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

    // Get donations within the specified period
    const donations = await Donation.find({ 
      campaignId, 
      date: { $gte: startDate } 
    }).sort({ date: 1 });

    // Group donations by day manually
    const dailyData = {};
    donations.forEach(donation => {
      const dateKey = donation.date.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { dailyAmount: 0, dailyDonors: 0 };
      }
      dailyData[dateKey].dailyAmount += donation.amount;
      dailyData[dateKey].dailyDonors += 1;
    });

    // Convert to array format
    const dailyTrends = Object.entries(dailyData)
      .map(([date, data]) => ({
        _id: {
          year: new Date(date).getFullYear(),
          month: new Date(date).getMonth() + 1,
          day: new Date(date).getDate()
        },
        ...data
      }))
      .sort((a, b) => {
        const dateA = new Date(a._id.year, a._id.month - 1, a._id.day);
        const dateB = new Date(b._id.year, b._id.month - 1, b._id.day);
        return dateA - dateB;
      });

    // Get all donations for hourly distribution
    const allDonations = await Donation.find({ campaignId });
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      _id: hour,
      count: 0,
      totalAmount: 0
    }));

    allDonations.forEach(donation => {
      const hour = donation.date.getHours();
      hourlyData[hour].count += 1;
      hourlyData[hour].totalAmount += donation.amount;
    });

    // Get top donation days
    const topDonationDays = Object.entries(dailyData)
      .map(([date, data]) => ({
        _id: {
          year: new Date(date).getFullYear(),
          month: new Date(date).getMonth() + 1,
          day: new Date(date).getDate()
        },
        ...data
      }))
      .sort((a, b) => b.dailyAmount - a.dailyAmount)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        dailyTrends,
        hourlyDistribution: hourlyData,
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
