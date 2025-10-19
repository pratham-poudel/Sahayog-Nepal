require('dotenv').config();
const { Worker } = require('bullmq');
const bullRedis = require('../utils/bullRedis');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { sendDailyReportEmail } = require('../utils/sendDailyReportEmail');

const worker = new Worker(
  'daily-report',
  async (job) => {
    console.log(`[Daily Report Worker] Processing job ${job.id} for campaign: ${job.data.campaignId}`);
    
    const { campaignId } = job.data;

    try {
      const campaign = await Campaign.findById(campaignId).populate('creator');
      
      if (!campaign) {
        console.warn(`[Daily Report Worker] Campaign not found: ${campaignId}`);
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      // Only send reports for active campaigns
      if (campaign.status !== 'active') {
        console.log(`[Daily Report Worker] Campaign ${campaignId} is not active (status: ${campaign.status})`);
        return { status: 'not_active', message: 'Campaign is not active' };
      }

      // Check if campaign has ended
      const now = new Date();
      const endDate = new Date(campaign.endDate);
      if (now > endDate) {
        console.log(`[Daily Report Worker] Campaign ${campaignId} has ended`);
        return { status: 'ended', message: 'Campaign has ended' };
      }

      // Get today's donations (start of day to now)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayDonations = await Donation.find({
        campaignId: campaign._id,
        createdAt: { $gte: startOfToday }
      });

      // Calculate today's statistics
      const todayAmount = todayDonations.reduce((sum, d) => sum + d.amount, 0);
      const todayDonors = todayDonations.length;
      const topDonationToday = todayDonors > 0 
        ? Math.max(...todayDonations.map(d => d.amount))
        : 0;
      const averageDonationToday = todayDonors > 0
        ? Math.round(todayAmount / todayDonors)
        : 0;

      // Calculate overall statistics
      const totalRaised = campaign.amountRaised;
      const totalDonors = campaign.donors;
      const goalAmount = campaign.targetAmount;
      const percentageComplete = Math.round((totalRaised / goalAmount) * 100);
      
      // Calculate days remaining
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

      const todayStats = {
        todayAmount,
        todayDonors,
        topDonationToday,
        averageDonationToday,
        totalRaised,
        totalDonors,
        goalAmount,
        percentageComplete,
        daysRemaining
      };

      // Send daily report email to creator
      const creator = campaign.creator;
      if (creator && creator.email) {
        await sendDailyReportEmail(campaign, creator, todayStats);
        console.log(`[Daily Report Worker] Daily report sent to ${creator.email} - Today: NPR ${todayAmount} from ${todayDonors} donors`);
      }

      return {
        status: 'success',
        campaignId,
        todayStats
      };

    } catch (error) {
      console.error(`[Daily Report Worker] Error processing campaign ${campaignId}:`, error);
      throw error;
    }
  },
  {
    connection: bullRedis,
    prefix: 'report',
    concurrency: parseInt(process.env.BULL_WORKER_CONCURRENCY || '5', 10),
  }
);

// Event handlers
worker.on('ready', () => console.log('✅ Daily Report Worker connected to Bull Redis'));
worker.on('completed', (job, result) => {
  console.log(`[Daily Report Worker] Job ${job.id} completed ✅`);
  if (result.todayStats) {
    console.log(`[Daily Report Worker] Stats: ${result.todayStats.todayAmount} NPR from ${result.todayStats.todayDonors} donors today`);
  }
});
worker.on('failed', (job, err) => {
  console.error(`[Daily Report Worker] Job ${job?.id} failed ❌:`, err.message);
  console.error(`[Daily Report Worker] Campaign ID: ${job?.data?.campaignId}`);
});
worker.on('error', (err) => console.error('[Daily Report Worker] Worker error ❌:', err));
worker.on('stalled', (jobId) => console.warn(`[Daily Report Worker] Job ${jobId} stalled ⚠️`));

module.exports = worker;
