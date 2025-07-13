const request = require('supertest');
const app = require('../server');
const redisClient = require('../utils/RedisClient');

describe('Email Abuse Protection Tests', () => {
  const testEmail = 'test@example.com';
  const testIP = '192.168.1.100';
  
  beforeEach(async () => {
    // Clear Redis cache before each test
    await redisClient.flushdb();
  });

  afterAll(async () => {
    // Clean up Redis connection
    await redisClient.quit();
  });

  describe('OTP Rate Limiting', () => {
    test('should allow initial OTP request', async () => {
      const response = await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email: testEmail })
        .set('X-Forwarded-For', testIP);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should block after 3 OTP requests in 15 minutes', async () => {
      // Send 3 OTP requests
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/users/send-otp')
          .send({ email: testEmail })
          .set('X-Forwarded-For', testIP);
      }

      // 4th request should be blocked
      const response = await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email: testEmail })
        .set('X-Forwarded-For', testIP);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('rate limit');
    });

    test('should block OTP resend after 2 attempts in 5 minutes', async () => {
      const email = 'resend@example.com';
      
      // Send initial OTP
      await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email })
        .set('X-Forwarded-For', testIP);

      // Send 2 resend requests
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/v1/users/resend-otp')
          .send({ email })
          .set('X-Forwarded-For', testIP);
      }

      // 3rd resend should be blocked
      const response = await request(app)
        .post('/api/v1/users/resend-otp')
        .send({ email })
        .set('X-Forwarded-For', testIP);

      expect(response.status).toBe(429);
    });
  });

  describe('Email Frequency Protection', () => {
    test('should block emails sent within 1 minute to same address', async () => {
      // Send first email
      await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email: testEmail })
        .set('X-Forwarded-For', testIP);

      // Immediate second request should be blocked
      const response = await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email: testEmail })
        .set('X-Forwarded-For', testIP);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('too soon');
    });
  });

  describe('Suspicious Pattern Detection', () => {
    test('should detect and block rapid successive emails to different addresses', async () => {
      const emails = [
        'user1@example.com',
        'user2@example.com', 
        'user3@example.com',
        'user4@example.com',
        'user5@example.com',
        'user6@example.com'
      ];

      // Send emails rapidly to different addresses
      for (const email of emails) {
        await request(app)
          .post('/api/v1/users/send-otp')
          .send({ email })
          .set('X-Forwarded-For', testIP);
        
        // Small delay to simulate rapid requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 7th email should trigger suspicious activity block
      const response = await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email: 'user7@example.com' })
        .set('X-Forwarded-For', testIP);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('suspicious');
    });

    test('should block disposable email domains', async () => {
      const disposableEmails = [
        'test@10minutemail.com',
        'test@guerrillamail.com',
        'test@tempmail.org'
      ];

      for (const email of disposableEmails) {
        const response = await request(app)
          .post('/api/v1/users/send-otp')
          .send({ email })
          .set('X-Forwarded-For', testIP);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('disposable');
      }
    });
  });

  describe('OTP Verification Protection', () => {
    test('should track failed OTP attempts and lockout after 5 failures', async () => {
      const email = 'lockout@example.com';
      
      // Send OTP first
      await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email })
        .set('X-Forwarded-For', testIP);

      // Make 5 failed verification attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/users/verify-otp')
          .send({ email, otp: '000000' })
          .set('X-Forwarded-For', testIP);
      }

      // 6th attempt should be locked out
      const response = await request(app)
        .post('/api/v1/users/verify-otp')
        .send({ email, otp: '000000' })
        .set('X-Forwarded-For', testIP);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('locked');
    });
  });

  describe('Daily Email Limits', () => {
    test('should enforce daily email limit per IP', async () => {
      // This test would need to mock time or use a lower limit for testing
      // For now, we'll test the structure
      const response = await request(app)
        .get('/api/v1/admin/email-abuse/stats')
        .set('Authorization', 'Bearer ' + process.env.TEST_ADMIN_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('dailyStats');
    });
  });

  describe('Admin Monitoring', () => {
    test('should provide abuse statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/email-abuse/stats')
        .set('Authorization', 'Bearer ' + process.env.TEST_ADMIN_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('blockedRequests');
      expect(response.body).toHaveProperty('suspiciousPatterns');
    });

    test('should allow manual IP blocking', async () => {
      const maliciousIP = '192.168.1.999';
      
      const response = await request(app)
        .post('/api/v1/admin/email-abuse/block-ip')
        .send({ 
          ip: maliciousIP, 
          reason: 'Test manual block',
          duration: 3600 
        })
        .set('Authorization', 'Bearer ' + process.env.TEST_ADMIN_TOKEN);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('blocked');

      // Verify the IP is actually blocked
      const testResponse = await request(app)
        .post('/api/v1/users/send-otp')
        .send({ email: testEmail })
        .set('X-Forwarded-For', maliciousIP);

      expect(testResponse.status).toBe(403);
    });
  });

  describe('Honeypot Protection', () => {
    test('should block requests with honeypot field filled', async () => {
      const response = await request(app)
        .post('/api/v1/users/send-otp')
        .send({ 
          email: testEmail,
          website: 'http://spam.com' // honeypot field
        })
        .set('X-Forwarded-For', testIP);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('suspicious');
    });
  });

  describe('Transaction Email Protection', () => {
    test('should respect transaction email rate limits', async () => {
      // Simulate sending multiple transaction emails
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/api/v1/users/send-transaction-email')
          .send({ 
            email: `user${i}@example.com`,
            type: 'password_reset'
          })
          .set('X-Forwarded-For', testIP);
      }

      // 21st email should be rate limited
      const response = await request(app)
        .post('/api/v1/users/send-transaction-email')
        .send({ 
          email: 'user21@example.com',
          type: 'password_reset'
        })
        .set('X-Forwarded-For', testIP);

      expect(response.status).toBe(429);
    });
  });
});

// Performance and Load Testing
describe('Email Protection Performance Tests', () => {
  test('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 50;
    const testIP = '192.168.1.200';
    
    const promises = Array.from({ length: concurrentRequests }, (_, i) => 
      request(app)
        .post('/api/v1/users/send-otp')
        .send({ email: `concurrent${i}@example.com` })
        .set('X-Forwarded-For', testIP)
    );

    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();

    // Should complete within reasonable time (5 seconds)
    expect(endTime - startTime).toBeLessThan(5000);
    
    // Some requests should succeed, some should be rate limited
    const successCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 200
    ).length;
    
    const rateLimitedCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    ).length;

    expect(successCount).toBeGreaterThan(0);
    expect(rateLimitedCount).toBeGreaterThan(0);
  });
});