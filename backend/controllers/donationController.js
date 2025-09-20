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
      .populate({
        path: 'donorId',
        select: 'name email profilePicture',
        options: { strictPopulate: false } // Allow null donorId for guest donations
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    // Format donations to handle guest donations
    const formattedDonations = donations.map(donation => {
      if (!donation.donorId && donation.donorName) {
        // Guest donation - use name and email from donation record
        return {
          ...donation.toObject(),
          donorId: {
            name: donation.donorName,
            email: donation.donorEmail,
            profilePicture: null
          }
        };
      }
      return donation;
    });
    
    const total = await Donation.countDocuments({ campaignId });
    
    res.status(200).json({
      success: true,
      data: formattedDonations,
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
      .populate({
        path: 'donorId',
        select: 'name email profilePicture',
        options: { strictPopulate: false } // Allow null donorId for guest donations
      })
      .sort({ date: -1 })
      .limit(7);
    
    // Format donations to handle guest donations
    const formattedDonations = donations.map(donation => {
      if (!donation.donorId && donation.donorName) {
        // Guest donation - use name and email from donation record
        return {
          ...donation.toObject(),
          donorId: {
            name: donation.donorName,
            email: donation.donorEmail,
            profilePicture: null
          }
        };
      }
      return donation;
    });
    
    res.status(200).json({
      success: true,
      data: formattedDonations
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
      .populate({
        path: 'donorId',
        select: 'name email profilePicture',
        options: { strictPopulate: false } // Allow null donorId for guest donations
      })
      .sort({ amount: -1 });
    
    // Format donation to handle guest donation
    let formattedTopDonor = topDonor;
    if (topDonor && !topDonor.donorId && topDonor.donorName) {
      // Guest donation - use name and email from donation record
      formattedTopDonor = {
        ...topDonor.toObject(),
        donorId: {
          name: topDonor.donorName,
          email: topDonor.donorEmail,
          profilePicture: null
        }
      };
    }
    
    res.status(200).json({
      success: true,
      data: formattedTopDonor
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

    // Use aggregation pipeline for better performance
    const pipeline = [
      {
        $lookup: {
          from: 'campaigns',
          localField: 'campaignId',
          foreignField: '_id',
          as: 'campaign'
        }
      },
      {
        $unwind: '$campaign'
      },
      {
        $match: {
          'campaign.creator': new mongoose.Types.ObjectId(userId),
          donorId: { $ne: new mongoose.Types.ObjectId(userId) }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'donorId',
          foreignField: '_id',
          as: 'donor',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                profilePicture: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$donor',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          message: 1,
          date: 1,
          anonymous: 1,
          donorName: 1,
          donorId: '$donor',
          campaignId: {
            _id: '$campaign._id',
            title: '$campaign.title'
          }
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $limit: 4
      }
    ];

    const donations = await Donation.aggregate(pipeline);

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

// Get comprehensive campaign statistics using aggregation
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
      .populate('creator', 'name email profilePicture isPremiumAndVerified');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Use aggregation pipeline for efficient statistics calculation
    const statisticsPipeline = [
      {
        $match: { campaignId: new mongoose.Types.ObjectId(campaignId) }
      },
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
          },
          publicDonors: {
            $sum: { $cond: [{ $eq: ['$anonymous', false] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          completionPercentage: {
            $cond: [
              { $gt: [campaign.targetAmount, 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$totalAmount', campaign.targetAmount] }, 100] },
                  0
                ]
              },
              0
            ]
          },
          remainingAmount: {
            $max: [0, { $subtract: [campaign.targetAmount, '$totalAmount'] }]
          }
        }
      }
    ];

    // Get donation distribution by amount ranges using aggregation
    const distributionPipeline = [
      {
        $match: { campaignId: new mongoose.Types.ObjectId(campaignId) }
      },
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
      },
      {
        $addFields: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 0] }, then: '$0-$100' },
                { case: { $eq: ['$_id', 100] }, then: '$100-$500' },
                { case: { $eq: ['$_id', 500] }, then: '$500-$1000' },
                { case: { $eq: ['$_id', 1000] }, then: '$1000-$5000' },
                { case: { $eq: ['$_id', 5000] }, then: '$5000-$10000' },
                { case: { $eq: ['$_id', 10000] }, then: '$10000+' }
              ],
              default: 'Other'
            }
          }
        }
      }
    ];

    // Execute both pipelines concurrently
    const [statisticsResult, distributionResult] = await Promise.all([
      Donation.aggregate(statisticsPipeline),
      Donation.aggregate(distributionPipeline)
    ]);

    const statistics = statisticsResult.length > 0 ? statisticsResult[0] : {
      totalAmount: 0,
      totalDonors: 0,
      averageDonation: 0,
      maxDonation: 0,
      minDonation: 0,
      anonymousDonors: 0,
      publicDonors: 0,
      completionPercentage: 0,
      remainingAmount: campaign.targetAmount
    };

    // Remove the null _id from statistics
    delete statistics._id;

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
        distribution: distributionResult
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

// Get donation trends and analytics using aggregation
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

    // Daily trends aggregation pipeline
    const dailyTrendsPipeline = [
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
      {
        $sort: { 
          '_id.year': 1, 
          '_id.month': 1, 
          '_id.day': 1 
        }
      }
    ];

    // Hourly distribution aggregation pipeline
    const hourlyDistributionPipeline = [
      {
        $match: { campaignId: new mongoose.Types.ObjectId(campaignId) }
      },
      {
        $group: {
          _id: { $hour: '$date' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ];

    // Top donation days pipeline
    const topDonationDaysPipeline = [
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
      {
        $sort: { dailyAmount: -1 }
      },
      {
        $limit: 5
      }
    ];

    // Execute all aggregations concurrently
    const [dailyTrends, hourlyDistributionResult, topDonationDays] = await Promise.all([
      Donation.aggregate(dailyTrendsPipeline),
      Donation.aggregate(hourlyDistributionPipeline),
      Donation.aggregate(topDonationDaysPipeline)
    ]);

    // Create complete hourly distribution array (0-23 hours)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      _id: hour,
      count: 0,
      totalAmount: 0
    }));

    // Fill in actual data
    hourlyDistributionResult.forEach(hourData => {
      hourlyData[hourData._id] = {
        _id: hourData._id,
        count: hourData.count,
        totalAmount: hourData.totalAmount
      };
    });

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
    
    // Format the response to handle guest and anonymous donations
    const formattedDonations = donations.map(donation => {
      let donorInfo;
      
      if (donation.anonymous) {
        // Anonymous donation (could be from registered user or guest)
        donorInfo = { name: 'Anonymous Donor', profilePicture: null };
      } else if (donation.donorId) {
        // Registered user donation
        donorInfo = donation.donorId;
      } else if (donation.donorName) {
        // Guest donation (non-anonymous)
        donorInfo = { 
          name: donation.donorName, 
          email: donation.donorEmail,
          profilePicture: null 
        };
      } else {
        // Fallback
        donorInfo = { name: 'Unknown Donor', profilePicture: null };
      }
      
      return {
        _id: donation._id,
        amount: donation.amount,
        message: donation.message,
        date: donation.date,
        anonymous: donation.anonymous,
        donor: donorInfo
      };
    });
    
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
