# KYC Signup Flow Implementation

## Overview
Implemented a comprehensive 4-step KYC signup flow with document verification for enhanced user verification and compliance.

## Changes Made

### 1. Backend Changes

#### User Model (`backend/models/User.js`)
- **Added Field**: `personalVerificationDocument`
  - Type: String
  - Default: Empty string
  - Purpose: Stores URL to citizenship or other government-issued verification document

#### User Controller (`backend/controllers/userController.js`)
- **Updated `verifyOtp` function**:
  - Added `personalVerificationDocument` parameter
  - Stores document URL during user registration
  - Document is uploaded using presigned URL approach before final registration

### 2. Frontend Changes

#### Signup Component (`client/src/pages/Signup.jsx`)

##### State Management Updates
- Added `uploadProgress` state for tracking document upload
- Added `documentFile` state for storing selected document file
- Added `documentPreview` state for image preview
- Updated `userData` state with:
  - `personalVerificationDocument`: URL of uploaded document
  - `detailsConfirmed`: Checkbox confirmation
  - `termsAccepted`: Terms and Privacy Policy acceptance

##### New 4-Step Flow

**Step 1: Email Entry** (Unchanged)
- User enters email address
- OTP is sent to email
- Validates email format

**Step 2: Personal Details + KYC Notice** (Enhanced)
- User enters: First Name, Last Name, Phone, Password
- **New KYC Notice Box**:
  - Professional amber-colored notice
  - Warns users that details must match verification document
  - Clear instructions about upcoming document requirement
- **New Verification Checkboxes**:
  1. **Details Confirmation**: "I hereby promise and confirm that all the details I am providing are correct, accurate, and not misleading. I understand that providing false information may result in account suspension or legal action."
  2. **Terms & Privacy**: Accepts Terms of Use and Privacy Policy
     - Clickable links open in new tabs
     - `/terms-of-use` route
     - `/privacy-policy` route
- **Removed**: Turnstile verification (moved to Step 4)
- **Validation**: Both checkboxes must be checked to proceed

**Step 3: Document Upload** (New Step)
- **Purpose**: Upload citizenship or government-issued ID
- **Features**:
  - Drag-and-drop or click to upload
  - File type validation (JPG, PNG, GIF, PDF)
  - File size validation (15MB max)
  - Image preview for image files
  - PDF indicator for PDF files
  - File details display (name, size)
  - Remove and re-upload capability
  - Clear instructions and requirements
- **Info Notice**: Blue-colored box with document requirements
- **Navigation**: Back to Step 2 or Continue to Step 4

**Step 4: OTP Verification + Final Submission** (Enhanced)
- User enters 6-digit OTP
- **Added**: Upload progress indicator (when submitting)
- **Added**: Turnstile security verification (moved from Step 2)
- **Process on Submit**:
  1. Validates Turnstile token
  2. Uploads document using presigned URL approach
  3. Shows upload progress
  4. Verifies OTP
  5. Creates user account with document URL
  6. Logs in user automatically
- **Navigation**: Back to Step 3

##### Key Features

**Document Upload Implementation**
- Uses `uploadService` from `services/uploadService.js`
- Presigned URL approach for direct S3 upload
- File type: `document-citizenship`
- Progress tracking during upload
- Error handling for upload failures

**Security Enhancements**
- Turnstile verification at final step only
- Prevents automated signups
- Document verification for KYC compliance

**User Experience**
- Clear step progression (4 steps)
- Visual progress indicator updated for 4 steps
- Professional notices and warnings
- Validation at each step
- Back navigation available at each step
- Disabled buttons when requirements not met
- Clear error messages

**Validation Requirements**
- Step 1: Valid email format
- Step 2: 
  - All fields filled
  - Password minimum 8 characters
  - Passwords match
  - Details confirmation checkbox checked
  - Terms acceptance checkbox checked
- Step 3:
  - Document file selected
  - Valid file type
  - File size under 15MB
- Step 4:
  - 6-digit OTP entered
  - Turnstile verification completed

### 3. Integration with Existing Systems

#### Upload Service
- Uses existing `uploadService` from `services/uploadService.js`
- Presigned URL approach for secure uploads
- Direct upload to S3-compatible storage (Cloudflare R2/AWS S3/MinIO)
- File type: `document-citizenship`

#### Terms & Privacy Pages
- Integrates with existing routes:
  - `/terms-of-use` → `TermsOfUse.jsx`
  - `/privacy-policy` → `PrivacyPolicy.jsx`
- Opens in new tab for user convenience

#### Authentication Flow
- Maintains existing JWT token generation
- Automatic login after successful registration
- Redirect to dashboard on completion

## Signup Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         STEP 1: EMAIL                           │
│  • Enter email address                                          │
│  • Validation: Email format                                     │
│  • Action: Send OTP                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 2: PERSONAL DETAILS                      │
│  • First Name, Last Name, Phone, Password                       │
│  ⚠️  KYC NOTICE: Details must match document                    │
│  ☑️  Details Confirmation Checkbox                              │
│  ☑️  Terms & Privacy Policy Checkbox                            │
│  • Validation: All fields + both checkboxes                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STEP 3: DOCUMENT UPLOAD                        │
│  • Upload citizenship/government ID                             │
│  • File types: JPG, PNG, GIF, PDF (max 15MB)                   │
│  • Image preview for images                                     │
│  • Validation: File selected                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           STEP 4: OTP VERIFICATION + SUBMISSION                 │
│  • Enter 6-digit OTP                                            │
│  • Turnstile security verification                              │
│  • Upload progress indicator                                    │
│  • Action: Upload document → Verify OTP → Create account        │
│  • Auto-login on success                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                      ✅ Dashboard
```

## Technical Details

### File Upload Process
1. User selects document file in Step 3
2. File is validated (type, size) immediately
3. File is stored in component state with preview
4. On Step 4 submission:
   - Presigned URL is requested from backend
   - File is uploaded directly to storage
   - Upload progress is tracked and displayed
   - Public URL is received upon completion
   - URL is sent with registration data

### Database Schema
```javascript
{
  personalVerificationDocument: {
    type: String,
    default: '' // URL to uploaded document
  }
}
```

### API Integration
- **Endpoint**: `POST /api/users/verify-otp`
- **New Parameter**: `personalVerificationDocument`
- **Upload Service**: Uses existing presigned URL infrastructure
- **File Type**: `document-citizenship`

## Security Considerations

1. **Turnstile Verification**: Prevents automated bot signups
2. **Document Verification**: KYC compliance for user identification
3. **Presigned URLs**: Secure direct upload to storage
4. **Server-side Validation**: All data validated on backend
5. **OTP Verification**: Email ownership verification
6. **Legal Confirmation**: User explicitly confirms data accuracy

## Benefits

1. **KYC Compliance**: Collect verification documents during signup
2. **Data Accuracy**: Users confirm details match documents
3. **Legal Protection**: Explicit user confirmation of accuracy
4. **Security**: Turnstile at final step prevents abuse
5. **User Experience**: Clear, professional multi-step flow
6. **Storage Efficiency**: Presigned URL approach for uploads

## Testing Checklist

- [ ] Step 1: Email submission and validation
- [ ] Step 2: All fields validation
- [ ] Step 2: KYC notice display
- [ ] Step 2: Details confirmation checkbox required
- [ ] Step 2: Terms checkbox with working links
- [ ] Step 2: Links open in new tab
- [ ] Step 3: File upload validation (type, size)
- [ ] Step 3: Image preview for images
- [ ] Step 3: PDF indicator for PDFs
- [ ] Step 3: File removal and re-upload
- [ ] Step 4: OTP validation
- [ ] Step 4: Turnstile verification
- [ ] Step 4: Upload progress display
- [ ] Step 4: Document upload to storage
- [ ] Step 4: User creation with document URL
- [ ] Step 4: Auto-login after registration
- [ ] Back navigation at each step
- [ ] Progress indicator shows all 4 steps
- [ ] Error handling at each step
- [ ] Mobile responsiveness

## Future Enhancements

1. **Document Verification**: Implement AI-based document validation
2. **OCR Integration**: Auto-fill name from document
3. **Face Match**: Compare selfie with document photo
4. **Document Expiry**: Track and remind for document renewal
5. **Admin Review**: Manual verification queue for documents
6. **Multiple Documents**: Support for multiple ID types
7. **Document Status**: Track verification status (pending/approved/rejected)

## Rollback Plan

If issues arise, the following can be reverted:
1. Remove `personalVerificationDocument` field from User model
2. Revert to 3-step signup flow
3. Move Turnstile back to Step 2
4. Remove document upload step
5. Remove KYC notice and checkboxes

## Notes

- Document upload is **required** in the current implementation
- Terms and Privacy Policy pages must exist at specified routes
- Upload service must be properly configured
- Storage (S3/R2/MinIO) must be accessible
- Turnstile site key must be valid
- OTP email service must be working
