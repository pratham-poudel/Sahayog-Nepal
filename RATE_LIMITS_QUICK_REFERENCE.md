# 🛡️ Rate Limiting Quick Reference

## Current Rate Limits by Endpoint

| Endpoint Category | Time Window | Request Limit | Scope |
|------------------|-------------|---------------|-------|
| **Global API** | 15 min | 200 | Per IP/User |
| **Authentication** | 15 min | 5 failed | Per IP+Email |
| **Campaign Creation** | 1 hour | 3 | Per User |
| **Donations/Payments** | 1 hour | 30 | Per User |
| **Withdrawals** | 24 hours | 5 | Per User |
| **File Uploads** | 1 hour | 50 | Per User |
| **Search Queries** | 10 min | 100 | Per User |
| **Admin Operations** | 5 min | 100 | Per Admin |
| **Data Exports** | 1 hour | 10 | Per Admin |
| **Bank Operations** | 1 hour | 10 | Per User |
| **Public Reads** | 10 min | 300 | Per IP |
| **Password Reset** | 1 hour | 3 | Per Email |

---

## 🔴 Critical Protected Endpoints

### **High Risk (Strict Limits)**
```
POST /api/admin/validate-access-code       [5/15min]
POST /api/admin/verify-credentials         [5/15min]
POST /api/admin/verify-otp-login          [5/15min]
POST /api/withdrawals/request             [5/day]
POST /api/campaigns                       [3/hour]
```

### **Financial (Moderate Limits)**
```
POST /api/payments/khalti/initiate        [30/hour]
POST /api/payments/esewa/initiate         [30/hour]
POST /api/payments/fonepay/initiate       [30/hour]
POST /api/bank/accounts                   [10/hour]
```

### **Public (Generous Limits)**
```
GET /api/campaigns                        [300/10min]
GET /api/campaigns/:id                    [300/10min]
GET /api/campaigns/search/:term           [100/10min]
```

---

## 📊 Response Headers

Every rate-limited response includes:

```http
RateLimit-Limit: 200
RateLimit-Remaining: 187
RateLimit-Reset: 1728234567
```

---

## ⚠️ Rate Limit Exceeded Response

```json
HTTP/1.1 429 Too Many Requests
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900,
  "errorCode": "CAMPAIGN_CREATION_LIMIT_EXCEEDED"
}
```

---

## 🎯 Error Codes

| Code | Description |
|------|-------------|
| `GLOBAL_RATE_LIMIT_EXCEEDED` | Too many API requests |
| `AUTH_RATE_LIMIT_EXCEEDED` | Too many login attempts |
| `CAMPAIGN_CREATION_LIMIT_EXCEEDED` | Too many campaigns created |
| `DONATION_RATE_LIMIT_EXCEEDED` | Too many donation attempts |
| `WITHDRAWAL_RATE_LIMIT_EXCEEDED` | Too many withdrawal requests |
| `UPLOAD_RATE_LIMIT_EXCEEDED` | Too many file uploads |
| `SEARCH_RATE_LIMIT_EXCEEDED` | Too many search queries |
| `ADMIN_RATE_LIMIT_EXCEEDED` | Too many admin operations |
| `EXPORT_RATE_LIMIT_EXCEEDED` | Too many data exports |
| `BANK_ACCOUNT_LIMIT_EXCEEDED` | Too many bank operations |
| `PUBLIC_READ_LIMIT_EXCEEDED` | Too many public reads |
| `PASSWORD_RESET_LIMIT_EXCEEDED` | Too many password resets |

---

## 🔧 Quick Commands

### Check Rate Limit Status
```bash
curl -I http://localhost:9000/api/campaigns
```

### View Redis Rate Limit Keys
```bash
redis-cli KEYS "rl:*"
```

### Check Rate Limit Violations
```bash
grep "RATE LIMIT VIOLATION" logs/app.log
```

### Clear Rate Limits (Development Only)
```bash
redis-cli FLUSHDB
```

---

## 💡 Tips

✅ **For Legitimate Users:**
- Rate limits are generous for normal usage
- Authenticated users get user-based tracking
- Failed requests count towards limits

✅ **For Developers:**
- Use Redis for production
- Monitor violation logs
- Adjust limits based on usage patterns
- Test rate limits before deployment

✅ **For Admins:**
- Review violation logs regularly
- Identify suspicious patterns
- Adjust limits as needed
- Whitelist trusted IPs if needed

---

**Last Updated:** October 6, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
