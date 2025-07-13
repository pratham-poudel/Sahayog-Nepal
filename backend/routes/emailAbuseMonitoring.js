const express = require('express');
const router = express.Router();
const redis = require('../utils/RedisClient');
const adminAuth = require('../middleware/adminAuth');

/**
 * Email Abuse Monitoring Routes
 * Provides administrators with insights into email abuse patterns and attempts
 */

// Get email abuse statistics and recent attempts
router.get('/email-abuse/stats', adminAuth, async (req, res) => {
    try {
        const { timeframe = '24h' } = req.query;
        
        let hours = 24;
        switch (timeframe) {
            case '1h': hours = 1; break;
            case '6h': hours = 6; break;
            case '24h': hours = 24; break;
            case '7d': hours = 168; break;
            default: hours = 24;
        }
        
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        
        // Get all abuse log keys
        const logKeys = await redis.keys('abuse-log:*');
        
        let stats = {
            totalAttempts: 0,
            abuseTypes: {},
            ipAddresses: {},
            emailAddresses: {},
            recentLogs: [],
            timeframe: timeframe
        };
        
        for (const key of logKeys) {
            try {
                const logData = await redis.get(key);
                if (logData) {
                    const log = JSON.parse(logData);
                    const logTime = new Date(log.timestamp).getTime();
                    
                    if (logTime >= cutoffTime) {
                        stats.totalAttempts++;
                        
                        // Count abuse types
                        stats.abuseTypes[log.type] = (stats.abuseTypes[log.type] || 0) + 1;
                        
                        // Count IP addresses
                        stats.ipAddresses[log.ip] = (stats.ipAddresses[log.ip] || 0) + 1;
                        
                        // Count email addresses
                        if (log.email) {
                            stats.emailAddresses[log.email] = (stats.emailAddresses[log.email] || 0) + 1;
                        }
                        
                        // Add to recent logs (limit to 50 most recent)
                        if (stats.recentLogs.length < 50) {
                            stats.recentLogs.push(log);
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing abuse log:', error);
            }
        }
        
        // Sort recent logs by timestamp (newest first)
        stats.recentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching abuse stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching abuse statistics'
        });
    }
});

// Get currently blocked IPs
router.get('/email-abuse/blocked-ips', adminAuth, async (req, res) => {
    try {
        const blockedKeys = await redis.keys('blocked:*');
        const blockedIPs = [];
        
        for (const key of blockedKeys) {
            const ip = key.replace('blocked:', '');
            const reason = await redis.get(key);
            const ttl = await redis.ttl(key);
            
            blockedIPs.push({
                ip: ip,
                reason: reason,
                expiresIn: ttl > 0 ? ttl : 0,
                expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000) : null
            });
        }
        
        res.json({
            success: true,
            data: blockedIPs
        });
    } catch (error) {
        console.error('Error fetching blocked IPs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching blocked IPs'
        });
    }
});

// Get OTP attempt statistics
router.get('/email-abuse/otp-attempts', adminAuth, async (req, res) => {
    try {
        const otpKeys = await redis.keys('otp-attempts:*');
        const attempts = [];
        
        for (const key of otpKeys) {
            const email = key.replace('otp-attempts:', '');
            const attemptCount = await redis.get(key);
            const ttl = await redis.ttl(key);
            
            attempts.push({
                email: email,
                attempts: parseInt(attemptCount) || 0,
                expiresIn: ttl > 0 ? ttl : 0
            });
        }
        
        // Sort by attempt count (highest first)
        attempts.sort((a, b) => b.attempts - a.attempts);
        
        res.json({
            success: true,
            data: attempts
        });
    } catch (error) {
        console.error('Error fetching OTP attempts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching OTP attempts'
        });
    }
});

// Manually block an IP address
router.post('/email-abuse/block-ip', adminAuth, async (req, res) => {
    try {
        const { ip, reason, duration = 3600 } = req.body; // Default 1 hour
        
        if (!ip) {
            return res.status(400).json({
                success: false,
                message: 'IP address is required'
            });
        }
        
        await redis.set(`blocked:${ip}`, reason || 'Manually blocked by admin', 'EX', duration);
        
        res.json({
            success: true,
            message: `IP ${ip} has been blocked for ${duration} seconds`
        });
    } catch (error) {
        console.error('Error blocking IP:', error);
        res.status(500).json({
            success: false,
            message: 'Error blocking IP address'
        });
    }
});

// Unblock an IP address
router.delete('/email-abuse/unblock-ip/:ip', adminAuth, async (req, res) => {
    try {
        const { ip } = req.params;
        
        const deleted = await redis.del(`blocked:${ip}`);
        
        if (deleted > 0) {
            res.json({
                success: true,
                message: `IP ${ip} has been unblocked`
            });
        } else {
            res.status(404).json({
                success: false,
                message: `IP ${ip} was not blocked`
            });
        }
    } catch (error) {
        console.error('Error unblocking IP:', error);
        res.status(500).json({
            success: false,
            message: 'Error unblocking IP address'
        });
    }
});

// Clear OTP attempts for an email
router.delete('/email-abuse/clear-otp-attempts/:email', adminAuth, async (req, res) => {
    try {
        const { email } = req.params;
        
        const deleted = await redis.del(`otp-attempts:${email}`);
        
        if (deleted > 0) {
            res.json({
                success: true,
                message: `OTP attempts cleared for ${email}`
            });
        } else {
            res.status(404).json({
                success: false,
                message: `No OTP attempts found for ${email}`
            });
        }
    } catch (error) {
        console.error('Error clearing OTP attempts:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing OTP attempts'
        });
    }
});

// Get email frequency data
router.get('/email-abuse/email-frequency', adminAuth, async (req, res) => {
    try {
        const frequencyKeys = await redis.keys('email-freq:*');
        const frequencies = [];
        
        for (const key of frequencyKeys) {
            const email = key.replace('email-freq:', '');
            const timestamp = await redis.get(key);
            const ttl = await redis.ttl(key);
            
            if (timestamp) {
                frequencies.push({
                    email: email,
                    lastRequest: new Date(parseInt(timestamp)),
                    expiresIn: ttl > 0 ? ttl : 0
                });
            }
        }
        
        // Sort by most recent request
        frequencies.sort((a, b) => b.lastRequest - a.lastRequest);
        
        res.json({
            success: true,
            data: frequencies
        });
    } catch (error) {
        console.error('Error fetching email frequency data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching email frequency data'
        });
    }
});

// Export abuse logs as CSV
router.get('/email-abuse/export', adminAuth, async (req, res) => {
    try {
        const { format = 'json', timeframe = '24h' } = req.query;
        
        let hours = 24;
        switch (timeframe) {
            case '1h': hours = 1; break;
            case '6h': hours = 6; break;
            case '24h': hours = 24; break;
            case '7d': hours = 168; break;
            default: hours = 24;
        }
        
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        const logKeys = await redis.keys('abuse-log:*');
        const logs = [];
        
        for (const key of logKeys) {
            try {
                const logData = await redis.get(key);
                if (logData) {
                    const log = JSON.parse(logData);
                    const logTime = new Date(log.timestamp).getTime();
                    
                    if (logTime >= cutoffTime) {
                        logs.push(log);
                    }
                }
            } catch (error) {
                console.error('Error processing log for export:', error);
            }
        }
        
        // Sort by timestamp
        logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (format === 'csv') {
            const csvHeader = 'Timestamp,IP,Email,Type,Details,UserAgent,Referer,Origin\n';
            const csvData = logs.map(log => {
                return [
                    log.timestamp,
                    log.ip || '',
                    log.email || '',
                    log.type || '',
                    (log.details || '').replace(/"/g, '""'),
                    (log.userAgent || '').replace(/"/g, '""'),
                    (log.headers?.referer || '').replace(/"/g, '""'),
                    (log.headers?.origin || '').replace(/"/g, '""')
                ].map(field => `"${field}"`).join(',');
            }).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=email_abuse_logs_${timeframe}_${Date.now()}.csv`);
            res.send(csvHeader + csvData);
        } else {
            res.json({
                success: true,
                data: logs
            });
        }
    } catch (error) {
        console.error('Error exporting abuse logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting abuse logs'
        });
    }
});

module.exports = router;
