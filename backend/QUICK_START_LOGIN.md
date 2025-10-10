# Quick Start Guide - Login with Phone Support

## What's New? 🎉
Users can now login using **email OR phone number** with both password and OTP methods!

## For Users

### Password Login
- Enter your **email** (e.g., `user@example.com`) OR **phone** (e.g., `9812345678`)
- Enter your password
- Login!

### OTP Login
- Enter your **email** OR **phone**
- Receive OTP via email or SMS
- Enter the 6-digit code
- Login!

## For Developers

### Backend API Changes

#### 1. Login with Password
```javascript
POST /api/users/login
{
  "email": "user@example.com",  // OR "phone": "9812345678"
  "password": "password123",
  "turnstileToken": "..."
}
```

#### 2. Send Login OTP
```javascript
POST /api/users/send-login-otp
{
  "email": "user@example.com",  // OR "phone": "9812345678"
  "turnstileToken": "..."
}

// Response includes identifierType
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "identifierType": "email"  // or "phone"
}
```

#### 3. Verify Login OTP
```javascript
POST /api/users/login-with-otp
{
  "email": "user@example.com",  // OR "phone": "9812345678"
  "otp": "123456"
}
```

### Frontend Changes

#### Form Fields
- Old: Separate `email` field
- New: Single `identifier` field that accepts email OR phone

#### Validation
```javascript
// Email pattern
/^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone pattern (10 digits)
/^[0-9]{10}$/
```

## Testing Examples

### Test with Email
```bash
# Password login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","turnstileToken":"..."}'

# OTP login
curl -X POST http://localhost:5000/api/users/send-login-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","turnstileToken":"..."}'
```

### Test with Phone
```bash
# Password login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9812345678","password":"test123","turnstileToken":"..."}'

# OTP login
curl -X POST http://localhost:5000/api/users/send-login-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9812345678","turnstileToken":"..."}'
```

## Important Notes

✅ **Phone Format:** Must be exactly 10 digits (e.g., `9812345678`)
✅ **Backward Compatible:** Existing email-only users can still login
✅ **Same Security:** Rate limiting and Turnstile protection apply to both
✅ **Smart OTP:** Automatically sends to email or SMS based on identifier
✅ **Flexible Users:** Users with both email and phone can use either to login

## Error Messages

| Error | Meaning |
|-------|---------|
| "Email or phone number is required" | No identifier provided |
| "Please enter a valid email or 10-digit phone number" | Invalid format |
| "Invalid email or password" / "Invalid phone or password" | Wrong credentials |
| "User not found with this email/phone" | Account doesn't exist |
| "OTP sent successfully to your email/phone" | OTP sent (check your channel) |

## Files Modified

### Backend
- ✅ `backend/controllers/userController.js` - All three login functions updated

### Frontend  
- ✅ `client/src/pages/Login.jsx` - Forms and validation updated

### Documentation
- ✅ `backend/LOGIN_PHONE_SUPPORT.md` - Full technical documentation
- ✅ `backend/QUICK_START_LOGIN.md` - This file!

## Next Steps

1. Test login with email + password ✓
2. Test login with phone + password ✓
3. Test OTP with email ✓
4. Test OTP with phone ✓
5. Verify error messages ✓
6. Deploy to production! 🚀
