require('dotenv').config();
const Campaign = require('../models/Campaign');
const campaignCompletionQueue = require('../queues/campaignCompletionQueue');
const withdrawalReminderQueue = require('../queues/withdrawalReminderQueue');
const dailyReportQueue = require('../queues/dailyReportQueue');

/**
 * Campaign Queue Scheduler Service
 * Manages recurring scheduled jobs for campaign management
 */
class CampaignQueueScheduler {
  constructor() {
    this.schedulerIntervals = {};
  }

  /**
   * Initialize all schedulers
   */
  async initialize() {
    console.log('[Campaign Queue Scheduler] Initializing schedulers...');
    
    // Schedule daily report jobs - runs every day at 6 PM Nepal Time (UTC+5:45)
    await this.scheduleDailyReports();
    
    // Schedule campaign completion checks - runs every hour
    await this.scheduleCampaignCompletionChecks();
    
    // Schedule withdrawal reminder checks - runs daily at 10 AM Nepal Time
    await this.scheduleWithdrawalReminders();

    console.log('[Campaign Queue Scheduler] ✅ All schedulers initialized');
  }

  /**
   * Schedule daily report emails for all active campaigns
   * Runs every day at 6 PM Nepal Time (UTC+5:45 = UTC+0345)
   */
  async scheduleDailyReports() {
    console.log('[Campaign Queue Scheduler] Setting up daily report scheduler...');

    // Track the last date reports were sent to avoid duplicates
    let lastReportDate = null;

    const scheduleReports = async () => {
      try {
        const now = new Date();
        const nepalTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));
        const hour = nepalTime.getHours();
        const currentDate = nepalTime.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Check if reports have already been sent today
        if (lastReportDate === currentDate) {
          return; // Already sent reports today
        }

        // Only run at or after 6 PM Nepal Time (18:00 to 23:59)
        if (hour < 18) {
          console.log(`[Campaign Queue Scheduler] Not time for daily reports yet (current hour: ${hour}, need 18+)`);
          return;
        }

        console.log('[Campaign Queue Scheduler] Running daily report scheduler...');
        console.log(`[Campaign Queue Scheduler] Nepal Time: ${nepalTime.toISOString()}, Hour: ${hour}`);

        // Get all active campaigns
        const activeCampaigns = await Campaign.find({
          status: 'active',
          endDate: { $gt: new Date() }
        }).select('_id title');

        console.log(`[Campaign Queue Scheduler] Found ${activeCampaigns.length} active campaigns for daily reports`);

        if (activeCampaigns.length === 0) {
          console.log('[Campaign Queue Scheduler] No active campaigns found, skipping daily reports');
          lastReportDate = currentDate; // Mark as sent even if no campaigns
          return;
        }

        // Add jobs to queue with staggered delays to respect rate limits
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < activeCampaigns.length; i++) {
          const campaign = activeCampaigns[i];
          const delay = i * 3000; // 3 second delay between each email (reduced rate)

          try {
            await dailyReportQueue.add(
              'send-daily-report',
              { campaignId: campaign._id.toString() }, // Ensure string ID
              {
                delay,
                jobId: `daily-report-${campaign._id}-${currentDate}`, // Unique job ID per day
                removeOnComplete: 100,
                removeOnFail: 50,
                attempts: 5,
                backoff: { type: 'exponential', delay: 60000 }
              }
            );
            successCount++;
          } catch (error) {
            console.error(`[Campaign Queue Scheduler] Failed to add job for campaign ${campaign._id}:`, error.message);
            errorCount++;
          }
        }

        console.log(`[Campaign Queue Scheduler] ✅ Scheduled ${successCount}/${activeCampaigns.length} daily report jobs for ${currentDate}`);
        if (errorCount > 0) {
          console.warn(`[Campaign Queue Scheduler] ⚠️  ${errorCount} jobs failed to schedule`);
        }
        lastReportDate = currentDate; // Mark reports as sent for today
      } catch (error) {
        console.error('[Campaign Queue Scheduler] ❌ Error scheduling daily reports:', error);
      }
    };

    // Run immediately on startup
    await scheduleReports();

    // Then run every 30 minutes to check if it's time (more frequent checks)
    this.schedulerIntervals.dailyReports = setInterval(scheduleReports, 30 * 60 * 1000); // Every 30 minutes
    console.log('[Campaign Queue Scheduler] ✅ Daily report scheduler set up (checks every 30 minutes, triggers at 6 PM Nepal Time)');
  }

  /**
   * Schedule campaign completion checks
   * Runs every hour to check for campaigns that have ended
   */
  async scheduleCampaignCompletionChecks() {
    console.log('[Campaign Queue Scheduler] Setting up campaign completion checker...');

    const checkCompletions = async () => {
      try {
        console.log('[Campaign Queue Scheduler] Running campaign completion check...');

        // Get campaigns that have ended but not yet marked as completed
        const now = new Date();
        const endedCampaigns = await Campaign.find({
          status: { $in: ['active', 'pending'] },
          endDate: { $lt: now }
        }).select('_id title endDate');

        console.log(`[Campaign Queue Scheduler] Found ${endedCampaigns.length} campaigns to check for completion`);

        // Add completion check jobs with staggered delays to respect email rate limits
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < endedCampaigns.length; i++) {
          const campaign = endedCampaigns[i];
          const delay = i * 5000; // 5 second delay between each email
          
          try {
            await campaignCompletionQueue.add(
              'check-completion',
              { campaignId: campaign._id.toString() },
              {
                delay,
                jobId: `completion-${campaign._id}`, // Prevent duplicate jobs
                removeOnComplete: 100,
                removeOnFail: 50,
                attempts: 5,
                backoff: { type: 'exponential', delay: 60000 }
              }
            );
            successCount++;
          } catch (error) {
            console.error(`[Campaign Queue Scheduler] Failed to add completion job for campaign ${campaign._id}:`, error.message);
            errorCount++;
          }
        }

        if (endedCampaigns.length > 0) {
          console.log(`[Campaign Queue Scheduler] ✅ Scheduled ${successCount}/${endedCampaigns.length} completion check jobs`);
          if (errorCount > 0) {
            console.warn(`[Campaign Queue Scheduler] ⚠️  ${errorCount} completion jobs failed to schedule`);
          }
        }
      } catch (error) {
        console.error('[Campaign Queue Scheduler] Error scheduling campaign completions:', error);
      }
    };

    // Run immediately on startup
    await checkCompletions();

    // Then run every hour
    this.schedulerIntervals.completionChecks = setInterval(checkCompletions, 60 * 60 * 1000); // Every hour
  }

  /**
   * Schedule withdrawal reminder checks
   * Runs daily at 10 AM Nepal Time to check for reminders
   */
  async scheduleWithdrawalReminders() {
    console.log('[Campaign Queue Scheduler] Setting up withdrawal reminder scheduler...');

    const checkReminders = async () => {
      try {
        const now = new Date();
        const nepalTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));
        const hour = nepalTime.getHours();

        // Only run at 10 AM Nepal Time
        if (hour !== 10) {
          console.log(`[Campaign Queue Scheduler] Not time for withdrawal reminders yet (current hour: ${hour})`);
          return;
        }

        console.log('[Campaign Queue Scheduler] Running withdrawal reminder scheduler...');

        // Get campaigns that are completed or ended
        const endedCampaigns = await Campaign.find({
          $or: [
            { status: 'completed' },
            { status: 'active', endDate: { $lt: now } }
          ]
        }).select('_id title endDate amountRaised amountWithdrawn pendingWithdrawals');

        console.log(`[Campaign Queue Scheduler] Found ${endedCampaigns.length} ended campaigns to check for withdrawal reminders`);

        // Filter campaigns with available funds and calculate reminder timing
        let reminderCount = 0;
        let reminderErrors = 0;
        
        for (let i = 0; i < endedCampaigns.length; i++) {
          const campaign = endedCampaigns[i];
          const availableAmount = campaign.amountRaised - campaign.amountWithdrawn - campaign.pendingWithdrawals;
          
          if (availableAmount <= 0) continue; // Skip if no funds available

          const endDate = new Date(campaign.endDate);
          const daysSinceEnd = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));

          // Determine if reminder is due
          let reminderType = null;
          
          // 9-month reminder (270 days ± 3 days buffer)
          if (daysSinceEnd >= 267 && daysSinceEnd <= 273) {
            reminderType = '9-month';
          }
          // 11-month reminder (330 days ± 3 days buffer)
          else if (daysSinceEnd >= 327 && daysSinceEnd <= 333) {
            reminderType = '11-month';
          }
          // Final reminder (355 days ± 3 days buffer)
          else if (daysSinceEnd >= 352 && daysSinceEnd <= 358) {
            reminderType = 'final';
          }
          // Fund reallocation (365+ days)
          else if (daysSinceEnd >= 365) {
            reminderType = 'reallocate';
          }

          if (reminderType) {
            const delay = reminderCount * 5000; // 5 second delay between each email
            
            try {
              await withdrawalReminderQueue.add(
                'withdrawal-reminder',
                { campaignId: campaign._id.toString(), reminderType },
                {
                  delay,
                  jobId: `withdrawal-${reminderType}-${campaign._id}`, // Prevent duplicates
                  removeOnComplete: 100,
                  removeOnFail: 50,
                  attempts: 5,
                  backoff: { type: 'exponential', delay: 60000 }
                }
              );

              console.log(`[Campaign Queue Scheduler] Scheduled ${reminderType} reminder for campaign ${campaign._id} (${daysSinceEnd} days since end)`);
              reminderCount++;
            } catch (error) {
              console.error(`[Campaign Queue Scheduler] Failed to add withdrawal reminder for campaign ${campaign._id}:`, error.message);
              reminderErrors++;
            }
          }
        }
        
        if (reminderCount > 0) {
          console.log(`[Campaign Queue Scheduler] ✅ Scheduled ${reminderCount} withdrawal reminder jobs`);
        }
        if (reminderErrors > 0) {
          console.warn(`[Campaign Queue Scheduler] ⚠️  ${reminderErrors} withdrawal reminder jobs failed to schedule`);
        }
      } catch (error) {
        console.error('[Campaign Queue Scheduler] Error scheduling withdrawal reminders:', error);
      }
    };

    // Run immediately on startup (if it's 10 AM)
    await checkReminders();

    // Then run every hour to check if it's time
    this.schedulerIntervals.withdrawalReminders = setInterval(checkReminders, 60 * 60 * 1000); // Every hour
  }

  /**
   * Manually trigger a campaign completion check
   */
  async triggerCampaignCompletion(campaignId) {
    console.log(`[Campaign Queue Scheduler] Manually triggering completion check for campaign: ${campaignId}`);
    
    await campaignCompletionQueue.add(
      'manual-completion-check',
      { campaignId },
      {
        priority: 1, // High priority for manual triggers
        removeOnComplete: 50
      }
    );
  }

  /**
   * Manually trigger a withdrawal reminder
   */
  async triggerWithdrawalReminder(campaignId, reminderType) {
    console.log(`[Campaign Queue Scheduler] Manually triggering ${reminderType} reminder for campaign: ${campaignId}`);
    
    await withdrawalReminderQueue.add(
      'manual-withdrawal-reminder',
      { campaignId, reminderType },
      {
        priority: 1,
        removeOnComplete: 50
      }
    );
  }

  /**
   * Manually trigger a daily report
   */
  async triggerDailyReport(campaignId) {
    console.log(`[Campaign Queue Scheduler] Manually triggering daily report for campaign: ${campaignId}`);
    
    await dailyReportQueue.add(
      'manual-daily-report',
      { campaignId },
      {
        priority: 1,
        removeOnComplete: 50
      }
    );
  }

  /**
   * Clean up all schedulers (for graceful shutdown)
   */
  cleanup() {
    console.log('[Campaign Queue Scheduler] Cleaning up schedulers...');
    
    Object.keys(this.schedulerIntervals).forEach(key => {
      clearInterval(this.schedulerIntervals[key]);
    });
    
    this.schedulerIntervals = {};
    console.log('[Campaign Queue Scheduler] ✅ Schedulers cleaned up');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      activeSchedulers: Object.keys(this.schedulerIntervals).length,
      schedulers: Object.keys(this.schedulerIntervals)
    };
  }
}

// Create singleton instance
const campaignQueueScheduler = new CampaignQueueScheduler();

module.exports = campaignQueueScheduler;
