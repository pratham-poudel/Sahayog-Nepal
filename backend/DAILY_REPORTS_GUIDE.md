# Daily Reports System - User Guide

## Overview
The daily report system automatically sends performance reports to campaign creators every day at 6 PM Nepal Time. These reports include today's donations, overall progress, and campaign statistics.

## Fixed Issues ✅

### Previous Problems:
1. ❌ Campaigns were never being added to the daily report queue
2. ❌ Strict hour === 18 check could miss the sending window
3. ❌ No visibility when ENABLE_SCHEDULER was not set
4. ❌ No way to manually trigger reports for testing

### Solutions Implemented:
1. ✅ **Better Time Window**: Changed from strict `hour === 18` to `hour >= 18` (6 PM to midnight)
2. ✅ **Date-Based Tracking**: Prevents duplicate sends and ensures once-per-day delivery
3. ✅ **Frequent Checks**: Scheduler checks every 30 minutes (instead of hourly) to not miss the window
4. ✅ **Better Logging**: Clear warnings when ENABLE_SCHEDULER is not enabled
5. ✅ **Manual Trigger**: New endpoint for testing and debugging

---

## Setup Instructions

### 1. Enable the Scheduler

Add this to your `.env` file:
```env
ENABLE_SCHEDULER=true
```

**Important**: Without this, daily reports will NOT be sent automatically.

### 2. Verify Setup

After starting the server, check the logs:

✅ **Correct Output:**
```
[Server] 🕐 This instance is designated as SCHEDULER instance
[Campaign Queue Scheduler] Initializing schedulers...
[Campaign Queue Scheduler] Setting up daily report scheduler...
[Campaign Queue Scheduler] ✅ Daily report scheduler set up (checks every 30 minutes, triggers at 6 PM Nepal Time)
```

❌ **If Missing ENABLE_SCHEDULER:**
```
[Server] ⚙️ This instance is a WORKER instance (scheduler disabled)
[Server] ⚠️ To enable daily reports and automated scheduling, set ENABLE_SCHEDULER=true in your .env file
```

---

## How It Works

### Automatic Scheduling

1. **Scheduler runs every 30 minutes** starting from server startup
2. **At or after 6 PM Nepal Time**, it checks for active campaigns
3. **Sends one report per campaign per day** (no duplicates)
4. **Emails are staggered** with 2-second delays to respect rate limits

### Report Timing

- **Target Time**: 6:00 PM Nepal Time (UTC+5:45)
- **Window**: 6:00 PM - 11:59 PM (any check during this time will trigger)
- **Frequency**: Once per day per campaign
- **Check Interval**: Every 30 minutes

### Eligible Campaigns

Reports are sent only for campaigns that:
- ✅ Have `status: 'active'`
- ✅ Have `endDate` in the future
- ✅ Have a creator with valid email

---

## Manual Testing

### Trigger Daily Reports Manually

**Endpoint**: `POST /api/employee/trigger-daily-reports`

**Authentication Required**: 
- Employee login (Executive, IT, or Analytics department)

**Option 1: Trigger for Single Campaign**
```bash
POST /api/employee/trigger-daily-reports
Content-Type: application/json
Authorization: Bearer <employee_token>

{
  "campaignId": "507f1f77bcf86cd799439011"
}
```

**Option 2: Trigger for All Active Campaigns**
```bash
POST /api/employee/trigger-daily-reports
Content-Type: application/json
Authorization: Bearer <employee_token>

{}
```

**Response:**
```json
{
  "success": true,
  "message": "Daily reports triggered for 5 active campaigns",
  "count": 5,
  "campaigns": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Help Fund Medical Treatment"
    },
    ...
  ]
}
```

---

## Monitoring & Debugging

### 1. Check Bull Dashboard

Visit: `http://localhost:5000/admin/queues`

**Queue Name**: `daily-report`

**Look For**:
- Job counts (waiting, active, completed, failed)
- Recent jobs with timestamps
- Job details including campaign IDs

### 2. Check Server Logs

**Successful Scheduling:**
```
[Campaign Queue Scheduler] Running daily report scheduler...
[Campaign Queue Scheduler] Nepal Time: 2025-12-03T18:05:00.000Z, Hour: 18
[Campaign Queue Scheduler] Found 5 active campaigns for daily reports
[Campaign Queue Scheduler] ✅ Scheduled 5 daily report jobs for 2025-12-03
```

**Daily Report Worker Processing:**
```
[Daily Report Worker] Processing job 123 for campaign: 507f1f77bcf86cd799439011
[Daily Report Worker] Daily report sent to creator@example.com - Today: NPR 5000 from 3 donors
[Daily Report Worker] Job 123 completed ✅
[Daily Report Worker] Stats: 5000 NPR from 3 donors today
```

**Worker Failures:**
```
[Daily Report Worker] Job 123 failed ❌: Campaign not found
[Daily Report Worker] Campaign ID: 507f1f77bcf86cd799439011
```

### 3. Common Issues

**Issue**: No jobs appearing in queue
- ✅ **Check**: Is `ENABLE_SCHEDULER=true` set?
- ✅ **Check**: Are there active campaigns with future end dates?
- ✅ **Check**: Is current Nepal Time between 6 PM and midnight?

**Issue**: Jobs failing
- ✅ **Check**: Campaign exists and has status 'active'
- ✅ **Check**: Campaign creator has valid email
- ✅ **Check**: ZEPTO_BULK_EMAILER token is configured
- ✅ **Check**: Worker is running (dailyReportWorker.js)

**Issue**: Duplicate emails
- ✅ **Fixed**: Date-based tracking prevents same-day duplicates
- ✅ **Check**: Job IDs include date: `daily-report-{campaignId}-{date}`

---

## Report Content

Each daily report email includes:

### Today's Performance
- 💰 Total amount raised today
- 👥 Number of donors today
- 🏆 Top donation today
- 📊 Average donation today

### Overall Campaign Progress
- 📈 Progress bar
- 💵 Total raised / Goal amount
- 🎯 Percentage complete
- ⏰ Days remaining

### Visual Design
- Professional branded email template
- Color-coded sections
- Progress visualization
- Mobile-responsive layout

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Server Startup (server.js)            │
│  - Checks ENABLE_SCHEDULER env var     │
│  - Initializes workers                  │
│  - Initializes scheduler (if enabled)   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Campaign Queue Scheduler               │
│  (services/campaignQueueScheduler.js)   │
│  - Runs every 30 minutes                │
│  - Checks if 6 PM+ Nepal Time           │
│  - Prevents duplicate sends per day     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Daily Report Queue                     │
│  (queues/dailyReportQueue.js)           │
│  - Stores jobs in Redis                 │
│  - Job ID: daily-report-{id}-{date}     │
│  - 2-second stagger between jobs        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Daily Report Worker                    │
│  (workers/dailyReportWorker.js)         │
│  - Fetches campaign & creator           │
│  - Calculates daily & overall stats     │
│  - Calls sendDailyReportEmail()         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Email Service (Zeptomail)              │
│  (utils/sendDailyReportEmail.js)        │
│  - Renders HTML email template          │
│  - Sends via Zeptomail API              │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

Before deploying to production:

- [ ] Set `ENABLE_SCHEDULER=true` in .env
- [ ] Restart server and verify scheduler logs
- [ ] Check at least one active campaign exists
- [ ] Use manual trigger endpoint to test
- [ ] Check Bull dashboard for job creation
- [ ] Verify worker processes jobs successfully
- [ ] Confirm email delivery to creator
- [ ] Check email content and formatting
- [ ] Verify no duplicate emails sent
- [ ] Test at actual 6 PM Nepal Time

---

## Troubleshooting Commands

### Check Redis Connection
```bash
# Connect to Redis CLI
redis-cli

# Check keys for daily reports
KEYS report:daily-report:*

# Get job details
HGETALL report:daily-report:jobs:<jobId>
```

### Check Active Campaigns
```javascript
// In MongoDB shell or Node REPL
db.campaigns.find({
  status: 'active',
  endDate: { $gt: new Date() }
}).count()
```

### Manually Trigger via Code
```javascript
const dailyReportQueue = require('./queues/dailyReportQueue');

await dailyReportQueue.add(
  'test-report',
  { campaignId: 'YOUR_CAMPAIGN_ID' },
  { priority: 1 }
);
```

---

## Support

If issues persist after following this guide:

1. Check server logs for error messages
2. Verify Bull dashboard shows queue activity
3. Ensure Redis is running and accessible
4. Confirm email service credentials are valid
5. Use manual trigger endpoint to isolate issues

**Key Log Patterns to Search For**:
- `[Campaign Queue Scheduler]`
- `[Daily Report Worker]`
- `[DAILY REPORT EMAIL]`

---

## Summary

The daily report system is now **fully functional** with:

✅ Reliable once-per-day scheduling  
✅ 6-hour sending window (6 PM - midnight)  
✅ Duplicate prevention  
✅ Manual testing capability  
✅ Comprehensive logging  
✅ Clear setup instructions  

Just ensure `ENABLE_SCHEDULER=true` is set in your environment!
