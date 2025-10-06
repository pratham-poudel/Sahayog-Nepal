# Rate Limiting Setup Instructions

## 📦 Required Package Installation

The advanced rate limiting implementation requires the `rate-limit-redis` package for Redis-based distributed rate limiting.

### **Installation Command:**

```bash
cd backend
npm install rate-limit-redis
```

### **What This Package Does:**
- Provides Redis store for express-rate-limit
- Enables distributed rate limiting across multiple servers
- Shares rate limit counters across all application instances
- Prevents users from bypassing limits by switching servers

---

## 🚀 Setup Steps

### **1. Install the Package**
```bash
cd backend
npm install rate-limit-redis
```

### **2. Verify Redis is Running**
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG
```

### **3. Restart Your Server**
```bash
npm run dev
```

### **4. Test Rate Limiting**
```bash
# Test global rate limit
curl -I http://localhost:9000/api/campaigns
# Check response headers for RateLimit-* headers
```

---

## ✅ Verification

After installation, you should see this in your server logs:

```
✅ Redis-based rate limiting enabled
```

If Redis is not available, you'll see:
```
⚠️ Redis rate limiting unavailable, using memory store
```

**Note:** The system will work with or without Redis, but Redis is recommended for production.

---

## 📋 Alternative: Memory Store Only

If you don't want to use Redis (not recommended for production), you can modify `backend/middlewares/advancedRateLimiter.js`:

Comment out the Redis store configuration:
```javascript
// let redisStore;
// try {
//     if (redis && redis.status === 'ready') {
//         const RedisStore = require('rate-limit-redis');
//         redisStore = new RedisStore({
//             client: redis,
//             prefix: 'rl:',
//         });
//         console.log('✅ Redis-based rate limiting enabled');
//     }
// } catch (error) {
//     console.warn('⚠️ Redis rate limiting unavailable, using memory store:', error.message);
// }
```

⚠️ **Warning:** Memory store does not share limits across multiple server instances.

---

## 🔍 Package Information

**Package:** rate-limit-redis  
**Version:** Compatible with express-rate-limit v7.x  
**Purpose:** Redis store adapter for express-rate-limit  
**Documentation:** https://www.npmjs.com/package/rate-limit-redis  

---

## 🎯 Next Steps

After installing the package:

1. ✅ Install `rate-limit-redis`
2. ✅ Ensure Redis is running
3. ✅ Restart your server
4. ✅ Test rate limiting endpoints
5. ✅ Monitor rate limit violations in logs
6. ✅ Adjust limits if needed

---

**Status:** Pending Package Installation  
**Required:** Yes (for production)  
**Impact:** High (enables distributed rate limiting)
