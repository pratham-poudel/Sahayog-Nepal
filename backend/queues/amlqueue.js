const { Queue } = require('bullmq');
const bullRedis = require('../utils/bullRedis');

const amlQueue = new Queue('aml-analysis', {
  connection: bullRedis, // ✅ use bull redis connection directly
  prefix: 'aml',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

module.exports = amlQueue;
