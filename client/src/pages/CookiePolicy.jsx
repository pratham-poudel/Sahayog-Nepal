import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const CookiePolicy = () => {
  const { theme } = useTheme();
  const [language, setLanguage] = useState('english');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'english' ? 'nepali' : 'english');
  };

  const content = {
    english: {
      title: "Cookie Policy",
      lastUpdated: "Last Updated: October 4, 2025",
      intro: "Welcome to sahayognepal.org. This Cookie Policy explains how we use cookies and similar technologies on our platform to provide you with a better, faster, and safer experience.",
      importantNote: "Before you use or submit any information through or in connection with our Services, please carefully review this Cookie Policy. By using any part of our Services, you consent to the collection and use of information as outlined in this policy.",
      sections: [
        {
          heading: "What Are Cookies?",
          content: `Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.

Types of Cookies We Use:

• Session Cookies: These are temporary cookies that expire when you close your browser or exit the application. They help us maintain your session and remember your actions during a single browsing session.

• Persistent Cookies: These cookies remain on your device for a set period or until you delete them. They help us remember your preferences and settings for future visits, making your experience more personalized and convenient.

• First-Party Cookies: These are set directly by SahayogNepal and can only be read by us. We use these to provide core functionality and improve your experience.

• Third-Party Cookies: These are set by external services we use, such as analytics providers, payment processors, and advertising networks. These help us understand how you interact with our platform and provide relevant content.`
        },
        {
          heading: "How We Use Cookies",
          content: `SahayogNepal uses cookies and similar technologies for various purposes:

Essential Functionality:
• Enable you to navigate and use all features of our platform
• Remember your login status and authentication
• Maintain your session during your visit
• Process donations and transactions securely
• Provide access to secure areas of the platform

Customization and Preferences:
• Remember your language preference (Nepali/English)
• Store your theme preference (light/dark mode)
• Customize elements of the layout and content
• Remember that you have visited us before
• Save your preferences for future visits

Analytics and Performance:
• Identify the number of unique visitors we receive
• Understand how visitors use our platform
• Track how long you spend on different pages
• Identify where you came to our platform from
• Measure the effectiveness of our campaigns
• Improve the accuracy, usability, and popularity of our services

Security and Fraud Prevention:
• Detect and prevent fraud and other criminal activity
• Protect against unauthorized access
• Identify and prevent cyber security incidents
• Ensure the security of your account and transactions

Marketing and Communication:
• Provide you with relevant content and advertisements
• Measure promotional effectiveness
• Customize advertising based on your interests
• Track campaign performance
• Send you relevant updates about campaigns you support`
        },
        {
          heading: "Device and Usage Information",
          content: `When you interact with SahayogNepal through our Services, we automatically collect certain information from your devices:

Device Information:
• Type of internet browser or mobile device you use
• Operating system (Windows, macOS, iOS, Android, etc.)
• Device identifiers and MAC addresses
• Screen resolution and device capabilities
• Mobile device model and manufacturer

Usage Information:
• IP address (which may identify your city and approximate location)
• Pages you visit on our platform
• Time spent on each page
• Links you click on
• Actions you take (donations, campaign creation, etc.)
• Referring website or app
• Search terms used to find our platform

Location Information:
• When you organize a fundraising campaign, we may request your city and province of residence
• Your precise geo-location if you have permitted your mobile device to share this information
• Location information derived from your IP address
• Location information may be visible to other users in connection with your campaign if made public

We use this information to:
• Improve our platform and services
• Understand user behavior and preferences
• Provide personalized content and features
• Detect and prevent fraud
• Comply with legal obligations`
        },
        {
          heading: "Social Media Integration",
          content: `Our platform integrates with various social networking services like Facebook, Twitter, and Google:

Social Media Login:
When you log in to SahayogNepal using your social media accounts, we collect:
• Your name and profile picture
• Email address associated with your social media account
• Friends list or connections (with your permission)
• Other information you permit the social network to share with us

Social Sharing:
You may choose to share your activities on SahayogNepal with your social media connections:
• Posting about campaigns you support
• Sharing your fundraising activities
• Inviting friends to support causes
• Highlighting your donations or campaign milestones

Important Notes:
• The manner in which social media platforms use, store, and disclose your information is governed by their own privacy policies
• We have no control over or liability for the privacy practices of social networking services
• Your social media friends, followers, and connections may be able to view activities you choose to share
• We recommend reviewing the privacy policies of social networking services you connect with

Social Media Cookies:
When you interact with social media features on our platform, the respective social media companies may set their own cookies on your device.`
        },
        {
          heading: "Analytics Services",
          content: `We use third-party analytics services to help us understand how users interact with our platform:

Google Analytics:
We use Google Analytics to:
• Analyze user behavior and demographics
• Track website traffic and performance
• Measure campaign effectiveness
• Understand user journey through our platform
• Identify popular features and content

Information Collected:
• Pages visited and time spent on each page
• Bounce rates and exit pages
• Traffic sources and referral paths
• Device and browser information
• Geographic location (country, city)
• User interactions and events

Opt-Out Options:
• You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on
• You can also adjust your cookie preferences in your browser settings
• Opting out may limit some features of our platform

Other Analytics Tools:
We may use additional analytics providers to:
• Monitor platform performance
• Track conversion rates
• Analyze user engagement
• Identify technical issues
• Improve user experience

All analytics data is used in accordance with this Cookie Policy and our Privacy Policy.`
        },
        {
          heading: "Advertising and Marketing Cookies",
          content: `We use advertising technologies to deliver relevant content and advertisements:

Tailored Advertising:
We may use third-party advertising technologies to:
• Show you relevant ads on our platform
• Display our advertisements on other websites you visit
• Customize ads based on your interests and browsing behavior
• Track the effectiveness of advertising campaigns
• Retarget users who have visited our platform

Information Used for Advertising:
• Your browsing activity on our platform and other websites
• Content you view and interact with
• Searches you perform
• Demographic information (age, gender, location)
• Interests inferred from your behavior

Third-Party Advertising Partners:
We work with various advertising partners, including:
• Google Ads and DoubleClick
• Facebook Pixel
• Other ad networks and servers

These partners may:
• Place cookies or tracking technologies on your device
• Collect information about your browsing activities
• Serve targeted ads across different websites and apps
• Match your information with their own data for ad targeting

Opt-Out Options:
You can opt out of personalized advertising through:
• Network Advertising Initiative (NAI) Consumer Opt-Out: www.networkadvertising.org/choices
• Digital Advertising Alliance (DAA) Consumer Opt-Out: www.aboutads.info/choices
• European Interactive Digital Advertising Alliance (EDAA): www.youronlinechoices.eu
• Google Ads Settings: www.google.com/settings/ads

Please note:
• Opting out does not mean you will stop seeing ads
• You will still see advertisements, but they may be less relevant to your interests
• You may need to opt out on each device and browser you use
• Clearing cookies will remove your opt-out preferences`
        },
        {
          heading: "Mobile Device Tracking",
          content: `If you access SahayogNepal through a mobile device, we collect additional information:

Mobile App Permissions:
Our mobile app may request permission to access:
• Camera (for uploading campaign photos)
• Photo library (for selecting images)
• Location services (for location-based features)
• Contacts (for inviting friends to campaigns)
• Push notifications (for campaign updates)

Mobile Identifiers:
We may collect:
• Device identifiers (UDID, Android ID)
• Advertising identifiers (IDFA, AAID)
• Mobile operating system and version
• App version and build information
• Mobile carrier information

Mobile Communications:
We may communicate with you via:
• SMS text messages
• WhatsApp messages
• Push notifications
• In-app notifications
• Email

Controlling Mobile Tracking:
iOS Devices:
• Go to Settings > Privacy > Tracking
• Toggle off "Allow Apps to Request to Track"
• Go to Settings > Privacy > Advertising
• Enable "Limit Ad Tracking"

Android Devices:
• Go to Settings > Google > Ads
• Enable "Opt out of Ads Personalization"
• Reset your Advertising ID as needed

You can also:
• Manage app permissions in your device settings
• Uninstall the app to stop all data collection
• Disable push notifications in app settings

Note: Your wireless carrier's standard charges, data rates, and fees may apply when accessing our services through mobile devices.`
        },
        {
          heading: "Managing Your Cookie Preferences",
          content: `You have several options to manage cookies and your privacy preferences:

Browser Settings:
Most web browsers allow you to:
• Block all cookies
• Block third-party cookies only
• Delete cookies after each session
• Receive notification when a cookie is set
• View and delete existing cookies

How to Manage Cookies in Different Browsers:

Google Chrome:
1. Click the three dots menu > Settings
2. Navigate to Privacy and Security > Cookies and other site data
3. Choose your preferred cookie settings

Mozilla Firefox:
1. Click the menu button > Settings
2. Select Privacy & Security
3. Under Cookies and Site Data, choose your preferences

Apple Safari:
1. Go to Preferences > Privacy
2. Manage cookies and website data
3. Choose blocking options

Microsoft Edge:
1. Click the three dots menu > Settings
2. Select Privacy, search, and services
3. Manage tracking prevention and cookies

Important Considerations:
• Blocking all cookies may prevent you from using certain features of our platform
• You may need to re-enter information or login credentials
• Your preferences and settings will not be saved
• Some features may not work properly

Cookie Banner:
When you first visit SahayogNepal, you will see a cookie consent banner. You can:
• Accept all cookies
• Reject non-essential cookies
• Customize your cookie preferences
• Change your preferences at any time through the cookie settings link in our footer

Do Not Track (DNT):
• We currently do not respond to Do Not Track signals
• The Internet industry is still working to define DNT standards
• You can use browser settings and opt-out tools to manage tracking

For more information about cookies and how to manage them, visit: www.allaboutcookies.org`
        },
        {
          heading: "Data Retention",
          content: `We retain cookie data for different periods depending on the type and purpose:

Session Cookies:
• Deleted automatically when you close your browser
• Typically last for the duration of your visit

Persistent Cookies:
• First-party cookies: Up to 2 years
• Analytics cookies: Up to 2 years
• Advertising cookies: Up to 13 months
• Preference cookies: Until you delete them or we update our systems

When We Delete Cookie Data:
• When the retention period expires
• When you delete cookies through your browser
• When you request deletion of your data
• When cookies are no longer necessary for their purpose
• When we update or change our cookie practices

Other Information Retention:
• Account information: As long as your account is active, plus applicable legal retention periods
• Transaction records: As required by law (typically 7 years)
• Communication logs: As necessary for customer support and legal compliance
• Aggregated and anonymized data: May be retained indefinitely

You can request deletion of your data by contacting us at info@sahayognepal.org. Please note that some data may need to be retained for legal or operational purposes.`
        },
        {
          heading: "Children's Privacy",
          content: `Our Services are not intended for children under the age of 18:

Age Restrictions:
• We do not knowingly collect information from children under 18
• If you are under 18, please do not use our Services
• We do not knowingly place cookies on devices of children under 18

Parental Controls:
• Parents and guardians can use browser and device controls to restrict cookie placement
• Many browsers offer parental control features
• Mobile devices have restrictions that can be enabled

If We Learn of Child Data Collection:
• We will promptly delete any information collected from children under 18
• We will remove any cookies placed on their devices
• We will take steps to prevent future collection

If you believe a child under 18 has provided information to us, please contact us immediately at info@sahayognepal.org.`
        },
        {
          heading: "Changes to This Cookie Policy",
          content: `We may update this Cookie Policy from time to time to reflect:
• Changes in our cookie practices
• New technologies we adopt
• Changes in applicable laws and regulations
• Improvements to our Services
• User feedback and requests

When We Update This Policy:
• We will update the "Last Updated" date at the top of this page
• We may notify you via email if changes are significant
• We may display a notice on our platform
• Continued use of our Services after changes constitutes acceptance

We encourage you to:
• Review this Cookie Policy periodically
• Check for updates when you notice changes to our platform
• Contact us if you have questions about changes

Previous Versions:
We may maintain previous versions of this Cookie Policy for reference. You can request access to previous versions by contacting us.`
        },
        {
          heading: "Contact Us",
          content: `If you have questions or concerns about our use of cookies, please contact us:

SahayogNepal
Operated by: Dallytech Pvt Ltd

Address:
Thamel, Kathmandu
Nepal

Phone: +977 1 4123456
Email: info@sahayognepal.org

Working Hours: Sunday – Friday (9:00 AM – 6:00 PM)

You can contact us for:
• Questions about our cookie practices
• Requests to exercise your privacy rights
• Technical support with cookie settings
• Concerns about data collection
• Feedback on this Cookie Policy

We aim to respond to all inquiries within 7 business days.

Additional Resources:
• Privacy Policy: /privacy-policy
• Terms of Use: /terms-of-use
• About Cookies: www.allaboutcookies.org
• Browser Cookie Settings: Refer to your browser's help section`
        }
      ],
      companyInfo: "Platform operated by Dallytech Pvt Ltd",
      website: "www.sahayognepal.org"
    },
    nepali: {
      title: "कुकी नीति",
      lastUpdated: "अन्तिम अद्यावधिक: अक्टोबर ४, २०२५",
      intro: "sahayognepal.org मा स्वागत छ। यो कुकी नीतिले हामी कसरी कुकीहरू र समान प्रविधिहरू प्रयोग गर्छौं भनेर व्याख्या गर्दछ।",
      importantNote: "हाम्रो सेवाहरू प्रयोग गर्नु अघि, कृपया यो कुकी नीति ध्यानपूर्वक समीक्षा गर्नुहोस्। हाम्रो सेवाहरूको कुनै पनि भाग प्रयोग गरेर, तपाईं यो नीतिमा उल्लेख गरिए अनुसार जानकारीको सङ्कलन र प्रयोगमा सहमति दिनुहुन्छ।",
      sections: [
        {
          heading: "कुकीहरू के हुन्?",
          content: `कुकीहरू साना पाठ फाइलहरू हुन् जुन तपाईंले वेबसाइट भ्रमण गर्दा तपाईंको कम्प्युटर वा मोबाइल उपकरणमा राखिन्छन्। तिनीहरू वेबसाइटहरूलाई अझ कुशलतापूर्वक काम गर्न र वेबसाइट मालिकहरूलाई जानकारी प्रदान गर्न व्यापक रूपमा प्रयोग गरिन्छ।

हामीले प्रयोग गर्ने कुकीहरूका प्रकारहरू:

• सत्र कुकीहरू: यी अस्थायी कुकीहरू हुन् जुन तपाईंले आफ्नो ब्राउजर बन्द गर्दा वा एप्लिकेसनबाट बाहिर निस्कँदा समाप्त हुन्छन्।

• स्थायी कुकीहरू: यी कुकीहरू तोकिएको अवधिको लागि वा तपाईंले तिनीहरूलाई मेटाउँदासम्म तपाईंको उपकरणमा रहन्छन्।

• पहिलो-पक्ष कुकीहरू: यी सीधा सहयोगनेपालद्वारा सेट गरिन्छन् र हामीद्वारा मात्र पढ्न सकिन्छ।

• तेस्रो-पक्ष कुकीहरू: यी हामीले प्रयोग गर्ने बाह्य सेवाहरूद्वारा सेट गरिन्छन्, जस्तै विश्लेषण प्रदायकहरू, भुक्तानी प्रशोधकहरू र विज्ञापन नेटवर्कहरू।`
        },
        {
          heading: "हामी कुकीहरू कसरी प्रयोग गर्छौं",
          content: `सहयोगनेपालले विभिन्न उद्देश्यका लागि कुकीहरू र समान प्रविधिहरू प्रयोग गर्दछ:

आवश्यक कार्यक्षमता:
• तपाईंलाई हाम्रो प्लेटफर्मको सबै सुविधाहरू नेभिगेट र प्रयोग गर्न सक्षम बनाउन
• तपाईंको लगइन स्थिति र प्रमाणीकरण सम्झन
• तपाईंको भ्रमणको क्रममा तपाईंको सत्र कायम राख्न
• दान र कारोबारहरू सुरक्षित रूपमा प्रशोधन गर्न

अनुकूलन र प्राथमिकताहरू:
• तपाईंको भाषा प्राथमिकता सम्झन (नेपाली/अंग्रेजी)
• तपाईंको थिम प्राथमिकता भण्डारण गर्न (उज्यालो/अँध्यारो मोड)
• लेआउट र सामग्रीका तत्वहरू अनुकूलित गर्न
• तपाईंले पहिले हामीलाई भ्रमण गर्नुभएको सम्झन

विश्लेषण र कार्यसम्पादन:
• हामीले प्राप्त गर्ने अद्वितीय आगन्तुकहरूको संख्या पहिचान गर्न
• आगन्तुकहरूले हाम्रो प्लेटफर्म कसरी प्रयोग गर्छन् भनेर बुझ्न
• तपाईंले विभिन्न पृष्ठहरूमा कति समय बिताउनुहुन्छ भनेर ट्र्याक गर्न
• तपाईं हाम्रो प्लेटफर्ममा कहाँबाट आउनुभयो भनेर पहिचान गर्न

सुरक्षा र जालसाजी रोकथाम:
• जालसाजी र अन्य आपराधिक गतिविधि पत्ता लगाउन र रोक्न
• अनधिकृत पहुँच विरुद्ध सुरक्षा गर्न
• साइबर सुरक्षा घटनाहरू पहिचान र रोक्न`
        },
        {
          heading: "उपकरण र प्रयोग जानकारी",
          content: `जब तपाईं हाम्रो सेवाहरू मार्फत सहयोगनेपालसँग अन्तरक्रिया गर्नुहुन्छ, हामी तपाईंको उपकरणहरूबाट निश्चित जानकारी स्वचालित रूपमा सङ्कलन गर्छौं:

उपकरण जानकारी:
• तपाईंले प्रयोग गर्ने इन्टरनेट ब्राउजर वा मोबाइल उपकरणको प्रकार
• अपरेटिङ सिस्टम (Windows, macOS, iOS, Android, आदि)
• उपकरण पहिचानकर्ताहरू र MAC ठेगानाहरू
• स्क्रिन रिजोल्युसन र उपकरण क्षमताहरू

प्रयोग जानकारी:
• IP ठेगाना (जसले तपाईंको शहर र अनुमानित स्थान पहिचान गर्न सक्छ)
• तपाईंले हाम्रो प्लेटफर्ममा भ्रमण गर्ने पृष्ठहरू
• प्रत्येक पृष्ठमा बिताएको समय
• तपाईंले क्लिक गर्ने लिङ्कहरू
• तपाईंले लिने कार्यहरू (दान, अभियान सिर्जना, आदि)

स्थान जानकारी:
• जब तपाईं अनुदान सङ्कलन अभियान आयोजना गर्नुहुन्छ, हामी तपाईंको शहर र प्रान्त निवासको अनुरोध गर्न सक्छौं
• यदि तपाईंले आफ्नो मोबाइल उपकरणलाई यो जानकारी साझेदारी गर्न अनुमति दिनुभएको छ भने तपाईंको सटीक भू-स्थान`
        },
        {
          heading: "सामाजिक मिडिया एकीकरण",
          content: `हाम्रो प्लेटफर्म Facebook, Twitter र Google जस्ता विभिन्न सामाजिक सञ्जाल सेवाहरूसँग एकीकृत हुन्छ:

सामाजिक मिडिया लगइन:
जब तपाईं आफ्नो सामाजिक मिडिया खाताहरू प्रयोग गरेर सहयोगनेपालमा लगइन गर्नुहुन्छ, हामी सङ्कलन गर्छौं:
• तपाईंको नाम र प्रोफाइल तस्विर
• तपाईंको सामाजिक मिडिया खातासँग सम्बद्ध इमेल ठेगाना
• साथीहरूको सूची वा जडानहरू (तपाईंको अनुमतिसँग)

सामाजिक साझेदारी:
तपाईं सहयोगनेपालमा आफ्ना गतिविधिहरू आफ्ना सामाजिक मिडिया जडानहरूसँग साझेदारी गर्न रोज्न सक्नुहुन्छ:
• तपाईंले समर्थन गर्ने अभियानहरूको बारेमा पोस्ट गर्दै
• तपाईंको अनुदान सङ्कलन गतिविधिहरू साझेदारी गर्दै
• कारणहरू समर्थन गर्न साथीहरूलाई आमन्त्रण गर्दै

महत्त्वपूर्ण नोटहरू:
• सामाजिक मिडिया प्लेटफर्महरूले तपाईंको जानकारी प्रयोग, भण्डारण र खुलासा गर्ने तरिका तिनीहरूको आफ्नै गोपनीयता नीतिहरूद्वारा शासित हुन्छ
• हामीसँग सामाजिक सञ्जाल सेवाहरूको गोपनीयता अभ्यासहरूमाथि कुनै नियन्त्रण वा दायित्व छैन`
        },
        {
          heading: "विश्लेषण सेवाहरू",
          content: `हामी प्रयोगकर्ताहरूले हाम्रो प्लेटफर्मसँग कसरी अन्तरक्रिया गर्छन् भनेर बुझ्न तेस्रो-पक्ष विश्लेषण सेवाहरू प्रयोग गर्छौं:

Google Analytics:
हामी Google Analytics प्रयोग गर्छौं:
• प्रयोगकर्ता व्यवहार र जनसांख्यिकी विश्लेषण गर्न
• वेबसाइट ट्राफिक र कार्यसम्पादन ट्र्याक गर्न
• अभियान प्रभावकारिता मापन गर्न
• हाम्रो प्लेटफर्म मार्फत प्रयोगकर्ता यात्रा बुझ्न

सङ्कलन गरिएको जानकारी:
• भ्रमण गरिएका पृष्ठहरू र प्रत्येक पृष्ठमा बिताएको समय
• बाउन्स दरहरू र बाहिर निस्कने पृष्ठहरू
• ट्राफिक स्रोतहरू र रेफरल मार्गहरू
• उपकरण र ब्राउजर जानकारी
• भौगोलिक स्थान (देश, शहर)

अप्ट-आउट विकल्पहरू:
• तपाईं Google Analytics Opt-out Browser Add-on स्थापना गरेर Google Analytics बाट अप्ट आउट गर्न सक्नुहुन्छ
• तपाईं आफ्नो ब्राउजर सेटिङहरूमा आफ्नो कुकी प्राथमिकताहरू पनि समायोजन गर्न सक्नुहुन्छ`
        },
        {
          heading: "विज्ञापन र मार्केटिङ कुकीहरू",
          content: `हामी प्रासङ्गिक सामग्री र विज्ञापनहरू प्रदान गर्न विज्ञापन प्रविधिहरू प्रयोग गर्छौं:

अनुकूलित विज्ञापन:
हामी तेस्रो-पक्ष विज्ञापन प्रविधिहरू प्रयोग गर्न सक्छौं:
• हाम्रो प्लेटफर्ममा तपाईंलाई प्रासङ्गिक विज्ञापनहरू देखाउन
• तपाईंले भ्रमण गर्नुभएका अन्य वेबसाइटहरूमा हाम्रा विज्ञापनहरू प्रदर्शन गर्न
• तपाईंको रुचि र ब्राउजिङ व्यवहारको आधारमा विज्ञापनहरू अनुकूलित गर्न
• विज्ञापन अभियानहरूको प्रभावकारिता ट्र्याक गर्न

विज्ञापनको लागि प्रयोग गरिएको जानकारी:
• हाम्रो प्लेटफर्म र अन्य वेबसाइटहरूमा तपाईंको ब्राउजिङ गतिविधि
• तपाईंले हेर्ने र अन्तरक्रिया गर्ने सामग्री
• तपाईंले गर्ने खोजहरू
• जनसांख्यिकीय जानकारी (उमेर, लिङ्ग, स्थान)

अप्ट-आउट विकल्पहरू:
तपाईं निम्न मार्फत व्यक्तिगत विज्ञापनबाट अप्ट आउट गर्न सक्नुहुन्छ:
• Network Advertising Initiative (NAI)
• Digital Advertising Alliance (DAA)
• European Interactive Digital Advertising Alliance (EDAA)

कृपया ध्यान दिनुहोस्:
• अप्ट आउट गर्नुको मतलब तपाईंले विज्ञापनहरू देख्न बन्द गर्नुहुने छैन
• तपाईंले अझै पनि विज्ञापनहरू देख्नुहुनेछ, तर तिनीहरू तपाईंको रुचिहरूसँग कम प्रासङ्गिक हुन सक्छन्`
        },
        {
          heading: "मोबाइल उपकरण ट्र्याकिङ",
          content: `यदि तपाईं मोबाइल उपकरण मार्फत सहयोगनेपाल पहुँच गर्नुहुन्छ भने, हामी अतिरिक्त जानकारी सङ्कलन गर्छौं:

मोबाइल एप अनुमतिहरू:
हाम्रो मोबाइल एपले पहुँचको लागि अनुमति अनुरोध गर्न सक्छ:
• क्यामेरा (अभियान फोटोहरू अपलोड गर्नको लागि)
• फोटो पुस्तकालय (छविहरू चयन गर्नको लागि)
• स्थान सेवाहरू (स्थान-आधारित सुविधाहरूको लागि)
• सम्पर्कहरू (अभियानहरूमा साथीहरूलाई आमन्त्रण गर्नको लागि)

मोबाइल पहिचानकर्ताहरू:
हामी सङ्कलन गर्न सक्छौं:
• उपकरण पहिचानकर्ताहरू (UDID, Android ID)
• विज्ञापन पहिचानकर्ताहरू (IDFA, AAID)
• मोबाइल अपरेटिङ सिस्टम र संस्करण

मोबाइल ट्र्याकिङ नियन्त्रण गर्दै:
iOS उपकरणहरू:
• सेटिङहरू > गोपनीयता > ट्र्याकिङमा जानुहोस्
• "Allow Apps to Request to Track" बन्द गर्नुहोस्

Android उपकरणहरू:
• सेटिङहरू > Google > Ads मा जानुहोस्
• "Opt out of Ads Personalization" सक्षम पार्नुहोस्`
        },
        {
          heading: "तपाईंको कुकी प्राथमिकताहरू व्यवस्थापन गर्दै",
          content: `तपाईंसँग कुकीहरू र तपाईंको गोपनीयता प्राथमिकताहरू व्यवस्थापन गर्न धेरै विकल्पहरू छन्:

ब्राउजर सेटिङहरू:
अधिकांश वेब ब्राउजरहरूले तपाईंलाई अनुमति दिन्छन्:
• सबै कुकीहरू अवरुद्ध गर्न
• केवल तेस्रो-पक्ष कुकीहरू अवरुद्ध गर्न
• प्रत्येक सत्र पछि कुकीहरू मेटाउन
• कुकी सेट हुँदा सूचना प्राप्त गर्न

विभिन्न ब्राउजरहरूमा कुकीहरू कसरी व्यवस्थापन गर्ने:

Google Chrome:
1. तीन थोप्ला मेनु > सेटिङहरू क्लिक गर्नुहोस्
2. गोपनीयता र सुरक्षा > कुकीहरू र अन्य साइट डाटामा नेभिगेट गर्नुहोस्

Mozilla Firefox:
1. मेनु बटन > सेटिङहरू क्लिक गर्नुहोस्
2. गोपनीयता र सुरक्षा चयन गर्नुहोस्

Apple Safari:
1. प्राथमिकताहरू > गोपनीयतामा जानुहोस्
2. कुकीहरू र वेबसाइट डाटा व्यवस्थापन गर्नुहोस्

महत्त्वपूर्ण विचारहरू:
• सबै कुकीहरू अवरुद्ध गर्नाले तपाईंलाई हाम्रो प्लेटफर्मका केही सुविधाहरू प्रयोग गर्नबाट रोक्न सक्छ
• तपाईंले जानकारी वा लगइन प्रमाणहरू पुन: प्रविष्ट गर्नु पर्ने हुन सक्छ

थप जानकारीको लागि: www.allaboutcookies.org भ्रमण गर्नुहोस्`
        },
        {
          heading: "डाटा प्रतिधारण",
          content: `हामी प्रकार र उद्देश्यको आधारमा विभिन्न अवधिको लागि कुकी डाटा राख्छौं:

सत्र कुकीहरू:
• तपाईंले आफ्नो ब्राउजर बन्द गर्दा स्वचालित रूपमा मेटाइन्छ
• सामान्यतया तपाईंको भ्रमणको अवधिको लागि रहन्छ

स्थायी कुकीहरू:
• पहिलो-पक्ष कुकीहरू: २ वर्षसम्म
• विश्लेषण कुकीहरू: २ वर्षसम्म
• विज्ञापन कुकीहरू: १३ महिनासम्म
• प्राथमिकता कुकीहरू: जबसम्म तपाईंले तिनीहरूलाई मेटाउनुहुन्न

हामीले कुकी डाटा कहिले मेटाउँछौं:
• जब प्रतिधारण अवधि समाप्त हुन्छ
• जब तपाईं आफ्नो ब्राउजर मार्फत कुकीहरू मेटाउनुहुन्छ
• जब तपाईं आफ्नो डाटा मेटाउन अनुरोध गर्नुहुन्छ

तपाईं info@sahayognepal.org मा हामीलाई सम्पर्क गरेर आफ्नो डाटा मेटाउन अनुरोध गर्न सक्नुहुन्छ।`
        },
        {
          heading: "बालबालिकाको गोपनीयता",
          content: `हाम्रा सेवाहरू १८ वर्ष मुनिका बालबालिकाहरूका लागि अभिप्रेत छैनन्:

उमेर प्रतिबन्धहरू:
• हामी जानाजानी १८ वर्ष मुनिका बालबालिकाहरूबाट जानकारी सङ्कलन गर्दैनौं
• यदि तपाईं १८ वर्ष मुनि हुनुहुन्छ भने, कृपया हाम्रो सेवाहरू प्रयोग नगर्नुहोस्
• हामी जानाजानी १८ वर्ष मुनिका बालबालिकाहरूको उपकरणहरूमा कुकीहरू राख्दैनौं

यदि तपाईंलाई विश्वास छ कि १८ वर्ष मुनिको बच्चाले हामीलाई जानकारी प्रदान गरेको छ भने, कृपया तुरुन्त हामीलाई info@sahayognepal.org मा सम्पर्क गर्नुहोस्।`
        },
        {
          heading: "यो कुकी नीतिमा परिवर्तनहरू",
          content: `हामी समय-समयमा यो कुकी नीति अद्यावधिक गर्न सक्छौं:
• हाम्रो कुकी अभ्यासहरूमा परिवर्तनहरू प्रतिबिम्बित गर्न
• हामीले अपनाउने नयाँ प्रविधिहरू
• लागू कानून र नियमहरूमा परिवर्तनहरू
• हाम्रा सेवाहरूमा सुधारहरू

जब हामी यो नीति अद्यावधिक गर्छौं:
• हामी यस पृष्ठको शीर्षमा "अन्तिम अद्यावधिक" मिति अद्यावधिक गर्नेछौं
• यदि परिवर्तनहरू महत्त्वपूर्ण छन् भने हामी तपाईंलाई इमेल मार्फत सूचित गर्न सक्छौं
• परिवर्तन पछि हाम्रो सेवाहरूको निरन्तर प्रयोगले स्वीकृति गठन गर्दछ

हामी तपाईंलाई प्रोत्साहित गर्छौं:
• यो कुकी नीति आवधिक रूपमा समीक्षा गर्नुहोस्
• यदि तपाईंसँग परिवर्तनहरू बारे प्रश्नहरू छन् भने हामीलाई सम्पर्क गर्नुहोस्`
        },
        {
          heading: "हामीलाई सम्पर्क गर्नुहोस्",
          content: `यदि तपाईंसँग हाम्रो कुकीहरूको प्रयोगको बारेमा प्रश्न वा चिन्ताहरू छन् भने, कृपया हामीलाई सम्पर्क गर्नुहोस्:

सहयोगनेपाल
सञ्चालित: Dallytech Pvt Ltd

ठेगाना:
थमेल, काठमाडौं
नेपाल

फोन: +९७७ १ ४१२३४५६
इमेल: info@sahayognepal.org

कार्य समय: आइतबार – शुक्रबार (बिहान ९:०० – साँझ ६:००)

तपाईं हामीलाई सम्पर्क गर्न सक्नुहुन्छ:
• हाम्रो कुकी अभ्यासहरू बारे प्रश्नहरू
• तपाईंको गोपनीयता अधिकारहरू प्रयोग गर्न अनुरोधहरू
• कुकी सेटिङहरूसँग प्राविधिक समर्थन
• डाटा सङ्कलन बारे चिन्ताहरू

अतिरिक्त स्रोतहरू:
• गोपनीयता नीति: /privacy-policy
• उपयोगका सर्तहरू: /terms-of-use
• कुकीहरू बारे: www.allaboutcookies.org`
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
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#8B2325] dark:text-[#e05759] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {currentContent.importantNote}
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
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-[#8B2325] dark:text-[#e05759] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {language === 'english' ? 'Your Cookie Preferences Matter' : 'तपाईंको कुकी प्राथमिकताहरू महत्त्वपूर्ण छन्'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {language === 'english' 
                  ? 'You have control over your cookie preferences. You can manage or disable cookies at any time through your browser settings. However, please note that disabling certain cookies may limit your ability to use some features of our platform. If you have questions about our cookie practices, contact us at info@sahayognepal.org'
                  : 'तपाईंसँग आफ्नो कुकी प्राथमिकताहरूमाथि नियन्त्रण छ। तपाईं आफ्नो ब्राउजर सेटिङहरू मार्फत कुनै पनि समयमा कुकीहरू व्यवस्थापन वा अक्षम गर्न सक्नुहुन्छ। तथापि, कृपया ध्यान दिनुहोस् कि केही कुकीहरू अक्षम गर्नाले हाम्रो प्लेटफर्मका केही सुविधाहरू प्रयोग गर्ने तपाईंको क्षमतालाई सीमित गर्न सक्छ। यदि तपाईंसँग हाम्रो कुकी अभ्यासहरू बारे प्रश्नहरू छन् भने, हामीलाई info@sahayognepal.org मा सम्पर्क गर्नुहोस्।'
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiePolicy;
