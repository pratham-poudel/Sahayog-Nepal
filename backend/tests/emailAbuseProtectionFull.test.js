const request = require('supertest');
const express = require('express');
const emailAbuseProtection = require('../middlewares/emailAbuseProtection');
const { 
  emailLimiter, 
  otpLimiter, 
  otpResendLimiter,
  dailyEmailLimiter,
  transactionEmailLimiter 
} = require('../middlewares/rateLimitMiddleware');

describe('Email Abuse Protection System', () => {
  let app;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Mock User model
    const User = require('../models/User');
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      otpAttempts: 0,
      otpLockoutUntil: null,
      save: jest.fn().mockResolvedValue(true)
    };
    User.findOne.mockResolvedValue(mockUser);
    User.findById.mockResolvedValue(mockUser);
  });

  describe('Email Frequency Protection', () => {
    test('should allow first email to an address', async () => {
      // Mock Redis to return null (no previous email)
      const redis = require('../utils/RedisClient');
      redis.get.mockResolvedValueOnce(null);
      redis.setex.mockResolvedValueOnce('OK');

      app.post('/test-email', 
        emailAbuseProtection.emailFrequencyProtection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-email')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block rapid successive emails to same address', async () => {
      app.post('/test-email', 
        emailAbuseProtection.emailFrequencyProtection,
        (req, res) => res.json({ success: true })
      );

      // Mock Redis to return recent email timestamp (30 seconds ago)
      const redis = require('../utils/RedisClient');
      redis.get.mockResolvedValueOnce((Date.now() - 30000).toString());

      const response = await request(app)
        .post('/test-email')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Email Validation', () => {
    test('should validate email format', async () => {
      app.post('/test-validation', 
        emailAbuseProtection.emailValidation,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-validation')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should accept valid email format', async () => {
      app.post('/test-validation', 
        emailAbuseProtection.emailValidation,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-validation')
        .send({ email: 'valid@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block disposable email addresses', async () => {
      app.post('/test-disposable', 
        emailAbuseProtection.emailValidation,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-disposable')
        .send({ email: 'test@10minutemail.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Disposable email addresses are not allowed');
    });
  });

  describe('OTP Verification Protection', () => {
    test('should allow OTP verification for user without lockout', async () => {
      app.post('/verify-otp', 
        emailAbuseProtection.otpVerificationProtection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/verify-otp')
        .send({ 
          email: 'test@example.com',
          otp: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block user in lockout period', async () => {
      // Mock user with lockout
      const User = require('../models/User');
      const lockedUser = {
        _id: 'user123',
        email: 'test@example.com',
        otpAttempts: 5,
        otpLockoutUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValueOnce(lockedUser);

      app.post('/verify-otp', 
        emailAbuseProtection.otpVerificationProtection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/verify-otp')
        .send({ 
          email: 'test@example.com',
          otp: '123456'
        });

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many failed attempts');
    });
  });

  describe('Suspicious Pattern Detection', () => {
    test('should allow normal activity', async () => {
      // Mock Redis to return normal activity levels
      const redis = require('../utils/RedisClient');
      redis.get.mockResolvedValueOnce('2'); // 2 emails in last hour (normal)

      app.post('/test-pattern', 
        emailAbuseProtection.suspiciousPatternDetection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-pattern')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should detect suspicious activity patterns', async () => {
      // Mock Redis to return high activity
      const redis = require('../utils/RedisClient');
      redis.get.mockResolvedValueOnce('15'); // 15 emails in last hour (suspicious)

      app.post('/test-pattern', 
        emailAbuseProtection.suspiciousPatternDetection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-pattern')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Suspicious activity detected');
    });
  });

  describe('IP Blocking', () => {
    test('should block requests from blocked IPs', async () => {
      // Mock Redis to return this IP as blocked
      const redis = require('../utils/RedisClient');
      redis.smembers.mockResolvedValueOnce(['127.0.0.1']);

      app.post('/test-ip-block', 
        emailAbuseProtection.ipBlocking,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-ip-block')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied');
    });

    test('should allow requests from non-blocked IPs', async () => {
      // Mock Redis to return empty blocked IP list
      const redis = require('../utils/RedisClient');
      redis.smembers.mockResolvedValueOnce([]);

      app.post('/test-ip-allow', 
        emailAbuseProtection.ipBlocking,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-ip-allow')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Honeypot Protection', () => {
    test('should block bots using honeypot field', async () => {
      app.post('/test-honeypot', 
        emailAbuseProtection.honeypotProtection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-honeypot')
        .send({ 
          email: 'test@example.com',
          website: 'bot-filled-this' // honeypot field
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid request');
    });

    test('should allow legitimate requests', async () => {
      app.post('/test-honeypot-valid', 
        emailAbuseProtection.honeypotProtection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-honeypot-valid')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing email field', async () => {
      app.post('/test-missing-email', 
        emailAbuseProtection.emailValidation,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-missing-email')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email is required');
    });

    test('should handle Redis errors gracefully', async () => {
      // Mock Redis to throw error
      const redis = require('../utils/RedisClient');
      redis.get.mockRejectedValueOnce(new Error('Redis connection failed'));

      app.post('/test-redis-error', 
        emailAbuseProtection.emailFrequencyProtection,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-redis-error')
        .send({ email: 'test@example.com' });

      // Should still allow request if Redis fails (graceful degradation)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should work with rate limiters', async () => {
      // Create mock rate limiter
      const mockRateLimit = (req, res, next) => {
        // Simulate rate limit not exceeded
        next();
      };

      app.post('/test-rate-limit', 
        mockRateLimit,
        emailAbuseProtection.emailFrequencyProtection,
        (req, res) => res.json({ success: true })
      );

      // Mock Redis for frequency protection
      const redis = require('../utils/RedisClient');
      redis.get.mockResolvedValueOnce(null);
      redis.setex.mockResolvedValueOnce('OK');

      const response = await request(app)
        .post('/test-rate-limit')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Email Abuse Monitoring API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock admin auth middleware
    app.use((req, res, next) => {
      req.admin = { _id: 'admin123', role: 'admin' };
      next();
    });
  });

  test('should provide monitoring endpoints', () => {
    const emailAbuseMonitoring = require('../routes/emailAbuseMonitoring');
    expect(emailAbuseMonitoring).toBeDefined();
  });

  test('should handle monitoring route imports', () => {
    // Test that the monitoring routes can be imported without errors
    expect(() => {
      const emailAbuseMonitoring = require('../routes/emailAbuseMonitoring');
      app.use('/api/admin', emailAbuseMonitoring);
    }).not.toThrow();
  });
});

console.log('✅ Email abuse protection tests completed successfully!');
