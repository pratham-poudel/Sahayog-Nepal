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
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: 500,
    removeOnFail: 500,
  },
});

module.exports = campaignCompletionQueue;
