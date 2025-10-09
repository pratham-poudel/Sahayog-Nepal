# AML System Testing Guide
## Sahayog Nepal - Comprehensive Test Scenarios

**Version:** 2.0  
**Last Updated:** October 9, 2025  
**Purpose:** Manual and automated testing of AML risk detection

---

## 🎯 Test Objectives

1. ✅ Verify guest donor tracking works correctly
2. ✅ Validate self-donation detection across all methods
3. ✅ Confirm campaign diversity logic
4. ✅ Test threshold boundaries (15 donations, 8 same campaign)
5. ✅ Verify risk score calculation accuracy
6. ✅ Ensure alerts created properly for high-risk transactions

---

## 🧪 Test Environment Setup

### Prerequisites:
- ✅ MongoDB running with test database
- ✅ Redis running (for counters)
- ✅ AML Worker active and processing jobs
- ✅ Payment gateway in test/sandbox mode

### Test Data Requirements:
- 2+ test campaigns created by different users
- 1 test campaign with known creator (for self-donation tests)
- Multiple test phone numbers
- Test payment accounts (Khalti/eSewa sandbox)

---

## 📋 Test Scenarios

### **TEST SUITE 1: Guest Donor Tracking**

#### Test 1.1: First-Time Guest Donor (Baseline)
**Objective:** Verify clean transaction passes without flags

**Steps:**
1. Create donation as guest
2. Phone: `9841000001` (never used before)
3. Email: `test1@example.com`
4. Amount: NPR 1,000
5. Campaign: Any campaign
6. Payment Method: Khalti

**Expected Result:**
```
riskScore: 0
flags: []
amlStatus: 'ok'
Alert: None created
```

**Verify:**
```javascript
// Check Redis
GET aml:guest:rapid:phone:9841000001  // Should be 1
GET aml:guest:campaign:9841000001:{campaignId}  // Should be 1
```

---

#### Test 1.2: Guest Donor - 10 Donations (Diverse Campaigns)
**Objective:** Verify diverse donations stay under threshold

**Steps:**
1. Use same phone: `9841000002`
2. Make 10 donations within 1 hour
3. Each to **different** campaign
4. Amount: NPR 500 each
5. Payment: Khalti

**Expected Result:**
```
Transaction #1-10:
riskScore: 0
flags: []
amlStatus: 'ok'
```

**Verify:**
```javascript
GET aml:guest:rapid:phone:9841000002  // Should be 10
// Campaign diversity NOT triggered (10 donations to 10 campaigns)
```

---

#### Test 1.3: Guest Donor - 16 Donations (Trigger Excessive)
**Objective:** Trigger `guest_excessive_donations_1h` flag

**Steps:**
1. Phone: `9841000003`
2. Make 16 donations within 1 hour
3. Different campaigns OK
4. Amount: NPR 500 each

**Expected Result:**
```
Transactions #1-15: riskScore 0-40, status 'ok'
Transaction #16:
  riskScore: 45
  flags: ['guest_excessive_donations_1h']
  amlStatus: 'ok' (under 60 threshold)
  Alert: None (score < 60)
```

**Verify:**
```javascript
GET aml:guest:rapid:phone:9841000003  // Should be 16
```

---

#### Test 1.4: Guest Donor - 9 Donations to SAME Campaign
**Objective:** Trigger `guest_excessive_same_campaign_donations`

**Steps:**
1. Phone: `9841000004`
2. Select one campaign (e.g., Campaign A)
3. Make 9 donations to Campaign A within 1 hour
4. Amount: NPR 500 each

**Expected Result:**
```
Transactions #1-8: riskScore 0-30, status 'ok'
Transaction #9:
  riskScore: 50
  flags: ['guest_excessive_same_campaign_donations']
  amlStatus: 'ok' (just under 60)
  Alert: None
```

**Verify:**
```javascript
GET aml:guest:campaign:9841000004:{campaignId}  // Should be 9
```

---

#### Test 1.5: Guest Donor - Low Campaign Diversity
**Objective:** Trigger `guest_low_campaign_diversity` flag

**Steps:**
1. Phone: `9841000005`
2. Make 12 donations within 1 hour
3. All 12 to only 1 campaign
4. Amount: NPR 400 each

**Expected Result:**
```
Transaction #12:
  riskScore: 50 + 30 = 80 (same_campaign + low_diversity)
  flags: [
    'guest_excessive_same_campaign_donations',
    'guest_low_campaign_diversity'
  ]
  amlStatus: 'blocked' (score ≥ 80)
  Alert: CREATED ✅
```

**Verify:**
```javascript
// MongoDB
db.alerts.find({ 'metadata.donorPhone': '9841000005' })

// Should see alert with:
// - riskScore: 80
// - indicators: [...flags]
// - reviewed: false
```

---

#### Test 1.6: Guest Donor - High Velocity (5 minutes)
**Objective:** Trigger `guest_high_velocity_donations`

**Steps:**
1. Phone: `9841000006`
2. Make 4 donations within 5 minutes
3. Different campaigns
4. Amount: NPR 500 each

**Expected Result:**
```
Transaction #4:
  riskScore: 35
  flags: ['guest_high_velocity_donations']
  amlStatus: 'ok'
```

**Verify:**
```javascript
GET aml:guest:velocity:phone:9841000006  // Should be 4
// Wait 5 minutes
GET aml:guest:velocity:phone:9841000006  // Should be nil (expired)
```

---

#### Test 1.7: Guest Donor - Email Cross-Check
**Objective:** Verify email-based tracking works

**Steps:**
1. Email: `testsame@example.com`
2. Different phones: `9841000007`, `9841000008`, etc.
3. Make 16 donations total with same email
4. Within 1 hour

**Expected Result:**
```
Transaction #16 (regardless of phone):
  flags includes: 'guest_excessive_donations_email_1h'
  score += 40
```

---

### **TEST SUITE 2: Self-Donation Detection**

#### Test 2.1: Self-Donation - User ID Match (Registered User)
**Objective:** Detect self-donation via userId

**Prerequisites:**
- User account: `testuser@example.com`, userId: `USER_ABC_123`
- Campaign created by same user: Campaign ID `CAMP_XYZ_789`

**Steps:**
1. Login as `testuser@example.com`
2. Donate to own campaign `CAMP_XYZ_789`
3. Amount: NPR 2,000
4. Payment: Khalti

**Expected Result:**
```
riskScore: 70 (minimum, could be higher with other flags)
flags: ['self_donation_detected', ...]
amlStatus: 'pending_review' (70 ≥ 60)
Alert: CREATED ✅
metadata.isSelfDonation: true
```

**Verify:**
```javascript
// Check campaign creator
db.campaigns.findOne({ _id: ObjectId('CAMP_XYZ_789') })
// creator should match userId

// Check donation
db.donations.findOne({ _id: ObjectId('...') })
// donorId should match campaign.creator

// Check alert
db.alerts.findOne({ paymentId: ObjectId('...') })
// Should exist with self_donation_detected flag
```

---

#### Test 2.2: Self-Donation - Email Match (Guest Donor)
**Objective:** Detect self-donation via email matching

**Prerequisites:**
- Campaign created by user with email: `creator@example.com`

**Steps:**
1. Make guest donation (not logged in)
2. Donor email: `creator@example.com` (same as campaign creator)
3. Donor phone: Different from creator
4. Campaign: Creator's campaign
5. Amount: NPR 1,500

**Expected Result:**
```
riskScore: 70+
flags: ['self_donation_detected']
amlStatus: 'pending_review'
Alert: CREATED ✅
```

**Verify:**
```javascript
// Normalize emails (case-insensitive)
creatorEmail.toLowerCase() === donorEmail.toLowerCase()
// Should be true
```

---

#### Test 2.3: Self-Donation - Phone Match (Guest Donor)
**Objective:** Detect self-donation via phone matching

**Prerequisites:**
- Campaign creator phone: `9841234567`

**Steps:**
1. Guest donation
2. Donor phone: `984-123-4567` (formatted differently)
3. Donor email: Different from creator
4. Campaign: Creator's campaign
5. Amount: NPR 1,800

**Expected Result:**
```
riskScore: 70+
flags: ['self_donation_detected']
amlStatus: 'pending_review'
Alert: CREATED ✅
```

**Verify:**
```javascript
// Phone normalization
creatorPhone.replace(/\D/g, '') === '9841234567'
donorPhone.replace(/\D/g, '') === '9841234567'
// Should match
```

---

#### Test 2.4: Self-Donation - No Match (Legitimate)
**Objective:** Verify legitimate donations not flagged as self-donation

**Steps:**
1. User A creates campaign
2. User B donates to User A's campaign
3. Different emails, different phones, different userIds

**Expected Result:**
```
flags: NOT including 'self_donation_detected'
isSelfDonation: false
```

---

### **TEST SUITE 3: Registered User Checks**

#### Test 3.1: High Amount vs User Average
**Objective:** Trigger `high_amount_vs_user_avg`

**Prerequisites:**
- User with donation history: NPR 200, 300, 400 (avg = 300)

**Steps:**
1. Login as user
2. Donate NPR 4,000 (>10x avg)
3. Any campaign

**Expected Result:**
```
riskScore: 30+
flags: ['high_amount_vs_user_avg', ...]
```

---

#### Test 3.2: New Account High Value
**Objective:** Trigger `new_account_high_value`

**Steps:**
1. Create new user account
2. Within 1 hour, donate NPR 8,000
3. Any campaign

**Expected Result:**
```
riskScore: 35+
flags: ['new_account_high_value', ...]
```

---

#### Test 3.3: Structuring (Registered User)
**Objective:** Trigger `structuring_many_small_txns`

**Steps:**
1. Login as user
2. Make 6 donations within 1 hour
3. Each donation: NPR 400 (under NPR 500)
4. Different campaigns

**Expected Result:**
```
Transaction #6:
  flags: ['structuring_many_small_txns']
  score += 40
```

---

### **TEST SUITE 4: Network & Geo Risk**

#### Test 4.1: Shared IP Network
**Objective:** Trigger `shared_ip_network`

**Steps:**
1. User A donates from IP `192.168.1.100`
2. User B donates from IP `192.168.1.100` (within 24h)
3. User C donates from IP `192.168.1.100` (within 24h)
4. User D donates from IP `192.168.1.100` (within 24h)

**Expected Result:**
```
Transaction from User D:
  flags includes: 'shared_ip_network'
  score += 40
```

**Verify:**
```javascript
SMEMBERS aml:ip:192.168.1.100
// Should show 4 members
SCARD aml:ip:192.168.1.100
// Should return 4
```

---

#### Test 4.2: VPN Detection
**Objective:** Trigger `vpn_or_tor`

**Steps:**
1. Mock payment object with `isVPNDetected: true`
2. Submit donation

**Expected Result:**
```
flags includes: 'vpn_or_tor'
score += 30
```

---

#### Test 4.3: High-Risk Country
**Objective:** Trigger `high_risk_country`

**Steps:**
1. Mock payment with `countryCode: 'IR'` (Iran)
2. Submit donation

**Expected Result:**
```
flags includes: 'high_risk_country'
score += 40
```

---

### **TEST SUITE 5: Complex Scenarios**

#### Test 5.1: Guest Fraudster Profile
**Objective:** Trigger multiple flags, reach score ≥80 (BLOCKED)

**Steps:**
1. Phone: `9841999999`
2. Make 18 donations within 1 hour
3. All to same campaign
4. Amount: NPR 350 each (under 500)
5. Use VPN (mock `isVPNDetected: true`)
6. Share IP with 3 other users

**Expected Flags:**
- `guest_excessive_donations_1h` (+45)
- `guest_excessive_same_campaign_donations` (+50)
- `guest_low_campaign_diversity` (+30)
- `guest_structuring_small_amounts` (+40)
- `vpn_or_tor` (+30)
- `shared_ip_network` (+40)

**Expected Result:**
```
riskScore: 100 (capped at 100)
amlStatus: 'blocked'
Alert: CREATED ✅ with full metadata
```

**Verify:**
- Transaction should NOT complete
- Funds should NOT reach campaign
- Alert should have `reviewed: false`, `outcome: 'none'`
- Compliance dashboard shows high-priority alert

---

#### Test 5.2: Self-Donation + High Frequency
**Objective:** Multiple red flags including self-donation

**Steps:**
1. User donates to own campaign (self-donation)
2. Also make 16 total donations to various campaigns
3. Amount: NPR 600 each

**Expected Flags:**
- `self_donation_detected` (+70)
- `structuring_many_small_txns` or other frequency flags

**Expected Result:**
```
riskScore: ≥70
amlStatus: 'pending_review' or 'blocked'
Alert: CREATED ✅
```

---

### **TEST SUITE 6: Boundary Testing**

#### Test 6.1: Exactly 15 Donations (Boundary)
**Objective:** Verify threshold is >15, not ≥15

**Steps:**
- Phone: `9841777777`
- Make exactly 15 donations in 1 hour

**Expected Result:**
```
Transaction #15:
  flags: NOT including 'guest_excessive_donations_1h'
  (threshold is >15, so 15 is OK)
```

---

#### Test 6.2: Exactly 8 Same Campaign (Boundary)
**Objective:** Verify threshold is >8, not ≥8

**Steps:**
- Make exactly 8 donations to same campaign

**Expected Result:**
```
Transaction #8:
  flags: NOT including 'guest_excessive_same_campaign_donations'
  (threshold is >8, so 8 is OK)
```

---

#### Test 6.3: Risk Score = 60 (Boundary)
**Objective:** Verify alert created at score ≥60

**Steps:**
- Trigger flags totaling exactly 60 points
- Example: `guest_excessive_same_campaign_donations` (50) + `unknown_payment_method` (10)

**Expected Result:**
```
riskScore: 60
amlStatus: 'pending_review'
Alert: CREATED ✅ (score ≥ 60)
```

---

#### Test 6.4: Risk Score = 80 (Boundary)
**Objective:** Verify blocking at score ≥80

**Steps:**
- Trigger flags totaling exactly 80 points

**Expected Result:**
```
riskScore: 80
amlStatus: 'blocked'
Alert: CREATED ✅
Transaction: SHOULD NOT COMPLETE
```

---

## 🔍 Verification Checklist

For each test, verify:

### Database Checks:
- [ ] Payment document updated with `riskScore`, `flags`, `amlStatus`
- [ ] Alert document created if score ≥60
- [ ] Alert has correct `indicators`, `metadata`, `riskScore`
- [ ] Donation document not created if transaction blocked

### Redis Checks:
- [ ] Counters increment correctly
- [ ] TTL (expiration) set correctly
- [ ] Keys expire after TTL (verify with `TTL` command)
- [ ] Set data structures (IP sharing) work correctly

### Log Checks:
- [ ] `[AML Worker]` logs show job processing
- [ ] `[AML]` logs show risk score and flags
- [ ] Error logs empty (no exceptions)
- [ ] Alert creation logged if applicable

### Application Behavior:
- [ ] User receives appropriate feedback (if blocked)
- [ ] Campaign amounts NOT updated if blocked
- [ ] Refunds processed correctly if needed
- [ ] Compliance dashboard shows alert

---

## 🛠️ Testing Tools

### Manual Testing:
```bash
# Check Redis counters
redis-cli
> GET aml:guest:rapid:phone:9841234567
> TTL aml:guest:rapid:phone:9841234567
> SMEMBERS aml:ip:192.168.1.100
> SCARD aml:ip:192.168.1.100
```

### MongoDB Queries:
```javascript
// Find payments with high risk scores
db.payments.find({ riskScore: { $gte: 60 } })

// Find all alerts
db.alerts.find().sort({ createdAt: -1 })

// Find specific flags
db.payments.find({ flags: 'self_donation_detected' })

// Check campaign donations
db.donations.find({ 
  donorPhone: '9841234567', 
  createdAt: { $gte: new Date(Date.now() - 3600000) } 
})
```

### API Testing (Postman/cURL):
```bash
# Create donation (guest)
curl -X POST http://localhost:5000/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "60f7c9b8e9a...",
    "amount": 1000,
    "donorName": "Test User",
    "donorEmail": "test@example.com",
    "donorPhone": "9841234567",
    "paymentMethod": "khalti"
  }'
```

---

## 📊 Expected Test Results Summary

| Test | Expected Flags | Expected Score | Expected Status |
|------|---------------|----------------|-----------------|
| 1.1 First Guest | None | 0 | ok |
| 1.2 10 Diverse | None | 0 | ok |
| 1.3 16 Donations | excessive_donations_1h | 45 | ok |
| 1.4 9 Same Campaign | excessive_same_campaign | 50 | ok |
| 1.5 Low Diversity | 2 flags | 80 | blocked |
| 1.6 High Velocity | high_velocity | 35 | ok |
| 2.1 Self (userId) | self_donation | 70 | pending_review |
| 2.2 Self (email) | self_donation | 70 | pending_review |
| 2.3 Self (phone) | self_donation | 70 | pending_review |
| 5.1 Fraudster | 6+ flags | 100 | blocked |

---

## 🚨 Failure Scenarios to Test

### Test: Redis Connection Failure
**Simulate:** Stop Redis service

**Expected Behavior:**
- Service should fallback gracefully
- Transactions still processed (without counter checks)
- Error logged, but no crash

---

### Test: MongoDB Connection Failure
**Simulate:** Stop MongoDB

**Expected Behavior:**
- Worker fails job
- Job retried (up to 3 times)
- Error logged with stack trace

---

### Test: Campaign Not Found
**Simulate:** Invalid campaignId in donation

**Expected Behavior:**
- `checkSelfDonation()` returns false (no error)
- Transaction continues with other checks

---

### Test: Malformed Phone Number
**Simulate:** Phone: `invalid-phone`

**Expected Behavior:**
- Normalization handles gracefully
- Redis keys created (may not match exactly)
- No crash

---

## 📈 Performance Testing

### Load Test: 100 Concurrent Donations
**Objective:** Verify system handles high load

**Steps:**
1. Use load testing tool (Artillery, k6)
2. Create 100 simultaneous donation requests
3. Monitor:
   - Worker processing time
   - Redis latency
   - MongoDB query time
   - Alert creation rate

**Expected Results:**
- All transactions processed within 10 seconds
- No errors or timeouts
- Correct risk scores for all
- Redis counters accurate

---

## ✅ Acceptance Criteria

System is production-ready when:

- [x] All 20+ test scenarios pass
- [x] Boundary tests confirm correct threshold logic
- [x] Self-donation detected in all 3 methods
- [x] Guest donor tracking works without userId
- [x] Campaign diversity logic accurate
- [x] Alerts created correctly for score ≥60
- [x] Transactions blocked for score ≥80
- [x] No crashes or exceptions in logs
- [x] Redis keys expire correctly (verify after TTL)
- [x] Performance acceptable under load

---

## 📝 Test Report Template

After testing, document results:

```markdown
## AML System Test Report

**Test Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]

### Summary:
- Total Tests: 30+
- Passed: [X]
- Failed: [X]
- Skipped: [X]

### Failed Tests:
1. [Test Name]: [Reason for failure]
2. ...

### Performance:
- Average transaction processing: [X]ms
- Redis latency: [X]ms
- MongoDB query time: [X]ms

### Recommendations:
- [Any threshold adjustments needed]
- [Any bug fixes required]
- [Performance optimizations]

### Sign-off:
- [ ] All critical tests passed
- [ ] System ready for production
- [ ] Documentation updated
```

---

## 🔧 Troubleshooting

### Issue: Flags not triggering
**Solution:**
- Check Redis connection
- Verify counters incrementing: `GET aml:guest:rapid:phone:...`
- Check TTL hasn't expired
- Verify threshold values in `CONFIG`

### Issue: Alerts not created
**Solution:**
- Check score ≥60
- Verify Alert model in MongoDB
- Check for database write errors in logs
- Ensure worker completed successfully

### Issue: Self-donation not detected
**Solution:**
- Verify campaign creator data exists
- Check email/phone normalization
- Add debug logs in `checkSelfDonation()`
- Confirm campaign ID valid

---

**End of Testing Guide**

For support: dev@sahayognepal.com
