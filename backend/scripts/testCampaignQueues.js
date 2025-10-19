/**
 * Test Script for Campaign Queue System
 * 
 * This script tests all three queue workers and the scheduler
 * Run with: node scripts/testCampaignQueues.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Donation = require('../models/Donation');
const campaignQueueScheduler = require('../services/campaignQueueScheduler');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB', colors.green);
  } catch (error) {
    log('❌ Failed to connect to MongoDB', colors.red);
    throw error;
  }
}

async function testCampaignCompletionQueue() {
  section('TEST 1: Campaign Completion Queue');
  
  try {
    // Find a campaign that has ended
    const endedCampaign = await Campaign.findOne({
      status: { $in: ['active', 'pending'] },
      endDate: { $lt: new Date() }
    }).limit(1);

    if (!endedCampaign) {
      log('⚠️  No ended campaigns found for testing', colors.yellow);
      log('Creating test scenario...', colors.blue);
      
      // You can create a test campaign here if needed
      log('💡 Tip: Create a campaign with past end date to test', colors.cyan);
      return false;
    }

    log(`Found campaign: ${endedCampaign.title}`, colors.blue);
    log(`Campaign ID: ${endedCampaign._id}`, colors.blue);
    log(`End Date: ${endedCampaign.endDate}`, colors.blue);
    log(`Status: ${endedCampaign.status}`, colors.blue);
    
    // Trigger completion check
    log('\nTriggering completion check...', colors.yellow);
    await campaignQueueScheduler.triggerCampaignCompletion(endedCampaign._id);
    
    log('✅ Completion check job added to queue', colors.green);
    log('📧 Watch logs for completion email', colors.cyan);
    
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testWithdrawalReminderQueue() {
  section('TEST 2: Withdrawal Reminder Queue');
  
  try {
    // Find completed campaign or campaign past end date
    const completedCampaign = await Campaign.findOne({
      $or: [
        { status: 'completed' },
        { status: 'active', endDate: { $lt: new Date() } }
      ],
      amountRaised: { $gt: 0 }
    }).limit(1);

    if (!completedCampaign) {
      log('⚠️  No completed campaigns with funds found', colors.yellow);
      return false;
    }

    const availableAmount = completedCampaign.amountRaised - 
                           completedCampaign.amountWithdrawn - 
                           completedCampaign.pendingWithdrawals;

    log(`Found campaign: ${completedCampaign.title}`, colors.blue);
    log(`Campaign ID: ${completedCampaign._id}`, colors.blue);
    log(`Available Amount: NPR ${availableAmount}`, colors.blue);
    log(`End Date: ${completedCampaign.endDate}`, colors.blue);
    
    // Test different reminder types
    const reminderTypes = ['9-month', '11-month', 'final'];
    const testType = reminderTypes[0]; // Test with 9-month reminder
    
    log(`\nTriggering ${testType} withdrawal reminder...`, colors.yellow);
    await campaignQueueScheduler.triggerWithdrawalReminder(
      completedCampaign._id, 
      testType
    );
    
    log(`✅ ${testType} reminder job added to queue`, colors.green);
    log('📧 Watch logs for reminder email', colors.cyan);
    
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testDailyReportQueue() {
  section('TEST 3: Daily Report Queue');
  
  try {
    // Find an active campaign
    const activeCampaign = await Campaign.findOne({
      status: 'active',
      endDate: { $gt: new Date() }
    }).limit(1);

    if (!activeCampaign) {
      log('⚠️  No active campaigns found', colors.yellow);
      return false;
    }

    log(`Found campaign: ${activeCampaign.title}`, colors.blue);
    log(`Campaign ID: ${activeCampaign._id}`, colors.blue);
    log(`Amount Raised: NPR ${activeCampaign.amountRaised}`, colors.blue);
    log(`Donors: ${activeCampaign.donors}`, colors.blue);
    
    // Check if there are donations today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todayDonations = await Donation.countDocuments({
      campaignId: activeCampaign._id,
      createdAt: { $gte: startOfToday }
    });
    
    log(`Donations Today: ${todayDonations}`, colors.blue);
    
    log('\nTriggering daily report...', colors.yellow);
    await campaignQueueScheduler.triggerDailyReport(activeCampaign._id);
    
    log('✅ Daily report job added to queue', colors.green);
    log('📧 Watch logs for daily report email', colors.cyan);
    
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testSchedulerStatus() {
  section('TEST 4: Scheduler Status');
  
  try {
    const status = campaignQueueScheduler.getStatus();
    
    log('Scheduler Status:', colors.blue);
    log(`Active Schedulers: ${status.activeSchedulers}`, colors.green);
    log(`Schedulers Running: ${status.schedulers.join(', ')}`, colors.green);
    
    if (status.activeSchedulers === 3) {
      log('✅ All schedulers are running', colors.green);
      return true;
    } else {
      log('⚠️  Not all schedulers are running', colors.yellow);
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function displayQueueStats() {
  section('Queue Statistics');
  
  try {
    const campaignCompletionQueue = require('../queues/campaignCompletionQueue');
    const withdrawalReminderQueue = require('../queues/withdrawalReminderQueue');
    const dailyReportQueue = require('../queues/dailyReportQueue');
    
    const [completionCounts, withdrawalCounts, reportCounts] = await Promise.all([
      campaignCompletionQueue.getJobCounts(),
      withdrawalReminderQueue.getJobCounts(),
      dailyReportQueue.getJobCounts()
    ]);
    
    log('Campaign Completion Queue:', colors.blue);
    log(`  Active: ${completionCounts.active}`, colors.cyan);
    log(`  Waiting: ${completionCounts.waiting}`, colors.cyan);
    log(`  Completed: ${completionCounts.completed}`, colors.green);
    log(`  Failed: ${completionCounts.failed}`, colors.red);
    
    log('\nWithdrawal Reminder Queue:', colors.blue);
    log(`  Active: ${withdrawalCounts.active}`, colors.cyan);
    log(`  Waiting: ${withdrawalCounts.waiting}`, colors.cyan);
    log(`  Completed: ${withdrawalCounts.completed}`, colors.green);
    log(`  Failed: ${withdrawalCounts.failed}`, colors.red);
    
    log('\nDaily Report Queue:', colors.blue);
    log(`  Active: ${reportCounts.active}`, colors.cyan);
    log(`  Waiting: ${reportCounts.waiting}`, colors.cyan);
    log(`  Completed: ${reportCounts.completed}`, colors.green);
    log(`  Failed: ${reportCounts.failed}`, colors.red);
    
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function displayCampaignStats() {
  section('Campaign Statistics');
  
  try {
    const [active, completed, ended, total] = await Promise.all([
      Campaign.countDocuments({ status: 'active', endDate: { $gt: new Date() } }),
      Campaign.countDocuments({ status: 'completed' }),
      Campaign.countDocuments({ status: 'active', endDate: { $lt: new Date() } }),
      Campaign.countDocuments()
    ]);
    
    log(`Total Campaigns: ${total}`, colors.blue);
    log(`Active (Running): ${active}`, colors.green);
    log(`Active (Ended, not completed): ${ended}`, colors.yellow);
    log(`Completed: ${completed}`, colors.cyan);
    
    // Count campaigns with withdrawable funds
    const campaignsWithFunds = await Campaign.countDocuments({
      $or: [
        { status: 'completed' },
        { status: 'active', endDate: { $lt: new Date() } }
      ],
      $expr: {
        $gt: [
          { $subtract: ['$amountRaised', { $add: ['$amountWithdrawn', '$pendingWithdrawals'] }] },
          0
        ]
      }
    });
    
    log(`Campaigns with Withdrawable Funds: ${campaignsWithFunds}`, colors.cyan);
    
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('\n🚀 Campaign Queue System - Test Suite\n', colors.bright + colors.green);
  
  try {
    // Connect to database
    await connectDB();
    
    // Display current stats
    await displayCampaignStats();
    await displayQueueStats();
    
    // Run tests
    const results = {
      completion: await testCampaignCompletionQueue(),
      withdrawal: await testWithdrawalReminderQueue(),
      dailyReport: await testDailyReportQueue(),
      scheduler: await testSchedulerStatus()
    };
    
    // Summary
    section('TEST SUMMARY');
    
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;
    
    log(`Tests Passed: ${passed}/${total}`, passed === total ? colors.green : colors.yellow);
    
    log('\nIndividual Results:', colors.blue);
    log(`  Campaign Completion: ${results.completion ? '✅ PASS' : '⚠️  SKIP/FAIL'}`, 
        results.completion ? colors.green : colors.yellow);
    log(`  Withdrawal Reminder: ${results.withdrawal ? '✅ PASS' : '⚠️  SKIP/FAIL'}`, 
        results.withdrawal ? colors.green : colors.yellow);
    log(`  Daily Report: ${results.dailyReport ? '✅ PASS' : '⚠️  SKIP/FAIL'}`, 
        results.dailyReport ? colors.green : colors.yellow);
    log(`  Scheduler Status: ${results.scheduler ? '✅ PASS' : '⚠️  FAIL'}`, 
        results.scheduler ? colors.green : colors.red);
    
    log('\n📝 Note: Check worker logs to see actual job processing', colors.cyan);
    log('📧 Emails will be sent if campaigns meet criteria', colors.cyan);
    log('⏱️  Jobs may take a few seconds to process\n', colors.cyan);
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    log('👋 Disconnected from MongoDB\n', colors.blue);
  }
}

// Run tests
runAllTests();
