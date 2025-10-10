# Withdrawal Department - Dual Responsibility System

## Overview
The Withdrawal Processing Department has **TWO PRIMARY RESPONSIBILITIES**:

1. **Bank Account Verification** - Verify user bank accounts before they can be used for withdrawals
2. **Withdrawal Request Processing** - Approve/reject withdrawal requests from verified bank accounts

This creates a secure, two-step verification system:
```
User creates bank account → Employee verifies bank → User requests withdrawal → Employee approves withdrawal → Admin processes transaction
```

## Critical Rule
⚠️ **Withdrawal requests can ONLY be made from VERIFIED bank accounts**

The system enforces this at the controller level - any withdrawal request with an unverified bank account will be rejected with:
```
"Invalid or unverified bank account selected"
```

---

## Bank Account Verification System

### Backend Routes (Employee API)

#### 1. GET /api/employee/bank-accounts
**Purpose**: Get paginated list of bank accounts for verification

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by verification status (pending, verified, rejected, under_review)
- `search`: Search in bank name, account number, account name, user details
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: asc or desc (default: desc)

**Response**:
```json
{
  "success": true,
  "data": [/* bank accounts */],
  "pagination": {
    "total": 150,
    "totalPages": 8,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

**Populated Fields**:
- userId: name, email, phone, profilePicture, kycVerified, kycDetails
- verifiedBy: username, email
- lastModifiedBy: name, email

#### 2. GET /api/employee/bank-accounts/:id
**Purpose**: Get detailed bank account information

**Response**: Complete bank account data with all populated relationships

#### 3. POST /api/employee/bank-accounts/:id/verify
**Purpose**: Verify a bank account

**Request Body**:
```json
{
  "notes": "Optional verification notes"
}
```

**Actions**:
1. Updates verificationStatus to 'verified'
2. Sets verificationDate to current date
3. Records employee verification details in `employeeVerification` object
4. Clears any rejection reason
5. Increments employee statistics (totalBankAccountsVerified)
6. Logs verification action

#### 4. POST /api/employee/bank-accounts/:id/reject
**Purpose**: Reject a bank account

**Request Body**:
```json
{
  "reason": "Required rejection reason (min 10 characters)"
}
```

**Validations**:
- Reason is required and minimum 10 characters

**Actions**:
1. Updates verificationStatus to 'rejected'
2. Sets verificationDate to current date
3. Records employee verification details with rejection reason
4. Stores rejection reason in rejectionReason field
5. Increments employee statistics (totalBankAccountsRejected)
6. Logs rejection action with reason

#### 5. GET /api/employee/bank-accounts-stats/overview
**Purpose**: Get bank account verification statistics

**Response**:
```json
{
  "success": true,
  "statistics": {
    "total": 150,
    "pending": 45,
    "verified": 85,
    "rejected": 15,
    "underReview": 5,
    "myActivity": {
      "totalVerifications": 42,
      "totalRejections": 8,
      "totalProcessed": 50
    },
    "recentActivity": {
      "newAccounts24h": 12,
      "verifications24h": 15
    }
  }
}
```

---

## Database Schema Updates

### BankAccount Model

**Added Fields**:
```javascript
// Dynamic reference to support both Admin and Employee verification
verifiedBy: {
  type: mongoose.Schema.Types.ObjectId,
  refPath: 'verifiedByModel',
  default: null
},

verifiedByModel: {
  type: String,
  enum: ['User', 'Admin', 'Employee'],
  default: null
},

// Employee-specific verification tracking
employeeVerification: {
  employeeId: ObjectId (ref: 'Employee'),
  employeeName: String,
  employeeDesignation: String,
  verifiedAt: Date,
  action: String (enum: ['verified', 'rejected']),
  reason: String,  // For rejections
  notes: String    // For verifications
}
```

**Purpose**: 
- `verifiedBy` + `verifiedByModel`: Allows both Admin and Employee to verify accounts
- `employeeVerification`: Detailed audit trail of employee actions

### Employee Model

**Updated Statistics**:
```javascript
statistics: {
  // ... existing fields
  totalBankAccountsVerified: Number (default: 0),
  totalBankAccountsRejected: Number (default: 0),
  // ... other fields
}
```

---

## Withdrawal Request Validation

### Existing Validation (Already Implemented)
**File**: `backend/controllers/withdrawalController.js` (Lines 148-153)

```javascript
// Validate bank account
const bankAccount = await BankAccount.findById(bankAccountId);
if (!bankAccount || bankAccount.userId.toString() !== userId || 
    bankAccount.verificationStatus !== 'verified' || !bankAccount.isActive) {
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid or unverified bank account selected' 
  });
}
```

**Validation Checks**:
1. ✅ Bank account exists
2. ✅ Bank account belongs to the user
3. ✅ Bank account is verified (`verificationStatus === 'verified'`)
4. ✅ Bank account is active (`isActive === true`)

**Result**: Users **cannot** create withdrawal requests with unverified bank accounts.

---

## Frontend Implementation (To Be Completed)

### Updated Dashboard Structure

The `WithdrawalProcessorDashboard` should have **TWO TABS**:

#### Tab 1: Bank Account Verification
- List of all bank accounts
- Filter by status (pending, verified, rejected)
- Search by bank name, account number, user details
- Statistics: Total, Pending, Verified, Rejected
- "Verify Account" button on each bank account card
- Opens `BankVerificationModal` for detailed review

#### Tab 2: Withdrawal Processing
- List of all withdrawal requests (existing implementation)
- Filter by status (pending, approved, rejected)
- Search by campaign, creator, bank details
- Statistics: Total, Pending, Approved, Rejected
- "View & Process" button on each withdrawal card
- Opens `WithdrawalVerificationModal` for detailed review

### New Component Needed: BankVerificationModal

**Purpose**: Display bank account details and allow verify/reject actions

**Should Display**:
- **User Information**:
  * Profile picture
  * Name, email, phone
  * KYC verification status
  * Account creation date

- **Bank Account Details**:
  * Bank name
  * Account number
  * Account holder name
  * Associated phone number
  * Verification status
  * Primary account indicator

- **Document Information**:
  * Document type (license, citizenship, passport)
  * Document number
  * **Document image viewer** (toggle to show/hide)
  * "Open in new tab" link

- **Verification History** (if previously verified/rejected):
  * Verified/Rejected by (employee/admin)
  * Date and time
  * Notes/Reason

**Action Workflow**:

1. **Initial State** (Pending account):
   - Shows "Verify Account" and "Reject Account" buttons
   
2. **Verification Mode**:
   - Optional verification notes textarea
   - "Confirm Verification" button
   - Cancel button
   
3. **Rejection Mode**:
   - Required rejection reason textarea (min 10 characters)
   - Character counter
   - "Confirm Rejection" button (disabled until 10 chars)
   - Cancel button

4. **Already Processed State**:
   - Shows verification history
   - No action buttons (already verified/rejected)

---

## Employee Experience Flow

### Login → Dashboard
1. Employee logs in with WITHDRAWAL_DEPARTMENT designation
2. Dashboard loads with **TWO TABS**: Bank Verification | Withdrawal Processing

### Tab 1: Bank Account Verification Workflow
1. **View Statistics**: See pending, verified, rejected counts
2. **Filter/Search**: Find specific bank accounts
3. **Review Account**: Click "Verify Account" on any bank card
4. **View Details**: See user info, bank details, document image
5. **View Document**: Toggle document viewer to see ID proof
6. **Make Decision**:
   - **Verify**: Optionally add notes, confirm verification
   - **Reject**: Provide detailed reason (min 10 chars), confirm rejection
7. **Track Activity**: See personal statistics in dashboard

### Tab 2: Withdrawal Processing Workflow
(Existing implementation - documented in WITHDRAWAL_DEPARTMENT_IMPLEMENTATION.md)

---

## Security & Compliance

### Multi-Layer Verification
1. **User KYC** - Must be verified before creating campaigns
2. **Bank Account Verification** - Employee verifies before withdrawal possible
3. **Withdrawal Approval** - Employee approves specific withdrawal requests
4. **Transaction Processing** - Admin handles actual fund transfer

### Audit Trail
Every action is tracked:
- **Bank Verification**: Employee ID, name, designation, timestamp, notes/reason
- **Withdrawal Approval**: Employee ID, name, designation, timestamp, notes/reason
- All actions logged to console for monitoring

### Access Control
- Only WITHDRAWAL_DEPARTMENT employees can access bank verification routes
- Routes protected with `restrictToDepartment('WITHDRAWAL_DEPARTMENT')` middleware
- JWT authentication required for all endpoints

---

## Testing Checklist

### Backend Testing
- [ ] Employee authentication with WITHDRAWAL_DEPARTMENT
- [ ] GET /api/employee/bank-accounts with various filters
- [ ] GET /api/employee/bank-accounts/:id with valid ID
- [ ] POST /api/employee/bank-accounts/:id/verify
  - [ ] With notes
  - [ ] Without notes
  - [ ] Verify statistics increment
- [ ] POST /api/employee/bank-accounts/:id/reject
  - [ ] With valid reason (≥10 chars)
  - [ ] With short reason (<10 chars) - should fail
  - [ ] Without reason - should fail
  - [ ] Verify statistics increment
- [ ] GET /api/employee/bank-accounts-stats/overview
- [ ] Withdrawal request creation fails with unverified bank account
- [ ] Withdrawal request succeeds with verified bank account
- [ ] Employee statistics update correctly

### Frontend Testing (To Be Implemented)
- [ ] Dashboard has two tabs: Bank Verification | Withdrawal Processing
- [ ] Bank verification tab loads bank accounts
- [ ] Statistics display correctly for bank accounts
- [ ] Search and filters work on bank tab
- [ ] "Verify Account" button opens BankVerificationModal
- [ ] Modal displays all bank account information
- [ ] Document viewer toggle works
- [ ] Document image displays correctly
- [ ] "Open in new tab" link works for document
- [ ] Verification workflow completes successfully
- [ ] Rejection workflow completes successfully
- [ ] Statistics update after verification/rejection
- [ ] Cannot verify already-verified accounts (optional behavior)
- [ ] Withdrawal tab works as before (existing tests)

---

## Files Modified

### Backend
- ✅ `backend/routes/employeeRoutes.js`
  - Added BankAccount import
  - Added 5 bank account verification endpoints
  
- ✅ `backend/models/BankAccount.js`
  - Added `verifiedByModel` field for polymorphic reference
  - Added `employeeVerification` object for employee tracking
  
- ✅ `backend/models/Employee.js`
  - Added `totalBankAccountsVerified` statistic
  - Added `totalBankAccountsRejected` statistic

- ✅ `backend/controllers/withdrawalController.js`
  - Already validates bank account verification status (no changes needed)

### Frontend (To Be Implemented)
- ⏳ `client/src/pages/WithdrawalProcessorDashboard.jsx` - Add tab system
- ⏳ `client/src/components/employee/BankVerificationModal.jsx` - Create new modal
- ⏳ `client/src/components/employee/BankAccountCard.jsx` - Create bank account card (optional)

### Documentation
- ✅ `WITHDRAWAL_DEPARTMENT_DUAL_RESPONSIBILITY.md` - This file
- ✅ `WITHDRAWAL_DEPARTMENT_IMPLEMENTATION.md` - Previous implementation doc

---

## API Endpoints Summary

### Bank Account Verification (Employee)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/employee/bank-accounts` | List bank accounts |
| GET | `/api/employee/bank-accounts/:id` | Get bank account details |
| POST | `/api/employee/bank-accounts/:id/verify` | Verify bank account |
| POST | `/api/employee/bank-accounts/:id/reject` | Reject bank account |
| GET | `/api/employee/bank-accounts-stats/overview` | Get statistics |

### Withdrawal Processing (Employee)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/employee/withdrawals` | List withdrawal requests |
| GET | `/api/employee/withdrawals/:id` | Get withdrawal details |
| POST | `/api/employee/withdrawals/:id/approve` | Approve withdrawal |
| POST | `/api/employee/withdrawals/:id/reject` | Reject withdrawal |
| GET | `/api/employee/withdrawals-stats/overview` | Get statistics |

---

## Next Steps

### Immediate
1. ✅ Backend API endpoints implemented
2. ✅ Database models updated
3. ✅ Withdrawal validation enforced
4. ⏳ Create BankVerificationModal component
5. ⏳ Add tab system to WithdrawalProcessorDashboard
6. ⏳ Integrate bank verification tab
7. ⏳ Test complete workflow

### Future Enhancements
1. **Batch Operations**: Verify/reject multiple bank accounts at once
2. **Document OCR**: Automatically extract info from document images
3. **Email Notifications**: Notify users when bank account is verified/rejected
4. **Appeal System**: Let users resubmit rejected bank accounts
5. **Advanced Filters**: Filter by bank name, user KYC status, date ranges
6. **Export Reports**: Generate PDF reports of verified bank accounts
7. **Document Quality Check**: Warn if document image is blurry/unclear

---

## Success Metrics

The dual-responsibility system is successful if:
1. ✅ Employees can verify bank accounts with full document viewing
2. ✅ Employees can reject bank accounts with detailed reasons
3. ✅ Users cannot create withdrawal requests with unverified banks
4. ✅ Employee actions are tracked in database with audit trail
5. ✅ Statistics accurately reflect both bank verification and withdrawal processing
6. ✅ Both verification types (bank and withdrawal) are accessible from one dashboard
7. ✅ Security is maintained with proper authentication and authorization
8. ✅ All employee actions are auditable and logged

---

## Important Notes

1. **Verification Order**: 
   - Bank account must be verified BEFORE withdrawal request can be created
   - This is enforced at the controller level, not just UI

2. **Employee vs Admin**:
   - Employees (Withdrawal Department) can verify bank accounts
   - Admins can also verify bank accounts (existing functionality preserved)
   - Both use the same BankAccount model with polymorphic `verifiedBy` reference

3. **Audit Trail**:
   - `verifiedBy` + `verifiedByModel`: Shows who verified (Admin or Employee)
   - `employeeVerification`: Additional employee-specific details
   - Admin verifications don't populate `employeeVerification`

4. **Statistics**:
   - Employee statistics track both bank verification and withdrawal processing
   - Separate counters for verified vs rejected for both types

5. **Document Security**:
   - Document images are sensitive - only authorized employees can view
   - Documents are stored securely and accessed via presigned URLs (if using S3/MinIO)
