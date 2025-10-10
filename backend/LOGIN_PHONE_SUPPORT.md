# Login Phone Number Support Implementation

## Overview
Extended the login system to support both email and phone number authentication for both password-based and OTP-based login methods.

## Backend Changes

### 1. **userController.js** - Password Login (`loginUser`)
**Changes:**
- Now accepts both `email` and `phone` in request body
- Validates that at least one identifier is provided
- Builds dynamic query based on which identifier is provided
- Returns appropriate error messages mentioning the identifier type
- Returns phone number in success response

**Request Body:**
```javascript
{
  email: "user@example.com" OR phone: "9812345678",
  password: "password123",
  turnstileToken: "token"
}
```

**Response:**
```javascript
{
  success: true,
  user: {
    _id: "...",
    name: "...",
    email: "...",
    phone: "...",  // Now included
    role: "...",
    profilePicture: "...",
    profilePictureUrl: "..."
  },
  token: "jwt_token"
}
```

### 2. **userController.js** - Send Login OTP (`sendLoginOtp`)
**Changes:**
- Accepts both `email` and `phone` in request body
- Detects identifier type (email or phone)
- Stores identifier type in Redis OTP data
- Sends OTP via email (using `sendLoginWithOtp`) or SMS (using `sendSmsOtp`)
- Returns `identifierType` in response

**Redis Storage Format:**
```javascript
Key: `login-otp:${identifier}`  // identifier can be email or phone
Value: {
  otp: "123456",
  identifier: "user@example.com or 9812345678",
  identifierType: "email" or "phone",
  timestamp: 1234567890,
  attempts: 0,
  type: "login"
}
```

**Response:**
```javascript
{
  success: true,
  message: "OTP sent successfully to your email/phone",
  identifierType: "email" or "phone"
}
```

### 3. **userController.js** - Verify Login OTP (`loginWithOtp`)
**Changes:**
- Accepts both `email` and `phone` in request body
- Validates that at least one identifier is provided
- Builds dynamic query to find user
- Uses identifier-specific Redis key for OTP lookup
- Returns phone number in success response

**Request Body:**
```javascript
{
  email: "user@example.com" OR phone: "9812345678",
  otp: "123456"
}
```

## Frontend Changes

### 1. **Login.jsx** - State Management
**Changes:**
- Replaced `otpEmail` with `otpIdentifier`
- Added `otpIdentifierType` state to track whether identifier is email or phone
- Updated state reset in `switchLoginMode` function

### 2. **Login.jsx** - Form Configuration
**Changes:**
- Password login form now uses `identifier` field instead of `email`
- OTP login form now uses `identifier` field instead of `email`
- Added validation to check if input is valid email OR valid 10-digit phone number

**Validation Logic:**
```javascript
validate: (value) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhone = /^[0-9]{10}$/.test(value);
  return isEmail || isPhone || "Please enter a valid email or 10-digit phone number";
}
```

### 3. **Login.jsx** - Password Login (`onSubmit`)
**Changes:**
- Detects whether identifier is email or phone
- Sends request with appropriate field (`email` or `phone`)
- Manually handles login flow instead of using `loginAndRedirect`

**Request Logic:**
```javascript
const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier);
const isPhone = /^[0-9]{10}$/.test(data.identifier);

const requestBody = {
  password: data.password,
  turnstileToken
};

if (isEmail) {
  requestBody.email = data.identifier;
} else {
  requestBody.phone = data.identifier;
}
```

### 4. **Login.jsx** - Send OTP (`onOtpIdentifierSubmit`)
**Changes:**
- Renamed from `onOtpEmailSubmit`
- Detects identifier type (email or phone)
- Sends appropriate field in request body
- Stores both `otpIdentifier` and `otpIdentifierType` in state
- Shows identifier type in success message

### 5. **Login.jsx** - Verify OTP (`onOtpSubmit`)
**Changes:**
- Detects identifier type from stored `otpIdentifier`
- Sends request with appropriate field (`email` or `phone`)
- Handles login and token storage

### 6. **Login.jsx** - UI Updates
**Changes:**
- Updated label: "Email Address" → "Email or Phone Number"
- Updated placeholder: "you@example.com" → "you@example.com or 9812345678"
- OTP verification shows: "We've sent a verification code to your {identifierType}"
- Displays the actual identifier (email or phone) that received the OTP

## User Experience

### Password Login Flow:
1. User enters email OR phone number + password
2. System detects identifier type
3. User logs in successfully
4. User data includes both email and phone (if available)

### OTP Login Flow:
1. User enters email OR phone number
2. System detects identifier type and sends OTP via appropriate channel
3. User receives OTP via email or SMS
4. User enters OTP and logs in successfully

## Security Features

1. **Validation:** Both email and phone formats are validated
2. **Error Messages:** Generic error messages that don't reveal if account exists
3. **Rate Limiting:** Existing rate limiting applies to both identifiers
4. **Attempt Tracking:** Failed OTP attempts tracked (max 3 attempts)
5. **Turnstile Protection:** CAPTCHA verification required for all login methods

## Testing Checklist

- [ ] Login with email + password
- [ ] Login with phone + password  
- [ ] Send OTP to email
- [ ] Send OTP to phone
- [ ] Verify OTP from email
- [ ] Verify OTP from phone
- [ ] Invalid email format error
- [ ] Invalid phone format error
- [ ] Wrong password error
- [ ] Wrong OTP error
- [ ] User not found error
- [ ] Exceeded OTP attempts error

## Notes

1. Phone numbers must be exactly 10 digits (no country code, no formatting)
2. Email validation uses standard regex pattern
3. Redis keys use the actual identifier (email or phone) for storage
4. Both channels use the same rate limiting and abuse protection
5. Users can have both email and phone, or just one - the system adapts dynamically

## Future Enhancements

1. Add country code support for international phone numbers
2. Phone number formatting/display improvements
3. Allow users to choose preferred OTP method if both email and phone exist
4. Add phone number verification badges similar to email verification
