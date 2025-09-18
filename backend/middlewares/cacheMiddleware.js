const redis = require('../utils/RedisClient');
const crypto = require('crypto');

const cacheMiddleware = (ttlOrGenerateKey, ttl) => {
  return async (req, res, next) => {
    try {
      let key, cacheTTL;
      
      // Handle different parameter combinations
      if (typeof ttlOrGenerateKey === 'function') {
        // First param is a function to generate key
        key = ttlOrGenerateKey(req);
        cacheTTL = ttl || 300; // Default 5 minutes
      } else if (typeof ttlOrGenerateKey === 'number') {
        // First param is TTL, generate key from route
        cacheTTL = ttlOrGenerateKey;
        key = `${req.route.path}:${crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')}`;
      } else if (typeof ttlOrGenerateKey === 'string') {
        // First param is static key
        key = ttlOrGenerateKey;
        cacheTTL = ttl || 300;
      } else {
        // Default behavior
        key = `${req.route.path}:${crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')}`;
        cacheTTL = 300;
      }

      // Skip caching for random=true queries (since they use $sample)
      if (req.query.random === 'true') return next();

      const cachedData = await redis.get(key);
      if (cachedData) {
        console.log(`📦 Cache HIT: ${key}`);
        return res.status(200).json(JSON.parse(cachedData));
      }

      console.log(`🔍 Cache MISS: ${key}`);

      // Monkey patch to store in cache after sending response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        if (res.statusCode === 200) {
          redis.set(key, JSON.stringify(data), 'EX', cacheTTL);
          console.log(`💾 Cached response for ${cacheTTL}s: ${key}`);
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      console.error('❌ Redis cache error:', err);
      next(); // fail open if Redis fails
    }
  };
};

module.exports = cacheMiddleware;
