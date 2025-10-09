require('dotenv').config();
const { Worker } = require('bullmq');
const bullRedis = require('../utils/bullRedis'); // ✅ use your existing bull redis connection
const Payment = require('../models/Payment');
const User = require('../models/User');
const { analyzeTransaction } = require('../services/amlService');

const worker = new Worker(
  'aml-analysis',
  async (job) => {
    console.log(`[AML Worker] Processing job ${job.id} for payment: ${job.data.paymentId}`);
    
    const { paymentId } = job.data;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.warn(`[AML Worker] Payment not found: ${paymentId}`);
      throw new Error(`Payment not found: ${paymentId}`);
    }

    console.log(`[AML Worker] Found payment ${paymentId} - Amount: ${payment.amount}, Method: ${payment.paymentMethod}, Status: ${payment.status}`);

    const user = payment.userId ? await User.findById(payment.userId) : null;
    if (user) {
      console.log(`[AML Worker] User found: ${user._id} (${user.name})`);
    } else {
      console.log(`[AML Worker] Guest donation - no user account`);
    }

    const result = await analyzeTransaction(
      payment.toObject(),
      user ? user.toObject() : null
    );

    console.log(`[AML Worker] Analysis complete for payment ${paymentId} - Risk: ${result.riskScore}, Status: ${result.amlStatus}`);
    return result;
  },
  {
    connection: bullRedis,
    prefix: 'aml', // Must match the queue prefix!
    concurrency: parseInt(process.env.BULL_WORKER_CONCURRENCY || '5', 10),
  }
);

// Logging
worker.on('ready', () => console.log('✅ AML Worker connected to Bull Redis'));
worker.on('completed', (job, result) => {
  console.log(`[AML Worker] Job ${job.id} completed ✅`);
  console.log(`[AML Worker] Result: Risk Score ${result.riskScore}, Status: ${result.amlStatus}, Flags: [${result.flags.join(', ')}]`);
  if (result.alertId) {
    console.log(`[AML Worker] ⚠️ High-risk alert created: ${result.alertId}`);
  }
});
worker.on('failed', (job, err) => {
  console.error(`[AML Worker] Job ${job?.id} failed ❌:`, err.message);
  console.error(`[AML Worker] Payment ID: ${job?.data?.paymentId}`);
  console.error(`[AML Worker] Stack:`, err.stack);
});
worker.on('error', (err) => console.error('[AML Worker] Worker error ❌:', err));
worker.on('stalled', (jobId) => console.warn(`[AML Worker] Job ${jobId} stalled ⚠️`));

module.exports = worker;
