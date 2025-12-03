const http = require('http');
const app = require('./app');
require('dotenv').config();

// Initialize Workers
const amlWorker = require('./workers/amlWorker');
const campaignCompletionWorker = require('./workers/campaignCompletionWorker');
const withdrawalReminderWorker = require('./workers/withdrawalReminderWorker');
const dailyReportWorker = require('./workers/dailyReportWorker');
console.log('[Server] All workers initialized');

// Initialize Campaign Queue Scheduler (only if this instance is designated as scheduler)
const isSchedulerInstance = process.env.ENABLE_SCHEDULER === 'true';
const campaignQueueScheduler = isSchedulerInstance ? require('./services/campaignQueueScheduler') : null;

if (isSchedulerInstance) {
  console.log('[Server] 🕐 This instance is designated as SCHEDULER instance');
} else {
  console.log('[Server] ⚙️  This instance is a WORKER instance (scheduler disabled)');
  console.log('[Server] ⚠️  To enable daily reports and automated scheduling, set ENABLE_SCHEDULER=true in your .env file');
}

const port = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  
  // Initialize schedulers after server starts (ONLY on scheduler instance)
  if (isSchedulerInstance && campaignQueueScheduler) {
    try {
      await campaignQueueScheduler.initialize();
      console.log('[Server] ✅ Campaign queue schedulers initialized successfully');
    } catch (error) {
      console.error('[Server] ❌ Error initializing campaign schedulers:', error);
    }
  } else if (!isSchedulerInstance) {
    console.log('[Server] ⏭️  Scheduler disabled on this instance (set ENABLE_SCHEDULER=true to enable)');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, closing gracefully...');
  
  // Clean up schedulers (only if scheduler instance)
  if (isSchedulerInstance && campaignQueueScheduler) {
    campaignQueueScheduler.cleanup();
    console.log('[Server] ✅ Schedulers cleaned up');
  }
  
  // Close all workers
  await Promise.all([
    amlWorker.close(),
    campaignCompletionWorker.close(),
    withdrawalReminderWorker.close(),
    dailyReportWorker.close()
  ]);
  console.log('[Server] ✅ All workers closed');
  
  server.close(() => {
    console.log('[Server] Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, closing gracefully...');
  
  // Clean up schedulers (only if scheduler instance)
  if (isSchedulerInstance && campaignQueueScheduler) {
    campaignQueueScheduler.cleanup();
    console.log('[Server] ✅ Schedulers cleaned up');
  }
  
  // Close all workers
  await Promise.all([
    amlWorker.close(),
    campaignCompletionWorker.close(),
    withdrawalReminderWorker.close(),
    dailyReportWorker.close()
  ]);
  console.log('[Server] ✅ All workers closed');
  
  server.close(() => {
    console.log('[Server] Process terminated');
    process.exit(0);
  });
}); 