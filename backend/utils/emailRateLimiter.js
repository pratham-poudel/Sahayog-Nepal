/**
 * Email Rate Limiter Utility
 * Provides centralized rate limiting for email services across all workers
 * Helps prevent hitting ZeptoMail rate limits
 */

class EmailRateLimiter {
  constructor() {
    // Track email sending timestamps
    this.emailTimestamps = [];
    
    // Configuration
    this.config = {
      maxEmailsPerMinute: 20,      // ZeptoMail typical limit: ~20-30/minute
      maxEmailsPerHour: 500,       // Adjust based on your plan
      minDelayBetweenEmails: 2000, // 2 seconds minimum between emails
    };
  }

  /**
   * Check if we can send an email now without hitting rate limits
   * @returns {Object} { canSend: boolean, waitTime: number }
   */
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean up old timestamps
    this.emailTimestamps = this.emailTimestamps.filter(ts => ts > oneHourAgo);

    // Count emails in last minute and hour
    const emailsLastMinute = this.emailTimestamps.filter(ts => ts > oneMinuteAgo).length;
    const emailsLastHour = this.emailTimestamps.length;

    // Get last email timestamp
    const lastEmailTime = this.emailTimestamps[this.emailTimestamps.length - 1] || 0;
    const timeSinceLastEmail = now - lastEmailTime;

    // Check all rate limit conditions
    if (emailsLastMinute >= this.config.maxEmailsPerMinute) {
      const oldestInMinute = Math.min(...this.emailTimestamps.filter(ts => ts > oneMinuteAgo));
      const waitTime = Math.max(0, (oldestInMinute + 60 * 1000) - now);
      return { canSend: false, waitTime, reason: 'per-minute limit' };
    }

    if (emailsLastHour >= this.config.maxEmailsPerHour) {
      const oldestInHour = Math.min(...this.emailTimestamps);
      const waitTime = Math.max(0, (oldestInHour + 60 * 60 * 1000) - now);
      return { canSend: false, waitTime, reason: 'per-hour limit' };
    }

    if (timeSinceLastEmail < this.config.minDelayBetweenEmails) {
      const waitTime = this.config.minDelayBetweenEmails - timeSinceLastEmail;
      return { canSend: false, waitTime, reason: 'minimum delay' };
    }

    return { canSend: true, waitTime: 0 };
  }

  /**
   * Record that an email was sent
   */
  recordEmailSent() {
    this.emailTimestamps.push(Date.now());
  }

  /**
   * Wait for rate limit to allow sending
   * @returns {Promise<void>}
   */
  async waitForRateLimit() {
    const { canSend, waitTime, reason } = this.checkRateLimit();
    
    if (!canSend) {
      console.log(`[Email Rate Limiter] Rate limit reached (${reason}), waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    return this.waitForRateLimit(); // Recursive check
  }

  /**
   * Wrap an email sending function with rate limiting
   * @param {Function} emailFunction - Function that sends email
   * @param {Array} args - Arguments to pass to email function
   * @returns {Promise<any>}
   */
  async sendWithRateLimit(emailFunction, ...args) {
    await this.waitForRateLimit();
    
    try {
      const result = await emailFunction(...args);
      this.recordEmailSent();
      return result;
    } catch (error) {
      // If it's a rate limit error from the email service, back off
      if (error.message && (
        error.message.includes('rate limit') || 
        error.message.includes('too many requests') ||
        error.message.includes('429')
      )) {
        console.warn(`[Email Rate Limiter] Rate limit error from email service, backing off for 10s...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        throw error; // Re-throw so worker can retry
      }
      throw error;
    }
  }

  /**
   * Get current rate limit stats
   * @returns {Object}
   */
  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const emailsLastMinute = this.emailTimestamps.filter(ts => ts > oneMinuteAgo).length;
    const emailsLastHour = this.emailTimestamps.filter(ts => ts > oneHourAgo).length;

    return {
      emailsLastMinute,
      emailsLastHour,
      maxEmailsPerMinute: this.config.maxEmailsPerMinute,
      maxEmailsPerHour: this.config.maxEmailsPerHour,
      remainingThisMinute: Math.max(0, this.config.maxEmailsPerMinute - emailsLastMinute),
      remainingThisHour: Math.max(0, this.config.maxEmailsPerHour - emailsLastHour),
    };
  }
}

// Export a singleton instance
const emailRateLimiter = new EmailRateLimiter();

module.exports = emailRateLimiter;
