require('dotenv').config();
const { Worker } = require('bullmq');
const bullRedis = require('../utils/bullRedis');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { sendCampaignCompletionEmail } = require('../utils/sendCampaignCompletionEmail');

const worker = new Worker(
  'campaign-completion',
  async (job) => {
    console.log(`[Campaign Completion Worker] Processing job ${job.id} for campaign: ${job.data.campaignId}`);
    
    const { campaignId } = job.data;

    try {
      const campaign = await Campaign.findById(campaignId).populate('creator');
      
      if (!campaign) {
        console.warn(`[Campaign Completion Worker] Campaign not found: ${campaignId}`);
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      // Check if campaign end date has passed
      const now = new Date();
      const endDate = new Date(campaign.endDate);
      endDate.setHours(23, 59, 59, 999); // End of the day

      if (now < endDate) {
        console.log(`[Campaign Completion Worker] Campaign ${campaignId} not yet ended. End date: ${endDate}`);
        return { status: 'not_ended', message: 'Campaign has not reached end date yet' };
      }

      // Check if already completed
      if (campaign.status === 'completed') {
        console.log(`[Campaign Completion Worker] Campaign ${campaignId} already marked as completed`);
        return { status: 'already_completed', message: 'Campaign already completed' };
      }

      // Calculate statistics
      const goalAchieved = campaign.amountRaised >= campaign.targetAmount;
      
      // Get donation statistics
      const donations = await Donation.find({ campaignId: campaign._id });
      const topDonation = donations.length > 0 
        ? Math.max(...donations.map(d => d.amount)) 
        : 0;
      const averageDonation = donations.length > 0
        ? donations.reduce((sum, d) => sum + d.amount, 0) / donations.length
        : 0;

      // Calculate campaign duration
      const startDate = new Date(campaign.startDate);
      const campaignDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      const stats = {
        goalAchieved,
        totalRaised: campaign.amountRaised,
        goalAmount: campaign.targetAmount,
        achievementPercentage: Math.round((campaign.amountRaised / campaign.targetAmount) * 100),
        totalDonors: campaign.donors,
        averageDonation: Math.round(averageDonation),
        topDonation,
        campaignDuration
      };

      // Update campaign status if goal is achieved
      if (goalAchieved) {
        campaign.status = 'completed';
        campaign.statusHistory.push({
          status: 'completed',
          changedAt: new Date(),
          reason: 'Campaign goal achieved and end date reached - automatically completed by system'
        });
        await campaign.save();
        console.log(`[Campaign Completion Worker] Campaign ${campaignId} marked as completed (goal achieved)`);
      } else {
        console.log(`[Campaign Completion Worker] Campaign ${campaignId} ended but goal not achieved - keeping status as active`);
      }

      // Send completion summary email to creator
      const creator = campaign.creator;
      if (creator && creator.email) {
        await sendCampaignCompletionEmail(campaign, creator, stats);
        console.log(`[Campaign Completion Worker] Completion email sent to ${creator.email}`);
      }

      return {
        status: 'success',
        campaignId,
        goalAchieved,
        statusUpdated: goalAchieved,
        stats
      };

    } catch (error) {
      console.error(`[Campaign Completion Worker] Error processing campaign ${campaignId}:`, error);
      throw error;
    }
  },
  {
    connection: bullRedis,
    prefix: 'campaign',
    concurrency: parseInt(process.env.BULL_WORKER_CONCURRENCY || '5', 10),
  }
);

// Event handlers
worker.on('ready', () => console.log('✅ Campaign Completion Worker connected to Bull Redis'));
worker.on('completed', (job, result) => {
  console.log(`[Campaign Completion Worker] Job ${job.id} completed ✅`);
  console.log(`[Campaign Completion Worker] Result:`, result);
});
worker.on('failed', (job, err) => {
  console.error(`[Campaign Completion Worker] Job ${job?.id} failed ❌:`, err.message);
  console.error(`[Campaign Completion Worker] Campaign ID: ${job?.data?.campaignId}`);
});
worker.on('error', (err) => console.error('[Campaign Completion Worker] Worker error ❌:', err));
worker.on('stalled', (jobId) => console.warn(`[Campaign Completion Worker] Job ${jobId} stalled ⚠️`));

module.exports = worker;
