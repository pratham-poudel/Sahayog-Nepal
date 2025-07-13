const redis = require('../utils/RedisClient');
const crypto = require('crypto');

const cacheMiddleware = (generateKey) => {
  return async (req, res, next) => {
    try {
      // Generate a dynamic cache key
      let key = typeof generateKey === 'function' ? generateKey(req) : generateKey;

      // Skip caching for random=true queries (since they use $sample)
      if (req.query.random === 'true') return next();

      const cachedData = await redis.get(key);
      if (cachedData) {
        console.log(`Cache HIT: ${key}`);
        return res.status(200).json(JSON.parse(cachedData));
      }

      console.log(`Cache MISS: ${key}`);

      // Monkey patch to store in cache after sending response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        if (res.statusCode === 200) {
          redis.set(key, JSON.stringify(data), 'EX', 60 * 5); // cache for 5 mins
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      console.error('Redis cache error:', err);
      next(); // fail open if Redis fails
    }
  };
};

module.exports = cacheMiddleware;
