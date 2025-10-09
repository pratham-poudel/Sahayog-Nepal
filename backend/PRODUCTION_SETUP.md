# Production Environment Setup for Admin Cookie Authentication

## Required Environment Variables

Create or update your `.env` file on the production server:

```env
# ============================================
# CRITICAL: Environment Settings
# ============================================
NODE_ENV=production

# ============================================
# CRITICAL: Security
# ============================================
# Must be a strong secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# ============================================
# Cookie Configuration (Optional)
# ============================================
# Only set if frontend and backend are on DIFFERENT subdomains
# Example: frontend = sahayognepal.org, backend = api.sahayognepal.org
# COOKIE_DOMAIN=.sahayognepal.org

# ============================================
# CORS Origins (Already in app.js)
# ============================================
# Make sure these match in app.js:
# - https://sahayognepal.org
# - https://www.sahayognepal.org

# ============================================
# Database and Redis
# ============================================
MONGODB_URI=your-mongodb-connection-string
REDIS_URL=your-redis-connection-string

# ============================================
# Email Configuration
# ============================================
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password

# ============================================
# Other Required Variables
# ============================================
# Add your other existing environment variables here
```

## Deployment Checklist

### 1. ✅ Server Configuration

**Ensure HTTPS is enabled:**
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Should show valid certificate information
```

**If using Nginx, ensure SSL configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-api-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-api-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. ✅ Update Backend Code

The code has been updated with:
- Proper cookie options for production
- Debug endpoint for testing
- Enhanced logging
- Domain support

**Updated files:**
- `backend/routes/admin.js` - Cookie configuration and logging
- `backend/COOKIE_DEBUGGING_GUIDE.md` - Comprehensive debugging guide
- `backend/TEST_ADMIN_COOKIE.md` - Testing procedures

### 3. ✅ Update Frontend Code (if needed)

Ensure the frontend makes requests with credentials:

```javascript
// All admin-related fetch requests should include:
fetch(`${API_URL}/api/admin/...`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include', // ← CRITICAL for cookies
    body: JSON.stringify(data)
});
```

**Check these files:**
- `client/src/pages/AdminLogin.jsx` ✅ (Already correct)
- Any other admin components making API calls

### 4. ✅ CORS Configuration

Verify `backend/app.js` has correct origins:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',           // Development
    'https://sahayognepal.org',        // Production
    'https://www.sahayognepal.org'     // Production with www
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // ← CRITICAL for cookies
}));
```

### 5. ✅ Deploy and Test

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (if any new)
cd backend
npm install

# 3. Restart server
pm2 restart backend
# OR
pm2 restart all

# 4. Check logs
pm2 logs backend --lines 50

# 5. Test debug endpoint
curl https://your-api-domain.com/api/admin/debug-cookie-test
```

### 6. ✅ Test Login Flow

1. Open frontend in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Login through admin panel
5. Watch for:
   - OTP verification request
   - Response with `Set-Cookie` header
6. Go to Application tab → Cookies
7. Verify `adminToken` cookie exists
8. Navigate to admin dashboard
9. Check that `/api/admin/check-auth` includes cookie in request

## Common Production Deployment Scenarios

### Scenario 1: Same Domain (Recommended)
**Setup:**
- Frontend: `https://sahayognepal.org`
- Backend: `https://sahayognepal.org/api` (proxied)

**Configuration:**
```env
NODE_ENV=production
JWT_SECRET=your-secret
# COOKIE_DOMAIN not needed
```

**Cookie Options:**
```javascript
{
    httpOnly: true,
    secure: true,
    sameSite: 'lax',  // Can use 'lax' since same domain
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
}
```

### Scenario 2: Different Subdomains
**Setup:**
- Frontend: `https://sahayognepal.org`
- Backend: `https://api.sahayognepal.org`

**Configuration:**
```env
NODE_ENV=production
JWT_SECRET=your-secret
COOKIE_DOMAIN=.sahayognepal.org  # Note the leading dot
```

**Cookie Options:**
```javascript
{
    httpOnly: true,
    secure: true,
    sameSite: 'none',  // Must use 'none' for cross-subdomain
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    domain: '.sahayognepal.org'
}
```

### Scenario 3: Completely Different Domains (Not Recommended)
**Setup:**
- Frontend: `https://sahayognepal.org`
- Backend: `https://api.differentdomain.com`

**Configuration:**
```env
NODE_ENV=production
JWT_SECRET=your-secret
# Cannot share cookies across different domains
# Consider using Authorization header instead
```

**Alternative:** Use Authorization header with token in localStorage
```javascript
// After login, store token
localStorage.setItem('adminToken', token);

// Include in requests
fetch(url, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    }
});
```

## Troubleshooting Production Issues

### Issue: Cookie Not Set After Login

**Check Server Logs:**
```bash
pm2 logs backend | grep "🍪"
# Should show: 🍪 Setting cookie with options: ...
```

**If no logs appear:**
1. Code didn't deploy properly
2. Login failed before cookie setting
3. Check for errors in logs

**If logs appear but cookie not in browser:**
1. HTTPS not enabled → Enable SSL
2. Wrong domain → Check COOKIE_DOMAIN
3. Browser blocking → Check SameSite setting

### Issue: Cookie Set but Not Sent in Requests

**Check Frontend:**
```javascript
// Every admin API call must include:
credentials: 'include'
```

**Check CORS:**
```javascript
// Backend must have:
credentials: true
```

### Issue: CORS Error

**Error Message:**
```
Access to fetch at 'https://api...' from origin 'https://...' 
has been blocked by CORS policy
```

**Fix:**
1. Add frontend URL to CORS origins in `app.js`
2. Ensure `credentials: true` in CORS config
3. Restart server

## Post-Deployment Verification

Run through this checklist:

```bash
# 1. Test debug endpoint
curl https://your-api.com/api/admin/debug-cookie-test

# 2. Check environment
ssh your-server
env | grep NODE_ENV
# Should output: NODE_ENV=production

# 3. Check server logs
pm2 logs backend --lines 100

# 4. Test login manually
# Visit your frontend and login
# Check browser DevTools → Application → Cookies

# 5. Verify authentication works
# After login, navigate to admin dashboard
# Should not redirect back to login
```

## Security Notes

✅ **Good Practices:**
- `httpOnly: true` - Prevents XSS attacks
- `secure: true` - Only send over HTTPS
- `sameSite: 'none'` or `'lax'` - CSRF protection
- Strong JWT secret (32+ characters)
- HTTPS enabled

❌ **Never Do This in Production:**
- `secure: false` - Allows HTTP (insecure)
- `httpOnly: false` - Accessible via JavaScript (XSS risk)
- Weak JWT secret
- CORS origin: '*' (allows any domain)
- Exposing sensitive data in logs

## Need Help?

If issues persist, collect this information:

1. **Output of debug endpoint:**
   ```bash
   curl -i https://your-api.com/api/admin/debug-cookie-test
   ```

2. **Server logs during login:**
   ```bash
   pm2 logs backend --lines 50
   ```

3. **Environment check:**
   ```bash
   env | grep NODE_ENV
   env | grep JWT_SECRET
   env | grep COOKIE_DOMAIN
   ```

4. **Network tab screenshot** from browser DevTools showing:
   - Request headers
   - Response headers (especially Set-Cookie)

5. **Your domain setup:**
   - Frontend URL: ?
   - Backend URL: ?
   - Same domain or different?

Then review the `COOKIE_DEBUGGING_GUIDE.md` for detailed troubleshooting steps.
