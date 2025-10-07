# LAP Letter Implementation - Testing Checklist

## 🧪 Complete Testing Guide

### Pre-Testing Setup
- [ ] Backend server is running
- [ ] Frontend dev server is running
- [ ] Database is connected
- [ ] File storage (MinIO/Cloudflare R2) is configured
- [ ] User account is created and logged in

---

## 📋 Backend Testing

### 1. Template Download
```bash
# Test that the template is accessible
curl http://localhost:5000/templates/LAP_Letter_Template.md
```
- [ ] Template file downloads successfully
- [ ] Content is correct and readable
- [ ] File serves with correct MIME type

### 2. Presigned URL Generation
```bash
# Test LAP letter presigned URL generation
curl -X POST http://localhost:5000/api/uploads/presigned-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "document-lap",
    "contentType": "application/pdf",
    "originalName": "lap-letter.pdf"
  }'
```
- [ ] Returns presigned URL successfully
- [ ] Returns correct upload method (PUT/POST)
- [ ] Returns public URL format correctly

### 3. File Upload Validation
- [ ] Upload PDF file (should succeed)
- [ ] Upload JPG file (should succeed)
- [ ] Upload PNG file (should succeed)
- [ ] Upload GIF file (should succeed)
- [ ] Upload TXT file (should fail with clear error)
- [ ] Upload file > 15MB (should fail with size error)

### 4. Campaign Creation Validation
```bash
# Test campaign creation without LAP letter
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Campaign",
    "category": "Healthcare",
    "targetAmount": 50000,
    "endDate": "2025-12-31",
    "shortDescription": "Test",
    "story": "Test story",
    "coverImageUrl": "https://example.com/image.jpg"
  }'
```
- [ ] Returns error about missing LAP letter
- [ ] Error message is clear and helpful

```bash
# Test campaign creation with LAP letter
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Campaign",
    "category": "Healthcare",
    "targetAmount": 50000,
    "endDate": "2025-12-31",
    "shortDescription": "Test",
    "story": "Test story",
    "coverImageUrl": "https://example.com/image.jpg",
    "lapLetterUrl": "https://example.com/lap.pdf"
  }'
```
- [ ] Campaign creates successfully
- [ ] LAP letter URL is stored in database
- [ ] Response includes LAP letter URL

### 5. Database Verification
```javascript
// Check campaign has LAP letter field
db.campaigns.findOne({}, { lapLetter: 1, title: 1 })
```
- [ ] lapLetter field exists
- [ ] lapLetter contains valid URL
- [ ] lapLetter is required on schema

---

## 🎨 Frontend Testing

### 1. Step 0: Requirements Page

**Navigation:**
- [ ] Requirements page loads when starting campaign
- [ ] Step indicator shows "Step 1" correctly
- [ ] Progress bar starts at 0%

**Content Display:**
- [ ] "Campaign Requirements" heading visible
- [ ] "Before You Start" section displays
- [ ] Required documents section shows
- [ ] LAP Letter is first in required list
- [ ] LAP Letter has "REQUIRED" badge
- [ ] Download template button is visible
- [ ] Cover Image requirement shows
- [ ] Basic Information requirement shows
- [ ] Optional documents section displays
- [ ] Important notes section displays

**LAP Letter Section:**
- [ ] LAP Letter box has red/maroon border
- [ ] Description text is clear
- [ ] Download Template button is prominent
- [ ] Button has download icon
- [ ] Button uses correct gradient colors

**Interactions:**
- [ ] Click "Download Template" button
- [ ] Template file downloads successfully
- [ ] Click "I Have Everything Ready" button
- [ ] Advances to Step 1 (Basic Information)

**Responsive Design:**
- [ ] Test on desktop (1920px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] All content readable on small screens
- [ ] Buttons remain accessible

### 2. Step 1: Basic Information

**Navigation:**
- [ ] Step indicator shows "Step 2" correctly
- [ ] Progress bar shows ~25%
- [ ] Back button not present (first input step)

**Form Fields:**
- [ ] Campaign title field works
- [ ] Category dropdown works
- [ ] Subcategory shows when applicable
- [ ] Target amount accepts numbers
- [ ] End date picker works
- [ ] Validation shows for required fields
- [ ] "Continue to Details" button enabled when valid

**Interactions:**
- [ ] Fill all required fields
- [ ] Click "Continue to Details"
- [ ] Advances to Step 2 (Campaign Details)

### 3. Step 2: Campaign Details

**Navigation:**
- [ ] Step indicator shows "Step 3" correctly
- [ ] Progress bar shows ~50%
- [ ] Back button works

**Form Fields:**
- [ ] Short description textarea works
- [ ] Character counter shows (0/200)
- [ ] Campaign story textarea works
- [ ] Form shows validation errors

**Cover Image Upload:**
- [ ] File selector appears
- [ ] "Click to select cover image" text visible
- [ ] Drag and drop works
- [ ] File selection dialog opens
- [ ] Selected file shows preview
- [ ] Can remove selected file
- [ ] Toast notification shows on selection

**LAP Letter Upload Section:**
- [ ] Section appears after cover image
- [ ] "Local Authority Permission (LAP) Letter*" heading visible
- [ ] "REQUIRED" badge shows in red
- [ ] Warning box displays (amber/yellow background)
- [ ] Warning text is clear and informative
- [ ] "Download Template" button visible
- [ ] Button has download icon
- [ ] File selector displays
- [ ] "Click to select LAP Letter" text visible
- [ ] "Image or PDF file up to 15MB" text shows
- [ ] "Must have official seal/stamp" note displays

**LAP Letter Upload Interactions:**
- [ ] Click "Download Template" button
- [ ] Template downloads successfully
- [ ] Click file selector
- [ ] File dialog opens
- [ ] Select PDF file
- [ ] File uploads successfully
- [ ] Preview shows (if image)
- [ ] File name displays
- [ ] Toast notification shows "LAP Letter selected"
- [ ] Can remove selected file
- [ ] Try uploading >15MB file (should show error)
- [ ] Try uploading .txt file (should show error)

**Additional Images Upload:**
- [ ] Section displays
- [ ] "Optional - Up to 3" text shows
- [ ] Can select multiple files
- [ ] Max 3 files enforced
- [ ] Toast shows count selected

**Verification Documents Upload:**
- [ ] Section displays
- [ ] "Optional - Up to 3" text shows
- [ ] Info box displays
- [ ] Can select multiple files
- [ ] Accepts PDF and images

**Validation:**
- [ ] Try clicking "Review & Submit" without cover image
- [ ] Should show error toast
- [ ] Try clicking "Review & Submit" without LAP letter
- [ ] Should show error toast "LAP Letter required"
- [ ] With all required files selected
- [ ] Should advance to Step 3

### 4. Step 3: Review & Submit

**Display:**
- [ ] Step indicator shows "Step 4" correctly
- [ ] Progress bar shows ~75%
- [ ] All entered information displays
- [ ] Cover image preview shows
- [ ] LAP letter file name shows (NEW)
- [ ] Additional images show (if uploaded)
- [ ] Verification docs show (if uploaded)

**Security Verification:**
- [ ] Turnstile widget displays
- [ ] Can complete verification
- [ ] Checkmark shows when verified
- [ ] Submit button enables after verification

**Submission:**
- [ ] Click "Submit Campaign" button
- [ ] Upload progress modal appears

### 5. Upload Progress Modal

**Stage Display:**
- [ ] Modal shows title "Uploading Your Campaign"
- [ ] Stage 1: Uploading cover image... shows
- [ ] Stage 2: Uploading LAP Letter... shows (NEW)
- [ ] Stage 3: Shows if additional images exist
- [ ] Stage 4: Shows if verification docs exist
- [ ] Stage 5: Creating campaign... shows
- [ ] Overall progress bar displays

**Progress Tracking:**
- [ ] Stage 1 shows progress (0-100%)
- [ ] Stage 1 shows checkmark when complete
- [ ] Stage 2 shows progress (0-100%) (NEW - LAP LETTER)
- [ ] Stage 2 shows checkmark when complete (NEW)
- [ ] Each stage completes in order
- [ ] Overall progress updates
- [ ] No errors occur

**Completion:**
- [ ] All stages show checkmarks
- [ ] "Campaign created!" toast appears
- [ ] Success message displays
- [ ] Redirects to dashboard after 2 seconds

**Error Handling:**
- [ ] If LAP letter upload fails, error shows
- [ ] Error stage shows red indicator
- [ ] Error message is clear
- [ ] Can close modal and retry

### 6. Campaign Data Verification

**Database Check:**
- [ ] Open created campaign in database
- [ ] `lapLetter` field has URL
- [ ] URL is accessible
- [ ] File exists in storage
- [ ] File is viewable/downloadable

**Frontend Display:**
- [ ] View campaign in dashboard
- [ ] Campaign shows "pending" status
- [ ] Campaign details are correct

---

## 🔄 Edge Cases Testing

### Invalid States:
- [ ] Start campaign without login → Should redirect to login
- [ ] Try to skip Step 0 → Should not be possible
- [ ] Try to skip Step 1 → Should not be possible
- [ ] Submit without cover image → Error shown
- [ ] Submit without LAP letter → Error shown
- [ ] Upload invalid file type → Error shown
- [ ] Upload oversized file → Error shown
- [ ] Network error during upload → Error handled gracefully
- [ ] Browser back button → Form data preserved (if auto-save works)
- [ ] Page refresh → Auto-save recovery works

### Auto-Save Testing (if implemented):
- [ ] Fill Step 1, refresh page
- [ ] Modal shows "Continue Draft"
- [ ] Draft restores form data
- [ ] LAP letter selection persists
- [ ] File selections persist

### Multiple File Selection:
- [ ] Select 1 additional image → Works
- [ ] Select 3 additional images → Works
- [ ] Try to select 4 additional images → Limited to 3
- [ ] Remove one image → Works
- [ ] Add another image → Works

### Mobile Testing:
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] File upload works on mobile
- [ ] Template download works on mobile
- [ ] All buttons are tappable
- [ ] No layout issues
- [ ] Drag and drop disabled/handled on mobile

---

## 🎯 Integration Testing

### Complete Flow:
1. [ ] User visits /start-campaign
2. [ ] Sees requirements page
3. [ ] Downloads LAP template
4. [ ] Clicks "I Have Everything Ready"
5. [ ] Fills basic information
6. [ ] Fills campaign details
7. [ ] Uploads cover image
8. [ ] Downloads LAP template again (from Step 2)
9. [ ] Uploads LAP letter (PDF)
10. [ ] Uploads 2 additional images
11. [ ] Uploads 1 verification document
12. [ ] Reviews information
13. [ ] Completes security verification
14. [ ] Submits campaign
15. [ ] Sees upload progress
16. [ ] All stages complete
17. [ ] Redirects to dashboard
18. [ ] Campaign appears in dashboard
19. [ ] Campaign has "pending" status
20. [ ] Admin can view LAP letter in review

### Admin Review (Future):
- [ ] Admin sees LAP letter in campaign review
- [ ] Admin can download LAP letter
- [ ] Admin can verify LAP letter authenticity

---

## 📊 Performance Testing

- [ ] Requirements page loads quickly
- [ ] Template download is fast
- [ ] File upload progress is smooth
- [ ] No UI blocking during upload
- [ ] Progress updates in real-time
- [ ] No memory leaks with file previews
- [ ] Multiple campaigns can be created

---

## 🔒 Security Testing

- [ ] LAP letter requires authentication
- [ ] Presigned URLs expire appropriately
- [ ] Cannot upload LAP letter for another user
- [ ] File size limits enforced
- [ ] File type restrictions enforced
- [ ] XSS protection in file names
- [ ] SQL injection protection in metadata

---

## 📱 Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Screen reader announces requirements
- [ ] Screen reader announces upload status
- [ ] All images have alt text
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible
- [ ] Error messages are announced

---

## ✅ Acceptance Criteria

### Must Pass:
- ✅ Step 0 displays all requirements clearly
- ✅ LAP letter template downloads successfully
- ✅ LAP letter upload section is prominent
- ✅ LAP letter is validated as required
- ✅ Upload progress shows LAP letter stage
- ✅ Campaign creation fails without LAP letter
- ✅ Campaign creation succeeds with LAP letter
- ✅ LAP letter URL is stored in database
- ✅ No emojis in production UI
- ✅ Professional design maintained
- ✅ Mobile responsive works

### Should Pass:
- ⭐ Auto-save preserves LAP letter selection
- ⭐ Error messages are user-friendly
- ⭐ File preview works for images
- ⭐ PDF icon shows for PDF files
- ⭐ Admin can view uploaded LAP letters

---

## 🐛 Bug Report Template

If you find issues, document them as:

```
**Bug**: LAP letter upload fails with PDF
**Steps to Reproduce**:
1. Navigate to Start Campaign
2. Go to Step 2
3. Select PDF file for LAP letter
4. Click upload

**Expected**: File uploads successfully
**Actual**: Error message appears

**Error Message**: [paste error]
**Browser**: Chrome 120
**OS**: Windows 11
**Screenshot**: [attach if relevant]
```

---

## 📈 Success Metrics

After testing, verify:
- [ ] 100% of test cases pass
- [ ] No console errors
- [ ] No network errors
- [ ] User experience is smooth
- [ ] Template downloads correctly
- [ ] LAP letters upload successfully
- [ ] Campaign creation works end-to-end

---

**Testing Status**: ⏳ Ready for Testing
**Estimated Testing Time**: 2-3 hours for complete suite
**Priority**: HIGH (New required feature)
