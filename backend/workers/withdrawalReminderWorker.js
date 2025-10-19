require('dotenv').config();
const { Worker } = require('bullmq');
const bullRedis = require('../utils/bullRedis');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { sendWithdrawalReminderEmail } = require('../utils/sendWithdrawalReminderEmail');

const worker = new Worker(
  'withdrawal-reminder',
  async (job) => {
    console.log(`[Withdrawal Reminder Worker] Processing job ${job.id} for campaign: ${job.data.campaignId}`);
    
    const { campaignId, reminderType } = job.data;

    try {
      const campaign = await Campaign.findById(campaignId).populate('creator');
      
      if (!campaign) {
        console.warn(`[Withdrawal Reminder Worker] Campaign not found: ${campaignId}`);
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      // Check if campaign is ended (completed status or past end date)
      const now = new Date();
      const endDate = new Date(campaign.endDate);
      const isEnded = campaign.status === 'completed' || now > endDate;

      if (!isEnded) {
        console.log(`[Withdrawal Reminder Worker] Campaign ${campaignId} is still active`);
        return { status: 'not_ended', message: 'Campaign is still active' };
      }

      // Calculate available withdrawal amount
      const availableAmount = Math.max(0, campaign.amountRaised - campaign.amountWithdrawn - campaign.pendingWithdrawals);

      if (availableAmount <= 0) {
        console.log(`[Withdrawal Reminder Worker] Campaign ${campaignId} has no funds available for withdrawal`);
        return { status: 'no_funds', message: 'No funds available for withdrawal' };
      }

      // Calculate days since campaign ended
      const daysSinceEnd = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
      const oneYearDays = 365;
      const daysRemaining = oneYearDays - daysSinceEnd;

      // Determine appropriate reminder based on time elapsed
      let actualReminderType = reminderType;
      
      if (!reminderType) {
        // Auto-determine reminder type based on days elapsed
        if (daysSinceEnd >= 270 && daysSinceEnd < 330) { // 9 months (270-330 days)
          actualReminderType = '9-month';
        } else if (daysSinceEnd >= 330 && daysSinceEnd < 350) { // 11 months (330-350 days)
          actualReminderType = '11-month';
        } else if (daysSinceEnd >= 350 && daysSinceEnd < 365) { // Final notice (350-365 days)
          actualReminderType = 'final';
        } else if (daysSinceEnd >= 365) {
          // Past deadline - handle fund reallocation
          return await handleFundReallocation(campaign, availableAmount);
        } else {
          console.log(`[Withdrawal Reminder Worker] Campaign ${campaignId} not yet due for reminder (${daysSinceEnd} days since end)`);
          return { status: 'not_due', daysSinceEnd };
        }
      }

      // Send reminder email
      const creator = campaign.creator;
      if (creator && creator.email) {
        await sendWithdrawalReminderEmail(
          campaign,
          creator,
          actualReminderType,
          daysRemaining,
          availableAmount
        );
        console.log(`[Withdrawal Reminder Worker] ${actualReminderType} reminder sent to ${creator.email}`);
      }

      return {
        status: 'success',
        campaignId,
        reminderType: actualReminderType,
        daysSinceEnd,
        daysRemaining,
        availableAmount
      };

    } catch (error) {
      console.error(`[Withdrawal Reminder Worker] Error processing campaign ${campaignId}:`, error);
      throw error;
    }
  },
  {
    connection: bullRedis,
    prefix: 'withdrawal',
    concurrency: parseInt(process.env.BULL_WORKER_CONCURRENCY || '5', 10),
  }
);

/**
 * Handle fund reallocation when 1-year deadline has passed
 */
async function handleFundReallocation(campaign, availableAmount) {
  console.log(`[Withdrawal Reminder Worker] Initiating fund reallocation for campaign ${campaign._id} - Amount: ${availableAmount}`);
  
  try {
    // Find similar category campaigns that are active
    const similarCampaigns = await Campaign.find({
      _id: { $ne: campaign._id },
      category: campaign.category,
      status: 'active',
      endDate: { $gt: new Date() }
    })
    .sort({ amountRaised: 1 }) // Prioritize campaigns with less funding
    .limit(5);

    let targetCampaign = null;

    if (similarCampaigns.length > 0) {
      // Find campaign that needs the most help (furthest from goal)
      targetCampaign = similarCampaigns.reduce((neediest, current) => {
        const neediestPercentage = (neediest.amountRaised / neediest.targetAmount) * 100;
        const currentPercentage = (current.amountRaised / current.targetAmount) * 100;
        return currentPercentage < neediestPercentage ? current : neediest;
      });
      
      console.log(`[Withdrawal Reminder Worker] Found similar campaign for reallocation: ${targetCampaign.title}`);
    }

    // If no similar campaign found, mark for DHUKUTI fund
    const reallocationType = targetCampaign ? 'similar_campaign' : 'dhukuti';
    
    // Mark funds as withdrawn in original campaign
    campaign.amountWithdrawn += availableAmount;
    campaign.statusHistory.push({
      status: campaign.status,
      changedAt: new Date(),
      reason: `Funds automatically reallocated to ${reallocationType} after 1-year withdrawal deadline - Amount: NPR ${availableAmount}`
    });
    await campaign.save();

    // If target campaign found, add funds to it
    if (targetCampaign) {
      targetCampaign.amountRaised += availableAmount;
      targetCampaign.statusHistory.push({
        status: targetCampaign.status,
        changedAt: new Date(),
        reason: `Received reallocated funds from expired campaign ${campaign.title} - Amount: NPR ${availableAmount}`
      });
      await targetCampaign.save();

      // Send notification to both creators
      if (campaign.creator && campaign.creator.email) {
        await sendFundReallocationNotification(campaign, targetCampaign, availableAmount, 'source');
      }
      if (targetCampaign.creator) {
        const targetCreator = await User.findById(targetCampaign.creator);
        if (targetCreator && targetCreator.email) {
          await sendFundReallocationNotification(campaign, targetCampaign, availableAmount, 'recipient', targetCreator);
        }
      }
    }

    console.log(`[Withdrawal Reminder Worker] Fund reallocation completed - Type: ${reallocationType}, Amount: ${availableAmount}`);

    return {
      status: 'reallocated',
      campaignId: campaign._id,
      reallocationType,
      targetCampaignId: targetCampaign?._id,
      amount: availableAmount
    };

  } catch (error) {
    console.error(`[Withdrawal Reminder Worker] Error during fund reallocation:`, error);
    throw error;
  }
}

/**
 * Send fund reallocation notification email
 */
async function sendFundReallocationNotification(sourceCampaign, targetCampaign, amount, notificationType, user = null) {
  // This can be implemented similarly to other email functions
  // For now, just log
  console.log(`[Withdrawal Reminder Worker] Fund reallocation notification (${notificationType}) - Amount: ${amount}`);
}

// Event handlers
worker.on('ready', () => console.log('✅ Withdrawal Reminder Worker connected to Bull Redis'));
worker.on('completed', (job, result) => {
  console.log(`[Withdrawal Reminder Worker] Job ${job.id} completed ✅`);
  console.log(`[Withdrawal Reminder Worker] Result:`, result);
});
worker.on('failed', (job, err) => {
  console.error(`[Withdrawal Reminder Worker] Job ${job?.id} failed ❌:`, err.message);
  console.error(`[Withdrawal Reminder Worker] Campaign ID: ${job?.data?.campaignId}`);
});
worker.on('error', (err) => console.error('[Withdrawal Reminder Worker] Worker error ❌:', err));
worker.on('stalled', (jobId) => console.warn(`[Withdrawal Reminder Worker] Job ${jobId} stalled ⚠️`));

module.exports = worker;
