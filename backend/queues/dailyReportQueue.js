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
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

module.exports = dailyReportQueue;
