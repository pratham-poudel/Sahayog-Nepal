# Admin Cookie Authentication Debugging Guide

## Problem Summary
Cookies are not being set in production environment even though `NODE_ENV=production` is configured.

## Root Causes Identified

### 1. **CORS Configuration**
- When using `sameSite: 'none'` in production, you MUST have:
  - `secure: true` (HTTPS only)
  - Proper CORS configuration with `credentials: true`
  - Matching origins between frontend and backend

### 2. **Cookie Domain Mismatch**
- If your frontend and backend are on different domains/subdomains
- Cookie domain must be properly configured

### 3. **HTTPS Requirements**
- `secure: true` means cookies will ONLY be sent over HTTPS
- If your production server doesn't have SSL, cookies won't work

## Solutions Implemented

### Backend Changes (`routes/admin.js`)
```javascript
// Updated cookie configuration
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
};

// Add domain for production if specified
if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
}

res.cookie('adminToken', token, cookieOptions);
```

## Environment Variables to Add

Add these to your production `.env` file:

```env
# Required
NODE_ENV=production
JWT_SECRET=your_secret_here

# Optional (only if frontend and backend are on different domains)
COOKIE_DOMAIN=.sahayognepal.org

# For debugging
DEBUG_COOKIES=true
```

## Debugging Steps

### 1. Check Server HTTPS
```bash
# Your server MUST be running on HTTPS in production
# Check if SSL is configured properly
curl -I https://your-api-domain.com
```

### 2. Check CORS Headers
Open browser DevTools → Network → Select the login request → Check Response Headers:
```
Access-Control-Allow-Origin: https://sahayognepal.org
Access-Control-Allow-Credentials: true
Set-Cookie: adminToken=...; HttpOnly; Secure; SameSite=None
```

### 3. Browser Console Check
```javascript
// In browser console after login
document.cookie
// Should show adminToken if set properly
```

### 4. Check Request Headers
In the request, ensure:
```
Origin: https://sahayognepal.org
Cookie: adminToken=... (on subsequent requests)
```

## Common Issues & Solutions

### Issue 1: Cookie Not Visible in Browser
**Cause**: `secure: true` but server is HTTP (not HTTPS)
**Solution**: 
- Enable HTTPS on your production server
- OR temporarily use `secure: false` (NOT RECOMMENDED)

### Issue 2: Cookie Set but Not Sent
**Cause**: CORS origin mismatch or `credentials: 'include'` missing
**Solution**: 
- Check CORS allowed origins match frontend URL exactly
- Ensure `credentials: 'include'` in all fetch requests

### Issue 3: Cookie Set with Wrong Domain
**Cause**: Domain attribute doesn't match your setup
**Solution**:
- If frontend is `sahayognepal.org` and backend is `api.sahayognepal.org`:
  - Set `COOKIE_DOMAIN=.sahayognepal.org` (note the leading dot)
- If on same domain, don't set domain attribute

### Issue 4: Cookie Cleared on Navigation
**Cause**: SameSite policy or path mismatch
**Solution**: 
- Ensure `path: '/'` is set
- Use `sameSite: 'none'` for cross-site cookies

## Testing Checklist

- [ ] Server is running on HTTPS in production
- [ ] `NODE_ENV=production` is set correctly
- [ ] CORS origins match frontend URL exactly
- [ ] `credentials: 'include'` in all frontend requests
- [ ] Cookie appears in browser DevTools → Application → Cookies
- [ ] Cookie is sent in subsequent requests (check Network tab)
- [ ] `/admin/check-auth` endpoint works after login

## Production Deployment Checklist

1. **Backend Environment Variables**
```env
NODE_ENV=production
JWT_SECRET=<strong-secret-minimum-32-chars>
COOKIE_DOMAIN=.sahayognepal.org  # Optional
```

2. **Frontend Environment Variables**
```env
VITE_API_URL=https://api.sahayognepal.org
VITE_ENV=production
```

3. **HTTPS Configuration**
- Ensure SSL certificate is valid
- Redirect HTTP to HTTPS
- Check certificate chain

4. **CORS Configuration**
- Update `app.js` origins to include production domains
- Remove localhost from production CORS origins

5. **Test Authentication Flow**
```bash
# Test cookie is set
curl -i -X POST https://your-api.com/api/admin/verify-otp-login \
  -H "Content-Type: application/json" \
  -d '{"adminId":"xxx","otp":"123456"}' \
  -c cookies.txt

# Test cookie is used
curl -i https://your-api.com/api/admin/check-auth -b cookies.txt
```

## Additional Debugging Code

Add this temporary debugging endpoint to check cookie settings:

```javascript
// Add to routes/admin.js
router.get('/debug-cookie-test', async (req, res) => {
    console.log('Cookie Debug Info:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Cookies received:', req.cookies);
    console.log('Headers:', req.headers);
    
    // Set a test cookie
    res.cookie('testCookie', 'testValue', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60000,
        path: '/'
    });
    
    res.json({
        success: true,
        environment: process.env.NODE_ENV,
        cookiesReceived: req.cookies,
        origin: req.headers.origin,
        cookieSettings: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        }
    });
});
```

## Quick Fix for Testing

If you need to test quickly and SSL is not available:

```javascript
// TEMPORARY - Development/Testing ONLY
const cookieOptions = {
    httpOnly: true,
    secure: false,  // Allow HTTP
    sameSite: 'lax',  // Less strict
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
};
```

⚠️ **WARNING**: Never use `secure: false` in production with real user data!

## Contact Points to Verify

1. Your production backend URL (API)
2. Your production frontend URL
3. Are they on the same domain or different domains?
4. Is HTTPS properly configured on both?

Please verify these and update accordingly.
