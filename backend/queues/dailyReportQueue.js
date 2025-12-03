const { Queue } = require('bullmq');
const bullRedis = require('../utils/bullRedis');

/**
 * Daily Report Queue
 * Sends daily performance reports to active campaign creators
 */
const dailyReportQueue = new Queue('daily-report', {
  connection: bullRedis,
  prefix: 'report',
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 60000 }, // Start with 60s delay
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

module.exports = dailyReportQueue;
