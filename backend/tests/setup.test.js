// Simple test to verify Jest setup
describe('Email Abuse Protection Setup Test', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should import emailAbuseProtection middleware', () => {
    const emailAbuseProtection = require('../middlewares/emailAbuseProtection');
    expect(emailAbuseProtection).toBeDefined();
    expect(typeof emailAbuseProtection.emailFrequencyProtection).toBe('function');
  });

  test('should import rate limiting middleware', () => {
    const rateLimitMiddleware = require('../middlewares/rateLimitMiddleware');
    expect(rateLimitMiddleware).toBeDefined();
    expect(rateLimitMiddleware.emailLimiter).toBeDefined();
  });
});
