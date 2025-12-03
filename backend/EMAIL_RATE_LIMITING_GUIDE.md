# Email Rate Limiting Implementation Guide

## Overview
All workers that send emails now have comprehensive rate limiting, validation, and error handling to prevent failures and ensure reliable email delivery.

## Rate Limiting Strategy

### 1. **Queue-Level Rate Limiting**
Each queue has staggered delays between job processing:
- **Daily Reports**: 3 seconds between emails
- **Campaign Completion**: 5 seconds between emails  
- **Withdrawal Reminders**: 5 seconds between emails

### 2. **Retry Configuration**
All email queues now use:
- **5 retry attempts** (increased from 3)
- **60-second initial backoff** (increased from 30s)
- **Exponential backoff** to handle rate limiting

### 3. **Worker-Level Protection**
Each worker includes:
- Database connection validation
- Job data validation
- Creator/email validation
- Enhanced error logging with stack traces
- Retry attempt tracking

## Configuration

### Environment Variables
```env
BULL_WORKER_CONCURRENCY=5  # Number of concurrent jobs per worker
```

### ZeptoMail Rate Limits
Default configuration (adjust based on your plan):
- **Per minute**: ~20 emails
- **Per hour**: ~500 emails
- **Min delay**: 2 seconds between emails

## Worker Details

### Daily Report Worker
**File**: `workers/dailyReportWorker.js`
- ✅ Validates campaign creator exists
- ✅ Validates creator has email
- ✅ Checks database connection
- ✅ 5 retry attempts with 60s backoff
- ✅ 3-second delay between emails

**Validations**:
```javascript
- Campaign exists
- Campaign.creator exists
- Campaign.creator.email exists
- Campaign status is 'active'
- Campaign has not ended
- Database connection ready
```

### Campaign Completion Worker
**File**: `workers/campaignCompletionWorker.js`
- ✅ Validates campaign creator exists
- ✅ Validates creator has email
- ✅ Checks database connection
- ✅ 5 retry attempts with 60s backoff
- ✅ 5-second delay between emails

**Validations**:
```javascript
- Campaign exists
- Campaign has ended
- Campaign.creator exists
- Campaign.creator.email exists
- Database connection ready
```

### Withdrawal Reminder Worker
**File**: `workers/withdrawalReminderWorker.js`
- ✅ Validates campaign creator exists
- ✅ Validates creator has email
- ✅ Checks database connection
- ✅ 5 retry attempts with 60s backoff
- ✅ 5-second delay between emails

**Validations**:
```javascript
- Campaign exists
- Campaign has ended
- Available withdrawal amount > 0
- Campaign.creator exists
- Campaign.creator.email exists
- Database connection ready
```

## Email Rate Limiter Utility

**File**: `utils/emailRateLimiter.js`

A centralized rate limiting utility that can be optionally integrated:

```javascript
const emailRateLimiter = require('../utils/emailRateLimiter');

// Use in email sending functions
await emailRateLimiter.sendWithRateLimit(sendEmail, campaign, user, stats);

// Check stats
const stats = emailRateLimiter.getStats();
console.log(`Emails sent: ${stats.emailsLastMinute}/min, ${stats.emailsLastHour}/hour`);
```

## Monitoring

### Success Indicators
```bash
✅ Daily Report Worker connected to Bull Redis
✅ Job completed ✅
✅ Scheduled X/Y daily report jobs
[Worker] Stats: X NPR from Y donors today
```

### Warning Signs
```bash
⚠️  Campaign has no creator - skipping email
⚠️  Creator has no email - skipping email
⚠️  Job stalled (likely took too long or worker died)
⚠️  Redis connection closed
⚠️  X jobs failed to schedule
```

### Failure Indicators
```bash
❌ Job failed ❌
❌ Worker error ❌
❌ Database not connected
⚠️  Job exhausted all retry attempts - PERMANENTLY FAILED
```

## Queue Configurations

### Daily Report Queue
```javascript
attempts: 5
backoff: { type: 'exponential', delay: 60000 }
removeOnComplete: 100
removeOnFail: 200
```

### Campaign Completion Queue
```javascript
attempts: 5
backoff: { type: 'exponential', delay: 60000 }
removeOnComplete: 500
removeOnFail: 500
```

### Withdrawal Reminder Queue
```javascript
attempts: 5
backoff: { type: 'exponential', delay: 60000 }
removeOnComplete: 1000
removeOnFail: 500
```

## Scheduling

### Daily Reports
- **Trigger Time**: 6 PM Nepal Time (UTC+5:45)
- **Check Interval**: Every 30 minutes
- **Target**: Active campaigns that haven't ended
- **Delay**: 3 seconds between each email

### Campaign Completion
- **Check Interval**: Every hour
- **Target**: Campaigns past end date, not yet marked completed
- **Delay**: 5 seconds between each email

### Withdrawal Reminders
- **Check Time**: 10 AM Nepal Time (UTC+5:45)
- **Check Interval**: Every hour
- **Target**: Ended campaigns with available funds
- **Reminder Types**:
  - 9-month: 270 days after campaign end
  - 11-month: 330 days after campaign end
  - Final: 355 days after campaign end
  - Reallocation: 365+ days after campaign end
- **Delay**: 5 seconds between each email

## Error Handling

### Job Validation Errors
**Non-retryable** - Job fails immediately:
- Missing campaignId
- Invalid campaign data

### Database Connection Errors
**Retryable** - Job will retry:
- Database not connected
- Mongoose connection state !== 1

### Email Service Errors
**Retryable** - Job will retry with exponential backoff:
- Rate limit exceeded (429)
- Service temporarily unavailable
- Network errors

### Validation Warnings
**Non-retryable** - Job completes with warning:
- Campaign has no creator
- Creator has no email
- Campaign not active/ended
- No funds available

## Troubleshooting

### Problem: Jobs constantly failing
**Check**:
1. Database connection is stable
2. ZeptoMail API token is valid
3. Worker concurrency is appropriate (default: 5)
4. Check logs for specific error messages

### Problem: Emails not being sent
**Check**:
1. Worker is running (`✅ Worker connected to Bull Redis`)
2. Scheduler is enabled (`ENABLE_SCHEDULER=true`)
3. Check Bull Board for job status
4. Verify email tokens are configured

### Problem: Rate limit errors
**Solution**:
- Reduce `BULL_WORKER_CONCURRENCY`
- Increase delays between emails in scheduler
- Check ZeptoMail dashboard for limits
- Consider upgrading email service plan

### Problem: Duplicate emails
**Solution**:
- Jobs use unique IDs per day to prevent duplicates
- Check for multiple scheduler instances running
- Verify `ENABLE_SCHEDULER` is only true on one instance

## Best Practices

1. **Run only ONE scheduler instance** with `ENABLE_SCHEDULER=true`
2. **Monitor Redis connection** stability
3. **Check Bull Board** regularly for failed jobs
4. **Review error logs** for patterns
5. **Adjust delays** based on your email service limits
6. **Keep worker concurrency** at reasonable levels (5-10)
7. **Ensure database** connection is stable before starting workers

## Upgrade Recommendations

If you frequently hit rate limits:
1. Upgrade ZeptoMail plan for higher limits
2. Implement the `emailRateLimiter` utility in email functions
3. Further increase delays between emails
4. Reduce worker concurrency
5. Consider queueing emails in batches

## Testing

### Manual Testing
```javascript
// Trigger manual daily report
POST /api/employee/trigger-daily-reports

// Trigger manual campaign completion
POST /api/employee/trigger-campaign-completion/:campaignId

// Check queue status
GET /admin/queues
```

### Monitoring Commands
```bash
# Watch worker logs
npm run dev

# Check Redis connection
redis-cli -u YOUR_REDIS_URL ping

# Monitor Bull Board
http://localhost:5000/admin/queues
```

## Support

If jobs continue to fail after implementing these changes:
1. Check all environment variables are set
2. Verify database connection is stable
3. Confirm email service credentials are valid
4. Review detailed error logs with stack traces
5. Check Bull Board for specific job failure reasons
