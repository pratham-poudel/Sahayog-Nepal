# Policy Documents Update Summary

## Overview of Changes

### Organizational Structure Change
**Previous**: Platform operated as private label by Dallytech Pvt Ltd  
**New**: Platform is part of NGO "Sahayog Nepal" with technology partner Dallytech Pvt Ltd

### Key Policy Addition
**1-Year Withdrawal Deadline**: If campaign creators do not withdraw funds within 1 year of campaign expiration, funds will be transferred to:
1. Another needy campaign (prioritized)
2. Main NGO fund "DHUKUTI" (if no suitable campaign found)

## Documents to Update

### 1. Terms of Use (TermsOfUse.jsx)

#### Sections Requiring Updates:

**Section 1: About SahayogNepal**
- Change organizational description from "platform operated by Dallytech Pvt Ltd" to "NGO platform"
- Add: "Sahayog Nepal is a registered Non-Governmental Organization (NGO) dedicated to facilitating crowdfunding for social causes in Nepal. The technology infrastructure and platform are provided by our technology partner, Dallytech Pvt Ltd."
- Note about absence of government crowdfunding regulations

**Section 4: Campaigner Obligations**
- **CRITICAL ADDITION** - 1-Year Withdrawal Policy:
  ```
  Campaign Fund Withdrawal Deadline:
  
  Campaigners must withdraw raised funds within ONE (1) YEAR from the campaign end date. 
  
  If funds are not withdrawn within this period:
  • Funds will be automatically transferred to another verified needy campaign on the platform
  • If no suitable campaign is identified, funds will be transferred to Sahayog Nepal's main relief fund "DHUKUTI"
  • Campaigners will receive email notifications at 9 months, 11 months, and final notice before transfer
  • This policy ensures funds reach beneficiaries promptly and are not left unused
  • No refunds will be made to donors after the 1-year period expires
  
  Reason for Policy: As Nepal does not yet have specific government regulations for crowdfunding platforms, this policy ensures donated funds are utilized for their intended charitable purpose within a reasonable timeframe.
  ```

**Section 5: Donor Responsibilities**
- Add information about the 1-year fund transfer policy
- Clarify that donations are final and may be reallocated per the 1-year policy

**Section 6: Payment and Financial Transactions**
- Update to reflect NGO status and mention DHUKUTI fund

**Section 12: Compliance with Nepali Laws**
- Add note: "As crowdfunding regulations are still emerging in Nepal, Sahayog Nepal operates as an NGO under the Social Welfare Act and relevant charitable organization regulations."

**Section 16: Contact Information**
- Update to:
  ```
  Sahayog Nepal (NGO)
  Technology Partner: Dallytech Pvt Ltd
  Main Fund: DHUKUTI
  Address: [Address]
  ```

### 2. Privacy Policy (PrivacyPolicy.jsx)

#### Updates Needed:

**Introduction Section**
- Update organizational description
- Add: "Sahayog Nepal is a registered NGO working to facilitate crowdfunding in Nepal. Our technology platform is developed and maintained by Dallytech Pvt Ltd."

**Section 3: Sharing of Personal Information**
- Add clause about fund reallocation notifications
- Mention DHUKUTI fund administration

**Section 6: Review and Management of Information**
- Update data retention policy to include 1-year campaign fund monitoring period
- Add: "We retain campaign and donation data for at least 1 year after campaign end date to facilitate the fund withdrawal and reallocation process."

**Section 12: Grievance Officer**
- Update organizational structure:
  ```
  Organization: Sahayog Nepal (NGO)
  Technology Partner: Dallytech Pvt Ltd
  ```

### 3. Cookie Policy (CookiePolicy.jsx)

#### Updates Needed:

**Introduction**
- Update organizational description to reflect NGO status

**Section "Contact Us"**
- Update to:
  ```
  Sahayog Nepal (NGO)
  Technology Partner: Dallytech Pvt Ltd
  ```

## New Content Sections to Add

### For Terms of Use - New Section 4.5: Fund Reallocation Process

```
4.5 Fund Reallocation Process

Timeline and Notifications:
• At 9 months after campaign end: First reminder email sent to campaigner
• At 11 months after campaign end: Urgent notice email sent
• At 11 months and 3 weeks: Final notice with 1-week deadline
• At 1 year: Funds become eligible for reallocation

Reallocation Priority:
1. Active campaigns in the same category (e.g., medical funds to medical campaigns)
2. Active campaigns with similar beneficiary demographics
3. Urgent campaigns requiring immediate support
4. DHUKUTI main fund for general charitable purposes

Transparency:
• All fund reallocations are documented and published on the platform
• Donors may view where their contributions were ultimately utilized
• Original campaign creators are notified of the final destination of funds

DHUKUTI Fund:
• DHUKUTI is Sahayog Nepal's main charitable fund
• Used for emergency relief, disaster response, and supporting campaigns that fall short of targets
• Administered by Sahayog Nepal's board of directors
• Regular public reports published quarterly

No Retroactive Claims:
• Once funds are reallocated, campaigners cannot claim them back
• This policy is final and binding from the moment a campaign is created
```

## Implementation Notes

### Legal Considerations
1. Ensure all terms mention this is due to absence of specific crowdfunding regulations in Nepal
2. Clear disclosure that by creating a campaign, users agree to this 1-year policy
3. Mention alignment with NGO charitable purposes

### Technical Requirements
1. Automated email system for notifications at 9, 11, and 11.75 months
2. Dashboard warnings for campaigners approaching deadline
3. Admin panel for tracking campaigns near 1-year mark
4. DHUKUTI fund tracking system

### Communication Strategy
1. Prominent display of 1-year policy during campaign creation
2. Checkbox confirmation that campaigner understands the policy
3. Regular platform-wide reminders about withdrawal deadlines
4. Success stories of reallocated funds helping other beneficiaries

## Regulatory Justification

### Why This Policy Exists
```
Regulatory Landscape in Nepal:

Nepal currently does not have specific legislation governing crowdfunding platforms. 
In the absence of government-mandated regulations:

1. Sahayog Nepal operates as a registered NGO under:
   - Social Welfare Act, 2049 (1992)
   - Association Registration Act, 2034 (1977)
   - Income Tax Act provisions for charitable organizations

2. The 1-year fund transfer policy ensures:
   - Charitable donations reach beneficiaries promptly
   - Unused funds continue serving social causes
   - Transparency and accountability in fund management
   - Alignment with NGO's charitable mission

3. This policy protects:
   - Donors: Ensuring their contributions make impact
   - Beneficiaries: Timely access to needed support
   - Platform integrity: Preventing fund accumulation without purpose

4. International Best Practices:
   - Similar policies exist in established crowdfunding markets
   - Typical fund claim periods range from 6 months to 2 years
   - Our 1-year period balances flexibility with accountability
```

## Language Updates

### English Terms
- "Platform operated by Dallytech Pvt Ltd" → "NGO platform with technology by Dallytech Pvt Ltd"
- Add "DHUKUTI" as main charitable fund name
- Emphasize NGO mission and charitable purpose
- Mention regulatory gap and self-governance

### Nepali Translation Updates
- सहयोग नेपाल - NGO को रूपमा
- धुकुटी - मुख्य परोपकारी कोष
- Add appropriate Nepali translations for all new policy sections

## Timeline for Implementation

1. **Immediate**: Update policy documents
2. **Within 1 week**: Add notification system for existing campaigns
3. **Within 2 weeks**: Update campaign creation flow with policy acceptance
4. **Ongoing**: Monitor campaigns approaching 1-year mark

## User Communication Plan

### For Campaign Creators
- Email campaign explaining new structure and policy
- FAQ section addressing common concerns
- Video explainer in Nepali and English

### For Donors
- Blog post explaining NGO structure
- Transparency report showing fund utilization
- Success stories of DHUKUTI fund impact

### For General Public
- About Us page update
- Press release about NGO status
- Social media campaign highlighting mission

---

**Last Updated**: [Current Date]  
**Document Version**: 2.0  
**Prepared For**: Policy Update Implementation  
**Requires**: Legal review, Board approval, Platform updates
