// Simple test to watch worker process a job
require('dotenv').config();
const mongoose = require('mongoose');

async function watchWorker() {
  console.log('Starting worker watch test...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected\n');
    
    // Start worker
    console.log('Starting worker...');
    const amlWorker = require('../workers/amlWorker');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Worker ready\n');
    
    // Get a payment to test
    const Payment = require('../models/Payment');
    const testPayment = await Payment.findOne({ 
      status: 'Completed',
      riskScore: { $exists: true, $eq: 0 } // Find one that hasn't been analyzed yet
    }).sort('-createdAt');
    
    if (!testPayment) {
      console.log('No unanalyzed payments found, using any completed payment');
      const anyPayment = await Payment.findOne({ status: 'Completed' }).sort('-createdAt');
      if (anyPayment) {
        console.log(`Using payment: ${anyPayment._id}\n`);
        await testJob(anyPayment._id.toString());
      } else {
        console.log('No completed payments found at all!');
      }
    } else {
      console.log(`Found unanalyzed payment: ${testPayment._id}`);
      console.log(`Amount: ${testPayment.amount}, Method: ${testPayment.paymentMethod}\n`);
      await testJob(testPayment._id.toString());
    }
    
    async function testJob(paymentId) {
      const amlQueue = require('../queues/amlqueue');
      
      console.log('Adding job to queue...');
      const job = await amlQueue.add('analyze-payment', { paymentId });
      console.log(`✅ Job ${job.id} added\n`);
      console.log('Watch the logs above for worker processing...\n');
      
      // Wait and check status
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const state = await job.getState();
        process.stdout.write(`\rStatus check ${i+1}/15: ${state}...`);
        
        if (state === 'completed' || state === 'failed') {
          console.log('\n');
          
          if (state === 'completed') {
            const returnValue = await job.returnvalue;
            console.log('✅ Job completed!');
            console.log('Return value:', JSON.stringify(returnValue, null, 2));
            
            // Check payment was updated
            const Payment = require('../models/Payment');
            const updatedPayment = await Payment.findById(paymentId);
            console.log('\nPayment after analysis:');
            console.log(`  Risk Score: ${updatedPayment.riskScore}`);
            console.log(`  AML Status: ${updatedPayment.amlStatus}`);
            console.log(`  Flags: ${updatedPayment.flags.join(', ') || 'None'}`);
          } else {
            console.log('❌ Job failed:', job.failedReason);
          }
          break;
        }
      }
    }
    
    console.log('\n\nKeeping worker alive for 5 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await amlWorker.close();
    await mongoose.connection.close();
    console.log('\n✅ Test complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

watchWorker();
