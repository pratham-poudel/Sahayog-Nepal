# Turnstile Security Implementation

This document explains the secure Turnstile implementation that prevents token reuse and provides comprehensive security features.

## Architecture Overview

### Backend Components
1. **Turnstile Middleware** (`middlewares/turnstileMiddleware.js`)
   - Centralized validation logic
   - Token reuse prevention using Redis
   - Rate limiting per IP address
   - Comprehensive error handling

2. **Enhanced Routes**
   - User routes: Login and OTP requests
   - Campaign routes: Campaign creation
   - Other protected endpoints as needed

### Frontend Components
1. **Enhanced TurnstileWidget** (`components/common/TurnstileWidget.jsx`)
   - Auto-reset on failure/expiry
   - Better error states and user feedback
   - Exposed ref methods for parent control

## Security Features

### 1. Token Reuse Prevention
```javascript
// Each token can only be used once
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const wasTokenUsed = await redis.exists(`turnstile_used:${tokenHash}`);
```

### 2. Rate Limiting
```javascript
// Max 10 attempts per 15-minute window per IP
const MAX_REQUESTS_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;
```

### 3. Token Expiry Tracking
```javascript
// Tokens marked as used for 24 hours
await redis.set(key, Date.now(), 'EX', 24 * 60 * 60);
```

### 4. IP-based Protection
- Rate limiting per IP address
- Suspicious activity logging
- Geographic validation support

## Implementation Guide

### Backend Setup

1. **Import the middleware in your routes:**
```javascript
const { turnstileMiddleware } = require('../middlewares/turnstileMiddleware');

// Apply to protected routes
router.post('/login', authLimiter, turnstileMiddleware, loginUser);
```

2. **Remove inline validation from controllers:**
```javascript
// OLD - Don't do this anymore
const validateTurnstileToken = async (token) => { /* ... */ };

// NEW - Rely on middleware
exports.loginUser = async (req, res) => {
  // Validation already done by middleware
  const { email, password } = req.body;
  // ... rest of login logic
};
```

### Frontend Setup

1. **Enhanced TurnstileWidget usage:**
```jsx
import { useRef } from 'react';
import TurnstileWidget from '../components/common/TurnstileWidget';

const LoginForm = () => {
  const turnstileRef = useRef();
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      alert('Please complete security verification');
      return;
    }

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          turnstileToken
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        // Reset turnstile on error
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setTurnstileToken('');
        
        // Handle specific error cases
        if (data.code === 'TOKEN_REUSED') {
          alert('Please refresh the page and try again');
        } else {
          alert(data.message);
        }
      }
    } catch (error) {
      // Reset on network error
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setTurnstileToken('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <TurnstileWidget
        ref={turnstileRef}
        siteKey={process.env.VITE_TURNSTILE_SITE_KEY}
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken('')}
        onError={() => setTurnstileToken('')}
        autoReset={true}
        resetDelay={3000}
      />
      
      <button type="submit">Login</button>
    </form>
  );
};
```

## Error Codes and Handling

### Backend Error Codes
- `MISSING_TOKEN`: No turnstile token provided
- `INVALID_FORMAT`: Token format is invalid
- `TOKEN_REUSED`: Token has already been used
- `RATE_LIMITED`: Too many requests from IP
- `TOKEN_EXPIRED`: Token expired on Cloudflare
- `INVALID_TOKEN`: Invalid token per Cloudflare
- `SERVICE_ERROR`: Cloudflare service issue

### Frontend Error Handling
```javascript
const handleError = (response) => {
  switch (response.code) {
    case 'TOKEN_REUSED':
    case 'TOKEN_EXPIRED':
      // Automatically refresh/reset
      window.location.reload();
      break;
      
    case 'RATE_LIMITED':
      const minutes = Math.ceil(response.retryAfter / 60);
      alert(`Too many attempts. Please wait ${minutes} minutes.`);
      break;
      
    case 'SERVICE_ERROR':
      alert('Security service temporarily unavailable. Please try again later.');
      break;
      
    default:
      alert('Security verification failed. Please try again.');
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
  }
};
```

## Monitoring and Logging

### Key Metrics to Monitor
1. **Token Reuse Attempts**: Indicates potential attacks
2. **Rate Limit Hits**: Shows automated/bot activity
3. **Validation Failures**: May indicate service issues
4. **Geographic Distribution**: Unusual patterns

### Log Examples
```
[TURNSTILE] Validation attempt from IP: 192.168.1.1, Token present: true
[TURNSTILE] Validating with Cloudflare API...
[TURNSTILE] Validation completed in 234ms, Success: true
[TURNSTILE] Validation successful for IP: 192.168.1.1
[TURNSTILE] Token reuse attempt detected from IP: 192.168.1.1
```

## Testing

Run the security test suite:
```bash
npm test -- --testNamePattern="Turnstile Middleware Security"
```

Test covers:
- Token validation and reuse prevention
- Rate limiting enforcement
- Error handling and mapping
- Logging functionality

## Configuration

### Environment Variables
```
TURNSTILE_SECRET_KEY=your_cloudflare_secret_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Middleware Settings
```javascript
// In turnstileMiddleware.js
const TOKEN_EXPIRY_MINUTES = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 10;
const USED_TOKEN_CACHE_HOURS = 24;
```

## Security Considerations

1. **Redis Security**: Ensure Redis is properly secured and not exposed
2. **Rate Limiting**: Adjust limits based on legitimate traffic patterns
3. **Logging**: Don't log actual tokens, only hashes
4. **Error Messages**: Balance security with usability
5. **Token Storage**: Use secure hashing for token storage

## Migration Notes

### From Old Implementation
1. Remove `validateTurnstileToken` functions from controllers
2. Add middleware to route definitions
3. Update frontend to handle new error codes
4. Test thoroughly with real tokens

### Breaking Changes
- Controllers no longer handle turnstile validation directly
- Error response format has changed
- Rate limiting is now enforced at the turnstile level
- Token reuse is now prevented

This implementation provides robust security while maintaining a good user experience.