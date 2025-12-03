const { Queue } = require('bullmq');
const bullRedis = require('../utils/bullRedis');

/**
 * Campaign Completion Queue
 * Handles automatic campaign completion checks when end date is reached
 */
const campaignCompletionQueue = new Queue('campaign-completion', {
  connection: bullRedis,
  prefix: 'campaign',
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 60000 }, // 60s initial backoff for email rate limiting
    removeOnComplete: 500,
    removeOnFail: 500,
  },
});

module.exports = campaignCompletionQueue;
