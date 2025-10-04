import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const PrivacyPolicy = () => {
  const { theme } = useTheme();
  const [language, setLanguage] = useState('english');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'english' ? 'nepali' : 'english');
  };

  const content = {
    english: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: October 4, 2025",
      intro: "We value the trust you place in us. That's why we insist upon the highest standards for secure transactions and User information privacy. Please read the following statement to learn about our information gathering and dissemination practices.",
      importantNote: "This Privacy Policy should be read along with the SahayogNepal Terms of Use for a full understanding of SahayogNepal's practices as well as the Users' responsibilities when interacting with www.sahayognepal.org and mobile application.",
      sections: [
        {
          heading: "Introduction",
          content: `This Privacy Policy is published in accordance with the provisions of the Nepal Information Technology Act, 2000 and rules made thereunder, specifically relating to reasonable security practices and procedures for sensitive personal data or information.

All terms used in this Privacy Policy will have the same meaning and definition assigned to them in applicable Nepali laws and regulations.

Important Notes:

• Our privacy policy is subject to change at any time without notice. To make sure you are aware of any changes, please review this policy periodically.

• By visiting this Platform you agree to be bound by the terms and conditions of this Privacy Policy and the Terms of Use of the Platform. If you do not agree, please do not use or access the Platform.

• By mere use of the Platform, you expressly consent to our use and disclosure of your personal information in accordance with this Privacy Policy. This Privacy Policy is incorporated into and subject to the Terms of Use.`
        },
        {
          heading: "1. Collection of Personally Identifiable Information",
          content: `When you use our Platform, we collect and store your personal information, which is provided by you from time to time. Our primary goal in doing so is to provide you a safe, efficient, smooth and customized experience. This allows us to provide services and features that most likely meet your needs, and to customize our Platform to make your experience safer and easier.

Information We Collect:

• Account Information: When you sign up through our portal or sign in through an associate API such as Google or Facebook, we collect your name, email address, phone number, and other registration details.

• Browsing Information: You can browse the Platform without revealing personal information. However, we may automatically track certain information based on your behavior, including the URL you came from, which URL you visit next, your browser information, and your IP address.

• Cookies: We use data collection devices such as "cookies" on certain pages of the Platform to help analyze our web page flow, measure promotional effectiveness, and promote trust and safety. "Cookies" are small files placed on your hard drive that assist us in providing our services. Most cookies are "session cookies," meaning they are automatically deleted from your hard drive at the end of a session. You are free to decline our cookies if your browser permits.

• Transaction Information: If you transact with us (through making donations/contributions), we collect billing address, payment card details, and tracking information from payment instruments.

• Communication Information: If you send us personal correspondence, such as emails or letters, or if other users or third parties send us correspondence about your activities, we may collect such information into a file specific to you.

• Donation Patterns: If you choose to donate or contribute on the Platform, we collect information about your donation patterns and usage behavior.

• User-Generated Content: If you post messages on our message boards or leave feedback, we will collect that information. We retain this information as necessary to resolve disputes, provide user support, and troubleshoot problems as permitted by law.

Required vs. Optional Fields: Where possible, we indicate which fields are required and which are optional. You always have the option to not provide information by choosing not to use a particular service or feature on the Platform.`
        },
        {
          heading: "2. Use of Demographic and Profile Data",
          content: `We use personal information to provide the services you request. To the extent we use your personal information to market to you, we will provide you the ability to opt-out of such uses.

Purposes of Data Use:

• Service Provision: To provide the services you request and complete transactions
• Dispute Resolution: To resolve disputes and troubleshoot problems
• Security: To help promote a safe service and detect and protect against error, fraud, and other criminal activity
• Payment Processing: To collect money either by us or through an authorized payment gateway facility
• Analytics: To measure user interests in fundraisers hosted on our site
• Communication: To inform you about updates, receipts, certificates, upcoming events, and newsletters
• Customization: To customize your experience on the Platform
• Enforcement: To enforce our terms and conditions
• Improvement: In our efforts to continually improve our product and service offerings, we collect and analyze demographic and profile data about our users' activity on our Platform

IP Address Usage: We identify and use your IP address to help diagnose problems with our server, to administer our Platform, and to gather broad demographic information.

Marketing Opt-Out: We provide you the ability to opt-out of marketing communications at any time.`
        },
        {
          heading: "3. Sharing of Personal Information",
          content: `Information We DO NOT Share:

The following information will not be shared with any third parties or disclosed to any person other than as required by law:
• Passwords
• Financial information such as bank account, credit card, debit card, or other payment instrument details
• Sexual orientation
• Any other sensitive personal information not essential for the continued use of the Platform

Information We MAY Share:

• Third-Party Vendors: We may share your personal information with third-party vendors or our corporate and associate entities to help with:
  - Identity verification
  - Detection and prevention of identity theft, fraud, and other potentially illegal acts
  - Cyber security incident management
  - Correlation of multiple accounts to prevent abuse of our services
  - Facilitation of joint or co-branded services

• Verification Services: In certain cases, to provide you services, we may receive your personal information from third parties for identity verification purposes. We may share your personal information with these third parties only if strictly necessary for service provision. We do not retain data from third parties for any purpose other than service provision.

• Campaigners: We provide certain data to Campaigners to interact with you and send you information such as receipts, certificates, updates, and rewards. Donors/contributors hereby permit SahayogNepal to share their personal information such as name, email address, and contact information with respective Campaigners and beneficiaries.

• Legal Requirements: We may disclose personal information if required by law or in good faith belief that such disclosure is reasonably necessary to:
  - Respond to summons, court orders, or other legal processes
  - Enforce our Terms of Use or Privacy Policy
  - Respond to claims that content violates third-party rights
  - Protect the rights, property, or personal safety of our users or the general public

• Business Transfers: In the event we merge with, are acquired by, or undergo reorganization with another business entity, the acquiring entity will be required to follow this privacy policy with respect to your personal information.

Third-Party Marketing: These entities and affiliates may not market to you as a result of such sharing unless you explicitly opt-in.

SahayogNepal assumes no liability and is not responsible for the manner in which third parties gather and extract your personal information.`
        },
        {
          heading: "4. Links to Other Sites",
          content: `Our Platform may link to other websites and applications that may collect personally identifiable information about you.

SahayogNepal is not responsible for the privacy practices or the content of those linked websites and applications.

We recommend that you review the privacy policies of any third-party sites you visit through our Platform.`
        },
        {
          heading: "5. Security Precautions and Security Breach",
          content: `Security Measures:

Our Platform has stringent security measures in place to protect the loss, misuse, and alteration of information under our control:

• Whenever you change or access your account information, we offer the use of a secure server
• Once your information is in our possession, we adhere to strict security guidelines, protecting it against unauthorized access
• Our web hosts, transaction affiliates, and partners all use industry-grade and standardized methods to protect your information from any misuse
• We comply with international security standards including IS/ISO/IEC 27001 or equivalent standards of Security Techniques and Information Security Management System Requirements

Reporting Security Breaches:

If any User has sufficient reason to believe their data has been compromised or there has been a security breach due to a cyber security incident, you may write to us immediately at the contact details provided below so that we may:
• Take suitable measures to rectify such a breach
• Inform the concerned authorities of a cyber security incident

Reporting Abuse:

To report abuse on the Platform (not being a cyber security incident), a User may contact us through our support channels. Upon receiving such information, SahayogNepal will examine the abuse and take suitable and necessary steps to remedy it.

Data Protection Compliance:

Information provided by you to SahayogNepal is processed, stored, and retained through our servers and web hosts with compliance to international security standards.`
        },
        {
          heading: "6. Review and Management of Information",
          content: `Reviewing Your Information:

If at any time a User wishes to review the information provided to SahayogNepal at the time of registration or at any time thereafter, you may do so by:
• Signing into your account
• Navigating to your profile settings
• Amending the information as needed

Opting Out of Communications:

We provide all users with the opportunity to opt-out of receiving non-essential (promotional, marketing-related) communications from us on behalf of our Campaigners, and from us in general, after setting up an account.

Account Deactivation:

All Users are given the option of:
• Canceling their User accounts
• Bringing to our attention their desire to discontinue the use of our services
• Removing their contact information from all SahayogNepal lists and newsletters

If you want to deactivate your account or remove your contact information from all SahayogNepal's lists and newsletters, please write to us at info@sahayognepal.org

Data Retention:

We retain your information for as long as necessary to:
• Provide our services
• Comply with legal obligations
• Resolve disputes
• Enforce our agreements`
        },
        {
          heading: "7. Advertisements on SahayogNepal",
          content: `We may use third-party advertising companies to serve advertisements when you visit our Platform.

These companies may use information (not including your name, address, email address, or telephone number and generally other information which may personally identify you) about your visits to this and other websites and applications in order to provide advertisements about goods and services of interest to you.

Cookie Usage by Advertisers:

You may encounter "cookies" or other similar devices on certain pages of the Platform that are placed by third parties. We do not control the use of cookies by third parties.

We encourage you to review the privacy policies of third-party advertisers to understand their data collection and usage practices.`
        },
        {
          heading: "8. Your Consent",
          content: `By using the Platform and/or by providing your information, you consent to:

• The collection and use of the information you disclose on the Platform in accordance with this Privacy Policy
• Sharing your information as per this Privacy Policy
• Allowing SahayogNepal to contact you via WhatsApp, Email, SMS, and other modes of communication

Donor/Contributor Consent:

The donors/contributors hereby permit SahayogNepal to share their personal information such as name, email address, and contact information to the respective Campaigner and beneficiaries of the donations made via sahayognepal.org

Changes to Privacy Policy:

If we decide to change our privacy policy, we will post those changes on this page so that you are always aware of:
• What information we collect
• How we use it
• Under what circumstances we disclose it

Withdrawal of Consent:

You may withdraw your consent at any time by contacting us at info@sahayognepal.org. However, withdrawal of consent may limit your ability to use certain features of the Platform.`
        },
        {
          heading: "9. Data Retention and Storage",
          content: `Information Storage:

Information provided by you to SahayogNepal is processed, stored, and retained through our servers and web hosting services.

Security Compliance:

Our web hosts and agencies managing your information are compliant with:
• IS/ISO/IEC 27001 or equivalent standards
• Security Techniques and Information Security Management System Requirements
• Industry best practices for data security

Data Location:

Your data may be stored on servers located in Nepal or internationally, in compliance with applicable data protection laws.

Retention Period:

We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.`
        },
        {
          heading: "10. Children's Privacy",
          content: `SahayogNepal does not knowingly collect or solicit personal information from anyone under the age of 18.

If you are under 18, please do not attempt to register for the Platform or send any personal information about yourself to us.

If we learn that we have collected personal information from a child under age 18, we will delete that information as quickly as possible.

If you believe that a child under 18 may have provided us personal information, please contact us at info@sahayognepal.org`
        },
        {
          heading: "11. Your Rights",
          content: `As a user of SahayogNepal, you have the following rights regarding your personal information:

Right to Access: You have the right to request copies of your personal information.

Right to Rectification: You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.

Right to Erasure: You have the right to request that we erase your personal information, under certain conditions.

Right to Restrict Processing: You have the right to request that we restrict the processing of your personal information, under certain conditions.

Right to Object to Processing: You have the right to object to our processing of your personal information, under certain conditions.

Right to Data Portability: You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.

To exercise any of these rights, please contact us at info@sahayognepal.org`
        },
        {
          heading: "12. Grievance Officer",
          content: `In accordance with Nepal Information Technology Act, 2000 and rules made thereunder, the name and contact details of the Grievance Officer are provided below:

Name: Grievance Officer
Organization: SahayogNepal
Operated by: Dallytech Pvt Ltd

Address:
Thamel, Kathmandu
Nepal

Phone: +977 1 4123456
Email: info@sahayognepal.org

Working Hours: Sunday – Friday (9:00 AM – 6:00 PM)

You may contact the Grievance Officer for any complaints, concerns, or queries regarding:
• Privacy violations
• Data security concerns
• Misuse of personal information
• Any other grievances related to the Platform

We are committed to resolving your concerns in a timely and effective manner.`
        }
      ],
      companyInfo: "Platform operated by Dallytech Pvt Ltd",
      website: "www.sahayognepal.org"
    },
    nepali: {
      title: "गोपनीयता नीति",
      lastUpdated: "अन्तिम अद्यावधिक: अक्टोबर ४, २०२५",
      intro: "हामी तपाईंले हामीमा राख्नुभएको विश्वासको कदर गर्छौं। त्यसैले हामी सुरक्षित कारोबार र प्रयोगकर्ता जानकारी गोपनीयताको लागि उच्चतम मापदण्डहरूमा जोड दिन्छौं।",
      importantNote: "यो गोपनीयता नीति www.sahayognepal.org र मोबाइल एप्लिकेसनसँग अन्तरक्रिया गर्दा सहयोगनेपालको अभ्यासहरू र प्रयोगकर्ताहरूको जिम्मेवारीहरूको पूर्ण बुझाइको लागि सहयोगनेपाल उपयोगका सर्तहरूसँग पढिनुपर्छ।",
      sections: [
        {
          heading: "परिचय",
          content: `यो गोपनीयता नीति नेपाल सूचना प्रविधि ऐन, २०००० र त्यस अन्तर्गत बनाइएका नियमहरू, विशेष गरी संवेदनशील व्यक्तिगत डाटा वा जानकारीको लागि उचित सुरक्षा अभ्यास र प्रक्रियाहरूसँग सम्बन्धित प्रावधानहरू अनुसार प्रकाशित गरिएको हो।

यो गोपनीयता नीतिमा प्रयोग गरिएका सबै सर्तहरू लागू नेपाली कानून र नियमहरूमा तोकिएको अर्थ र परिभाषा अनुसार हुनेछन्।

महत्त्वपूर्ण नोटहरू:

• हाम्रो गोपनीयता नीति कुनै पनि समयमा सूचना बिना परिवर्तन हुन सक्छ। तपाईं कुनै पनि परिवर्तनहरूको बारेमा सचेत हुनुहुन्छ भन्ने सुनिश्चित गर्न, कृपया यो नीति आवधिक रूपमा समीक्षा गर्नुहोस्।

• यो प्लेटफर्म भ्रमण गरेर तपाईं यो गोपनीयता नीति र प्लेटफर्मको उपयोगका सर्तहरूको नियम र शर्तहरूद्वारा बाध्य हुन सहमत हुनुहुन्छ। यदि तपाईं सहमत हुनुहुन्न भने, कृपया प्लेटफर्म प्रयोग नगर्नुहोस्।

• प्लेटफर्मको मात्र प्रयोगले, तपाईंले यो गोपनीयता नीति अनुसार आफ्नो व्यक्तिगत जानकारीको हाम्रो प्रयोग र खुलासामा स्पष्ट रूपमा सहमति दिनुहुन्छ।`
        },
        {
          heading: "१. व्यक्तिगत पहिचान योग्य जानकारीको सङ्कलन",
          content: `जब तपाईं हाम्रो प्लेटफर्म प्रयोग गर्नुहुन्छ, हामी तपाईंको व्यक्तिगत जानकारी सङ्कलन र भण्डारण गर्छौं, जुन तपाईंले समय-समयमा प्रदान गर्नुहुन्छ। यसो गर्नुको हाम्रो प्राथमिक लक्ष्य तपाईंलाई सुरक्षित, कुशल, सहज र अनुकूलित अनुभव प्रदान गर्नु हो।

हामीले सङ्कलन गर्ने जानकारी:

• खाता जानकारी: जब तपाईं हाम्रो पोर्टल मार्फत साइन अप गर्नुहुन्छ वा Google वा Facebook जस्ता सहयोगी API मार्फत साइन इन गर्नुहुन्छ, हामी तपाईंको नाम, इमेल ठेगाना, फोन नम्बर र अन्य दर्ता विवरणहरू सङ्कलन गर्छौं।

• ब्राउजिङ जानकारी: तपाईंले व्यक्तिगत जानकारी प्रकट नगरी प्लेटफर्म ब्राउज गर्न सक्नुहुन्छ। तथापि, हामी तपाईंको व्यवहारको आधारमा निश्चित जानकारी स्वचालित रूपमा ट्र्याक गर्न सक्छौं।

• कुकीहरू: हामी हाम्रो वेब पेज प्रवाह विश्लेषण गर्न, प्रचार प्रभावकारिता मापन गर्न र विश्वास र सुरक्षा प्रवर्द्धन गर्न प्लेटफर्मका केही पृष्ठहरूमा "कुकीहरू" जस्ता डाटा सङ्कलन उपकरणहरू प्रयोग गर्छौं।

• कारोबार जानकारी: यदि तपाईं हामीसँग कारोबार गर्नुहुन्छ (दान/योगदान मार्फत), हामी बिलिङ ठेगाना, भुक्तानी कार्ड विवरणहरू र भुक्तानी उपकरणहरूबाट ट्र्याकिङ जानकारी सङ्कलन गर्छौं।

• सञ्चार जानकारी: यदि तपाईंले हामीलाई व्यक्तिगत पत्राचार पठाउनुहुन्छ, जस्तै इमेल वा पत्रहरू, हामी त्यस्तो जानकारी तपाईंको विशेष फाइलमा सङ्कलन गर्न सक्छौं।

• दान ढाँचाहरू: यदि तपाईं प्लेटफर्ममा दान वा योगदान गर्न रोज्नुहुन्छ भने, हामी तपाईंको दान ढाँचा र प्रयोग व्यवहार बारे जानकारी सङ्कलन गर्छौं।

आवश्यक बनाम वैकल्पिक क्षेत्रहरू: सम्भव भएसम्म, हामी संकेत गर्छौं कि कुन क्षेत्रहरू आवश्यक छन् र कुन वैकल्पिक छन्।`
        },
        {
          heading: "२. जनसांख्यिकीय र प्रोफाइल डाटाको प्रयोग",
          content: `हामी तपाईंले अनुरोध गर्नुभएको सेवाहरू प्रदान गर्न व्यक्तिगत जानकारी प्रयोग गर्छौं।

डाटा प्रयोगको उद्देश्यहरू:

• सेवा प्रावधान: तपाईंले अनुरोध गर्नुभएको सेवाहरू प्रदान गर्न र कारोबारहरू पूरा गर्न
• विवाद समाधान: विवादहरू समाधान गर्न र समस्याहरू समाधान गर्न
• सुरक्षा: सुरक्षित सेवा प्रवर्द्धन गर्न र त्रुटि, जालसाजी र अन्य आपराधिक गतिविधिहरू विरुद्ध पत्ता लगाउन र सुरक्षा गर्न
• भुक्तानी प्रशोधन: हामी वा अधिकृत भुक्तानी गेटवे सुविधा मार्फत पैसा सङ्कलन गर्न
• विश्लेषण: हाम्रो साइटमा होस्ट गरिएका अनुदान सङ्कलनहरूमा प्रयोगकर्ताको रुचि मापन गर्न
• सञ्चार: तपाईंलाई अद्यावधिकहरू, रसिदहरू, प्रमाणपत्रहरू, आगामी घटनाहरू र समाचारपत्रहरू बारे जानकारी दिन
• अनुकूलन: प्लेटफर्ममा तपाईंको अनुभव अनुकूलित गर्न
• प्रवर्तन: हाम्रो नियम र शर्तहरू लागू गर्न

मार्केटिङ अप्ट-आउट: हामी तपाईंलाई कुनै पनि समयमा मार्केटिङ सञ्चारबाट अप्ट-आउट गर्ने क्षमता प्रदान गर्छौं।`
        },
        {
          heading: "३. व्यक्तिगत जानकारीको साझेदारी",
          content: `हामीले साझेदारी नगर्ने जानकारी:

निम्न जानकारी कुनै पनि तेस्रो पक्षसँग साझेदारी गरिने छैन वा कानूनद्वारा आवश्यक बाहेक कुनै पनि व्यक्तिलाई खुलासा गरिने छैन:
• पासवर्डहरू
• बैंक खाता, क्रेडिट कार्ड, डेबिट कार्ड, वा अन्य भुक्तानी उपकरण विवरणहरू जस्ता वित्तीय जानकारी
• यौन झुकाव
• प्लेटफर्मको निरन्तर प्रयोगको लागि आवश्यक नभएको कुनै पनि अन्य संवेदनशील व्यक्तिगत जानकारी

हामीले साझेदारी गर्न सक्ने जानकारी:

• तेस्रो-पक्ष विक्रेताहरू: हामी तपाईंको व्यक्तिगत जानकारी तेस्रो-पक्ष विक्रेताहरू वा हाम्रो कर्पोरेट र सहयोगी संस्थाहरूसँग साझेदारी गर्न सक्छौं।

• अभियान सञ्चालकहरू: हामी अभियान सञ्चालकहरूलाई तपाईंसँग अन्तरक्रिया गर्न र तपाईंलाई रसिद, प्रमाणपत्र, अद्यावधिकहरू र पुरस्कारहरू जस्ता जानकारी पठाउन निश्चित डाटा प्रदान गर्छौं।

• कानूनी आवश्यकताहरू: यदि कानूनद्वारा आवश्यक भएमा वा राम्रो विश्वासमा हामी व्यक्तिगत जानकारी खुलासा गर्न सक्छौं।

• व्यवसाय स्थानान्तरण: यदि हामी अर्को व्यवसाय संस्थासँग मर्ज गर्छौं, अधिग्रहण गरिन्छ, वा पुनर्गठन गर्छौं भने, अधिग्रहण गर्ने संस्थाले तपाईंको व्यक्तिगत जानकारीको सम्बन्धमा यो गोपनीयता नीति पालना गर्न आवश्यक हुनेछ।`
        },
        {
          heading: "४. अन्य साइटहरूमा लिङ्कहरू",
          content: `हाम्रो प्लेटफर्मले अन्य वेबसाइटहरू र एप्लिकेसनहरूमा लिङ्क गर्न सक्छ जसले तपाईंको बारेमा व्यक्तिगत पहिचान योग्य जानकारी सङ्कलन गर्न सक्छ।

सहयोगनेपाल ती लिङ्क गरिएका वेबसाइटहरू र एप्लिकेसनहरूको गोपनीयता अभ्यासहरू वा सामग्रीको लागि जिम्मेवार छैन।

हामी सिफारिस गर्छौं कि तपाईंले हाम्रो प्लेटफर्म मार्फत भ्रमण गर्नुभएको कुनै पनि तेस्रो-पक्ष साइटहरूको गोपनीयता नीतिहरू समीक्षा गर्नुहोस्।`
        },
        {
          heading: "५. सुरक्षा सावधानीहरू र सुरक्षा उल्लङ्घन",
          content: `सुरक्षा उपायहरू:

हाम्रो प्लेटफर्ममा हाम्रो नियन्त्रण अन्तर्गत जानकारीको हानि, दुरुपयोग र परिवर्तन सुरक्षित गर्न कडा सुरक्षा उपायहरू छन्:

• जब तपाईं आफ्नो खाता जानकारी परिवर्तन वा पहुँच गर्नुहुन्छ, हामी सुरक्षित सर्भरको प्रयोग प्रस्ताव गर्छौं
• एकचोटि तपाईंको जानकारी हाम्रो कब्जामा आएपछि, हामी अनधिकृत पहुँच विरुद्ध सुरक्षा गर्दै कडा सुरक्षा दिशानिर्देशहरू पालना गर्छौं
• हाम्रा वेब होस्टहरू, कारोबार सहयोगीहरू र साझेदारहरू सबैले तपाईंको जानकारीलाई कुनै पनि दुरुपयोगबाट सुरक्षित गर्न उद्योग-ग्रेड र मानकीकृत विधिहरू प्रयोग गर्छन्

सुरक्षा उल्लङ्घन रिपोर्ट गर्दै:

यदि कुनै प्रयोगकर्तासँग उनीहरूको डाटा सम्झौता भएको वा साइबर सुरक्षा घटनाको कारण सुरक्षा उल्लङ्घन भएको विश्वास गर्ने पर्याप्त कारण छ भने, तपाईं तुरुन्त तल प्रदान गरिएको सम्पर्क विवरणहरूमा हामीलाई लेख्न सक्नुहुन्छ।

दुरुपयोग रिपोर्ट गर्दै:

प्लेटफर्ममा दुरुपयोग रिपोर्ट गर्न, प्रयोगकर्ताले हाम्रो समर्थन च्यानलहरू मार्फत हामीलाई सम्पर्क गर्न सक्नुहुन्छ।`
        },
        {
          heading: "६. जानकारीको समीक्षा र व्यवस्थापन",
          content: `तपाईंको जानकारी समीक्षा गर्दै:

यदि कुनै पनि समयमा प्रयोगकर्ताले दर्ताको समयमा वा त्यसपछि कुनै पनि समयमा सहयोगनेपाललाई प्रदान गरिएको जानकारी समीक्षा गर्न चाहनुहुन्छ भने, तपाईं यसो गर्न सक्नुहुन्छ:
• आफ्नो खातामा साइन इन गरेर
• आफ्नो प्रोफाइल सेटिङहरूमा नेभिगेट गरेर
• आवश्यकता अनुसार जानकारी संशोधन गरेर

सञ्चारबाट अप्ट आउट गर्दै:

हामी सबै प्रयोगकर्ताहरूलाई हाम्रो अभियान सञ्चालकहरूको तर्फबाट र सामान्यतया हामीबाट गैर-आवश्यक (प्रचारात्मक, मार्केटिङ-सम्बन्धित) सञ्चारहरू प्राप्त गर्नबाट अप्ट-आउट गर्ने अवसर प्रदान गर्छौं।

खाता निष्क्रियता:

यदि तपाईं आफ्नो खाता निष्क्रिय गर्न वा सबै सहयोगनेपालको सूचीहरू र समाचारपत्रहरूबाट आफ्नो सम्पर्क जानकारी हटाउन चाहनुहुन्छ भने, कृपया हामीलाई info@sahayognepal.org मा लेख्नुहोस्।`
        },
        {
          heading: "७. सहयोगनेपालमा विज्ञापनहरू",
          content: `जब तपाईं हाम्रो प्लेटफर्म भ्रमण गर्नुहुन्छ, हामी विज्ञापनहरू प्रदान गर्न तेस्रो-पक्ष विज्ञापन कम्पनीहरू प्रयोग गर्न सक्छौं।

यी कम्पनीहरूले तपाईंलाई रुचिको सामान र सेवाहरूको बारेमा विज्ञापनहरू प्रदान गर्न यो र अन्य वेबसाइटहरू र एप्लिकेसनहरूमा तपाईंको भ्रमणहरूको बारेमा जानकारी प्रयोग गर्न सक्छन्।

विज्ञापनदाताहरूद्वारा कुकी प्रयोग:

तपाईंले प्लेटफर्मका केही पृष्ठहरूमा तेस्रो पक्षहरूद्वारा राखिएका "कुकीहरू" वा अन्य समान उपकरणहरू सामना गर्न सक्नुहुन्छ। हामी तेस्रो पक्षहरूद्वारा कुकीहरूको प्रयोग नियन्त्रण गर्दैनौं।`
        },
        {
          heading: "८. तपाईंको सहमति",
          content: `प्लेटफर्म प्रयोग गरेर र/वा तपाईंको जानकारी प्रदान गरेर, तपाईं सहमति दिनुहुन्छ:

• यो गोपनीयता नीति अनुसार प्लेटफर्ममा तपाईंले खुलासा गर्नुभएको जानकारीको सङ्कलन र प्रयोगमा
• यो गोपनीयता नीति अनुसार तपाईंको जानकारी साझेदारी गर्नमा
• सहयोगनेपाललाई WhatsApp, इमेल, SMS र अन्य सञ्चार माध्यमहरू मार्फत तपाईंलाई सम्पर्क गर्न अनुमति दिनमा

दाता/योगदानकर्ता सहमति:

दाता/योगदानकर्ताहरूले सहयोगनेपाललाई उनीहरूको व्यक्तिगत जानकारी जस्तै नाम, इमेल ठेगाना र सम्पर्क जानकारी सम्बन्धित अभियान सञ्चालक र sahayognepal.org मार्फत गरिएका दानका लाभार्थीहरूलाई साझेदारी गर्न अनुमति दिन्छन्।`
        },
        {
          heading: "९. डाटा प्रतिधारण र भण्डारण",
          content: `जानकारी भण्डारण:

तपाईंले सहयोगनेपाललाई प्रदान गर्नुभएको जानकारी हाम्रो सर्भरहरू र वेब होस्टिङ सेवाहरू मार्फत प्रशोधन, भण्डारण र प्रतिधारण गरिन्छ।

सुरक्षा अनुपालन:

तपाईंको जानकारी व्यवस्थापन गर्ने हाम्रा वेब होस्टहरू र एजेन्सीहरू अनुपालन छन्:
• IS/ISO/IEC 27001 वा समकक्ष मापदण्डहरू
• सुरक्षा प्रविधिहरू र सूचना सुरक्षा व्यवस्थापन प्रणाली आवश्यकताहरू
• डाटा सुरक्षाको लागि उद्योग उत्तम अभ्यासहरू`
        },
        {
          heading: "१०. बालबालिकाको गोपनीयता",
          content: `सहयोगनेपालले जानाजानी १८ वर्ष मुनिको कसैबाट पनि व्यक्तिगत जानकारी सङ्कलन वा माग गर्दैन।

यदि तपाईं १८ वर्ष मुनि हुनुहुन्छ भने, कृपया प्लेटफर्मको लागि दर्ता गर्ने प्रयास नगर्नुहोस् वा हामीलाई आफ्नो बारेमा कुनै व्यक्तिगत जानकारी नपठाउनुहोस्।

यदि हामीले थाहा पाउँछौं कि हामीले १८ वर्ष मुनिको बच्चाबाट व्यक्तिगत जानकारी सङ्कलन गरेका छौं भने, हामी सकेसम्म छिटो त्यो जानकारी मेटाउनेछौं।`
        },
        {
          heading: "११. तपाईंको अधिकारहरू",
          content: `सहयोगनेपालको प्रयोगकर्ताको रूपमा, तपाईंको व्यक्तिगत जानकारी सम्बन्धी निम्न अधिकारहरू छन्:

पहुँचको अधिकार: तपाईंसँग आफ्नो व्यक्तिगत जानकारीको प्रतिलिपिहरू अनुरोध गर्ने अधिकार छ।

सुधारको अधिकार: तपाईंसँग हामीलाई कुनै पनि जानकारी सही गर्न अनुरोध गर्ने अधिकार छ।

मेटाउनको अधिकार: तपाईंसँग हामीलाई तपाईंको व्यक्तिगत जानकारी मेटाउन अनुरोध गर्ने अधिकार छ।

प्रशोधन प्रतिबन्धित गर्ने अधिकार: तपाईंसँग हामीलाई तपाईंको व्यक्तिगत जानकारीको प्रशोधन प्रतिबन्धित गर्न अनुरोध गर्ने अधिकार छ।

यी मध्ये कुनै पनि अधिकारहरू प्रयोग गर्न, कृपया हामीलाई info@sahayognepal.org मा सम्पर्क गर्नुहोस्।`
        },
        {
          heading: "१२. गुनासो अधिकारी",
          content: `नेपाल सूचना प्रविधि ऐन, २०००० र त्यस अन्तर्गत बनाइएका नियमहरू अनुसार, गुनासो अधिकारीको नाम र सम्पर्क विवरणहरू तल प्रदान गरिएको छ:

नाम: गुनासो अधिकारी
संस्था: सहयोगनेपाल
सञ्चालित: Dallytech Pvt Ltd

ठेगाना:
थमेल, काठमाडौं
नेपाल

फोन: +९७७ १ ४१२३४५६
इमेल: info@sahayognepal.org

कार्य समय: आइतबार – शुक्रबार (बिहान ९:०० – साँझ ६:००)

तपाईं निम्नसँग सम्बन्धित कुनै पनि गुनासो, चिन्ता वा प्रश्नहरूको लागि गुनासो अधिकारीलाई सम्पर्क गर्न सक्नुहुन्छ:
• गोपनीयता उल्लङ्घन
• डाटा सुरक्षा चिन्ताहरू
• व्यक्तिगत जानकारीको दुरुपयोग
• प्लेटफर्मसँग सम्बन्धित कुनै पनि अन्य गुनासोहरू`
        }
      ],
      companyInfo: "Dallytech Pvt Ltd द्वारा संचालित प्लेटफर्म",
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
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {currentContent.intro}
            </p>
            <div className="bg-gradient-to-r from-[#D5A021]/10 to-[#8B2325]/10 dark:from-[#D5A021]/20 dark:to-[#8B2325]/20 rounded-lg p-4 border-l-4 border-[#D5A021]">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {currentContent.importantNote}
              </p>
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
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-[#8B2325] dark:text-[#e05759] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {language === 'english' ? 'Your Privacy Matters' : 'तपाईंको गोपनीयता महत्त्वपूर्ण छ'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {language === 'english' 
                  ? 'By using SahayogNepal, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. We are committed to protecting your personal information and using it responsibly. If you have any questions or concerns about how we handle your data, please contact us at info@sahayognepal.org'
                  : 'सहयोगनेपाल प्रयोग गरेर, तपाईंले यो गोपनीयता नीति पढेको, बुझेको र पालना गर्न सहमत भएको स्वीकार गर्नुहुन्छ। हामी तपाईंको व्यक्तिगत जानकारी सुरक्षित गर्न र यसलाई जिम्मेवारीपूर्वक प्रयोग गर्न प्रतिबद्ध छौं। यदि तपाईंसँग हामीले तपाईंको डाटा कसरी ह्यान्डल गर्छौं भन्ने बारे कुनै प्रश्न वा चिन्ता छ भने, कृपया हामीलाई info@sahayognepal.org मा सम्पर्क गर्नुहोस्।'
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
