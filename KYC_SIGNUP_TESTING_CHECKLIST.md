# KYC Signup Flow - Testing Checklist

## Pre-Testing Requirements
- [ ] Backend server is running
- [ ] Frontend development server is running
- [ ] Database connection is active
- [ ] Redis is running (for OTP storage)
- [ ] Email service is configured
- [ ] S3/R2/MinIO storage is accessible
- [ ] Turnstile site key is valid and configured
- [ ] Terms of Use page exists at `/terms-of-use`
- [ ] Privacy Policy page exists at `/privacy-policy`

---

## STEP 1: Email Entry Testing

### ✅ Functionality Tests
- [ ] Email input field is visible and accessible
- [ ] Email validation works (invalid format shows error)
- [ ] Empty email submission shows error
- [ ] Valid email proceeds to Step 2
- [ ] OTP is sent to email (check inbox)
- [ ] Loading state shows while processing
- [ ] "Already have an account? Sign in" link works

### ✅ Error Handling
- [ ] Network error shows proper message
- [ ] Already registered email shows appropriate error
- [ ] Rate limiting works (too many requests)
- [ ] Server error shows user-friendly message

### ✅ UI/UX Tests
- [ ] Progress indicator shows Step 1 active
- [ ] Form input styling is correct (light/dark mode)
- [ ] Button hover/tap animations work
- [ ] Mobile responsive design works
- [ ] Placeholder text is visible

---

## STEP 2: Personal Details + KYC Testing

### ✅ Functionality Tests
- [ ] All input fields are visible and functional
  - [ ] First Name
  - [ ] Last Name
  - [ ] Email (locked/disabled, showing Step 1 email)
  - [ ] Phone
  - [ ] Password
  - [ ] Confirm Password
- [ ] Password visibility toggle (if implemented)
- [ ] Password strength indicator (if implemented)
- [ ] Password match validation works
- [ ] Password minimum 8 characters validation

### ✅ KYC Notice Tests
- [ ] KYC notice box is visible
- [ ] Amber/warning color styling is correct
- [ ] Warning icon is displayed
- [ ] Text is readable and professional
- [ ] Notice mentions document requirement
- [ ] Dark mode styling works

### ✅ Checkbox Tests
#### Details Confirmation Checkbox
- [ ] Checkbox is visible and functional
- [ ] Full legal text is displayed correctly
- [ ] Checkbox is required (form won't submit without it)
- [ ] Error message shows if not checked
- [ ] Professional wording is used

#### Terms & Privacy Checkbox
- [ ] Checkbox is visible and functional
- [ ] "Terms of Use" link is present
- [ ] "Privacy Policy" link is present
- [ ] Clicking Terms link opens `/terms-of-use` in NEW TAB
- [ ] Clicking Privacy link opens `/privacy-policy` in NEW TAB
- [ ] Links don't navigate away from signup form
- [ ] Checkbox is required (form won't submit without it)
- [ ] Error message shows if not checked
- [ ] Link styling is correct (color, underline)

### ✅ Validation Tests
- [ ] Empty fields show validation errors
- [ ] Invalid phone format shows error (if applicable)
- [ ] Password mismatch shows error
- [ ] Submit disabled if checkboxes unchecked
- [ ] All validations work together

### ✅ Navigation Tests
- [ ] "Back" button returns to Step 1
- [ ] Email field remains populated from Step 1
- [ ] "Continue to Document Upload" button works
- [ ] Button shows correct text
- [ ] Button disabled states work correctly

### ✅ UI/UX Tests
- [ ] Progress indicator shows Step 2 active
- [ ] Form layout is clean and organized
- [ ] Notice box styling is professional
- [ ] Checkbox alignment is correct
- [ ] Mobile responsive layout works
- [ ] Dark mode works properly
- [ ] Error messages are clearly visible

### ✅ Security Tests
- [ ] Turnstile is NOT present in Step 2 (moved to Step 4)
- [ ] No security verification required at this step
- [ ] Form data is not sent to server yet

---

## STEP 3: Document Upload Testing

### ✅ Functionality Tests
- [ ] Upload area is visible and accessible
- [ ] "Click to upload" text is clear
- [ ] File input opens file browser on click
- [ ] Drag-and-drop works (if supported by browser)

### ✅ File Validation Tests
#### Accepted File Types
- [ ] JPEG/JPG files are accepted
- [ ] PNG files are accepted
- [ ] GIF files are accepted
- [ ] PDF files are accepted

#### Rejected File Types
- [ ] .doc/.docx files are rejected with error
- [ ] .txt files are rejected with error
- [ ] .zip files are rejected with error
- [ ] Other file types show appropriate error

#### File Size Validation
- [ ] Files under 15MB are accepted
- [ ] Files over 15MB show "File too large" error
- [ ] Error message mentions 15MB limit
- [ ] Large files don't crash the app

### ✅ Preview Tests
#### Image Files
- [ ] Image preview displays correctly
- [ ] Preview maintains aspect ratio
- [ ] Preview is contained within frame
- [ ] Preview quality is acceptable

#### PDF Files
- [ ] PDF icon/indicator is shown
- [ ] No broken image for PDFs
- [ ] PDF filename is displayed

### ✅ File Display Tests
- [ ] File name is displayed correctly
- [ ] File size is shown in MB/KB
- [ ] File size calculation is accurate
- [ ] Long filenames are truncated properly

### ✅ Remove/Replace Tests
- [ ] Remove (🗑️) button is visible
- [ ] Clicking remove clears the file
- [ ] Preview is cleared after removal
- [ ] Can upload new file after removal
- [ ] Can upload same file again after removal

### ✅ Information Notice Tests
- [ ] Blue info box is visible
- [ ] Info icon is displayed
- [ ] "Document Requirements" title is shown
- [ ] All requirement bullets are listed:
  - [ ] Accepted formats
  - [ ] Max size
  - [ ] Clarity requirement
  - [ ] Visibility requirement

### ✅ Navigation Tests
- [ ] "Back" button returns to Step 2
- [ ] User details are retained from Step 2
- [ ] "Continue to Verification" button works
- [ ] Button is disabled when no file selected
- [ ] Button is enabled when file is selected
- [ ] Button text is appropriate

### ✅ UI/UX Tests
- [ ] Progress indicator shows Step 3 active
- [ ] Upload area has proper hover state
- [ ] File upload area styling is attractive
- [ ] Selected file display is professional
- [ ] Mobile responsive design works
- [ ] Dark mode works properly
- [ ] Upload icon is visible and styled

### ✅ Edge Cases
- [ ] Uploading multiple files (should only accept one)
- [ ] Very long filenames display properly
- [ ] Special characters in filename work
- [ ] Uploading same file twice works
- [ ] Navigating back and forward retains file

---

## STEP 4: OTP Verification + Submission Testing

### ✅ OTP Input Tests
- [ ] OTP input field is visible
- [ ] Placeholder text is clear
- [ ] Can enter 6 digits
- [ ] Only numbers are accepted
- [ ] Non-numeric input is rejected
- [ ] Field validation works (6 digits required)
- [ ] Tracking/spacing makes digits readable

### ✅ OTP Email Tests
- [ ] OTP email is received in inbox
- [ ] Email contains correct 6-digit code
- [ ] Email is from correct sender
- [ ] Email template is professional
- [ ] Email includes user's email address

### ✅ Resend OTP Tests
- [ ] "Resend Code" link is visible
- [ ] Clicking resend sends new OTP
- [ ] Success toast shows after resend
- [ ] New OTP is received in email
- [ ] Old OTP is invalidated (optional test)
- [ ] Rate limiting works on resend

### ✅ Turnstile Tests
- [ ] Turnstile widget loads properly
- [ ] Turnstile challenge appears
- [ ] Can complete Turnstile verification
- [ ] Checkmark appears after verification
- [ ] "Security verification completed" message shows
- [ ] Submit button disabled without Turnstile
- [ ] Warning text shows when not completed
- [ ] Turnstile expiry shows error toast
- [ ] Turnstile error shows error toast

### ✅ Upload Progress Tests
- [ ] Progress bar appears during upload
- [ ] Progress percentage is shown
- [ ] Progress bar fills from 0% to 100%
- [ ] Upload progress is smooth
- [ ] Blue styling for progress indicator
- [ ] Progress text is readable

### ✅ Form Submission Tests
- [ ] Submit button shows "Complete Sign Up"
- [ ] Button disabled without Turnstile completion
- [ ] Button shows "Complete verification to submit" when disabled
- [ ] Button enabled after Turnstile completion
- [ ] Loading state shows during submission ("Creating Account...")
- [ ] Cannot submit multiple times (double-click prevention)

### ✅ Upload Process Tests
1. **Document Upload**
   - [ ] Presigned URL is requested successfully
   - [ ] File uploads to storage (S3/R2/MinIO)
   - [ ] Upload progress is tracked
   - [ ] Public URL is received
   - [ ] No errors during upload

2. **OTP Verification**
   - [ ] OTP is validated correctly
   - [ ] Correct OTP proceeds with registration
   - [ ] Invalid OTP shows error
   - [ ] Expired OTP shows error

3. **Account Creation**
   - [ ] User account is created in database
   - [ ] All user details are saved:
     - [ ] Name (First + Last)
     - [ ] Email
     - [ ] Phone
     - [ ] Password (hashed)
     - [ ] Personal Verification Document URL
   - [ ] Document URL is correctly stored
   - [ ] User role is set to 'user'
   - [ ] Timestamps are created

4. **Auto-Login**
   - [ ] JWT token is generated
   - [ ] Token is saved to localStorage
   - [ ] Auth context is updated
   - [ ] Success toast is shown
   - [ ] Welcome message is displayed

5. **Redirect**
   - [ ] User is redirected to `/dashboard`
   - [ ] Dashboard loads successfully
   - [ ] User is logged in (can see their data)

### ✅ Error Handling Tests
#### Upload Errors
- [ ] Network error during upload shows message
- [ ] Storage service down shows error
- [ ] Large file timeout handled gracefully
- [ ] Upload failure allows retry

#### OTP Errors
- [ ] Wrong OTP shows clear error message
- [ ] Expired OTP shows appropriate message
- [ ] Too many attempts handled properly
- [ ] Network error shows message

#### Turnstile Errors
- [ ] Turnstile failure shows error
- [ ] Turnstile expiry prompts re-verification
- [ ] Network error with Turnstile handled
- [ ] Can retry after Turnstile error

#### Server Errors
- [ ] 500 errors show user-friendly message
- [ ] Database errors handled gracefully
- [ ] Email service errors don't break flow
- [ ] Validation errors displayed clearly

### ✅ Navigation Tests
- [ ] "Back" button returns to Step 3
- [ ] Document selection is retained
- [ ] OTP field is cleared when going back
- [ ] Turnstile state is reset when needed

### ✅ UI/UX Tests
- [ ] Progress indicator shows Step 4 active (all 4 filled)
- [ ] OTP input styling is good
- [ ] Turnstile widget styling fits design
- [ ] Upload progress is visible and clear
- [ ] Success messages are celebratory
- [ ] Error messages are helpful
- [ ] Mobile responsive design works
- [ ] Dark mode works properly

---

## Integration Tests

### ✅ Full Flow Tests
1. **Happy Path - Complete Signup**
   - [ ] Step 1: Enter email → receive OTP
   - [ ] Step 2: Enter details → check both boxes → continue
   - [ ] Step 3: Upload document → continue
   - [ ] Step 4: Enter OTP → complete Turnstile → submit
   - [ ] Document uploads successfully
   - [ ] Account created
   - [ ] Auto-login works
   - [ ] Redirect to dashboard
   - [ ] Can verify document URL in database

2. **Backward Navigation**
   - [ ] From Step 2 → back to Step 1 (email retained)
   - [ ] From Step 3 → back to Step 2 (details retained)
   - [ ] From Step 4 → back to Step 3 (document retained)
   - [ ] Can go back multiple steps
   - [ ] Can complete flow after going back

3. **Error Recovery**
   - [ ] OTP error → can resend → can complete
   - [ ] Upload error → can go back → re-upload → continue
   - [ ] Turnstile error → can re-verify → can submit

### ✅ Data Persistence Tests
- [ ] Email persists across Step 1 → Step 2
- [ ] User details persist across Step 2 → Step 3 → Step 4
- [ ] Document selection persists when going back
- [ ] Checkbox states persist appropriately
- [ ] Nothing lost during navigation

### ✅ Database Tests
- [ ] New user appears in database
- [ ] All fields are populated correctly
- [ ] `personalVerificationDocument` field has URL
- [ ] Password is hashed (not plain text)
- [ ] Timestamps are correct
- [ ] No duplicate users created

### ✅ Storage Tests
- [ ] Document file exists in storage
- [ ] File is in correct folder (`documents/citizenship/`)
- [ ] Filename format is correct
- [ ] File is accessible via public URL
- [ ] File permissions are correct (public-read)

---

## Security Tests

### ✅ Authentication Tests
- [ ] Cannot access protected routes before login
- [ ] JWT token is valid
- [ ] Token expires appropriately
- [ ] Refresh token works (if implemented)

### ✅ Authorization Tests
- [ ] New user has 'user' role (not admin)
- [ ] User can only access their own data
- [ ] User cannot access admin routes

### ✅ Input Validation Tests
- [ ] XSS attempts in inputs are sanitized
- [ ] SQL injection attempts are prevented
- [ ] Script tags in inputs are escaped
- [ ] Special characters handled properly

### ✅ Rate Limiting Tests
- [ ] Too many OTP requests are blocked
- [ ] Too many signup attempts are blocked
- [ ] Rate limit error messages are shown
- [ ] Rate limit resets after time period

### ✅ File Upload Security Tests
- [ ] Cannot upload executable files
- [ ] File size limits are enforced
- [ ] File type validation works
- [ ] Presigned URLs expire appropriately
- [ ] Cannot access other users' documents

---

## Performance Tests

### ✅ Load Time Tests
- [ ] Step transitions are smooth (< 300ms)
- [ ] Form renders quickly
- [ ] Images load efficiently
- [ ] No janky animations
- [ ] Upload progress is smooth

### ✅ Upload Performance Tests
- [ ] Small files (< 1MB) upload quickly
- [ ] Medium files (1-5MB) upload reasonably
- [ ] Large files (5-15MB) show progress clearly
- [ ] Upload doesn't freeze UI
- [ ] Multiple uploads handled well (if applicable)

### ✅ Memory Tests
- [ ] No memory leaks during flow
- [ ] Image previews are cleaned up
- [ ] File objects are released
- [ ] No excessive re-renders

---

## Accessibility Tests

### ✅ Keyboard Navigation
- [ ] Can tab through all inputs
- [ ] Can check/uncheck boxes with keyboard
- [ ] Can submit forms with Enter key
- [ ] Focus indicators are visible
- [ ] Tab order is logical

### ✅ Screen Reader Tests
- [ ] Form labels are read correctly
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Checkboxes are properly labeled
- [ ] Links are distinguishable

### ✅ Visual Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is readable at all sizes
- [ ] Error states are clear
- [ ] Focus states are visible
- [ ] Icons have alt text/aria-labels

---

## Cross-Browser Tests

### ✅ Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Opera (if applicable)

### ✅ Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Firefox Mobile
- [ ] Samsung Internet

### ✅ Browser Features
- [ ] File upload works in all browsers
- [ ] Turnstile works in all browsers
- [ ] Animations work smoothly
- [ ] Dark mode works in all browsers

---

## Responsive Design Tests

### ✅ Desktop (1920×1080)
- [ ] Layout is centered and attractive
- [ ] Progress indicator fits well
- [ ] Forms are appropriately sized
- [ ] All elements visible without scrolling (per step)

### ✅ Laptop (1366×768)
- [ ] Layout adapts properly
- [ ] No horizontal scrolling
- [ ] All elements accessible

### ✅ Tablet (768×1024)
- [ ] Forms scale appropriately
- [ ] Touch targets are large enough
- [ ] Buttons are easy to tap
- [ ] Upload area is accessible

### ✅ Mobile (375×667)
- [ ] Single column layout
- [ ] All text is readable
- [ ] Forms are thumb-friendly
- [ ] Progress indicator scales
- [ ] Upload works on mobile
- [ ] No horizontal scrolling

---

## Edge Cases & Stress Tests

### ✅ Network Issues
- [ ] Slow network doesn't break flow
- [ ] Upload timeout handled gracefully
- [ ] Can retry after network failure
- [ ] Offline detection works

### ✅ Unusual Inputs
- [ ] Very long names (> 100 chars)
- [ ] Names with special characters
- [ ] International characters (Unicode)
- [ ] Email with plus addressing (user+tag@domain.com)
- [ ] Phone numbers with various formats

### ✅ Unusual Files
- [ ] Minimum size file (1KB)
- [ ] Maximum size file (15MB)
- [ ] File with no extension
- [ ] File with multiple dots in name
- [ ] File with Unicode filename

### ✅ Timing Issues
- [ ] OTP expiry (10 minutes)
- [ ] Turnstile expiry
- [ ] Session timeout
- [ ] Multiple tabs open

---

## Final Verification Checklist

### ✅ Code Quality
- [ ] No console errors in browser
- [ ] No console warnings
- [ ] No ESLint errors
- [ ] Code follows project conventions
- [ ] No commented-out code
- [ ] Proper error handling everywhere

### ✅ Documentation
- [ ] KYC_SIGNUP_FLOW_IMPLEMENTATION.md created ✅
- [ ] KYC_SIGNUP_VISUAL_GUIDE.md created ✅
- [ ] Testing checklist complete ✅
- [ ] Code comments are clear
- [ ] API documentation updated (if needed)

### ✅ Deployment Readiness
- [ ] Environment variables configured
- [ ] Production settings reviewed
- [ ] Storage buckets configured
- [ ] Email service configured
- [ ] Turnstile keys are production-ready
- [ ] Database migrations run (if needed)

### ✅ Rollback Plan
- [ ] Backup of previous code exists
- [ ] Rollback procedure documented
- [ ] Database rollback plan ready
- [ ] Can revert quickly if needed

---

## Test Results Summary

**Date Tested:** _______________  
**Tester Name:** _______________  
**Environment:** _______________  

**Total Tests:** _____ / _____  
**Passed:** _____ ✅  
**Failed:** _____ ❌  
**Skipped:** _____ ⏭️  

**Critical Issues Found:**
1. _______________________________
2. _______________________________
3. _______________________________

**Minor Issues Found:**
1. _______________________________
2. _______________________________
3. _______________________________

**Overall Status:** [ ] PASS / [ ] FAIL / [ ] NEEDS WORK

**Ready for Production:** [ ] YES / [ ] NO

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Quick Test Commands

### Start Backend
```powershell
cd backend
npm run dev
```

### Start Frontend
```powershell
cd client
npm run dev
```

### Check Database
```powershell
# Connect to MongoDB and verify user document
```

### Check Storage
```powershell
# Verify file exists in storage bucket
```

### Clear Test Data
```powershell
# Remove test users from database
# Remove test documents from storage
```

---

## Post-Testing Actions

- [ ] Report all bugs found
- [ ] Create tickets for issues
- [ ] Update documentation if needed
- [ ] Inform stakeholders of results
- [ ] Schedule fixes for critical issues
- [ ] Plan deployment timeline
- [ ] Prepare monitoring for production
- [ ] Set up error tracking (Sentry, etc.)

**Testing Completed By:** _______________  
**Date:** _______________  
**Sign-off:** _______________
