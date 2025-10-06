const Redis = require('ioredis');
require('dotenv').config();

// Parse the Redis connection URL from environment variable
const redisUrl = process.env.REDIS_HOST;

// Create Redis client with proper configuration
// ioredis can accept a connection URL directly
const redis = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false // Required for some cloud Redis providers
  },
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true // Don't connect immediately
});

// Connect to Redis
redis.connect().catch((err) => {
  console.error('Failed to connect to Redis ❌:', err.message);
});

redis.on('connect', () => {
  console.log('Connected to Redis ✅');
});

redis.on('ready', () => {
  console.log('Redis is ready to accept commands ✅');
});

redis.on('error', (err) => {
  console.error('Redis connection error ❌:', err.message);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

module.exports = redis;
