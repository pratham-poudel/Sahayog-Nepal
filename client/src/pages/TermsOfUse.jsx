import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const TermsOfUse = () => {
  const { theme } = useTheme();
  const [language, setLanguage] = useState('english');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'english' ? 'nepali' : 'english');
  };

  const content = {
    english: {
      title: "Terms of Use",
      lastUpdated: "Last Updated: October 4, 2025",
      intro: "Any contribution on sahayognepal.org, by any person, should not be construed as an investment in any form whatsoever.",
      disclaimer: "We do not provide any financial return in any form whatsoever, including but not limited to financial securities (debt or equity), interest, dividend, profit share, rewards in cash or cash equivalents, to persons who contribute on sahayognepal.org.",
      sections: [
        {
          heading: "1. About SahayogNepal",
          content: `This document is an electronic record in terms of Information Technology Act, 2000 and rules thereunder as applicable. This document is published in accordance with the provisions of applicable laws in Nepal.

SahayogNepal is a registered Non-Governmental Organization (NGO) dedicated to facilitating crowdfunding for medical, social, and charitable causes in Nepal. As Nepal does not yet have specific government regulations for crowdfunding platforms, Sahayog Nepal operates under the Social Welfare Act, 2049 (1992) and relevant charitable organization regulations.

The online platform, including the domain name www.sahayognepal.org (hereinafter referred to as "Website") and mobile application (hereinafter referred to as "Application"), is owned and operated by SahayogNepal NGO, a registered non-profit organization under Nepali law.

Your use of the Website and Application and tools are governed by the following terms and conditions ("Terms of Use / Terms") as mentioned herein. By mere use of the Website or Application, you shall be contracting with SahayogNepal NGO and these terms and conditions constitute your binding obligations.`
        },
        {
          heading: "2. Services of SahayogNepal and Campaign Verification",
          content: `SahayogNepal is a registered Non-Governmental Organization providing a crowdfunding platform for medical, social, and charitable causes in Nepal. The Website and Application allow users to reach a larger base of donors and supporters for legitimate charitable purposes.

IMPORTANT - Campaign Verification and NGO Responsibility:
All campaigns posted on SahayogNepal undergo strict verification by our NGO team before being displayed on the main page. Once a campaign is verified and published on our platform:
• The campaign becomes an OFFICIAL CAMPAIGN of SahayogNepal NGO
• SahayogNepal NGO takes responsibility for the authenticity and legitimacy of the campaign
• We verify documents, beneficiary details, and the genuine need for funds
• Only campaigns meeting our strict verification criteria are shown to donors

The Website provides services to allow verified Campaigners to post fundraising campaigns to accept monetary donations. Although there are no fees to set up a Campaign, operational costs are deducted from donations as per our fee policy.

CRITICAL - We do NOT provide any financial returns: We do not provide any financial return in any form whatsoever, including but not limited to financial securities (debt or equity), interest, dividend, profit share, rewards in cash or cash equivalents, to persons who contribute on sahayognepal.org. All contributions are purely charitable donations.

We do not guarantee that a Campaign will obtain a certain amount of donations. However, by verifying and publishing campaigns, we stand behind their authenticity and charitable purpose.`
        },
        {
          heading: "3. Eligibility of the User",
          content: `Use of the Website is available only to persons who can form legally binding contracts under Nepali law. Persons who are incompetent to contract, including minors under the age of 18 years, are not eligible to use the Website. If you are a minor, you shall not register as a member on SahayogNepal and shall not transact or use the Website. As a minor, if you wish to use the Website, such use or transaction may be made by your legal guardian or parents.

SahayogNepal reserves the right to terminate your membership and refuse to provide you with access to the Website if it is discovered that you are under the age of 18 years or otherwise incompetent to contract.`
        },
        {
          heading: "4. Campaigner Obligations",
          content: `A Campaigner is bound and legally liable to provide accurate, true and correct information in respect of the campaign details. A Campaigner shall ensure that the description of the Campaign is not misleading and accurately describes the need and use of funds.

You shall ensure that documents and information submitted are true, correct, up to date, and do not infringe upon intellectual property or other rights of third parties. You must comply with all applicable Nepali laws including tax regulations, foreign contribution regulations, and information technology laws.

CRITICAL - One-Year Fund Withdrawal Policy:

Campaigners MUST withdraw raised funds within ONE (1) YEAR from the campaign end date.

If funds are NOT withdrawn within this 1-year period:
• Funds will be automatically transferred to another verified needy campaign on the platform (prioritized to similar category campaigns)
• If no suitable active campaign is identified, funds will be transferred to Sahayog Nepal's main charitable fund "DHUKUTI"
• Campaigners will receive email notifications at 9 months, 11 months, and a final notice before the 1-year deadline
• This policy ensures donated funds reach beneficiaries promptly and are not left unused
• NO refunds will be made to donors after the 1-year period expires
• Once funds are reallocated, they CANNOT be reclaimed by the original campaigner

Reason for This Policy:
As Nepal does not yet have specific government regulations for crowdfunding platforms, Sahayog Nepal has established this policy as an NGO to ensure:
- Charitable donations serve their intended purpose promptly
- Unused funds continue helping those in need
- Transparency and accountability in fund management
- Alignment with our charitable mission

About DHUKUTI Fund:
DHUKUTI is Sahayog Nepal's main charitable relief fund used for:
- Emergency disaster response
- Supporting campaigns that fall short of their targets
- Urgent medical cases requiring immediate intervention
- Community development projects
- Administered transparently by Sahayog Nepal's board of directors with quarterly public reports

By creating a campaign, you explicitly agree to this 1-year withdrawal deadline and fund reallocation policy.

Ethical Image Posting: You must obtain permission from people depicted in images. For minors, obtain permission from parents/guardians. Show authentic and accurate portrayals. Do not manipulate images or manufacture fake vulnerability. Respect child protection and privacy standards.`
        },
        {
          heading: "5. Donor Responsibilities",
          content: `The Donor agrees to make payments for any Campaign as per the terms stated herein. The Donor acknowledges that SahayogNepal has no responsibility to verify the accuracy of information furnished by Campaigners.

SahayogNepal only enables the flow of funds from Donors to Campaigners and is not the final recipient of funds. We deduct certain charges and transfer the net amount to the Campaigner.

While making a donation, the Donor should conduct independent due diligence regarding the Campaign. SahayogNepal shall not be responsible for any misrepresentation or false information listed on the Website.

Important Notice - Fund Reallocation Policy:
Donors should be aware that if a campaign creator does not withdraw the raised funds within 1 YEAR of the campaign end date, those funds will be:
1. Transferred to another verified needy campaign on the platform (prioritized), OR
2. Transferred to Sahayog Nepal's main charitable fund "DHUKUTI"

This ensures your donation continues to serve charitable purposes even if the original campaign creator does not claim the funds. All donations are FINAL and non-refundable after this 1-year period. Donors can track fund reallocation through the platform's transparency reports.

If a Campaign terminates prematurely for reasons of fraud or misrepresentation, SahayogNepal reserves the right to refund donations to Donors or redirect them to DHUKUTI fund or another suitable campaign.`
        },
        {
          heading: "6. Payment, Fund Disbursement and Verification",
          content: `All payments must be made in Nepali Rupees (NPR) for Nepali nationals using local payment gateways. Foreign contributions must be made through approved foreign payment gateways in accordance with Nepali foreign exchange regulations.

You authorize SahayogNepal NGO to collect, process, facilitate and remit payments electronically. The payment facility is merely a facilitator using existing authorized banking infrastructure.

STRICT FUND DISBURSEMENT VERIFICATION:
Before transferring raised funds to campaigners, SahayogNepal NGO conducts rigorous verification:
• Complete document verification (identity, bank details, medical reports, etc.)
• Physical verification of beneficiary and need (when required)
• For large amounts (cash or cheque transfers), a representative from SahayogNepal NGO may be present during fund handover
• Video/photo documentation of fund transfer for transparency
• Signed acknowledgement receipts from beneficiaries

FRAUD DETECTION AND FUND PROTECTION:
If any scam, fraud, or fraudulent activity is detected at any stage:
• ALL funds raised for that campaign will be IMMEDIATELY frozen
• After investigation, if fraud is confirmed, the ENTIRE fund amount will be transferred to SahayogNepal's main charitable fund "DHUKUTI"
• These funds will be used for genuine social and charitable purposes
• The fraudulent campaigner will be permanently banned and legal action will be pursued
• Donors will be notified about the fraud detection and fund reallocation

SahayogNepal reserves the right to refuse questionable transactions, delay payment confirmation for suspicious transactions, and may inform law enforcement if illegal activity is suspected.

Funds will be transferred to verified Campaigners net of platform fees, payment gateway charges, and applicable taxes within 15 days of campaign completion or upon withdrawal request, subject to successful verification.`
        },
        {
          heading: "7. Platform Charges and Fees",
          content: `SahayogNepal does not charge any fee for browsing the Website. However, funds collected under any Campaign are subject to deductions comprising:

- Advertisement spends incurred for promoting campaigns
- Costs for photo/video shoots and content creation
- Payment gateway charges
- Technology and operational expenses
- Employee and resource costs
- Applicable taxes and levies

SahayogNepal reserves the right to change its fee policy from time to time. By agreeing to these Terms, you agree to SahayogNepal's pricing policy.`
        },
        {
          heading: "8. User Conduct and Prohibited Activities",
          content: `You shall not upload, display, or share information that:
- Belongs to another person without authorization
- Is harmful, defamatory, obscene, or unlawful
- Is misleading or fraudulent
- Infringes intellectual property rights
- Promotes illegal activities
- Contains viruses or malicious code
- Violates privacy or publicity rights

You shall not attempt unauthorized access, interfere with Website operations, engage in data mining or scraping, or use the platform for spam or illegal solicitation.

SahayogNepal reserves the right to remove content, suspend accounts, and take legal action for violations of these terms.`
        },
        {
          heading: "9. Intellectual Property Rights",
          content: `All content on the Website, including text, graphics, logos, and software, is protected by copyright and intellectual property laws. You may not copy, reproduce, or distribute Website content without express written permission from SahayogNepal NGO.

By uploading User Content, you grant SahayogNepal a non-exclusive, worldwide, royalty-free, perpetual license to use, display, and distribute your content in connection with platform operations and marketing.

The SahayogNepal name and logo are trademarks of SahayogNepal NGO. Unauthorized use of our trademarks is strictly prohibited.`
        },
        {
          heading: "10. Privacy and Data Protection",
          content: `We view protection of your privacy as a very important principle. Your personal information is stored securely and processed in accordance with applicable Nepali data protection laws.

By using the Website, you consent to our collection and use of personal data as outlined in our Privacy Policy. You also consent to receive communications via email, SMS, and other channels regarding campaigns and platform updates.

For full details on data handling, please refer to our Privacy Policy available on the Website.`
        },
        {
          heading: "11. Disclaimers and Limitation of Liability",
          content: `THE WEBSITE AND SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. SAHAYOGNEPAL MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE WEBSITE OR CAMPAIGNS.

SahayogNepal is not responsible for:
- Accuracy or completeness of campaign information
- Performance or fulfillment of campaign obligations
- Misuse of funds by campaigners
- Technical issues or service interruptions
- Third-party content or links

IN NO EVENT SHALL SAHAYOGNEPAL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM USE OF THE WEBSITE OR SERVICES.`
        },
        {
          heading: "12. Compliance with Nepali Laws",
          content: `Users shall comply with all applicable laws of Nepal including:
- Income Tax Act and regulations
- Foreign Exchange Regulation Act
- Information Technology Act
- Anti-Money Laundering regulations
- Consumer Protection laws
- Social Welfare Act, 2049 (1992)
- Association Registration Act, 2034 (1977)

Important Note on Regulatory Framework:
As crowdfunding-specific regulations are still emerging in Nepal, Sahayog Nepal operates as a registered NGO under the Social Welfare Act and relevant charitable organization regulations. We have established self-governance policies, including the 1-year fund withdrawal deadline, to ensure transparency, accountability, and alignment with international best practices for charitable crowdfunding.

Campaigners must obtain necessary licenses and approvals for receiving donations and carrying out campaign activities. Failure to comply may result in campaign suspension and legal consequences.

All funds managed through the platform, including those transferred to DHUKUTI fund, are subject to NGO financial reporting requirements and public disclosure norms as per Nepali law.`
        },
        {
          heading: "13. Dispute Resolution and Jurisdiction",
          content: `These Terms of Use shall be governed by and construed in accordance with the laws of Nepal. The exclusive jurisdiction for any disputes shall be the courts of Kathmandu, Nepal.

Any dispute involving SahayogNepal shall be resolved through arbitration in accordance with Nepali Arbitration Act. The seat of arbitration shall be in Kathmandu and proceedings shall be conducted in English or Nepali.

You agree that any claim must be filed within one (1) year after the cause of action arose or be forever barred.`
        },
        {
          heading: "14. Termination",
          content: `SahayogNepal may suspend or terminate your account at any time for:
- Violation of Terms of Use
- Fraudulent or illegal activity
- Providing false information
- Lack of use or inactivity

Upon termination, you may not register or attempt to use the Website. SahayogNepal reserves the right to pursue legal action and recover amounts due.

You may terminate your account at any time by contacting us, subject to fulfillment of all pending obligations.`
        },
        {
          heading: "15. Changes to Terms",
          content: `SahayogNepal reserves the right to modify these Terms of Use at any time. Changes will be effective fourteen (14) days after posting, except changes for new features or legal requirements which are effective immediately.

Continued use of the Website after changes constitutes acceptance of modified Terms. We encourage you to review Terms periodically.`
        },
        {
          heading: "16. Contact Information",
          content: `For questions or concerns regarding these Terms of Use, please contact:

Sahayog Nepal (NGO)
Main Charitable Fund: DHUKUTI
Address: Thamel, Kathmandu, Nepal
Phone: +977 1 4123456
Email: info@sahayognepal.org
Website: www.sahayognepal.org

Grievance Officer:
For complaints or grievances, please write to our Grievance Officer at the above address or email.

About Our Organization:
Sahayog Nepal is a registered Non-Governmental Organization dedicated to facilitating transparent and effective crowdfunding for social causes in Nepal. We are committed to verifying every campaign, ensuring fund safety, and maintaining the highest standards of accountability and transparency in charitable giving.`
        }
      ],
      companyInfo: "Registered Non-Governmental Organization (NGO)",
      website: "www.sahayognepal.org"
    },
    nepali: {
      title: "उपयोगका सर्तहरू",
      lastUpdated: "अन्तिम अद्यावधिक: अक्टोबर ४, २०२५",
      intro: "sahayognepal.org मा कुनै पनि व्यक्तिको योगदानलाई कुनै पनि प्रकारको लगानीको रूपमा लिइने छैन।",
      disclaimer: "हामी sahayognepal.org मा योगदान गर्ने व्यक्तिहरूलाई कुनै पनि प्रकारको वित्तीय प्रतिफल प्रदान गर्दैनौं, जसमा वित्तीय धितोपत्र (ऋण वा इक्विटी), ब्याज, लाभांश, नाफा साझेदारी, नगद वा नगद समकक्षमा पुरस्कारहरू समावेश छन् तर सीमित छैनन्।",
      sections: [
        {
          heading: "१. सहयोगनेपाल बारे",
          content: `यो कागजात सूचना प्रविधि ऐन, २०००० र त्यस अन्तर्गतका नियमहरू अनुसार इलेक्ट्रोनिक रेकर्ड हो। यो कागजात नेपालका लागू कानूनहरूको प्रावधान अनुसार प्रकाशित गरिएको हो।

सहयोगनेपाल नेपालमा चिकित्सा, सामाजिक र परोपकारी उद्देश्यका लागि क्राउडफन्डिङ सुविधा प्रदान गर्न समर्पित दर्ता गरिएको गैर-सरकारी संस्था (NGO) हो। नेपालमा अझै क्राउडफन्डिङ प्लेटफर्महरूका लागि विशेष सरकारी नियमहरू नभएकोले, सहयोग नेपाल समाज कल्याण ऐन, २०४९ (१९९२) र सम्बन्धित परोपकारी संस्था नियमहरू अन्तर्गत सञ्चालन हुन्छ।

अनलाइन प्लेटफर्म, डोमेन नाम www.sahayognepal.org (यसपछि "वेबसाइट" भनिने) र मोबाइल एप्लिकेसन (यसपछि "एप्लिकेसन" भनिने) सहित, सहयोगनेपाल NGO को स्वामित्व र सञ्चालनमा छ, जुन नेपाली कानून अन्तर्गत दर्ता गरिएको गैर-नाफामूलक संस्था हो।

तपाईंको वेबसाइट र एप्लिकेसन प्रयोग निम्न सर्त र शर्तहरू ("उपयोगका सर्तहरू") द्वारा शासित छ। वेबसाइट वा एप्लिकेसन प्रयोग गरेर, तपाईं सहयोगनेपाल NGO सँग सम्झौता गर्दै हुनुहुन्छ।`
        },
        {
          heading: "२. सहयोगनेपालको सेवाहरू र अभियान प्रमाणीकरण",
          content: `सहयोगनेपाल नेपालमा चिकित्सा, सामाजिक र परोपकारी कारणहरूका लागि क्राउडफन्डिङ प्लेटफर्म प्रदान गर्ने दर्ता गरिएको गैर-सरकारी संस्था हो। वेबसाइट र एप्लिकेसनले प्रयोगकर्ताहरूलाई वैध परोपकारी उद्देश्यका लागि दाताहरू र समर्थकहरूको ठूलो आधारमा पुग्न अनुमति दिन्छ।

महत्त्वपूर्ण - अभियान प्रमाणीकरण र NGO जिम्मेवारी:
सहयोगनेपालमा पोस्ट गरिएका सबै अभियानहरू मुख्य पृष्ठमा प्रदर्शन गर्नु अघि हाम्रो NGO टोलीद्वारा कडा प्रमाणीकरण गरिन्छ। एक पटक अभियान प्रमाणित र हाम्रो प्लेटफर्ममा प्रकाशित भएपछि:
• अभियान सहयोगनेपाल NGO को आधिकारिक अभियान बन्छ
• सहयोगनेपाल NGO ले अभियानको प्रामाणिकता र वैधताको जिम्मेवारी लिन्छ
• हामी कागजातहरू, लाभार्थी विवरण र कोषको वास्तविक आवश्यकता प्रमाणित गर्छौं
• हाम्रो कडा प्रमाणीकरण मापदण्ड पूरा गर्ने अभियानहरू मात्र दाताहरूलाई देखाइन्छ

वेबसाइटले प्रमाणित अभियान सञ्चालकहरूलाई आर्थिक दान स्वीकार गर्न अभियानहरू पोस्ट गर्न अनुमति दिन्छ। अभियान सिर्जना गर्न कुनै शुल्क छैन, तर हाम्रो शुल्क नीति अनुसार परिचालन लागत दानबाट कटौती गरिन्छ।

महत्त्वपूर्ण - हामी कुनै पनि वित्तीय प्रतिफल प्रदान गर्दैनौं: हामी sahayognepal.org मा योगदान गर्ने व्यक्तिहरूलाई वित्तीय धितोपत्र (ऋण वा इक्विटी), ब्याज, लाभांश, नाफा साझेदारी, नगद वा नगद समकक्षमा पुरस्कार सहित कुनै पनि प्रकारको वित्तीय प्रतिफल प्रदान गर्दैनौं। सबै योगदानहरू विशुद्ध परोपकारी दान हुन्।

हामी कुनै अभियानले निश्चित रकम प्राप्त गर्ने ग्यारेन्टी गर्दैनौं। तर, अभियानहरू प्रमाणित र प्रकाशित गरेर, हामी तिनीहरूको प्रामाणिकता र परोपकारी उद्देश्यको पछाडि उभिन्छौं।`
        },
        {
          heading: "३. प्रयोगकर्ताको योग्यता",
          content: `वेबसाइटको प्रयोग नेपाली कानून अन्तर्गत कानूनी रूपमा बाध्यकारी सम्झौता गर्न सक्ने व्यक्तिहरूलाई मात्र उपलब्ध छ। १८ वर्ष मुनिका नाबालिगहरू सहित सम्झौता गर्न अयोग्य व्यक्तिहरू वेबसाइट प्रयोग गर्न योग्य छैनन्।

यदि तपाईं नाबालिग हुनुहुन्छ भने, तपाईंले सहयोगनेपालमा सदस्य दर्ता गर्नु हुँदैन र वेबसाइट प्रयोग गर्नु हुँदैन। नाबालिगको रूपमा प्रयोग गर्न चाहनुहुन्छ भने, तपाईंको कानूनी अभिभावक वा अभिभावकले प्रयोग गर्न सक्नुहुन्छ।`
        },
        {
          heading: "४. अभियान सञ्चालकको दायित्वहरू",
          content: `अभियान सञ्चालक अभियानको विवरण सम्बन्धी सही, सत्य र सही जानकारी प्रदान गर्न कानूनी रूपमा बाध्य छन्। अभियानको विवरण भ्रामक हुनु हुँदैन र कोषको आवश्यकता र प्रयोगलाई सही रूपमा वर्णन गर्नुपर्छ।

तपाईंले पेश गरेको कागजात र जानकारी सत्य, सही, अद्यावधिक छ र तेस्रो पक्षको बौद्धिक सम्पत्ति वा अन्य अधिकारहरू उल्लङ्घन गर्दैन भन्ने सुनिश्चित गर्नुपर्छ।

१-वर्ष निकासी समयसीमा: यदि अभियान सञ्चालक वा प्राप्तकर्ताले अभियान समाप्त भएको मितिले १ वर्षभित्र निकासी अनुरोध नगरेमा, तब सबै कोष सहयोग नेपाल NGO को सामान्य कोष (DHUKUTI) मा स्थानान्तरण हुनेछ, जसलाई अन्य आवश्यक अभियानहरूलाई वितरण गर्न वा संस्थाको परोपकारी गतिविधिहरूलाई सहयोग गर्न प्रयोग गरिनेछ। यो अप्रयोग गरिएको कोषको कुशल उपयोग सुनिश्चित गर्न गरिन्छ। निकासी समयसीमा अभियानको समाप्ति मितिबाट शुरू हुन्छ।

तपाईंले नियमित रूपमा दाताहरूलाई अभियान प्रगति बारे अपडेट गर्नुपर्छ र लागू नेपाली कानून र हाम्रो अभियान दिशानिर्देशहरू पालना गर्नुपर्छ।`
        },
        {
          heading: "५. दाताको जिम्मेवारीहरू",
          content: `दाता यहाँ उल्लेखित सर्तहरू अनुसार कुनै पनि अभियानको लागि भुक्तानी गर्न सहमत छन्। दाताले स्वीकार गर्दछन् कि अभियान सञ्चालकहरूले प्रदान गरेको जानकारीको शुद्धता प्रमाणित गर्ने सहयोगनेपालको कुनै जिम्मेवारी छैन।

सहयोगनेपालले दाताहरूबाट अभियान सञ्चालकहरूमा कोषको प्रवाह सक्षम पार्छ र कोषको अन्तिम प्राप्तकर्ता होइन। हामी केही शुल्क कटौती गरी अभियान सञ्चालकलाई शुद्ध रकम स्थानान्तरण गर्छौं।

महत्त्वपूर्ण नोट - कोष स्थानान्तरण नीति: यदि अभियान सञ्चालकले अभियान समाप्त भएको १ वर्षभित्र निकासी अनुरोध नगरेमा, प्रयोग नभएका दानहरू DHUKUTI कोष वा अन्य सक्रिय अभियानहरूमा स्थानान्तरित हुनेछन्। यसले प्रयोग नभएका कोषहरू राम्ररी प्रयोग गरिने र अन्य आवश्यकताहरूलाई मद्दत गरिने सुनिश्चित गर्छ।

दान गर्दा, दाताले अभियान सम्बन्धी स्वतन्त्र सावधानी गर्नुपर्छ। भ्रामक वा झूटा जानकारीको लागि सहयोगनेपाल जिम्मेवार हुने छैन।`
        },
        {
          heading: "६. भुक्तानी, कोष वितरण र प्रमाणीकरण",
          content: `नेपाली नागरिकहरूले स्थानीय भुक्तानी गेटवे प्रयोग गरेर नेपाली रुपैयाँ (NPR) मा सबै भुक्तानीहरू गर्नुपर्छ। विदेशी योगदान नेपाली विदेशी मुद्रा नियमहरू अनुसार स्वीकृत विदेशी भुक्तानी गेटवे मार्फत गरिनुपर्छ।

तपाईंले सहयोगनेपाल NGO लाई इलेक्ट्रोनिक रूपमा भुक्तानीहरू सङ्कलन, प्रशोधन र रेमिट गर्न अधिकृत गर्नुहुन्छ।

कडा कोष वितरण प्रमाणीकरण:
अभियान सञ्चालकहरूलाई उठाइएको कोष स्थानान्तरण गर्नु अघि, सहयोगनेपाल NGO ले कठोर प्रमाणीकरण गर्दछ:
• पूर्ण कागजात प्रमाणीकरण (परिचय, बैंक विवरण, चिकित्सा रिपोर्ट, आदि)
• लाभार्थी र आवश्यकताको भौतिक प्रमाणीकरण (आवश्यक भएमा)
• ठूलो रकम (नगद वा चेक स्थानान्तरण) को लागि, कोष हस्तान्तरणको समयमा सहयोगनेपाल NGO को प्रतिनिधि उपस्थित हुन सक्छ
• पारदर्शिताको लागि कोष स्थानान्तरणको भिडियो/फोटो दस्तावेज
• लाभार्थीहरूबाट हस्ताक्षरित स्वीकृति रसिदहरू

धोखाधडी पत्ता लगाउने र कोष संरक्षण:
यदि कुनै पनि चरणमा कुनै घोटाला, धोखाधडी, वा जालसाजी गतिविधि पत्ता लाग्यो भने:
• त्यो अभियानको लागि उठाइएको सबै कोष तुरुन्तै रोकिनेछ
• अनुसन्धान पछि, यदि धोखाधडी पुष्टि भयो भने, सम्पूर्ण कोष रकम सहयोगनेपालको मुख्य परोपकारी कोष "DHUKUTI" मा स्थानान्तरण गरिनेछ
• यी कोषहरू वास्तविक सामाजिक र परोपकारी उद्देश्यका लागि प्रयोग गरिनेछ
• जालसाजी अभियान सञ्चालकलाई स्थायी रूपमा प्रतिबन्धित गरिनेछ र कानूनी कारबाही गरिनेछ
• दाताहरूलाई धोखाधडी पत्ता लगाउने र कोष पुनः आवंटनको बारेमा सूचित गरिनेछ

सहयोगनेपालले संदिग्ध कारोबारहरू अस्वीकार गर्ने, संदिग्ध कारोबारहरूको लागि भुक्तानी पुष्टि ढिलाइ गर्ने अधिकार सुरक्षित गर्दछ।

प्लेटफर्म शुल्क, भुक्तानी गेटवे शुल्क र लागू करहरू कटौती गरेर अभियान समाप्त भएको १५ दिन भित्र वा निकासी अनुरोधमा प्रमाणित अभियान सञ्चालकहरूलाई रकम स्थानान्तरण गरिनेछ, सफल प्रमाणीकरणको अधीनमा।`
        },
        {
          heading: "७. प्लेटफर्म शुल्क र दस्तुरहरू",
          content: `सहयोगनेपालले वेबसाइट ब्राउज गर्नको लागि कुनै शुल्क लिँदैन। तर, कुनै पनि अभियान अन्तर्गत सङ्कलन गरिएको कोषबाट निम्न कटौती गरिन्छ:

- अभियानहरू प्रवर्द्धन गर्न खर्च गरिएको विज्ञापन रकम
- फोटो/भिडियो शूट र सामग्री सिर्जनाको लागत
- भुक्तानी गेटवे शुल्क
- प्रविधि र परिचालन खर्चहरू
- कर्मचारी र स्रोत लागतहरू
- लागू कर र शुल्कहरू

सहयोगनेपालले समय-समयमा आफ्नो शुल्क नीति परिवर्तन गर्ने अधिकार सुरक्षित गर्दछ।`
        },
        {
          heading: "८. प्रयोगकर्ता आचरण र निषेधित गतिविधिहरू",
          content: `तपाईंले जानकारी अपलोड, प्रदर्शन वा साझेदारी गर्नु हुँदैन जुन:
- अनुमति बिना अर्को व्यक्तिको हो
- हानिकारक, मानहानिकारक, अश्लील वा गैरकानूनी छ
- भ्रामक वा जालसाजी छ
- बौद्धिक सम्पत्ति अधिकार उल्लङ्घन गर्दछ
- अवैध गतिविधिहरू प्रवर्द्धन गर्दछ
- भाइरस वा दुर्भावनापूर्ण कोड समावेश गर्दछ
- गोपनीयता वा प्रचार अधिकारहरू उल्लङ्घन गर्दछ

तपाईंले अनाधिकृत पहुँचको प्रयास गर्नु हुँदैन, वेबसाइट सञ्चालनमा हस्तक्षेप गर्नु हुँदैन, डाटा माइनिङ वा स्क्र्यापिङमा संलग्न हुनु हुँदैन।

सहयोगनेपालले सामग्री हटाउने, खाताहरू निलम्बन गर्ने र यी सर्तहरूको उल्लङ्घनको लागि कानूनी कारबाही गर्ने अधिकार सुरक्षित गर्दछ।`
        },
        {
          heading: "९. बौद्धिक सम्पत्ति अधिकारहरू",
          content: `वेबसाइटमा सबै सामग्री, पाठ, ग्राफिक्स, लोगो र सफ्टवेयर सहित, प्रतिलिपि अधिकार र बौद्धिक सम्पत्ति कानून द्वारा सुरक्षित छ। तपाईंले सहयोगनेपालको स्पष्ट लिखित अनुमति बिना वेबसाइट सामग्री प्रतिलिपि, पुन: उत्पादन वा वितरण गर्न सक्नुहुन्न।

प्रयोगकर्ता सामग्री अपलोड गरेर, तपाईंले सहयोगनेपाललाई प्लेटफर्म सञ्चालन र मार्केटिङसँग सम्बन्धित तपाईंको सामग्री प्रयोग, प्रदर्शन र वितरण गर्न गैर-विशेष, विश्वव्यापी, रोयल्टी-मुक्त, स्थायी लाइसेन्स प्रदान गर्नुहुन्छ।`
        },
        {
          heading: "१०. गोपनीयता र डाटा संरक्षण",
          content: `हामी तपाईंको गोपनीयताको संरक्षणलाई धेरै महत्त्वपूर्ण सिद्धान्तको रूपमा हेर्छौं। तपाईंको व्यक्तिगत जानकारी सुरक्षित रूपमा भण्डारण गरिन्छ र लागू नेपाली डाटा संरक्षण कानून अनुसार प्रशोधन गरिन्छ।

वेबसाइट प्रयोग गरेर, तपाईं हाम्रो गोपनीयता नीतिमा उल्लेख गरिए अनुसार व्यक्तिगत डाटाको सङ्कलन र प्रयोगमा सहमति दिनुहुन्छ।

डाटा ह्यान्डलिङको पूर्ण विवरणको लागि, कृपया वेबसाइटमा उपलब्ध हाम्रो गोपनीयता नीति हेर्नुहोस्।`
        },
        {
          heading: "११. अस्वीकरण र दायित्वको सीमा",
          content: `वेबसाइट र सेवाहरू "जस्तै छ" र "उपलब्ध छ" आधारमा प्रदान गरिएको छ। सहयोगनेपालले वेबसाइट वा अभियानहरू सम्बन्धी कुनै वारेन्टी, स्पष्ट वा निहित, गर्दैन।

सहयोगनेपाल जिम्मेवार छैन:
- अभियान जानकारीको शुद्धता वा पूर्णताको लागि
- अभियान दायित्वहरूको कार्यसम्पादन वा पूर्तिको लागि
- अभियान सञ्चालकहरूद्वारा कोषको दुरुपयोगको लागि
- प्राविधिक समस्याहरू वा सेवा अवरोधहरूको लागि

कुनै पनि अवस्थामा सहयोगनेपाल वेबसाइट वा सेवाहरूको प्रयोगबाट उत्पन्न हुने कुनै पनि अप्रत्यक्ष, आकस्मिक, परिणामात्मक, वा दण्डात्मक क्षतिहरूको लागि जिम्मेवार हुने छैन।`
        },
        {
          heading: "१२. नेपाली कानूनहरूको पालना",
          content: `प्रयोगकर्ताहरूले नेपालका सबै लागू कानूनहरूको पालना गर्नुपर्छ:
- आयकर ऐन र नियमहरू
- विदेशी मुद्रा नियमन ऐन
- सूचना प्रविधि ऐन
- मनी लाउन्डरिङ विरुद्धको नियमहरू
- उपभोक्ता संरक्षण कानूनहरू
- समाज कल्याण ऐन, २०४९ (१९९२)
- संस्था दर्ता ऐन, २०३४ (१९७७)

महत्त्वपूर्ण नोट - नियामक ढाँचाबारे:
नेपालमा क्राउडफन्डिङका लागि विशेष नियमहरू अझै विकास भइरहेको हुनाले, सहयोग नेपाल समाज कल्याण ऐन र सम्बन्धित परोपकारी संस्था नियमहरू अन्तर्गत दर्ता गरिएको NGO को रूपमा सञ्चालन हुन्छ। हामीले पारदर्शिता, जवाफदेहीता र अन्तर्राष्ट्रिय परोपकारी क्राउडफन्डिङ सर्वोत्तम अभ्यासहरूसँग मिल्ने सुनिश्चित गर्न १-वर्ष कोष निकासी समयसीमा सहित स्व-शासन नीतिहरू स्थापना गरेका छौं।

अभियान सञ्चालकहरूले दान प्राप्त गर्न र अभियान गतिविधिहरू सञ्चालन गर्नको लागि आवश्यक इजाजतपत्र र स्वीकृतिहरू प्राप्त गर्नुपर्छ। पालना नगरेमा अभियान निलम्बन र कानूनी परिणामहरू हुन सक्छ।

DHUKUTI कोषमा स्थानान्तरित गरिएका कोषहरू सहित प्लेटफर्म मार्फत व्यवस्थित सबै कोषहरू नेपाली कानून अनुसार NGO वित्तीय रिपोर्टिङ आवश्यकताहरू र सार्वजनिक खुलासा मानदण्डहरूको अधीनमा छन्।`
        },
        {
          heading: "१३. विवाद समाधान र अधिकार क्षेत्र",
          content: `उपयोगका यी सर्तहरू नेपालको कानून द्वारा शासित र व्याख्या गरिनेछ। कुनै पनि विवादको लागि विशेष अधिकार क्षेत्र काठमाडौं, नेपालको अदालतहरू हुनेछन्।

सहयोगनेपाल समावेश कुनै पनि विवाद नेपाली मध्यस्थता ऐन अनुसार मध्यस्थता मार्फत समाधान गरिनेछ। मध्यस्थताको स्थान काठमाडौं हुनेछ र कार्यवाही अंग्रेजी वा नेपालीमा सञ्चालन गरिनेछ।`
        },
        {
          heading: "१४. समाप्ति",
          content: `सहयोगनेपालले निम्न कारणहरूले कुनै पनि समयमा तपाईंको खाता निलम्बन वा समाप्त गर्न सक्छ:
- उपयोगका सर्तहरूको उल्लङ्घन
- जालसाजी वा अवैध गतिविधि
- झूटा जानकारी प्रदान गर्नु
- प्रयोगको अभाव वा निष्क्रियता

समाप्ति पछि, तपाईंले दर्ता वा वेबसाइट प्रयोग गर्ने प्रयास गर्नु हुँदैन।`
        },
        {
          heading: "१५. सर्तहरूमा परिवर्तनहरू",
          content: `सहयोगनेपालले कुनै पनि समयमा उपयोगका यी सर्तहरू परिमार्जन गर्ने अधिकार सुरक्षित गर्दछ। परिवर्तनहरू पोस्ट गरेको चौध (१४) दिन पछि प्रभावकारी हुनेछन्।

परिवर्तन पछि वेबसाइटको निरन्तर प्रयोगले परिमार्जित सर्तहरूको स्वीकृति गठन गर्दछ। हामी तपाईंलाई आवधिक रूपमा सर्तहरू समीक्षा गर्न प्रोत्साहित गर्दछौं।`
        },
        {
          heading: "१६. सम्पर्क जानकारी",
          content: `उपयोगका यी सर्तहरू सम्बन्धी प्रश्न वा चिन्ताहरूको लागि, कृपया सम्पर्क गर्नुहोस्:

सहयोग नेपाल (NGO)
मुख्य परोपकारी कोष: DHUKUTI
ठेगाना: थमेल, काठमाडौं, नेपाल
फोन: +९७७ १ ४१२३४५६
इमेल: info@sahayognepal.org
वेबसाइट: www.sahayognepal.org

गुनासो अधिकारी:
गुनासो वा उजुरीहरूको लागि, कृपया माथिको ठेगाना वा इमेलमा हाम्रो गुनासो अधिकारीलाई लेख्नुहोस्।

हाम्रो संगठनबारे:
सहयोग नेपाल नेपालमा सामाजिक कारणहरूका लागि पारदर्शी र प्रभावकारी क्राउडफन्डिङ सुविधा प्रदान गर्न समर्पित दर्ता गरिएको गैर-सरकारी संस्था हो। हामी प्रत्येक अभियान प्रमाणित गर्न, कोष सुरक्षा सुनिश्चित गर्न, र परोपकारी दानमा जवाफदेहीता र पारदर्शिताको उच्चतम मापदण्ड कायम राख्न प्रतिबद्ध छौं।`
        }
      ],
      companyInfo: "दर्ता गरिएको गैर-सरकारी संस्था (NGO)",
      website: "www.sahayognepal.org"
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {currentContent.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentContent.lastUpdated}
              </p>
            </div>
            
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B2325] to-[#6d1b1d] hover:from-[#6d1b1d] hover:to-[#8B2325] text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              aria-label="Toggle Language"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <span className="font-medium text-sm">
                {language === 'english' ? 'नेपाली' : 'English'}
              </span>
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentContent.intro}
            </p>
          </div>

          {/* Important Disclaimer Box */}
          <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-5 border-l-4 border-red-600">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
                  {language === 'english' ? 'Important Notice' : 'महत्त्वपूर्ण सूचना'}
                </h3>
                <p className="text-sm text-red-900 dark:text-red-200 leading-relaxed">
                  {currentContent.disclaimer}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center bg-[#8B2325] rounded-full">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {currentContent.website}
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-400">
              {currentContent.companyInfo}
            </span>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-6">
          {currentContent.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <h2 className="text-xl font-bold text-[#8B2325] dark:text-[#e05759] mb-4 flex items-center gap-2">
                <span className="inline-block w-1 h-6 bg-[#D5A021] rounded-full"></span>
                {section.heading}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-[#8B2325]/10 to-[#D5A021]/10 dark:from-[#8B2325]/20 dark:to-[#D5A021]/20 rounded-xl p-6 border-l-4 border-[#8B2325]"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {language === 'english' 
              ? 'By using SahayogNepal, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree with any part of these terms, please do not use our platform.'
              : 'सहयोगनेपाल प्रयोग गरेर, तपाईंले यी उपयोगका सर्तहरू पढेको, बुझेको र पालना गर्न सहमत भएको स्वीकार गर्नुहुन्छ। यदि तपाईं यी सर्तहरूको कुनै पनि भागसँग सहमत हुनुहुन्न भने, कृपया हाम्रो प्लेटफर्म प्रयोग नगर्नुहोस्।'
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfUse;
