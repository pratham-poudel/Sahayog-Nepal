# Phone Number OTP Implementation

## Overview
The signup flow has been enhanced to support both email and phone number verification. Users can now sign up using either their email address or phone number, with OTP verification sent via email or SMS respectively.

## Changes Made

### 1. Backend Changes

#### New Files
- **`backend/utils/sendSmsOtp.js`**: New utility function to send SMS OTP using AkashSMS API
  - Sends 6-digit OTP via SMS
  - Handles API errors gracefully
  - Logs SMS sending for debugging

#### Modified Files

##### `backend/models/User.js`
- Made `email` field optional (required: false)
- Made `phone` field optional (required: false)
- Added `sparse: true` to both fields for unique index support with null values
- Added pre-validation hook to ensure at least one (email or phone) is provided

##### `backend/controllers/userController.js`
- **`sendEmailOtp`** function renamed conceptually but handles both email and phone:
  - Accepts both `email` and `phone` in request body
  - Validates that at least one identifier is provided
  - Detects identifier type (email or phone) based on format
  - Sends OTP via email (using existing service) or SMS (using new service)
  - Stores identifier type in Redis for verification
  
- **`verifyOtp`** function updated:
  - Accepts both `email` and `phone` parameters
  - Validates based on which identifier was used for OTP
  - Creates user with appropriate field (email or phone)
  - Sends welcome email only if email was provided

##### `backend/.env`
- Added SMS API credentials:
  ```
  AKASHSMS_API_KEY=39226005c5bb3423a398cd00571445d1b37a07eb2d8a8e1a1b0ed78b32f20002
  AKASHSMS_API_URL=https://sms.aakashsms.com/sms/v3/send
  ```

### 2. Frontend Changes

##### `client/src/pages/Signup.jsx`

**State Management:**
- Added `identifierType` state to track whether email or phone was verified

**Step 1 - Identifier Input:**
- Replaced `renderEmailForm` with `renderIdentifierForm`
- Single input field accepts either email or phone number
- Client-side validation for both formats
- Placeholder shows examples: "you@example.com or 9876543210"

**Step 2 - User Details:**
- Dynamic field rendering based on `identifierType`:
  - If email was verified:
    - Email field is locked and shows "Verified" badge
    - Phone field is optional
  - If phone was verified:
    - Phone field is locked and shows "Verified" badge
    - Email field is optional

**Form Submissions:**
- `onIdentifierSubmit`: Detects identifier type and sends appropriate OTP request
- `onUserDetailsSubmit`: Updates userData with verified and optional fields
- `onOtpSubmit`: Sends correct identifier (email or phone) with OTP verification

## How It Works

### User Flow

1. **Step 1 - Identifier Entry:**
   - User enters either email or phone number
   - Frontend validates format and determines type
   - OTP is sent via email or SMS accordingly

2. **Step 2 - User Details:**
   - Verified identifier is pre-filled and locked
   - User provides name, password, and optionally the other identifier
   - User confirms details and accepts terms

3. **Step 3 - Document Upload:**
   - User uploads verification document (unchanged)

4. **Step 4 - OTP Verification:**
   - User enters OTP received via email or SMS
   - Backend verifies OTP against stored value
   - Account is created with provided details

### Database Storage

- User can have email, phone, or both
- At least one must be provided (validated at model level)
- Both fields have unique indexes with sparse support
- Welcome email sent only if email is provided

### Security

- SMS API credentials stored securely in backend .env
- Never exposed to frontend
- Rate limiting still applies to OTP endpoints
- Same security measures for both email and phone OTP

## Testing

To test the implementation:

1. **Email Signup:**
   - Enter email address in step 1
   - Verify email field is locked in step 2
   - Phone field is optional
   - OTP sent via email

2. **Phone Signup:**
   - Enter phone number (10-15 digits) in step 1
   - Verify phone field is locked in step 2
   - Email field is optional
   - OTP sent via SMS

3. **Validation:**
   - Try invalid formats (should show error)
   - Try existing email/phone (should show error)
   - Verify OTP expiration (10 minutes)
   - Verify failed attempt tracking (3 attempts max)

## API Changes

### POST `/api/users/send-otp`

**Request Body (Before):**
```json
{
  "email": "user@example.com"
}
```

**Request Body (Now):**
```json
{
  "email": "user@example.com"  // OR
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email/phone successfully",
  "expiresIn": 600,
  "identifierType": "email" // or "phone"
}
```

### POST `/api/users/verify-otp`

**Request Body (Before):**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "name": "John Doe",
  "phone": "9876543210",
  "password": "password123"
}
```

**Request Body (Now):**
```json
{
  "email": "user@example.com",  // OR "phone": "9876543210"
  "otp": "123456",
  "name": "John Doe",
  "phone": "9876543210",  // Optional if email was verified
  "password": "password123"
}
```

## Notes

- Phone numbers should be 10-15 digits (validation can be adjusted)
- SMS format includes security message about not sharing OTP
- OTP is same length (6 digits) for both email and SMS
- Redis keys use the identifier (email or phone) for OTP storage
- Failed attempts tracked separately per identifier
- Rate limiting applies to both email and phone OTP requests

## Future Enhancements

Consider implementing:
- International phone number support with country codes
- Phone number formatting/display
- SMS delivery status tracking
- Fallback to email if SMS fails
- Phone number verification in user profile settings
