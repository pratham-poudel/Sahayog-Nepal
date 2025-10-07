# LAP Letter Feature - Developer Quick Reference

## 🚀 Quick Start

### What Changed?
- ✅ Added mandatory LAP (Local Authority Permission) Letter upload
- ✅ New Step 0: Requirements information page
- ✅ Campaign flow: 4 steps instead of 3
- ✅ LAP Letter template available for download

### Files Modified:
```
Backend (5 files):
- models/Campaign.js
- controllers/campaignController.js
- routes/uploadRoutes.js
- middlewares/uploadMiddleware.js
- app.js

Frontend (2 files):
- pages/StartCampaign.jsx
- services/uploadService.js

New Files (1):
- public/templates/LAP_Letter_Template.md
```

---

## 💻 Code Snippets

### Backend: Campaign Model
```javascript
lapLetter: {
  type: String,
  required: [true, 'Local Authority Permission (LAP) Letter is required'],
  description: 'Local Authority Permission Letter - Required document'
}
```

### Backend: Controller Validation
```javascript
// Validate LAP letter is uploaded
if (!lapLetterUrl && !lapLetter) {
  return res.status(400).json({
    success: false,
    message: 'Local Authority Permission (LAP) Letter is required'
  });
}
```

### Frontend: Upload LAP Letter
```javascript
import { uploadLapLetter } from '@/services/uploadService';

// In component
const [selectedLapLetter, setSelectedLapLetter] = useState(null);

// Handler
const handleLapLetterSelection = (file) => {
  setSelectedLapLetter(file);
  toast({
    title: "LAP Letter selected",
    description: "Local Authority Permission Letter has been selected successfully."
  });
};

// In upload flow
uploadedLapLetter = await uploadLapLetter(selectedLapLetter, (progress) => {
  // Update progress
});
```

### Frontend: FileSelector Component
```jsx
<FileSelector
  fileType="document-lap"
  accept="image/*,application/pdf"
  maxFiles={1}
  onFilesSelected={handleLapLetterSelection}
  selectedFiles={selectedLapLetter}
  className="w-full"
>
  <div className="text-sm font-medium">
    Click to select LAP Letter or drag and drop
  </div>
  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    Image or PDF file up to 15MB
  </div>
</FileSelector>
```

---

## 🔧 API Endpoints

### Generate Presigned URL for LAP Letter
```http
POST /api/uploads/presigned-url
Authorization: Bearer {token}
Content-Type: application/json

{
  "fileType": "document-lap",
  "contentType": "application/pdf",
  "originalName": "lap-letter.pdf"
}

Response:
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "key": "documents/lap-letters/...",
    "publicUrl": "https://...",
    "method": "PUT"
  }
}
```

### Create Campaign with LAP Letter
```http
POST /api/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Campaign Title",
  "category": "Healthcare",
  "targetAmount": 50000,
  "endDate": "2025-12-31",
  "shortDescription": "Short description",
  "story": "Full campaign story",
  "coverImageUrl": "https://...",
  "lapLetterUrl": "https://...",  // REQUIRED
  "additionalImageUrls": ["https://..."],
  "verificationDocumentUrls": ["https://..."],
  "turnstileToken": "..."
}
```

---

## 🎨 UI Components

### Step 0: Requirements Page Structure
```jsx
<div className="p-8 md:p-12">
  <h2>Campaign Requirements</h2>
  
  {/* Introduction */}
  <div className="bg-gradient...">Before You Start</div>
  
  {/* Required Documents */}
  <div>
    <h3>✓ Required Documents & Information</h3>
    
    {/* LAP Letter - Most Prominent */}
    <div className="border-2 border-[#8B2325]/30">
      <FileText /> LAP Letter [REQUIRED]
      <a href="/templates/LAP_Letter_Template.md" download>
        <Download /> Download Template
      </a>
    </div>
    
    {/* Other Required */}
    <div>Cover Image [REQUIRED]</div>
    <div>Basic Information [REQUIRED]</div>
  </div>
  
  {/* Optional Documents */}
  <div>
    <h3>ℹ️ Optional (But Recommended)</h3>
    <div>Medical Reports [OPTIONAL]</div>
    <div>Additional Images [OPTIONAL]</div>
  </div>
  
  {/* Important Notes */}
  <div className="bg-amber-50">⚠️ Important Notes</div>
  
  <button onClick={nextStep}>
    I Have Everything Ready →
  </button>
</div>
```

### LAP Letter Upload Section (Step 2)
```jsx
<div className="group">
  <label className="flex items-center">
    <span>Local Authority Permission (LAP) Letter*</span>
    <span className="badge-required">REQUIRED</span>
  </label>
  
  <div className="warning-box amber">
    <AlertCircle />
    <div>
      <h4>Official Document Required</h4>
      <p>Upload signed and stamped LAP Letter...</p>
      <a href="/templates/LAP_Letter_Template.md" download>
        <Download /> Download Template
      </a>
    </div>
  </div>
  
  <FileSelector
    fileType="document-lap"
    accept="image/*,application/pdf"
    maxFiles={1}
    onFilesSelected={handleLapLetterSelection}
    selectedFiles={selectedLapLetter}
  />
  
  <p className="note">Must have official seal/stamp</p>
</div>
```

---

## 🔍 Validation Rules

### File Validation:
- **Allowed Types**: JPG, JPEG, PNG, GIF, PDF
- **Max Size**: 15MB
- **Required**: Yes (cannot skip)
- **Count**: Exactly 1 file

### Campaign Validation:
- **Frontend**: Validates before Step 2 → 3 transition
- **Frontend**: Validates before submission
- **Backend**: Validates LAP letter URL presence
- **Backend**: Returns 400 if missing

---

## 📊 Database Schema

### Campaign Collection:
```javascript
{
  _id: ObjectId,
  title: String,
  category: String,
  // ... other fields ...
  coverImage: String,
  lapLetter: String,  // NEW & REQUIRED
  images: [String],
  verificationDocuments: [String],
  // ... other fields ...
}
```

### Migration for Existing Campaigns:
```javascript
// Option 1: Make optional for existing
db.campaigns.updateMany(
  { lapLetter: { $exists: false } },
  { $set: { lapLetter: 'legacy-campaign' } }
);

// Option 2: Mark legacy campaigns
db.campaigns.updateMany(
  { createdAt: { $lt: new Date('2025-01-07') } },
  { $set: { lapLetter: 'not-required-legacy' } }
);
```

---

## 🎯 Component State Management

### State Variables (StartCampaign.jsx):
```javascript
const [currentStep, setCurrentStep] = useState(0); // Changed from 1
const [selectedLapLetter, setSelectedLapLetter] = useState(null); // NEW
const [selectedCoverImage, setSelectedCoverImage] = useState(null);
const [selectedAdditionalImages, setSelectedAdditionalImages] = useState([]);
const [selectedVerificationDocs, setSelectedVerificationDocs] = useState([]);
```

### Step Validation:
```javascript
const handleNextStep = async () => {
  if (currentStep === 0) {
    // Step 0: Just proceed (info page)
    isStepValid = true;
  } else if (currentStep === 1) {
    // Validate basic info
    isStepValid = await trigger(['title', 'category', ...]);
  } else if (currentStep === 2) {
    // Validate campaign details + files
    isStepValid = await trigger(['shortDescription', 'story']);
    
    if (!selectedCoverImage) {
      // Show error
      return;
    }
    
    if (!selectedLapLetter) {  // NEW VALIDATION
      // Show error
      return;
    }
  }
  
  if (isStepValid) nextStep();
};
```

---

## 🚦 Upload Flow Stages

### New Upload Sequence:
```javascript
// Stage 1: Cover Image
uploadedCoverImage = await uploadCampaignCover(selectedCoverImage);

// Stage 2: LAP Letter (NEW)
uploadedLapLetter = await uploadLapLetter(selectedLapLetter);

// Stage 3: Additional Images (if any)
if (selectedAdditionalImages.length > 0) {
  uploadedAdditionalImages = await uploadCampaignImages(selectedAdditionalImages);
}

// Stage 4: Verification Docs (if any)
if (selectedVerificationDocs.length > 0) {
  uploadedVerificationDocs = await uploadCampaignVerification(selectedVerificationDocs);
}

// Stage 5: Submit Campaign
const campaignData = {
  // ... other fields ...
  coverImageUrl: uploadedCoverImage?.publicUrl,
  lapLetterUrl: uploadedLapLetter?.publicUrl,  // NEW
  // ... other fields ...
};
```

---

## 🎨 Styling References

### Color Scheme:
```css
/* Primary Red/Maroon */
--primary: #8B2325;
--primary-dark: #7a1f21;
--primary-light: #a02729;

/* Required Badge */
background: #8B2325;
color: white;

/* Warning Box (Amber) */
background: rgb(254 252 232); /* amber-50 */
border-left: 4px solid rgb(245 158 11); /* amber-500 */

/* Optional Badge (Blue) */
background: rgb(239 246 255); /* blue-50 */
color: rgb(29 78 216); /* blue-700 */
```

### Key Classes:
```
Group container: "group"
Required badge: "px-3 py-1 bg-[#8B2325] text-white text-xs font-semibold rounded-full"
Warning box: "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500"
Download button: "inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#8B2325] to-[#a02729]"
```

---

## 🐛 Common Issues & Solutions

### Issue: Template not downloading
```javascript
// Solution: Ensure static middleware is configured
app.use(express.static(path.join(__dirname, 'public')));
```

### Issue: LAP letter upload fails
```javascript
// Check: File type validation
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}
```

### Issue: Campaign creation fails silently
```javascript
// Check: Backend validation
if (!lapLetterUrl && !lapLetter) {
  return res.status(400).json({
    success: false,
    message: 'LAP Letter is required'
  });
}
```

### Issue: Step indicator shows wrong numbers
```javascript
// Solution: Use step + 1 for display
{[0, 1, 2, 3].map((step) => (
  <div>{step + 1}</div>  // Shows 1, 2, 3, 4
))}
```

---

## 📚 Import References

### Required Imports (StartCampaign.jsx):
```javascript
import { 
  Heart, TrendingUp, Users, 
  ChevronLeft, ChevronRight, Rocket,
  FileText, Download, CheckCircle2, AlertCircle  // NEW ICONS
} from 'lucide-react';

import uploadService, { 
  uploadCampaignCover, 
  uploadCampaignImages, 
  uploadCampaignVerification,
  uploadLapLetter  // NEW EXPORT (optional, can use uploadService.uploadFile)
} from '../services/uploadService';
```

---

## 🔗 Related Files

- **Backend Model**: `backend/models/Campaign.js`
- **Backend Controller**: `backend/controllers/campaignController.js`
- **Backend Routes**: `backend/routes/uploadRoutes.js`
- **Backend Middleware**: `backend/middlewares/uploadMiddleware.js`
- **Backend App**: `backend/app.js`
- **Frontend Component**: `client/src/pages/StartCampaign.jsx`
- **Frontend Service**: `client/src/services/uploadService.js`
- **Template**: `backend/public/templates/LAP_Letter_Template.md`

---

## ⚡ Quick Commands

### Start Backend:
```bash
cd backend
npm start
```

### Start Frontend:
```bash
cd client
npm run dev
```

### Test Template Access:
```bash
curl http://localhost:5000/templates/LAP_Letter_Template.md
```

### Check Campaign Model:
```bash
cd backend
node -e "const Campaign = require('./models/Campaign'); console.log(Campaign.schema.obj.lapLetter);"
```

---

## 📝 Git Commit Message
```
feat: Add mandatory LAP Letter upload for campaigns

- Added LAP Letter field to Campaign model (required)
- Created Step 0: Requirements information page
- Added LAP Letter upload in Step 2
- Provided downloadable LAP Letter template
- Updated campaign creation flow (4 steps)
- Added LAP Letter validation (frontend & backend)
- Integrated LAP Letter in upload progress tracking
- Professional design without emojis

BREAKING CHANGE: Campaign creation now requires LAP Letter
```

---

## 🎓 Developer Notes

1. **LAP Letter is MANDATORY** - Cannot create campaign without it
2. **Template Location** - Must be in `backend/public/templates/`
3. **Static Files** - Ensure `express.static` is configured
4. **Step Numbers** - Internal: 0-3, Display: 1-4
5. **File Types** - Accepts images (JPG, PNG, GIF) and PDF
6. **Max Size** - 15MB per file
7. **Storage** - Uses same system as other uploads (MinIO/R2)
8. **Validation** - Both frontend and backend validation
9. **Migration** - May need to update existing campaigns
10. **Testing** - Use the comprehensive testing checklist

---

**Version**: 1.0.0  
**Last Updated**: January 7, 2025  
**Status**: ✅ Complete
