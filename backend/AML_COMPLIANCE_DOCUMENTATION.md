# Anti-Money Laundering (AML) Compliance Documentation
## Sahayog Nepal - Crowdfunding Platform

**Document Version:** 2.0  
**Last Updated:** October 9, 2025  
**Prepared For:** Government of Nepal - Financial Intelligence Unit (FIU)  
**Platform:** Sahayog Nepal Crowdfunding Platform  

---

## Executive Summary

Sahayog Nepal implements a comprehensive, multi-layered Anti-Money Laundering (AML) and Counter-Financing of Terrorism (CFT) system that complies with Nepal Rastra Bank regulations and international FATF (Financial Action Task Force) standards. Our system employs real-time risk assessment, automated transaction monitoring, and robust identity verification measures to prevent, detect, and report suspicious activities.

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Real-Time Transaction Monitoring
- **Technology Stack:** Node.js, MongoDB, Redis, BullMQ
- **Processing Model:** Asynchronous queue-based analysis with distributed workers
- **Latency:** Average analysis completion within 2-5 seconds per transaction
- **Scalability:** Handles 5+ concurrent transaction analyses

### 1.2 Data Retention & Audit Trail
- **Transaction Records:** Retained for minimum 5 years (compliant with Nepal Rastra Bank requirements)
- **Alert Records:** Permanent retention with full audit trail
- **Log Management:** Comprehensive logging of all AML decisions and risk scores
- **Database:** MongoDB with indexed collections for rapid query and reporting

---

## 2. CUSTOMER DUE DILIGENCE (CDD)

### 2.1 Registered User Verification
All users creating campaigns must complete:
- ✅ **Email Verification:** Mandatory email OTP verification
- ✅ **Phone Number Verification:** Mandatory SMS OTP verification (Nepal mobile numbers)
- ✅ **Identity Documentation:** Government-issued ID verification for campaign creators
- ✅ **Bank Account Verification:** Bank account details verification for fund withdrawal
- ✅ **Local Authority Permission (LAP):** Required document for all campaigns
- ✅ **Address Verification:** Physical address collection and validation

### 2.2 Guest Donor Monitoring
Guest donors (non-registered) are tracked through:
- **Phone Number:** Primary identifier with validation
- **Email Address:** Secondary identifier for cross-verification
- **IP Address:** Geographic location and device fingerprinting
- **Transaction History:** Historical pattern analysis by phone/email
- **Behavioral Analysis:** Donation frequency, amount patterns, campaign diversity

### 2.3 Enhanced Due Diligence (EDD)
Applied automatically when:
- Transaction amount exceeds NPR 100,000
- User from high-risk country (as per FATF list)
- VPN/proxy detected
- Multiple red flags triggered
- Self-donation patterns detected

---

## 3. RISK SCORING METHODOLOGY

### 3.1 Risk Score Calculation (0-100 Points)

Our proprietary risk scoring algorithm evaluates 15+ risk factors:

#### **A. User Account Risk Factors**

| Factor | Risk Points | Trigger Condition |
|--------|-------------|-------------------|
| New Account High Value | 35 | Account < 24 hours old + Amount > NPR 5,000 |
| High Amount vs User Average | 30 | Transaction > 10x user's average donation |
| Account Age | 0-15 | Newer accounts receive higher scores |

#### **B. Guest Donor Risk Factors**

| Factor | Risk Points | Trigger Condition |
|--------|-------------|-------------------|
| Excessive Donations (1 hour) | 45 | >15 donations in 1 hour (same phone) |
| Same Campaign Saturation | 50 | >8 donations to same campaign in 1 hour |
| High Velocity Donations | 35 | >3 donations within 5 minutes |
| Guest Amount vs Phone Average | 25 | Amount > 10x phone history average |
| Guest Amount vs Email Average | 20 | Amount > 10x email history average |
| Low Campaign Diversity | 30 | >10 donations to <2 unique campaigns |
| Small Amount Structuring | 40 | >5 transactions under NPR 500 in 1 hour |

#### **C. Self-Donation Detection**

| Factor | Risk Points | Detection Method |
|--------|-------------|------------------|
| Self-Donation Detected | 70 | Campaign creator = Donor (by userId, email, or phone) |

**Detection Logic:**
1. Direct User ID match (Campaign.creator === Donation.userId)
2. Email address match (normalized, case-insensitive)
3. Phone number match (normalized, digits only)
4. Cross-reference with bank account holder names

#### **D. Network & Behavioral Risk**

| Factor | Risk Points | Trigger Condition |
|--------|-------------|-------------------|
| Shared IP Network | 40 | >3 unique users from same IP in 24 hours |
| Structuring Pattern | 40 | >5 small transactions (<NPR 500) in 1 hour |
| High-Risk Country | 40 | Transaction from FATF high-risk country |
| VPN/Tor Usage | 30 | VPN or proxy detected |
| Refund/Chargeback History | 20 | Previous refunded transactions |
| Unknown Payment Method | 10 | Payment method other than Khalti/eSewa |

### 3.2 Risk Categories

| Risk Score | Status | Action |
|------------|--------|--------|
| 0-59 | ✅ **OK** | Transaction approved automatically |
| 60-79 | ⚠️ **PENDING_REVIEW** | Alert created, manual review required |
| 80-100 | 🚫 **BLOCKED** | Transaction blocked, STR considered |

---

## 4. SUSPICIOUS ACTIVITY DETECTION

### 4.1 Automated Red Flags

Our system automatically flags the following patterns:

#### **Structuring (Smurfing)**
- Multiple transactions under reporting threshold
- >5 transactions of <NPR 500 within 1 hour
- Detection works for both registered users and guest donors

#### **Rapid Transaction Velocity**
- Guest donors: >15 donations in 1 hour
- Registered users: >5 donations in 1 hour
- Velocity check: >3 donations in 5 minutes

#### **Self-Dealing**
- Campaign creator donating to own campaign
- Detection via userId, email, and phone number matching
- Cross-verification with bank account information

#### **Campaign Targeting**
- >8 donations to same campaign in 1 hour (guest donor)
- Lack of campaign diversity (>10 donations to <2 campaigns)

#### **Geographic Anomalies**
- Transactions from FATF high-risk countries:
  - Iran (IR), North Korea (KP), Syria (SY), Cuba (CU)
  - Sudan (SD), Afghanistan (AF), Myanmar (MM), Zimbabwe (ZW), Iraq (IQ)
- VPN/Tor usage detection
- IP address sharing across multiple accounts

#### **New Account Exploitation**
- Accounts <24 hours old making large donations (>NPR 5,000)
- First-time large donations without transaction history

---

## 5. GUEST DONOR MONITORING SYSTEM

### 5.1 Comprehensive Tracking Without User Registration

**Challenge:** Guest donors don't have user accounts, requiring alternative tracking mechanisms.

**Solution:** Multi-identifier tracking system

#### **Primary Identifiers:**
1. **Phone Number** (mandatory)
   - Normalized format (digits only)
   - Cross-platform tracking key
   - Historical analysis by phone

2. **Email Address** (mandatory)
   - Normalized (lowercase, trimmed)
   - Secondary verification layer
   - Pattern detection across donations

3. **IP Address** (captured automatically)
   - Geographic location
   - Device fingerprinting
   - Network sharing detection

#### **Tracking Metrics:**
- ✅ Total donations in past 1 hour (by phone)
- ✅ Total donations in past 1 hour (by email)
- ✅ Donations to specific campaign (by phone + campaignId)
- ✅ Average donation amount (by phone/email)
- ✅ Campaign diversity score
- ✅ Transaction velocity (5-minute window)
- ✅ IP address sharing

### 5.2 Redis-Based Real-Time Counters

All guest donor metrics are stored in Redis with automatic expiration:

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `aml:guest:rapid:phone:{phone}` | 1 hour | Count donations per phone |
| `aml:guest:rapid:email:{email}` | 1 hour | Count donations per email |
| `aml:guest:campaign:{phone}:{campaignId}` | 1 hour | Count per campaign |
| `aml:guest:velocity:phone:{phone}` | 5 minutes | Rapid succession detection |
| `aml:ip:{ip}` | 24 hours | Shared IP network detection |

### 5.3 Guest Donor Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Donations per hour (phone) | 15 | Flag + 45 points |
| Same campaign per hour | 8 | Flag + 50 points |
| Velocity (5 min) | 3 | Flag + 35 points |
| Campaign diversity | <2 campaigns in >10 donations | Flag + 30 points |
| Small structuring | >5 txns < NPR 500 | Flag + 40 points |

---

## 6. SELF-DONATION PREVENTION

### 6.1 Detection Methodology

**Three-Layer Matching System:**

#### **Layer 1: User ID Matching**
```
IF Campaign.creator === Donation.userId
THEN Flag as self-donation
```

#### **Layer 2: Email Matching**
```
IF CampaignCreator.email === Donor.email (case-insensitive)
THEN Flag as self-donation
```

#### **Layer 3: Phone Number Matching**
```
IF CampaignCreator.phone === Donor.phone (normalized)
THEN Flag as self-donation
```

### 6.2 Self-Donation Risk Score
- **Automatic Risk Score:** 70 points (High Risk)
- **Status:** Typically triggers "pending_review" or "blocked"
- **Alert Generation:** Automatic alert created for compliance review
- **Metadata Captured:** Campaign details, creator info, donation details

### 6.3 Rationale
Self-donation manipulation can be used to:
- Inflate campaign popularity artificially
- Trigger platform algorithms for featured placement
- Create false social proof
- Launder funds in circular patterns

**Our Prevention:** Automatic detection with high penalty ensures platform integrity.

---

## 7. CAMPAIGN DIVERSITY MONITORING

### 7.1 Purpose
Detect donors who repeatedly donate to the same campaign(s), indicating potential:
- Circular money flow
- Coordinated manipulation
- Money laundering through repeated small transactions

### 7.2 Implementation
When a guest donor makes >10 donations in 1 hour:
1. System queries all recent donations by phone
2. Calculates unique campaign count
3. If unique campaigns < 2, flags "low campaign diversity"
4. Adds 30 risk points

### 7.3 Threshold Logic
```
IF (donations_last_hour > 10) AND (unique_campaigns < 2)
THEN Flag: guest_low_campaign_diversity
SCORE: +30 points
```

**Rationale:** Legitimate donors typically support diverse causes. Concentration on 1-2 campaigns with high frequency suggests manipulation.

---

## 8. TRANSACTION APPROVAL WORKFLOW

### 8.1 Real-Time Analysis Pipeline

```
[Payment Initiated]
       ↓
[Queue: AML Analysis Job]
       ↓
[Worker: Fetch Payment + User Data]
       ↓
[Execute Risk Assessment]
       ↓
[Calculate Risk Score 0-100]
       ↓
    ┌─────┴─────┐
    ↓           ↓
[Score < 60] [Score ≥ 60]
    ↓           ↓
[Approve]   [Create Alert]
    ↓           ↓
[Complete]  [Manual Review]
```

### 8.2 Manual Review Process (Score ≥ 60)
1. **Alert Creation:** System creates Alert document in database
2. **Notification:** Compliance team notified (email/dashboard)
3. **Review:** Manual assessment by compliance officer
4. **Decision:** Approve, Block, or Report to FIU
5. **Documentation:** Decision logged with rationale
6. **Outcome Update:** Alert.outcome set to 'reported', 'dismissed', or 'under_review'

### 8.3 Blocked Transaction Handling (Score ≥ 80)
- Transaction automatically blocked
- Funds held in escrow (not released to campaign)
- User/donor notified of review requirement
- Enhanced Due Diligence (EDD) initiated
- Potential STR (Suspicious Transaction Report) filing

---

## 9. REPORTING MECHANISMS

### 9.1 Suspicious Transaction Report (STR)
**Trigger Conditions:**
- Risk score ≥ 80
- Self-donation detected
- Structuring pattern confirmed
- High-risk country + large amount
- Multiple red flags on single transaction

**STR Filing Process:**
1. Alert with score ≥ 80 created
2. Compliance officer reviews alert
3. If suspicious, Alert.reportType set to 'STR'
4. Report generated with full transaction details
5. Filed with Financial Intelligence Unit (FIU) Nepal within 3 business days
6. Follow-up documentation maintained for 5 years

### 9.2 Threshold Transaction Report (TTR)
**Automatic Reporting for:**
- Single transaction ≥ NPR 1,000,000
- Cumulative transactions ≥ NPR 1,000,000 per user per month

**TTR Process:**
1. System tracks cumulative monthly amounts
2. When threshold exceeded, automatic flag
3. TTR generated with user details
4. Filed with FIU Nepal within regulatory timeframe

### 9.3 Alert Dashboard
Internal compliance dashboard displays:
- All pending alerts (real-time)
- Risk score distribution
- Flag frequency analysis
- Review status tracking
- STR/TTR filing history

---

## 10. DATA SECURITY & PRIVACY

### 10.1 Data Encryption
- **In Transit:** TLS 1.3 encryption for all API communications
- **At Rest:** MongoDB encryption at rest enabled
- **Sensitive Fields:** PII (Personal Identifiable Information) encrypted

### 10.2 Access Controls
- **Role-Based Access Control (RBAC):** Compliance officers only access to AML alerts
- **Audit Logging:** All alert reviews logged with user ID and timestamp
- **Multi-Factor Authentication (MFA):** Required for compliance dashboard access

### 10.3 Privacy Compliance
- GDPR-compliant data handling (for international donors)
- Nepal Data Privacy regulations adherence
- User consent obtained for data processing
- Right to explanation for automated decisions (AML flags)

---

## 11. PAYMENT GATEWAY INTEGRATION

### 11.1 Supported Payment Methods
- **Khalti:** Nepal's leading digital wallet (Primary)
- **eSewa:** Digital payment platform (Primary)
- **Fonepay:** QR-based payment system
- **Card Payments:** International card support

### 11.2 Gateway-Level Security
- PCI DSS compliance through payment partners
- Tokenization of payment credentials
- 3D Secure authentication for cards
- Real-time fraud detection by payment gateways

### 11.3 Transaction Verification
- Payment confirmation from gateway before marking complete
- Webhook verification for payment status
- Duplicate transaction prevention
- Refund tracking and flagging

---

## 12. REGULATORY COMPLIANCE

### 12.1 Nepal Rastra Bank (NRB) Compliance
✅ **Asset (Money) Laundering Prevention Act, 2008 (2064)**  
✅ **Asset (Money) Laundering Prevention Rules, 2010 (2066)**  
✅ **Prevention of Financing of Terrorism Act**  
✅ **NRB Directives on Payment Systems**  
✅ **Digital Payment Service Provider Guidelines**  

### 12.2 International Standards
✅ **FATF 40 Recommendations:** Risk-based approach implemented  
✅ **Know Your Customer (KYC):** Comprehensive identity verification  
✅ **Customer Due Diligence (CDD):** Ongoing monitoring and risk assessment  
✅ **Record Keeping:** 5+ year retention policy  
✅ **STR/TTR Reporting:** Automated detection and timely filing  

### 12.3 Platform-Specific Compliance
- **Crowdfunding Regulations:** Adhering to Nepal's crowdfunding framework
- **Charity/NGO Regulations:** Compliance with Social Welfare Council guidelines
- **Tax Compliance:** TDS deduction and reporting for campaign creators

---

## 13. TECHNICAL IMPLEMENTATION DETAILS

### 13.1 AML Service Architecture

**File:** `backend/services/amlService.js`

**Key Functions:**
- `analyzeTransaction(txnObj, userObj)` - Main risk assessment function
- `getUserAvgDonation(userId)` - Calculate user average for baseline
- `getGuestAvgDonationByPhone(phone)` - Guest donor baseline by phone
- `getGuestAvgDonationByEmail(email)` - Guest donor baseline by email
- `checkSelfDonation(txnObj, userObj)` - Self-donation detection
- `isHighRiskCountry(countryCode)` - FATF high-risk country check
- `isVPN(ipOrPayment)` - VPN/proxy detection

### 13.2 Queue-Based Processing

**Queue:** `backend/queues/amlqueue.js`
- **Technology:** BullMQ with Redis
- **Queue Name:** `aml-analysis`
- **Job Options:**
  - Max Attempts: 3
  - Backoff: Exponential (60s delay)
  - Retention: 1000 completed, 1000 failed

**Worker:** `backend/workers/amlWorker.js`
- **Concurrency:** 5 parallel jobs
- **Processing:** Fetches payment + user, calls `analyzeTransaction()`
- **Logging:** Comprehensive job status logging
- **Error Handling:** Failed jobs logged with full context

### 13.3 Database Schema

**Payment Model:** Enhanced with AML fields
```javascript
{
  riskScore: Number (0-100),
  flags: [String],
  amlStatus: Enum ['ok', 'pending_review', 'blocked'],
  ip: String,
  country: String,
  countryCode: String,
  isVPNDetected: Boolean,
  vpnProvider: String
}
```

**Alert Model:** Compliance tracking
```javascript
{
  userId: ObjectId,
  paymentId: ObjectId,
  donationId: ObjectId,
  riskScore: Number,
  indicators: [String],
  reviewed: Boolean,
  outcome: Enum ['reported', 'dismissed', 'under_review', 'none'],
  reportType: Enum ['STR', 'TTR', 'none'],
  metadata: Object
}
```

### 13.4 Redis Key Patterns

| Pattern | Purpose | TTL |
|---------|---------|-----|
| `aml:txncount:uid:{userId}` | Registered user txn count | 1 hour |
| `aml:guest:rapid:phone:{phone}` | Guest phone donation count | 1 hour |
| `aml:guest:rapid:email:{email}` | Guest email donation count | 1 hour |
| `aml:guest:campaign:{phone}:{campaignId}` | Per-campaign donation count | 1 hour |
| `aml:guest:velocity:phone:{phone}` | 5-minute velocity check | 5 minutes |
| `aml:ip:{ip}` | Shared IP user set | 24 hours |

---

## 14. OPERATIONAL PROCEDURES

### 14.1 Daily Monitoring
- **Alert Review:** Compliance officer reviews all pending alerts daily
- **Dashboard Check:** Monitor risk score trends and flag frequencies
- **System Health:** Verify AML worker and queue operational status

### 14.2 Weekly Reporting
- Generate internal report:
  - Total transactions analyzed
  - Risk score distribution
  - Alerts created and resolved
  - STR/TTR filed
  - Top risk indicators

### 14.3 Monthly Audit
- Review AML system effectiveness
- Update risk thresholds if needed
- Training for compliance team
- System performance optimization

### 14.4 Incident Response
In case of critical AML breach:
1. **Immediate Action:** Block related accounts/transactions
2. **Investigation:** Deep dive into transaction history
3. **Reporting:** File STR with FIU within 24 hours if required
4. **Documentation:** Full incident report for internal records
5. **Prevention:** Update detection rules to prevent recurrence

---

## 15. TRAINING & AWARENESS

### 15.1 Compliance Team Training
- AML/CFT regulations (Nepal & international)
- Risk assessment methodology
- Alert investigation techniques
- STR/TTR filing procedures
- System operation and troubleshooting

### 15.2 User Awareness
- Terms of Service include AML policies
- Prohibition of money laundering clearly stated
- Consequences of suspicious activity outlined
- User education on legitimate platform use

---

## 16. CONTINUOUS IMPROVEMENT

### 16.1 Machine Learning Enhancement (Planned)
- Train ML models on historical transaction data
- Improve risk score accuracy with supervised learning
- Reduce false positives through pattern recognition
- Adapt to evolving money laundering techniques

### 16.2 Regular Updates
- Monitor FATF high-risk country updates (quarterly)
- Adjust thresholds based on transaction patterns
- Incorporate regulatory changes from Nepal Rastra Bank
- Technology stack updates for security and performance

### 16.3 Third-Party Integrations (Planned)
- Enhanced VPN/proxy detection services
- Global sanctions list checking (OFAC, UN, EU)
- Credit bureau integration for identity verification
- Real-time fraud intelligence feeds

---

## 17. CONTACT & ESCALATION

### 17.1 AML Compliance Officer
**Name:** [To be assigned]  
**Email:** compliance@sahayognepal.com  
**Phone:** [To be assigned]  
**Availability:** Monday-Friday, 9 AM - 5 PM NPT  

### 17.2 Regulatory Reporting
**Financial Intelligence Unit (FIU) Nepal**  
**Address:** Nepal Rastra Bank, Central Office, Baluwatar, Kathmandu  
**Website:** https://www.nrb.org.np  

### 17.3 Emergency Contacts
- **Law Enforcement:** Nepal Police, Economic Crime Investigation Department
- **Legal Counsel:** [Law firm details]
- **Technical Support:** dev@sahayognepal.com

---

## 18. APPENDICES

### Appendix A: Risk Flag Reference
Complete list of all 20+ risk flags with descriptions, scoring, and detection logic.

### Appendix B: Sample Alert Report
Template for internal alert documentation and STR filing.

### Appendix C: System Architecture Diagrams
Visual representation of AML processing pipeline and data flow.

### Appendix D: Compliance Checklist
Pre-launch and ongoing operational compliance verification checklist.

### Appendix E: Regulatory References
Links to Nepal Rastra Bank circulars, FATF guidelines, and relevant legislation.

---

## 19. DOCUMENT APPROVAL

**Prepared By:**  
Technical Team, Sahayog Nepal  
Date: October 9, 2025  

**Reviewed By:**  
AML Compliance Officer  
Date: [To be assigned]  

**Approved By:**  
Chief Executive Officer, Sahayog Nepal  
Date: [To be assigned]  

---

## 20. DOCUMENT REVISION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | [Initial Date] | Initial AML framework documentation | Technical Team |
| 2.0 | October 9, 2025 | Enhanced guest donor monitoring, self-donation detection, campaign diversity checks | Technical Team |

---

**END OF DOCUMENT**

---

## CERTIFICATION

This document certifies that Sahayog Nepal crowdfunding platform implements a comprehensive, automated, and continuously monitored Anti-Money Laundering (AML) and Counter-Financing of Terrorism (CFT) system in full compliance with:

1. Nepal Rastra Bank regulations
2. Financial Action Task Force (FATF) recommendations
3. International best practices for payment service providers
4. Nepal's Asset (Money) Laundering Prevention Act and Rules

The system is designed to detect, prevent, and report suspicious financial activities while maintaining user privacy and operational efficiency.

**Platform:** Sahayog Nepal  
**Domain:** [sahayognepal.com]  
**Submission Date:** October 9, 2025  

---

For questions or clarifications regarding this document, please contact:  
**Email:** compliance@sahayognepal.com  
**Phone:** [To be assigned]
