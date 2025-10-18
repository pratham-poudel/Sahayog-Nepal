# 🚫 User Ban System - Quick Reference

## API Endpoints

### Ban User
```
POST /api/employee/kyc/ban-user/:userId
Authorization: Employee Token (USER_KYC_VERIFIER)
Body: {
  "banReason": "Detailed reason (min 10 chars)"
}
```

### Unban User
```
POST /api/employee/kyc/unban-user/:userId
Authorization: Employee Token (USER_KYC_VERIFIER)
Body: {
  "unbanReason": "Optional reason"
}
```

### Get KYC Statistics (includes banned count)
```
GET /api/employee/kyc/statistics
Authorization: Employee Token (USER_KYC_VERIFIER)
```

---

## User Model Fields

```javascript
{
  isBanned: Boolean (default: false),
  banReason: String (default: null),
  bannedBy: {
    employeeId: ObjectId,
    employeeName: String,
    designationNumber: String
  },
  bannedAt: Date
}
```

---

## Middleware Usage

```javascript
// Apply to protected routes
router.get('/route', protect, checkBanStatus, controller);
```

**Applied to:**
- All `/api/users/profile*` routes
- All campaign creation/edit routes
- All protected user actions

---

## Frontend Components

### KYC Dashboard Features
- Ban/Unban buttons in user modal
- Ban status indicator in user table
- Banned users count in statistics
- Professional ban warning display
- Ban reason input modal

### Auth Hook Updates
- Intercepts 403 ban responses
- Shows toast notifications
- Auto-logout for banned users
- Professional ban messages

---

## Ban Response Format

```json
{
  "success": false,
  "isBanned": true,
  "message": "Account Access Suspended",
  "banDetails": {
    "reason": "User-facing ban reason",
    "bannedAt": "2025-10-18T10:30:00.000Z",
    "notice": "Professional legal notice about authorities"
  }
}
```

---

## Validation Rules

- **Ban Reason:** Minimum 10 characters required
- **Authorization:** USER_KYC_VERIFIER department only
- **Confirmation:** Unban requires user confirmation

---

## Error Handling

### Login Attempt (Banned User)
```javascript
Status: 403
Response: {
  isBanned: true,
  banDetails: {...}
}
Frontend: Shows toast, prevents login
```

### API Call (Banned User)
```javascript
Status: 403
Middleware: checkBanStatus
Frontend: Auto-logout + notification
```

---

## Testing Commands

### Ban a User (via MongoDB)
```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: { 
      isBanned: true, 
      banReason: "Test ban reason",
      bannedAt: new Date()
    } 
  }
)
```

### Unban a User
```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: { 
      isBanned: false, 
      banReason: null,
      bannedAt: null
    } 
  }
)
```

### Check Ban Status
```javascript
db.users.findOne({ email: "test@example.com" }, { isBanned: 1, banReason: 1 })
```

---

## Security Notes

1. ✅ Ban check happens at multiple levels:
   - Login controller
   - Auth middleware (all protected routes)
   - Frontend validation

2. ✅ Token is cleared on ban detection

3. ✅ Professional legal language used

4. ✅ Complete audit trail maintained

---

## User Experience Flow

```
User Banned → Next Request → 403 Response → Toast Notification → Auto Logout
     ↓
Login Attempt → Ban Check → 403 Response → Professional Notice → Login Blocked
```

---

## Employee Workflow

```
KYC Dashboard → Find User → Click Review → 
  → Click "Ban User" → Enter Reason (10+ chars) → 
  → Confirm → User Banned + Statistics Updated
```

---

## Monitoring & Logs

### Backend Logs:
```
[USER BANNED] User: email@example.com by Employee: KYC-001
Ban Reason: Detailed reason here
```

### Frontend Console:
```javascript
console.error('Account Banned:', {
  reason: "Ban reason",
  bannedAt: "Date"
})
```

---

## Common Issues & Solutions

### Issue: Ban not taking effect
**Solution:** Check middleware is applied to route

### Issue: User can still login
**Solution:** Verify ban check in `loginUser` controller

### Issue: Toast not showing
**Solution:** Check `useAuth.js` for 403 handling

### Issue: Statistics not updating
**Solution:** Verify `fetchStatistics` includes `bannedUsers`

---

## Database Indexes

```javascript
// For performance
userSchema.index({ isBanned: 1 });
userSchema.index({ isBanned: 1, bannedAt: -1 });
```

---

## Environment Variables

No new environment variables required. Uses existing:
- `JWT_SECRET` - For token validation
- `API_BASE_URL` - For frontend API calls

---

## Production Checklist

- [ ] Database indexes created
- [ ] Middleware applied to all protected routes
- [ ] Frontend ban modal tested
- [ ] Toast notifications working
- [ ] Audit trail logging verified
- [ ] Professional messages reviewed
- [ ] Employee permissions verified
- [ ] Ban/unban flow tested end-to-end
- [ ] Statistics showing banned count
- [ ] Documentation updated

---

## Support & Maintenance

**Key Files:**
- Models: `backend/models/User.js`
- Middleware: `backend/middlewares/authMiddleware.js`
- Routes: `backend/routes/employeeRoutes.js`
- Frontend: `client/src/pages/KYCVerifierDashboard.jsx`
- Auth: `client/src/hooks/useAuth.js`

**For Updates:**
1. Modify ban fields in User model
2. Update middleware logic
3. Update frontend UI components
4. Test all flows thoroughly

---

**Last Updated:** October 18, 2025
**Status:** ✅ Production Ready
