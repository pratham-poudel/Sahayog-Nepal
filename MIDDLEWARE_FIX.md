# Phone Number OTP - Middleware Fix

## Issue
When trying to send OTP to a phone number, the API was returning:
```json
{
  "success": false,
  "message": "Email is required",
  "errorCode": "EMAIL_REQUIRED"
}
```

## Root Cause
The email abuse protection middlewares were checking specifically for the `email` field in the request body and returning an error if it wasn't present. This prevented phone number signups from working.

## Files Modified

### `backend/middlewares/emailAbuseProtection.js`

#### 1. `emailFrequencyProtection` function
**Before:** Required email field, returned error if missing
**After:** 
- Accepts either `email` or `phone`
- Uses generic "identifier" terminology
- Skips validation if neither is provided (controller will handle it)
- Updated Redis keys from `email-freq:` to `identifier-freq:`
- Updated error messages to be generic ("verification code" instead of "email")

#### 2. `otpAttemptProtection` function
**Before:** Required email field for OTP attempt tracking
**After:**
- Accepts either `email` or `phone`
- Uses identifier for tracking failed attempts
- Supports both email and phone number verification

#### 3. `suspiciousPatternDetection` function
**Before:** Tracked email addresses and flagged email enumeration
**After:**
- Tracks identifiers (email or phone)
- Changed `emailsRequested` to `identifiersRequested`
- Changed `uniqueEmails` to `uniqueIdentifiers`
- Updated error code from `EMAIL_ENUMERATION_DETECTED` to `ENUMERATION_DETECTED`
- Updated error message to generic "verification attempts"

#### 4. `emailDomainProtection` function
**Before:** Required email field
**After:**
- Skips validation if no email is provided (allows phone-only requests)
- Only validates email domains when email is actually provided
- Disposable email check only applies to email signups

#### 5. `trackFailedOTPAttempt` and `clearOTPAttempts` functions
**Before:** Accepted only email parameter
**After:**
- Renamed parameter from `email` to `identifier`
- Works with both email and phone numbers

## Behavior After Fix

### Email Signup Flow
1. User enters email → OTP sent via email ✅
2. All middleware checks apply (disposable email, frequency, etc.) ✅
3. Email field locked in step 2, phone optional ✅

### Phone Signup Flow
1. User enters phone → OTP sent via SMS ✅
2. Frequency and pattern detection apply ✅
3. Email domain protection skipped (not applicable) ✅
4. Phone field locked in step 2, email optional ✅

## Testing

### Test Phone Number OTP:
```bash
POST /api/users/send-otp
{
  "phone": "9876543210"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to phone successfully",
  "expiresIn": 600,
  "identifierType": "phone"
}
```

### Test Email OTP (should still work):
```bash
POST /api/users/send-otp
{
  "email": "user@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to email successfully",
  "expiresIn": 600,
  "identifierType": "email"
}
```

## Security Maintained

All security measures remain in place:
- ✅ Rate limiting still applies to both email and phone
- ✅ Frequency protection (30-second cooldown)
- ✅ Pattern detection (max 25 requests/hour)
- ✅ IP blocking for suspicious activity
- ✅ Failed attempt tracking (max 3 attempts)
- ✅ Disposable email blocking (for email signups)
- ✅ Honeypot protection
- ✅ Bot detection

## Summary

The middleware has been made identifier-agnostic, supporting both email and phone numbers seamlessly. All protection mechanisms work for both types of identifiers, with email-specific checks (like disposable domain blocking) only applying when email is actually provided.
