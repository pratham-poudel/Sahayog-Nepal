# Testing Admin Cookie Authentication

## Quick Test Steps

### 1. Test Cookie Debug Endpoint

First, visit this URL in your browser (or use curl):

```bash
# For production
curl -i https://your-api-domain.com/api/admin/debug-cookie-test

# Check the response headers for Set-Cookie
```

**What to Look For:**
- Response should include `Set-Cookie: testCookie=...`
- In browser DevTools → Application → Cookies, you should see `testCookie`
- If you DON'T see the cookie, the problem is with your server/HTTPS setup

### 2. Test Full Login Flow with Logging

After deploying the updated code, watch your server logs during login:

```bash
# SSH into your server and tail the logs
pm2 logs backend --lines 100

# Or if using a different process manager
tail -f /path/to/your/app.log
```

**Expected Log Output:**
```
🔐 OTP Verification Request: { adminId: '...', otpProvided: '******', ... }
✅ OTP verified successfully for adminId: ...
🍪 Setting cookie with options: { httpOnly: true, secure: true, sameSite: 'none', ... }
✅ Cookie set successfully. Token length: 123
```

### 3. Check Browser DevTools

**After Login:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click on **Cookies** in left sidebar
4. Check your domain
5. Look for `adminToken` cookie

**If Cookie Is Missing:**
- Check Network tab → Find the login request
- Click on the response
- Check **Response Headers** for `Set-Cookie`
- If `Set-Cookie` header exists but cookie isn't stored, it's a browser security issue

### 4. Common Issues Checklist

#### ✅ Issue: Cookie in Response but Not Stored

**Symptoms:**
- `Set-Cookie` header is present in response
- Cookie doesn't appear in Application → Cookies

**Causes:**
1. **Domain Mismatch**
   - Frontend: `https://sahayognepal.org`
   - Backend: `https://api.otherdomain.com`
   - Cookie domain set to `.otherdomain.com`
   
   **Fix:** Don't set domain or use common parent domain

2. **Not Using HTTPS**
   - `secure: true` requires HTTPS
   
   **Fix:** Enable HTTPS or temporarily set `secure: false` (not recommended)

3. **SameSite=None without Secure**
   - Modern browsers reject `sameSite: 'none'` without `secure: true`
   
   **Fix:** Ensure HTTPS is enabled

#### ✅ Issue: No Set-Cookie Header in Response

**Symptoms:**
- Response doesn't include `Set-Cookie` header at all

**Causes:**
1. **Server Error Before Setting Cookie**
   - Check server logs for errors
   
2. **Response Already Sent**
   - Cookie must be set before `res.json()` or `res.send()`
   - Our code does this correctly

#### ✅ Issue: Cookie Set but Not Sent in Requests

**Symptoms:**
- Cookie appears in DevTools
- Subsequent requests don't include the cookie

**Causes:**
1. **Missing `credentials: 'include'`**
   ```javascript
   // Frontend - Make sure ALL requests include this
   fetch(url, {
       credentials: 'include',
       // ... other options
   });
   ```

2. **Path Mismatch**
   - Cookie path doesn't match request path
   - Our code sets `path: '/'` which should work for all paths

3. **Domain Mismatch**
   - Cookie domain doesn't match request domain

## Testing Commands

### Test 1: Check HTTPS Certificate
```bash
curl -I https://your-api-domain.com
# Should return 200 OK and show SSL info
```

### Test 2: Test Cookie Setting (Manual)
```bash
# Replace with your actual API URL
curl -i -X POST https://your-api-domain.com/api/admin/verify-otp-login \
  -H "Content-Type: application/json" \
  -H "Origin: https://sahayognepal.org" \
  -d '{"adminId":"VALID_ADMIN_ID","otp":"VALID_OTP"}' \
  -c cookies.txt

# Check if cookie was saved
cat cookies.txt

# Test if cookie is sent back
curl -i https://your-api-domain.com/api/admin/check-auth \
  -H "Origin: https://sahayognepal.org" \
  -b cookies.txt
```

### Test 3: Check CORS Headers
```bash
curl -i -X OPTIONS https://your-api-domain.com/api/admin/check-auth \
  -H "Origin: https://sahayognepal.org" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"

# Look for these headers in response:
# Access-Control-Allow-Origin: https://sahayognepal.org
# Access-Control-Allow-Credentials: true
```

## Environment Variable Check

Make sure these are set in production:

```bash
# SSH into your server
env | grep NODE_ENV
# Should output: NODE_ENV=production

env | grep JWT_SECRET
# Should output: JWT_SECRET=your-secret

# Optional
env | grep COOKIE_DOMAIN
```

## Frontend Check

Make sure your frontend config is correct:

```javascript
// client/src/config/index.js
export const API_URL = 'https://your-api-domain.com'; // MUST be HTTPS in production
```

And ALL fetch requests include:
```javascript
fetch(`${API_URL}/api/admin/...`, {
    credentials: 'include', // ← THIS IS CRITICAL
    // ... other options
});
```

## Quick Fix for Testing (TEMPORARY)

If you need to test immediately and can't fix HTTPS:

### Backend: Temporarily disable secure flag
```javascript
// In routes/admin.js - ONLY FOR TESTING
const cookieOptions = {
    httpOnly: true,
    secure: false,  // ← Changed from production check
    sameSite: 'lax',  // ← Changed from 'none'
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
};
```

⚠️ **IMPORTANT**: This is INSECURE! Only use for testing. Remove before production deployment.

## Still Not Working?

If none of the above helps, provide these details:

1. **Your production setup:**
   - Frontend URL: `https://...`
   - Backend URL: `https://...`
   - Are they on same domain or different?

2. **Server logs from login attempt:**
   ```
   🔐 OTP Verification Request: ...
   🍪 Setting cookie with options: ...
   ```

3. **Browser console errors** (if any)

4. **Network tab screenshot** showing:
   - Request headers
   - Response headers
   - Response body

5. **Application → Cookies screenshot**

6. **Output of debug endpoint:**
   `GET /api/admin/debug-cookie-test`
