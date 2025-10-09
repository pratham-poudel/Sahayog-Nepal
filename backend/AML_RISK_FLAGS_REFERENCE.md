# AML Risk Flags Quick Reference
## Sahayog Nepal - Complete Flag Dictionary

**Version:** 2.0  
**Last Updated:** October 9, 2025

---

## 📋 All Risk Flags (20+ Indicators)

| # | Flag Name | Points | Category | Trigger Condition |
|---|-----------|--------|----------|-------------------|
| 1 | `high_amount_vs_user_avg` | 30 | User Behavior | Transaction > 10x user's historical average |
| 2 | `new_account_high_value` | 35 | Account Risk | Account age <24h + amount >NPR 5,000 |
| 3 | `structuring_many_small_txns` | 40 | Structuring | >5 transactions <NPR 500 in 1 hour (registered) |
| 4 | `guest_high_amount_vs_phone_avg` | 25 | Guest Behavior | Guest amount > 10x phone history average |
| 5 | `guest_excessive_donations_1h` | 45 | Guest Frequency | >15 donations in 1 hour from same phone |
| 6 | `guest_excessive_same_campaign_donations` | 50 | Campaign Abuse | >8 donations to same campaign in 1 hour (phone) |
| 7 | `guest_low_campaign_diversity` | 30 | Pattern Detection | >10 donations to <2 unique campaigns in 1h |
| 8 | `guest_high_velocity_donations` | 35 | Velocity | >3 donations within 5 minutes (phone) |
| 9 | `guest_structuring_small_amounts` | 40 | Structuring | >5 transactions <NPR 500 in 1 hour (guest) |
| 10 | `guest_high_amount_vs_email_avg` | 20 | Guest Behavior | Guest amount > 10x email history average |
| 11 | `guest_excessive_donations_email_1h` | 40 | Guest Frequency | >15 donations in 1 hour from same email |
| 12 | `self_donation_detected` | 70 | Fraud | Campaign creator = Donor (any method) |
| 13 | `shared_ip_network` | 40 | Network Risk | >3 distinct users from same IP in 24h |
| 14 | `unknown_payment_method` | 10 | Payment Risk | Payment method not Khalti/eSewa |
| 15 | `high_risk_country` | 40 | Geo Risk | Transaction from FATF high-risk country |
| 16 | `vpn_or_tor` | 30 | Network Risk | VPN/proxy detected |
| 17 | `refund_flag` | 20 | Chargeback | Previous refunded transaction |

---

## 🎯 Flag Categories

### 1. **USER BEHAVIOR** (Registered Users)

#### `high_amount_vs_user_avg` - 30 points
**Detection:**
```javascript
if (amount > 10 * userAverage) → FLAG
```

**Example:**
- User's average donation: NPR 500
- Current transaction: NPR 6,000
- Result: 6000 > (10 * 500) → **FLAGGED**

**Rationale:** Sudden large donations deviate from established behavior, potential compromised account or money laundering.

---

#### `new_account_high_value` - 35 points
**Detection:**
```javascript
if (accountAge < 24 hours AND amount > 5000) → FLAG
```

**Example:**
- Account created: 10 hours ago
- Transaction: NPR 7,000
- Result: **FLAGGED**

**Rationale:** New accounts making large donations lack transaction history, high risk for fraudulent accounts.

---

#### `structuring_many_small_txns` - 40 points
**Detection:**
```javascript
if (txnCountLast1Hour > 5 AND amount < 500) → FLAG
```

**Example:**
- User makes 6 donations of NPR 400 each in 1 hour
- Result: **FLAGGED** as structuring

**Rationale:** Smurfing technique to avoid reporting thresholds by splitting large amounts into small transactions.

---

### 2. **GUEST DONOR BEHAVIOR**

#### `guest_high_amount_vs_phone_avg` - 25 points
**Detection:**
```javascript
avgByPhone = average of all donations from this phone (where donorId = null)
if (amount > 10 * avgByPhone) → FLAG
```

**Example:**
- Phone 9841234567 history: NPR 200, NPR 300, NPR 250 (avg = 250)
- Current transaction: NPR 3,000
- Result: 3000 > (10 * 250) → **FLAGGED**

**Rationale:** Guest donor deviation from historical pattern indicates account takeover or fraudulent use.

---

#### `guest_excessive_donations_1h` - 45 points
**Detection:**
```javascript
Redis key: aml:guest:rapid:phone:{phone}
if (count > 15 in 1 hour) → FLAG
```

**Example:**
- Phone 9841234567 makes 16 donations between 10:00-11:00 AM
- Result: **FLAGGED** at donation #16

**Rationale:** Legitimate donors rarely make >15 donations in 1 hour. Indicates bot activity or fraud.

---

#### `guest_excessive_same_campaign_donations` - 50 points
**Detection:**
```javascript
Redis key: aml:guest:campaign:{phone}:{campaignId}
if (count > 8 to same campaign in 1 hour) → FLAG
```

**Example:**
- Phone 9841234567 donates 9 times to Campaign ABC in 1 hour
- Result: **FLAGGED** at donation #9

**Rationale:** Repeated donations to same campaign suggest circular money flow or artificial inflation of campaign metrics.

**Special Logic:** This is why >15 donations to **different** campaigns is less suspicious than >8 to the **same** campaign.

---

#### `guest_low_campaign_diversity` - 30 points
**Detection:**
```javascript
if (totalDonations > 10 in 1 hour) {
  uniqueCampaigns = count distinct campaignIds from this phone
  if (uniqueCampaigns < 2) → FLAG
}
```

**Example:**
- Phone 9841234567 makes 12 donations in 1 hour
- All 12 donations to Campaign ABC
- Result: **FLAGGED** (only 1 unique campaign)

**Rationale:** High-frequency donors typically support diverse causes. Concentration indicates coordinated manipulation.

---

#### `guest_high_velocity_donations` - 35 points
**Detection:**
```javascript
Redis key: aml:guest:velocity:phone:{phone} (TTL: 5 minutes)
if (count > 3 in 5 minutes) → FLAG
```

**Example:**
- 10:00:00 - Donation 1
- 10:01:30 - Donation 2
- 10:03:00 - Donation 3
- 10:04:30 - Donation 4
- Result: **FLAGGED** at donation #4 (4 donations in <5 minutes)

**Rationale:** Human donors need time to read campaign details, enter information. Rapid-fire donations indicate automation.

---

#### `guest_structuring_small_amounts` - 40 points
**Detection:**
```javascript
if (guestRapidCount > 5 AND amount < 500) → FLAG
```

**Example:**
- Guest makes 6 donations of NPR 350 each in 1 hour
- Result: **FLAGGED**

**Rationale:** Same as registered user structuring, but tracked by phone instead of userId.

---

#### `guest_high_amount_vs_email_avg` - 20 points
**Detection:**
```javascript
avgByEmail = average of donations from this email (donorId = null)
if (amount > 10 * avgByEmail) → FLAG
```

**Example:**
- Email donor@example.com history: NPR 300 average
- Current transaction: NPR 4,000
- Result: **FLAGGED**

**Rationale:** Cross-validation with email provides additional fraud detection layer.

---

#### `guest_excessive_donations_email_1h` - 40 points
**Detection:**
```javascript
Redis key: aml:guest:rapid:email:{email}
if (count > 15 in 1 hour) → FLAG
```

**Example:**
- Email donor@example.com makes 16 donations in 1 hour
- Result: **FLAGGED**

**Rationale:** Email-based tracking catches fraudsters who change phone numbers but reuse emails.

---

### 3. **FRAUD DETECTION**

#### `self_donation_detected` - 70 points ⚠️ HIGH RISK
**Detection (3 Layers):**

**Layer 1: User ID**
```javascript
if (campaign.creator === donation.userId) → FLAG
```

**Layer 2: Email**
```javascript
creatorEmail = User.findById(campaign.creator).email
if (creatorEmail === donation.donorEmail) → FLAG
```

**Layer 3: Phone**
```javascript
creatorPhone = User.findById(campaign.creator).phoneNumber
if (normalize(creatorPhone) === normalize(donation.donorPhone)) → FLAG
```

**Examples:**

**Scenario 1: Registered User Self-Donation**
- Campaign Creator: User ID `abc123`
- Donor: User ID `abc123`
- Result: **FLAGGED** (Layer 1 match)

**Scenario 2: Guest Email Match**
- Campaign Creator: `creator@example.com`
- Guest Donor Email: `creator@example.com`
- Result: **FLAGGED** (Layer 2 match)

**Scenario 3: Guest Phone Match**
- Campaign Creator Phone: `9841234567`
- Guest Donor Phone: `984-123-4567` (normalized to `9841234567`)
- Result: **FLAGGED** (Layer 3 match)

**Rationale:** Self-donations manipulate campaign metrics (fake social proof), can be used for circular money laundering, violate platform integrity.

---

### 4. **NETWORK RISK**

#### `shared_ip_network` - 40 points
**Detection:**
```javascript
Redis key: aml:ip:{ip} (Set data structure)
Members = unique userId or guest identifiers from this IP
if (members.size >= 3 in 24 hours) → FLAG
```

**Example:**
- IP 192.168.1.100:
  - User A donates at 10:00 AM
  - User B donates at 2:00 PM
  - User C donates at 6:00 PM
  - Result: **FLAGGED** at User C (3 distinct users)

**Rationale:** Multiple accounts from same IP indicates shared device (internet café, fraud ring) or botnet activity.

---

#### `vpn_or_tor` - 30 points
**Detection:**
```javascript
if (payment.isVPNDetected === true) → FLAG
```

**Example:**
- VPN detection service flags IP as NordVPN exit node
- Result: **FLAGGED**

**Rationale:** VPN/Tor usage hides true geographic location, common in money laundering and sanction evasion.

---

### 5. **GEOGRAPHIC RISK**

#### `high_risk_country` - 40 points
**Detection:**
```javascript
highRiskCountries = ['IR', 'KP', 'SY', 'CU', 'SD', 'AF', 'MM', 'ZW', 'IQ']
if (payment.countryCode in highRiskCountries) → FLAG
```

**Example:**
- Transaction from IP in Iran (IR)
- Result: **FLAGGED**

**Rationale:** FATF high-risk countries have inadequate AML controls, higher risk of illicit financial activity.

**Countries Flagged:**
- IR - Iran
- KP - North Korea
- SY - Syria
- CU - Cuba
- SD - Sudan
- AF - Afghanistan
- MM - Myanmar
- ZW - Zimbabwe
- IQ - Iraq

---

### 6. **PAYMENT RISK**

#### `unknown_payment_method` - 10 points
**Detection:**
```javascript
approvedMethods = ['khalti', 'esewa']
if (payment.paymentMethod NOT IN approvedMethods) → FLAG
```

**Example:**
- Payment method: `fonepay` or `card`
- Result: **FLAGGED**

**Rationale:** Local payment methods (Khalti, eSewa) have better KYC. International cards higher risk for fraud.

---

#### `refund_flag` - 20 points
**Detection:**
```javascript
if (payment.refunded === true OR payment.status === 'Refunded') → FLAG
```

**Example:**
- Payment has `refunded: true` in database
- Result: **FLAGGED**

**Rationale:** Refund history indicates disputes, chargebacks, or testing behavior typical of fraudsters.

---

## 🎯 Risk Score Calculation

### Example 1: Legitimate Guest Donor
```
Donation: NPR 1,000 to Campaign A
Phone: 9841234567 (first donation of the day)
Email: legit@example.com
Payment: Khalti
Country: Nepal

Flags Triggered: NONE
Risk Score: 0
Status: ✅ OK (Auto-approved)
```

---

### Example 2: High-Frequency Guest (Diverse Campaigns)
```
Donation #16 in 1 hour
Phone: 9841234567
Campaigns: A, B, C, D, E, F (6 unique campaigns)
Amount: NPR 500 each

Flags Triggered:
- guest_excessive_donations_1h (+45)

Risk Score: 45
Status: ✅ OK (Under 60 threshold)
```

---

### Example 3: Same Campaign Saturation
```
Donation #9 in 1 hour to Campaign A
Phone: 9841234567
Amount: NPR 500

Flags Triggered:
- guest_excessive_same_campaign_donations (+50)

Risk Score: 50
Status: ✅ OK (Just under 60 threshold)
```

---

### Example 4: Self-Donation Attempt
```
Campaign Creator: user@example.com, 9841111111
Guest Donation: user@example.com, 9849999999
Amount: NPR 2,000

Flags Triggered:
- self_donation_detected (+70)

Risk Score: 70
Status: ⚠️ PENDING_REVIEW (Alert created)
```

---

### Example 5: Guest Fraudster Profile
```
Donation #17 in 1 hour
Phone: 9841234567
Campaign: Only Campaign A (all 17 donations)
Amount: NPR 300 each
Same IP as 2 other users
From VPN

Flags Triggered:
- guest_excessive_donations_1h (+45)
- guest_excessive_same_campaign_donations (+50)
- guest_low_campaign_diversity (+30)
- guest_structuring_small_amounts (+40)
- shared_ip_network (+40)
- vpn_or_tor (+30)

Total Risk Score: Min(235, 100) = 100
Status: 🚫 BLOCKED (Alert created, transaction blocked)
```

---

### Example 6: New Account Large Donation
```
User Account: Created 5 hours ago
Donation: NPR 15,000
Payment: Card (not Khalti/eSewa)
Country: Nepal
IP: Shared with 2 other users

Flags Triggered:
- new_account_high_value (+35)
- unknown_payment_method (+10)
- shared_ip_network (+40)

Risk Score: 85
Status: 🚫 BLOCKED (Alert created)
```

---

## 🔍 Debugging Guide

### How to Check Which Flags Triggered

**In MongoDB:**
```javascript
db.payments.findOne(
  { _id: ObjectId("...") },
  { riskScore: 1, flags: 1, amlStatus: 1 }
)

// Example output:
{
  riskScore: 70,
  flags: ["self_donation_detected"],
  amlStatus: "pending_review"
}
```

**In Redis (Check Counters):**
```bash
# Guest phone rapid donations
GET aml:guest:rapid:phone:9841234567

# Same campaign count
GET aml:guest:campaign:9841234567:60f7c9b8e9a1234567890abc

# Velocity check
GET aml:guest:velocity:phone:9841234567

# Shared IP
SMEMBERS aml:ip:192.168.1.100
SCARD aml:ip:192.168.1.100
```

**In Logs:**
```
[AML] Updated payment 60f7... with riskScore: 70, status: pending_review
[AML] Alert created: 60f8... for payment 60f7... with score 70
[AML Worker] Result: Risk Score 70, Status: pending_review, 
             Flags: [self_donation_detected]
```

---

## 📊 Flag Frequency Analysis (Expected)

| Flag | Expected Frequency | Action Required |
|------|-------------------|-----------------|
| `guest_excessive_donations_1h` | Rare | Review for bots |
| `self_donation_detected` | Very Rare | Immediate review |
| `high_amount_vs_user_avg` | Occasional | Verify user intent |
| `new_account_high_value` | Rare | Enhanced verification |
| `shared_ip_network` | Common (cafés) | Context-based review |
| `vpn_or_tor` | Occasional | Investigate reason |
| `guest_low_campaign_diversity` | Very Rare | Flag for fraud |

---

## 🛠️ Threshold Tuning

If false positive rate is high, adjust in `CONFIG`:

```javascript
// In services/amlService.js

const CONFIG = {
  // Increase to reduce false positives
  GUEST_RAPID_DONATION_THRESHOLD: 20,  // Was 15
  
  // Decrease to catch more fraud
  GUEST_RAPID_SAME_CAMPAIGN_THRESHOLD: 5,  // Was 8
  
  // Adjust based on legitimate user behavior
  VELOCITY_THRESHOLD: 4,  // Was 3
};
```

**Recommendation:** Monitor for 1-2 weeks, then adjust based on data.

---

## 📈 Performance Impact

| Check Type | Performance Cost | Mitigation |
|------------|-----------------|------------|
| Redis counters | <1ms per operation | None needed |
| MongoDB aggregations | 10-50ms | Indexed fields |
| Self-donation check | 20-100ms | Cached user data |
| Campaign diversity | 50-150ms | Only for >10 donations |

**Total Average:** 2-5 seconds per transaction (acceptable for background processing)

---

## 🎓 Best Practices

### For Compliance Officers:

1. **Review self-donation flags immediately** - Highest priority
2. **Investigate score ≥80 within 24 hours** - Potential STR filing
3. **Monitor guest_excessive_same_campaign_donations** - Often real fraud
4. **Context matters for shared_ip_network** - Internet cafés legitimate
5. **VPN usage may be privacy, not fraud** - Investigate further

### For Developers:

1. **Never remove flags** - Add new ones, deprecate old ones
2. **Log everything** - Debugging production AML issues difficult
3. **Test threshold changes** - Small adjustments, big impact
4. **Monitor Redis memory** - Keys expire automatically but monitor usage
5. **Index database fields** - Performance critical for real-time analysis

---

## 📞 Support

For questions about specific flags:
- **Email:** dev@sahayognepal.com
- **Compliance:** compliance@sahayognepal.com

---

**End of Quick Reference Guide**

For full implementation details, see:
- `AML_COMPLIANCE_DOCUMENTATION.md` - Government submission
- `AML_IMPLEMENTATION_SUMMARY.md` - Technical overview
- `services/amlService.js` - Source code
