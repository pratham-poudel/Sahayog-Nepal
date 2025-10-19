const { Queue } = require('bullmq');
const bullRedis = require('../utils/bullRedis');

/**
 * Withdrawal Reminder Queue
 * Handles withdrawal deadline reminders (9 months, 11 months, final notice)
 * and automatic fund reallocation after 1-year deadline
 */
const withdrawalReminderQueue = new Queue('withdrawal-reminder', {
  connection: bullRedis,
  prefix: 'withdrawal',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: 1000,
    removeOnFail: 500,
  },
});

module.exports = withdrawalReminderQueue;
