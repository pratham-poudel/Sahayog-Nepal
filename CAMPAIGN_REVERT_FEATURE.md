# Campaign Revert to Pending Feature

## 🎯 Overview

Added functionality to revert ACTIVE campaigns back to PENDING status for re-verification. This is a critical feature for handling special scenarios where a campaign that was previously approved needs to be reviewed again.

---

## ✅ Implementation Summary

### 1. **Backend API Endpoint** ✓

**New Route**: `POST /api/employee/campaigns/:campaignId/revert-to-pending`

**File**: `backend/routes/employeeRoutes.js`

**Authentication**: 
- Employee JWT token required
- Department: CAMPAIGN_VERIFIER only

**Request Body**:
```json
{
  "reason": "Fraudulent documents detected during routine audit",
  "verificationNotes": "Requires fresh verification of LAP letter"
}
```

**Validation**:
- ✅ `reason` is required and cannot be empty
- ✅ Campaign must exist
- ✅ Campaign status must be 'active' (cannot revert pending, rejected, or completed campaigns)

**Actions Performed**:
1. Changes campaign status from `active` → `pending`
2. Clears `featured` flag (set to false)
3. Clears all `tags` (empty array)
4. Preserves previous verification info for audit trail
5. Adds detailed entry to `statusHistory`:
   - Status: 'pending'
   - Changed by: Employee ID
   - Timestamp
   - Detailed reason including employee designation
6. Updates verification notes
7. Increments employee statistics (`totalCampaignsReverted`)
8. Logs reversion action to console

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Campaign reverted to pending status successfully",
  "campaign": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Help Fund Medical Treatment",
    "status": "pending",
    "previousVerification": {
      "employeeId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "employeeName": "John Doe",
      "employeeDesignation": "EMP001",
      "verifiedAt": "2025-10-05T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:
- 400: Reason not provided
- 400: Campaign status is not 'active'
- 404: Campaign not found
- 500: Server error

**Console Logs**:
```
[CAMPAIGN REVERTED] ID: 64f1a2b3c4d5e6f7g8h9i0j1 from ACTIVE to PENDING by Employee: EMP001
Reversion Reason: Fraudulent documents detected during routine audit
```

---

### 2. **Employee Model Enhancement** ✓

**File**: `backend/models/Employee.js`

**Added Statistic**:
```javascript
statistics: {
  // ... existing stats
  totalCampaignsReverted: { type: Number, default: 0 }
}
```

**Purpose**: Track how many campaigns each employee has reverted for performance monitoring and audit purposes.

---

### 3. **Frontend Modal UI** ✓

**File**: `client/src/components/employee/CampaignVerificationModal.jsx`

#### Added State:
```javascript
const [revertReason, setRevertReason] = useState('');
```

#### New Handler Function:
```javascript
const handleRevertToPending = async () => {
  // Validation
  // API call to revert endpoint
  // Success: refresh dashboard and close modal
  // Error: display error message
}
```

#### UI Components Added:

**Revert Section** (Only visible for ACTIVE campaigns):

Located below the "Mark as Completed" section with an orange theme to indicate caution.

**Features**:
1. **Warning Header**:
   - AlertTriangle icon
   - "Revert Campaign to Pending Status" title
   - Orange color scheme (bg-orange-50, border-orange-300)

2. **Information Text**:
   - Explains what reverting does
   - Warns about consequences (deactivation, removal of tags/featured status)

3. **Initial State** (action !== 'revert'):
   - Single "Revert to Pending" button
   - Orange styling with AlertTriangle icon

4. **Expanded State** (action === 'revert'):
   - **Reason Textarea** (Required):
     - Placeholder: "Explain why this campaign needs re-verification..."
     - 4 rows
     - Orange border styling
     - Examples provided in placeholder
   
   - **Additional Notes Textarea** (Optional):
     - Placeholder: "Add any additional internal notes..."
     - 2 rows
     - For internal documentation
   
   - **Action Buttons**:
     - "Confirm Reversion" (Orange) - Disabled if no reason provided
     - "Cancel" (Gray) - Resets form and closes expanded view

**Visual Design**:
- Orange color scheme (warning/caution theme)
- Distinct from blue (complete) and red (reject)
- AlertTriangle icon for visual warning
- Clear separation from other actions

---

## 🔄 Workflow

### When to Use Campaign Reversion:

**Common Scenarios**:
1. **Fraudulent Documents Detected**: LAP letter found to be fake after initial approval
2. **Policy Violation**: Campaign content updated to violate platform policies
3. **Audit Findings**: Routine audit reveals issues with verification
4. **User Report**: Multiple user reports indicate suspicious activity
5. **Legal Requirements**: New legal requirements necessitate re-verification
6. **Document Expiry**: Verification documents have expired
7. **Content Modification**: Creator significantly changed campaign details post-approval

### Step-by-Step Process:

```
1. EMPLOYEE identifies issue with ACTIVE campaign
   ↓
2. Opens Campaign Verification Modal
   ↓
3. Scrolls to "Revert to Pending" section (orange box)
   ↓
4. Clicks "Revert to Pending" button
   ↓
5. Form expands with:
   - Reason textarea (required)
   - Additional notes textarea (optional)
   ↓
6. Employee enters detailed reason:
   Example: "LAP letter verification failed during routine audit.
            Document appears to be forged. Requires fresh submission
            of legal authorization from local authority."
   ↓
7. (Optional) Adds internal notes for other verifiers
   ↓
8. Clicks "Confirm Reversion"
   ↓
9. Backend processes:
   - Status: active → pending
   - Featured: true → false
   - Tags: cleared
   - Status history: updated with detailed reason
   - Employee stats: totalCampaignsReverted++
   ↓
10. Campaign becomes PENDING again
    ↓
11. Creator can see campaign is back in pending (will need notification)
    ↓
12. Campaign must go through full verification process again
    ↓
13. New employee (or same) can review and approve/reject
```

---

## 🔒 Security & Audit Trail

### Audit Trail Components:

1. **Status History Entry**:
   ```javascript
   {
     status: 'pending',
     changedBy: ObjectId('employee_id'),
     changedAt: Date,
     reason: "Reverted to pending for re-verification by EMP001. 
              Reason: [employee provided reason]"
   }
   ```

2. **Previous Verification Preserved**:
   - Original verifier information stored
   - Verification timestamp maintained
   - Can track who initially approved before reversion

3. **Employee Statistics**:
   - Each reversion increments `totalCampaignsReverted`
   - Can monitor if employee reverts too frequently
   - Performance metric for management review

4. **Console Logging**:
   - Every reversion logged with campaign ID
   - Employee designation recorded
   - Full reason logged for system audit

### Access Control:
- ✅ Only CAMPAIGN_VERIFIER department employees
- ✅ Only works on ACTIVE campaigns
- ✅ Requires mandatory reason (cannot be empty)
- ✅ JWT authentication enforced

---

## 📊 Impact on Campaign

### What Happens When Campaign is Reverted:

**Immediate Effects**:
- ✅ Status: `active` → `pending`
- ✅ Featured flag: `true` → `false`
- ✅ Tags: All removed (empty array)
- ✅ Campaign removed from public listing
- ✅ Donations temporarily stopped (pending campaigns cannot receive donations)

**Preserved Data**:
- ✅ Previous verification info (for audit)
- ✅ All donations already made
- ✅ Campaign content (title, story, images, etc.)
- ✅ LAP letter and documents
- ✅ Financial data (amountRaised, donors, etc.)
- ✅ Complete status history

**What Does NOT Change**:
- Campaign creator
- Campaign financials
- Existing donations
- Campaign images/documents
- Campaign ID
- Creation date

---

## 🎨 UI/UX Design

### Color Coding:
- **Orange Theme**: Indicates caution/warning action
  - Distinct from green (approve), red (reject), blue (complete)
  - AlertTriangle icon reinforces warning
  - Clear visual separation from other actions

### User Flow:
1. **Collapsed State**: Single button, minimal space
2. **Expanded State**: Detailed form with clear labels
3. **Validation**: Button disabled until reason provided
4. **Feedback**: Loading state during processing
5. **Success**: Modal closes, dashboard refreshes automatically

### Accessibility:
- Clear labels for all form fields
- Required field indicators (*)
- Descriptive placeholder text
- Disabled state for invalid submissions
- Error messages displayed prominently

---

## 📝 Examples

### Example 1: Fraudulent Document Detection

**Scenario**: Employee discovers LAP letter is forged during routine audit.

**Reason Input**:
```
LAP letter verification failed during routine document audit. Cross-reference 
with local authority database shows no record of this authorization. Document 
appears to be forged. Campaign creator must submit authentic LAP letter from 
recognized local authority before re-approval can be considered.
```

**Additional Notes**:
```
Contacted local ward office - they confirmed no such letter was issued. 
Creator account flagged for review. Legal team notified.
```

**Result**: Campaign deactivated, creator must provide authentic documentation.

---

### Example 2: Policy Violation

**Scenario**: Campaign content updated post-approval to include prohibited content.

**Reason Input**:
```
Campaign creator modified campaign description after approval to include 
promotional content for commercial products, violating platform policy 
section 4.2. Original campaign was for educational support. Requires 
content revision and fresh verification.
```

**Additional Notes**:
```
Screenshots of original and modified content saved to audit folder. 
Creator contacted via email about policy violation.
```

**Result**: Campaign requires content correction and re-verification.

---

### Example 3: Document Expiry

**Scenario**: Verification documents are no longer valid.

**Reason Input**:
```
LAP letter has expired (valid for 6 months only, issued on March 10, 2025). 
Campaign requires updated authorization from local authority per platform 
policy. All other documents appear valid. Only LAP letter needs renewal.
```

**Additional Notes**:
```
Creator has been active in updating campaign. Likely will provide updated 
LAP letter promptly. Fast-track re-verification once document received.
```

**Result**: Campaign requires updated legal authorization.

---

## 🔍 Testing Checklist

### Backend Testing:
- [x] Endpoint accessible only to CAMPAIGN_VERIFIER employees
- [x] Revert requires reason (validation works)
- [x] Only ACTIVE campaigns can be reverted
- [x] Featured flag cleared on reversion
- [x] Tags cleared on reversion
- [x] Status history updated correctly
- [x] Employee statistics incremented
- [x] Previous verification info preserved
- [x] Error handling for invalid campaign ID
- [x] Error handling for wrong status

### Frontend Testing:
- [x] Revert section only shows for ACTIVE campaigns
- [x] "Revert to Pending" button displays correctly
- [x] Form expands on button click
- [x] Reason textarea is required
- [x] Additional notes textarea is optional
- [x] "Confirm Reversion" disabled without reason
- [x] Loading state displays during processing
- [x] Success closes modal and refreshes dashboard
- [x] Error messages display correctly
- [x] Cancel button resets form

### Integration Testing:
- [ ] Reverted campaign appears in pending list
- [ ] Statistics update in real-time
- [ ] Modal refresh shows new status
- [ ] Campaign no longer accepts donations
- [ ] Campaign removed from public explore page
- [ ] Re-verification workflow works after reversion

---

## 📈 Performance Considerations

### Database Impact:
- Single document update operation
- No cascade updates required
- Status history append (not replacement)
- Minimal performance overhead

### User Experience:
- Immediate feedback (loading state)
- Dashboard auto-refresh on success
- No page reload required
- Smooth modal transitions

---

## 🔮 Future Enhancements

### Potential Additions:
- [ ] Email notification to campaign creator when reverted
- [ ] Admin approval required for reversion (double-check)
- [ ] Reversion history analytics dashboard
- [ ] Bulk reversion for multiple campaigns
- [ ] Scheduled reversion (e.g., after document expiry date)
- [ ] Creator response system (allow creator to appeal reversion)
- [ ] Reversion reason categories (dropdown + custom text)

---

## 📞 Support & Documentation

### Common Questions:

**Q: Can a rejected campaign be reverted to pending?**
A: No, only ACTIVE campaigns can be reverted. Rejected campaigns remain rejected.

**Q: What happens to donations when campaign is reverted?**
A: All existing donations are preserved. However, the campaign cannot receive new donations while in pending status.

**Q: Can the same employee re-verify a campaign they reverted?**
A: Yes, the system allows this. However, it's best practice to have a different employee verify for objectivity.

**Q: Is there a limit to how many times a campaign can be reverted?**
A: No technical limit, but excessive reversions should be investigated by management.

**Q: What if featured status and tags need to be preserved?**
A: Current implementation clears them for safety. Future enhancement could add option to preserve.

---

## 🎉 Implementation Complete!

All features for Campaign Reversion have been successfully implemented:

✅ Backend API endpoint with full validation  
✅ Employee statistics tracking  
✅ Frontend UI with orange warning theme  
✅ Comprehensive audit trail  
✅ Status history preservation  
✅ Error handling and validation  
✅ Security and access control  
✅ Documentation and examples  

**Ready for production testing!** 🚀

---

*Campaign Revert Feature - Sahayog Nepal Platform*  
*Implementation Date: October 2025*  
*Version: 1.0.0*
