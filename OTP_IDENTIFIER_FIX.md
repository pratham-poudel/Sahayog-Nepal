# OTP Verification Identifier Mismatch Fix

## Issue
When signing up with phone number and optionally adding email in step 2, the OTP verification was failing with:
```json
{
  "success": false,
  "message": "OTP has expired or does not exist. Please request a new one.",
  "errorCode": "OTP_EXPIRED"
}
```

## Root Cause Analysis

### What Was Happening:
1. User enters phone number → OTP stored in Redis with key `otp:9805470529`
2. User fills details in step 2, optionally adds email `prathampoudel2@gmail.com`
3. Frontend sends verification request with **both** phone and email:
   ```json
   {
     "phone": "9805470529",
     "email": "prathampoudel2@gmail.com",
     "otp": "360594",
     "name": "...",
     "password": "..."
   }
   ```
4. Backend logic was: `let identifier = email || phone;`
5. Backend looked for `otp:prathampoudel2@gmail.com` in Redis
6. **Not found!** ❌ (OTP was stored with phone key, not email)

### The Problem:
The backend was **blindly preferring email over phone** without checking which identifier was actually used during OTP generation.

## Solution

Modified `backend/controllers/userController.js` in the `verifyOtp` function to:

### 1. Smart Identifier Detection
Instead of blindly choosing email over phone, the backend now:
- Checks Redis for OTP with **phone first** (if phone provided)
- If not found, checks Redis for OTP with **email** (if email provided)
- Uses whichever identifier actually has an OTP stored

```javascript
// Try to find which identifier was used for OTP (check both if both are provided)
let identifier = null;
let identifierType = null;
let storedOtpData = null;

// First try phone if provided
if (phone) {
    storedOtpData = await redis.get(`otp:${phone}`);
    if (storedOtpData) {
        identifier = phone;
        identifierType = 'phone';
    }
}

// If not found and email is provided, try email
if (!storedOtpData && email) {
    storedOtpData = await redis.get(`otp:${email}`);
    if (storedOtpData) {
        identifier = email;
        identifierType = 'email';
    }
}
```

### 2. Updated Existing User Check
Changed the duplicate user check to use the verified identifier:
```javascript
// OLD: const query = email ? { email } : { phone };
// NEW: 
const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };
```

## Flow After Fix

### Scenario 1: Phone Signup with Optional Email
1. ✅ User enters phone `9805470529` → OTP stored as `otp:9805470529`
2. ✅ User adds email `test@example.com` in step 2
3. ✅ Verification request includes both
4. ✅ Backend checks phone first, **finds OTP**
5. ✅ Uses phone as primary identifier
6. ✅ Creates user with phone + email

### Scenario 2: Email Signup with Optional Phone
1. ✅ User enters email `test@example.com` → OTP stored as `otp:test@example.com`
2. ✅ User adds phone `9805470529` in step 2
3. ✅ Verification request includes both
4. ✅ Backend checks phone first, not found
5. ✅ Backend checks email, **finds OTP**
6. ✅ Uses email as primary identifier
7. ✅ Creates user with email + phone

### Scenario 3: Phone Only
1. ✅ User enters phone `9805470529` → OTP stored as `otp:9805470529`
2. ✅ User skips email in step 2
3. ✅ Verification request includes only phone
4. ✅ Backend finds OTP with phone
5. ✅ Creates user with phone only

### Scenario 4: Email Only
1. ✅ User enters email `test@example.com` → OTP stored as `otp:test@example.com`
2. ✅ User skips phone in step 2
3. ✅ Verification request includes only email
4. ✅ Backend finds OTP with email
5. ✅ Creates user with email only

## Testing

### Test Phone Signup:
1. Enter phone number: `9805470529`
2. Receive SMS OTP
3. Add optional email in step 2
4. Enter OTP
5. **Expected:** ✅ Account created successfully

### Test Email Signup:
1. Enter email: `test@example.com`
2. Receive email OTP
3. Add optional phone in step 2
4. Enter OTP
5. **Expected:** ✅ Account created successfully

## Key Changes

**File:** `backend/controllers/userController.js`

**Function:** `verifyOtp`

**Changes:**
1. ✅ Smart OTP lookup (tries phone first, then email)
2. ✅ Identifier determined by which has valid OTP in Redis
3. ✅ Duplicate check uses verified identifier
4. ✅ Better logging for debugging

## Benefits

✅ **Flexible signup:** Users can start with either email or phone  
✅ **Optional fields work:** Can add the other identifier in step 2  
✅ **Correct validation:** OTP verified against actual sent identifier  
✅ **No confusion:** System knows which identifier was verified  
✅ **Future-proof:** Works for all combinations of email/phone  

The signup flow now works seamlessly whether users start with email or phone, and correctly handles optional secondary identifiers!
