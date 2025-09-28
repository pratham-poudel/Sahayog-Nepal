# Admin Authentication System - Security Enhancement

## Overview

The admin authentication system has been enhanced with a robust 3-step security process:

1. **Access Code Validation** (Backend Verified)
2. **Credentials Verification** (Username/Password)
3. **OTP Verification** (Email-based Two-Factor Authentication)

## Security Flow

### Step 1: Access Code Validation
- **Frontend**: User enters access code
- **Backend**: Validates code (`250529`) on server
- **Security**: Prevents frontend bypass attacks

### Step 2: Credentials Verification  
- **Frontend**: User enters username and password
- **Backend**: Verifies credentials against database
- **Action**: If valid, generates and sends OTP to admin email

### Step 3: OTP Verification
- **Frontend**: User enters 6-digit OTP code
- **Backend**: Verifies OTP from Redis cache
- **Action**: If valid, creates admin session and JWT token

## Technical Implementation

### Backend Changes

#### 1. Admin Model Updates
- Added `email` field (required, unique)
- Updated schema to support email-based authentication

#### 2. New API Endpoints

**POST `/api/admin/validate-access-code`**
- Validates access code on backend
- Returns success/failure response

**POST `/api/admin/verify-credentials`** 
- Verifies username and password
- Generates 6-digit OTP
- Stores OTP in Redis (10-minute expiry)
- Sends OTP email to admin
- Returns masked email and admin ID

**POST `/api/admin/verify-otp-login`**
- Verifies OTP from Redis
- Creates admin session
- Sets JWT cookie
- Completes authentication

**POST `/api/admin/resend-otp`**
- Generates new OTP
- Updates Redis cache
- Resends email

#### 3. Dependencies Added
- `sendAdminOtpEmail.js` - Admin OTP email service
- Redis integration for OTP storage

### Frontend Changes

#### 1. Multi-Step State Management
- `currentStep`: Tracks authentication progress
- `accessCode`, `username`, `password`, `otp`: Form states
- `adminId`, `maskedEmail`: Server response data

#### 2. Enhanced UI Components
- **Access Code Step**: Secure code entry
- **Login Step**: Username/password with navigation
- **OTP Step**: 6-digit code input with resend option

#### 3. Security Features
- Account lockout after failed attempts
- Loading states and error handling
- Input validation and sanitization

## Setup Instructions

### 1. Database Migration
Run the admin email script to add email to existing admin:

```bash
cd backend
node scripts/addAdminEmail.js
```

**Note**: Update the email in the script before running.

### 2. Environment Variables
Ensure these are set in your `.env`:

```env
ZEPTO_TOKEN_OTP=your_zepto_mail_token
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

### 3. Admin Creation (New Admins)
Use the updated create-admin endpoint:

```bash
POST /api/admin/create-admin
{
    "authpass": "heelothisispassword",
    "email": "admin@yourcompany.com"
}
```

### 4. Manual Database Update (Existing Admin)
If you have existing admin without email, update manually:

```javascript
// In MongoDB shell or admin panel
db.admins.updateOne(
    { username: "admin" },
    { $set: { email: "admin@yourcompany.com" } }
)
```

## Security Benefits

### 1. Multi-Layer Authentication
- **Layer 1**: Access code (prevents unauthorized access)
- **Layer 2**: Credentials (user verification)
- **Layer 3**: OTP (email-based 2FA)

### 2. Backend Validation
- All security checks moved to backend
- Prevents client-side bypasses
- Server-side rate limiting and lockout

### 3. Temporary OTP Storage
- OTPs stored in Redis with automatic expiry
- No permanent OTP storage in database
- Memory-efficient and secure

### 4. Email Notifications
- Professional email templates
- Admin-specific branding
- Security alerts and warnings

## Usage Instructions

### For Administrators

1. **Access the Admin Portal**
   - Navigate to admin login page
   - Enter access code: `250529`

2. **Login with Credentials**
   - Enter admin username and password
   - System sends OTP to registered email

3. **Complete OTP Verification**
   - Check email for 6-digit code
   - Enter code within 10 minutes
   - Use "Resend OTP" if needed

### For Developers

#### Testing the Flow
```javascript
// 1. Test access code
fetch('/api/admin/validate-access-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: '250529' })
});

// 2. Test credentials  
fetch('/api/admin/verify-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        username: 'admin', 
        password: 'admin123' 
    })
});

// 3. Test OTP
fetch('/api/admin/verify-otp-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ 
        adminId: 'admin_id_from_step_2',
        otp: '123456' 
    })
});
```

## File Structure

```
backend/
├── models/
│   └── Admin.js                 # Updated with email field
├── routes/
│   └── admin.js                 # New authentication routes
├── utils/
│   ├── sendAdminOtpEmail.js     # Admin OTP email service
│   └── RedisClient.js           # Redis connection
├── scripts/
│   └── addAdminEmail.js         # Database migration script

frontend/
└── src/pages/
    └── AdminLogin.jsx           # Complete rewrite with 3-step flow
```

## Security Considerations

### Access Code
- Currently hardcoded (`250529`)
- Should be environment variable in production
- Consider rotation policy

### OTP Security
- 6-digit numeric code
- 10-minute expiry
- Single-use only
- Rate limiting implemented

### Session Management
- JWT tokens with 1-day expiry
- HTTP-only cookies
- Secure flag in production

### Email Security
- Professional templates
- Security warnings included
- SMTP credentials secured

## Troubleshooting

### Common Issues

1. **OTP Not Received**
   - Check spam/junk folder
   - Verify email configuration
   - Use "Resend OTP" option

2. **Access Code Invalid**
   - Verify code is `250529`
   - Check for typos
   - Ensure backend is running

3. **Redis Connection Error**
   - Verify Redis is running
   - Check connection settings
   - Restart Redis service

4. **Email Configuration**
   - Verify ZEPTO_TOKEN_OTP
   - Check email service status
   - Test email connectivity

### Logs and Monitoring
- All authentication attempts logged
- Failed attempts tracked
- Security events in production logs
- Admin activity monitoring

## Future Enhancements

1. **Multi-Admin Support**
   - Role-based access control
   - Individual admin emails
   - Admin management interface

2. **Enhanced Security**
   - CAPTCHA integration
   - IP-based restrictions
   - Advanced rate limiting

3. **Audit Trail**
   - Login history tracking
   - Action logging
   - Security reports

4. **Mobile Support**
   - SMS-based OTP option
   - Mobile-friendly UI
   - Push notifications

## Support

For issues or questions:
- Check logs in `/backend/logs/`
- Review Redis connection
- Verify email service status
- Contact development team

---

**Last Updated**: Current Date  
**Version**: 1.0  
**Status**: Production Ready