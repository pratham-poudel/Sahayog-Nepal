const Redis = require('ioredis');
require('dotenv').config();

// Parse Redis URL if available, otherwise use default config
const redisUrl = process.env.REDIS_BULL_URL || process.env.REDIS_HOST;

// Validate that we have a Redis URL
if (!redisUrl) {
  console.error('❌ FATAL: No Redis URL found in environment variables!');
  console.error('❌ Please set REDIS_BULL_URL or REDIS_HOST in your .env file');
  process.exit(1);
}

console.log(`🔌 Connecting to Bull Redis: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs

const bullRedis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Auto-detect TLS based on URL scheme (rediss://)
  ...(redisUrl && redisUrl.startsWith('rediss://') ? {
    tls: {
      rejectUnauthorized: false
    }
  } : {})
});

bullRedis.on('connect', () => console.log('✅ Bull/AML Redis connected'));
bullRedis.on('ready', () => console.log('✅ Bull/AML Redis ready'));
bullRedis.on('error', (err) => console.error('❌ Bull Redis error:', err.message));
bullRedis.on('close', () => console.warn('⚠️  Bull Redis connection closed'));

module.exports = bullRedis;
