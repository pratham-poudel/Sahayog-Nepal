# KYC Signup Flow - Visual Guide

## User Journey Through the Signup Process

### 🔹 STEP 1: Email Entry
```
┌────────────────────────────────────────────┐
│         SahayogNepal                       │
│         Enter Your Email                   │
│                                            │
│  Progress: [●]─[○]─[○]─[○]                │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Email address                        │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ you@example.com                  │ │ │
│  │ └──────────────────────────────────┘ │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         Continue          [Button]   │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Already have an account? Sign in         │
└────────────────────────────────────────────┘
```
**What Happens:**
- User enters their email
- System validates email format
- OTP is sent to the email
- User proceeds to Step 2

---

### 🔹 STEP 2: Personal Details + KYC Declaration
```
┌────────────────────────────────────────────┐
│         SahayogNepal                       │
│      Complete Your Profile                 │
│                                            │
│  Progress: [●]─[●]─[○]─[○]                │
│                                            │
│  First Name:    [John          ]          │
│  Last Name:     [Doe           ]          │
│  Email:         [john@email.com] (locked) │
│  Phone:         [+977 9810000000]         │
│  Password:      [••••••••      ]          │
│  Confirm Pass:  [••••••••      ]          │
│                                            │
│  ╔══════════════════════════════════════╗ │
│  ║  ⚠️  Important: KYC Notice           ║ │
│  ║                                      ║ │
│  ║  Please ensure all details match    ║ │
│  ║  your verification document          ║ │
│  ║  (e.g., Citizenship, Passport)      ║ │
│  ╚══════════════════════════════════════╝ │
│                                            │
│  ☑️ I confirm all details are correct    │
│     and not misleading                    │
│                                            │
│  ☑️ I accept the Terms of Use and        │
│     Privacy Policy                        │
│                                            │
│  [Back]  [Continue to Document Upload]   │
└────────────────────────────────────────────┘
```
**What Happens:**
- User fills in personal details
- **KYC Notice** warns that details must match document
- User must check both confirmation checkboxes
- Terms & Privacy links open in new tabs
- No Turnstile at this step (moved to Step 4)

---

### 🔹 STEP 3: Document Upload
```
┌────────────────────────────────────────────┐
│         SahayogNepal                       │
│    Upload Verification Document            │
│                                            │
│  Progress: [●]─[●]─[●]─[○]                │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  📄 Verification Document          │   │
│  │                                    │   │
│  │  Please upload citizenship,        │   │
│  │  passport, or government ID        │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ╔══════════════════════════════════════╗ │
│  ║  ℹ️  Document Requirements           ║ │
│  ║  • Formats: JPG, PNG, GIF, PDF      ║ │
│  ║  • Max size: 15MB                   ║ │
│  ║  • Clear and readable               ║ │
│  ╚══════════════════════════════════════╝ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  ┌────────────────────────────────┐ │ │
│  │  │    📤 Click to upload          │ │ │
│  │  │    or drag and drop            │ │ │
│  │  │                                │ │ │
│  │  │  PNG, JPG, GIF, PDF (15MB)    │ │ │
│  │  └────────────────────────────────┘ │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  After Upload:                            │
│  ┌──────────────────────────────────────┐ │
│  │  ✅ citizenship.jpg                  │ │
│  │  [Preview Image]                     │ │
│  │  2.5 MB                      [🗑️]    │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [Back]     [Continue to Verification]    │
└────────────────────────────────────────────┘
```
**What Happens:**
- User uploads citizenship or ID document
- Image preview shown for image files
- File details displayed (name, size)
- Can remove and re-upload
- Validates file type and size
- Document stored temporarily (not uploaded yet)

---

### 🔹 STEP 4: OTP Verification + Final Submission
```
┌────────────────────────────────────────────┐
│         SahayogNepal                       │
│       Verify Your Email                    │
│                                            │
│  Progress: [●]─[●]─[●]─[●]                │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  ✉️ Verify Your Email              │   │
│  │                                    │   │
│  │  Code sent to: john@email.com     │   │
│  │  Enter the 6-digit code below     │   │
│  └────────────────────────────────────┘   │
│                                            │
│  Verification Code:                       │
│  ┌──────────────────────────────────────┐ │
│  │        [  1  2  3  4  5  6  ]        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Didn't receive? Resend Code              │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  🔒 Security Verification            │ │
│  │  [Cloudflare Turnstile Widget]      │ │
│  │  ✅ Verification completed           │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  While Uploading:                         │
│  ╔══════════════════════════════════════╗ │
│  ║  📤 Uploading document...    45%     ║ │
│  ║  [████████░░░░░░░░░░░]              ║ │
│  ╚══════════════════════════════════════╝ │
│                                            │
│  [Back]        [Complete Sign Up]         │
│              (Requires Turnstile ✓)       │
└────────────────────────────────────────────┘
```
**What Happens:**
1. User enters 6-digit OTP from email
2. User completes Turnstile security verification
3. On "Complete Sign Up":
   - Document uploads to storage (progress shown)
   - OTP is verified
   - User account is created with document URL
   - User is automatically logged in
   - Redirected to dashboard

---

## Checkbox Details

### ✅ Details Confirmation Checkbox (Step 2)
**Full Text:**
> "I hereby promise and confirm that all the details I am providing are correct, accurate, and not misleading. I understand that providing false information may result in account suspension or legal action."

**Purpose:**
- Legal confirmation from user
- Ensures user takes responsibility for accuracy
- Protects platform from fraud
- Required for KYC compliance

### ✅ Terms & Privacy Checkbox (Step 2)
**Full Text:**
> "I accept the [Terms of Use] and [Privacy Policy]"

**Links:**
- `Terms of Use` → `/terms-of-use` (opens in new tab)
- `Privacy Policy` → `/privacy-policy` (opens in new tab)

**Purpose:**
- Legal acceptance of platform terms
- GDPR/privacy law compliance
- Opens in new tab for easy review

---

## Upload Process Flow

```
┌─────────────┐
│ Select File │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Validate File       │
│ • Type: Image/PDF   │
│ • Size: < 15MB      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Show Preview        │
│ • Image: Display    │
│ • PDF: Icon         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Store in State      │
│ (Not uploaded yet)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User Continues to   │
│ Step 4 (OTP)        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User Enters OTP +   │
│ Completes Turnstile │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ REQUEST PRESIGNED   │
│ URL FROM BACKEND    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ UPLOAD FILE         │
│ • Direct to Storage │
│ • Show Progress     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ GET PUBLIC URL      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ SEND TO VERIFY-OTP  │
│ • OTP               │
│ • User Details      │
│ • Document URL      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ CREATE USER +       │
│ AUTO-LOGIN          │
└──────┬──────────────┘
       │
       ▼
   Dashboard ✅
```

---

## Error Scenarios

### ❌ Step 2 Errors
- **Passwords don't match**: Show error, stay on step 2
- **Details checkbox not checked**: "Please confirm your details are correct"
- **Terms checkbox not checked**: "Please accept the Terms of Use and Privacy Policy"

### ❌ Step 3 Errors
- **No file selected**: "Please upload your citizenship or verification document"
- **File too large**: "Please select a file smaller than 15MB"
- **Invalid file type**: "Please upload an image (JPG, PNG, GIF) or PDF file"

### ❌ Step 4 Errors
- **No Turnstile**: "Please complete the security verification"
- **Invalid OTP**: "Invalid or expired OTP. Please try again."
- **Upload fails**: "Failed to upload verification document. Please try again."
- **Network error**: "Network error. Please check your connection."

---

## Success Flow

```
Step 1: Email ✅
   ↓
Step 2: Details + Checkboxes ✅
   ↓
Step 3: Document Selected ✅
   ↓
Step 4: OTP + Turnstile ✅
   ↓
Upload Document (Progress: 0% → 100%) ✅
   ↓
Verify OTP ✅
   ↓
Create Account ✅
   ↓
Auto-Login ✅
   ↓
🎉 Dashboard Welcome!
```

---

## Mobile Responsive Design

All steps are fully responsive:
- Forms adapt to mobile screens
- Touch-friendly upload areas
- Readable text sizes
- Proper spacing for mobile
- Back buttons accessible
- Progress indicator scales

---

## Accessibility Features

- ✅ Keyboard navigation support
- ✅ Screen reader compatible labels
- ✅ Clear error messages
- ✅ Color contrast compliance
- ✅ Focus indicators on inputs
- ✅ Aria labels where needed
- ✅ Logical tab order

---

## Security Features

1. **Email Verification**: OTP sent to email
2. **Turnstile**: Prevents bot signups (at final step)
3. **Presigned URLs**: Secure upload mechanism
4. **File Validation**: Type and size checks
5. **Server Validation**: All data re-validated on backend
6. **Legal Confirmation**: User explicitly confirms accuracy
7. **JWT Tokens**: Secure authentication after signup
