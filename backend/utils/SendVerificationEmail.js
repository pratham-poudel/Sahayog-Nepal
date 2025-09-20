// utils/SendVerificationEmail.js
const { SendMailClient } = require("zeptomail");
const redis = require("../utils/RedisClient.js"); 

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_TOKEN_WELCOME; // keep token in .env

let client = new SendMailClient({url, token});

const sendVerificationEmail = async (email, name, ipAddress = null) => {
    // Check email frequency to prevent abuse
    const emailKey = `verification-email-freq:${email}`;
    const lastEmailTime = await redis.get(emailKey);
    
    if (lastEmailTime) {
        const timeDiff = Date.now() - parseInt(lastEmailTime);
        const minInterval = 24 * 60 * 60 * 1000; // 24 hours minimum between verification emails to same address
        
        if (timeDiff < minInterval) {
            console.warn(`[VERIFICATION EMAIL THROTTLED] Email: ${email}, IP: ${ipAddress}, Last sent: ${Math.ceil((minInterval - timeDiff) / 1000 / 60 / 60)}h ago`);
            return; // Silently skip sending duplicate verification email
        }
    }
    
    try {
        // Using professional HTML template with modern design
        await client.sendMail({
            "from": 
            {
                "address": "noreply@gogoiarmaantech.me",
                "name": "Sahayog Nepal"
            },
            "to": 
            [
                {
                    "email_address": 
                        {
                            "address": `${email}`,
                            "name": `${name}`
                        }
                }
            ],
            "subject": "✓ Account Verification Complete - Premium Partner Status Activated",
            "htmlbody": `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Verified - Sahayog Nepal</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        
                        body { 
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                            line-height: 1.6; 
                            color: #1f2937; 
                            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                            padding: 40px 20px;
                        }
                        
                        .email-container { 
                            max-width: 680px; 
                            margin: 0 auto; 
                            background: #ffffff; 
                            border-radius: 20px; 
                            overflow: hidden; 
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        }
                        
                        /* Header Section */
                        .header { 
                            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
                            padding: 60px 40px 80px;
                            text-align: center;
                            position: relative;
                            overflow: hidden;
                        }
                        
                        .header::before {
                            content: '';
                            position: absolute;
                            top: -50%;
                            right: -50%;
                            width: 200%;
                            height: 200%;
                            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                        }
                        
                        .logo { 
                            color: #ffffff; 
                            font-size: 32px; 
                            font-weight: 700; 
                            margin-bottom: 20px;
                            letter-spacing: -0.5px;
                            position: relative;
                            z-index: 2;
                        }
                        
                        .verification-badge { 
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 80px; 
                            height: 80px; 
                            background: #ffffff; 
                            border-radius: 50%; 
                            margin: 30px auto 20px;
                            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                            position: relative;
                            z-index: 2;
                        }
                        
                        .verification-status { 
                            color: #ffffff; 
                            font-size: 20px; 
                            font-weight: 600;
                            position: relative;
                            z-index: 2;
                        }
                        
                        /* Content Section */
                        .content { 
                            padding: 60px 40px; 
                        }
                        
                        .greeting { 
                            font-size: 28px; 
                            font-weight: 600; 
                            color: #111827; 
                            margin-bottom: 30px;
                            text-align: center;
                        }
                        
                        .message { 
                            font-size: 16px; 
                            line-height: 1.7; 
                            color: #4b5563; 
                            margin-bottom: 35px;
                            text-align: center;
                        }
                        
                        .highlight-card {
                            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                            border: 2px solid #bae6fd;
                            border-radius: 16px;
                            padding: 35px 30px;
                            margin: 40px 0;
                            text-align: center;
                        }
                        
                        .premium-status {
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            background: #1e40af;
                            color: white;
                            padding: 8px 16px;
                            border-radius: 50px;
                            font-weight: 600;
                            font-size: 14px;
                            margin-bottom: 15px;
                        }
                        
                        /* Benefits Section */
                        .benefits { 
                            background: #f8fafc; 
                            border-radius: 16px; 
                            padding: 40px 35px; 
                            margin: 45px 0; 
                        }
                        
                        .benefits-title { 
                            color: #111827; 
                            font-size: 22px; 
                            font-weight: 600; 
                            margin-bottom: 25px;
                            text-align: center;
                        }
                        
                        .benefits-grid {
                            display: grid;
                            gap: 20px;
                        }
                        
                        .benefit-item { 
                            display: flex; 
                            align-items: flex-start; 
                            gap: 16px; 
                            padding: 20px;
                            background: white;
                            border-radius: 12px;
                            border-left: 4px solid #3b82f6;
                        }
                        
                        .benefit-icon { 
                            width: 32px; 
                            height: 32px; 
                            background: #3b82f6; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            flex-shrink: 0;
                            margin-top: 2px;
                        }
                        
                        .benefit-text {
                            font-size: 15px;
                            color: #374151;
                            font-weight: 500;
                        }
                        
                        /* CTA Button */
                        .cta-section {
                            text-align: center;
                            margin: 50px 0;
                        }
                        
                        .cta-button { 
                            display: inline-block; 
                            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                            color: #ffffff; 
                            text-decoration: none; 
                            padding: 18px 40px; 
                            border-radius: 12px; 
                            font-weight: 600; 
                            font-size: 16px;
                            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                            transition: all 0.3s ease;
                        }
                        
                        .cta-button:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
                        }
                        
                        /* Footer */
                        .footer { 
                            background: #1f2937; 
                            color: #d1d5db;
                            padding: 40px; 
                            text-align: center; 
                        }
                        
                        .footer-brand {
                            font-size: 18px;
                            font-weight: 600;
                            color: #ffffff;
                            margin-bottom: 8px;
                        }
                        
                        .footer-tagline {
                            color: #9ca3af;
                            margin-bottom: 25px;
                            font-size: 14px;
                        }
                        
                        .social-links { 
                            margin: 25px 0; 
                        }
                        
                        .social-links a { 
                            color: #60a5fa; 
                            text-decoration: none; 
                            margin: 0 15px; 
                            font-weight: 500;
                            transition: color 0.3s ease;
                        }
                        
                        .social-links a:hover {
                            color: #93c5fd;
                        }
                        
                        .footer-info {
                            margin-top: 30px;
                            padding-top: 25px;
                            border-top: 1px solid #374151;
                            font-size: 12px;
                            color: #9ca3af;
                            line-height: 1.6;
                        }
                        
                        /* Responsive Design */
                        @media (max-width: 600px) {
                            body { padding: 20px 10px; }
                            .email-container { border-radius: 16px; }
                            .header { padding: 40px 20px 60px; }
                            .content { padding: 40px 25px; }
                            .greeting { font-size: 24px; }
                            .benefits { padding: 30px 20px; }
                            .benefit-item { padding: 15px; }
                            .footer { padding: 30px 20px; }
                            .logo { font-size: 28px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <!-- Header Section -->
                        <div class="header">
                            <div class="logo">Sahayog Nepal</div>
                            <div class="verification-badge">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div class="verification-status">Account Verified Successfully</div>
                        </div>
                        
                        <!-- Content Section -->
                        <div class="content">
                            <div class="greeting">Hello ${name}!</div>
                            
                            <div class="highlight-card">
                                <div class="premium-status">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    Premium Verified Partner
                                </div>
                                <h2 style="color: #1e40af; font-size: 24px; font-weight: 700; margin-bottom: 15px;">
                                    Congratulations! Your Account is Now Verified
                                </h2>
                                <p style="color: #1e40af; font-size: 16px; margin: 0;">
                                    You've been upgraded to Premium Verified Partner status, recognizing your commitment to transparency and positive social impact.
                                </p>
                            </div>
                            
                            <div class="message">
                                This verification status is awarded to trusted community members who demonstrate excellence in campaign management and dedication to making a meaningful difference in their communities.
                            </div>
                            
                            <!-- Benefits Section -->
                            <div class="benefits">
                                <div class="benefits-title">Your Premium Verification Benefits</div>
                                <div class="benefits-grid">
                                    <div class="benefit-item">
                                        <div class="benefit-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <div class="benefit-text">Blue verified badge displayed prominently on your profile and all campaigns</div>
                                    </div>
                                    
                                    <div class="benefit-item">
                                        <div class="benefit-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                            </svg>
                                        </div>
                                        <div class="benefit-text">Priority support with dedicated assistance and expedited campaign reviews</div>
                                    </div>
                                    
                                    <div class="benefit-item">
                                        <div class="benefit-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                                            </svg>
                                        </div>
                                        <div class="benefit-text">Enhanced visibility with featured campaign placement and increased exposure</div>
                                    </div>
                                    
                                    <div class="benefit-item">
                                        <div class="benefit-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                            </svg>
                                        </div>
                                        <div class="benefit-text">Access to advanced analytics, insights, and premium partner resources</div>
                                    </div>
                                    
                                    <div class="benefit-item">
                                        <div class="benefit-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                            </svg>
                                        </div>
                                        <div class="benefit-text">Increased donor trust and credibility leading to higher success rates</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="message">
                                <strong>What's Next?</strong><br><br>
                                • Your verified badge is now active on your profile<br>
                                • All future campaigns will display your trusted status<br>
                                • Enjoy priority support for any questions or assistance<br>
                                • Continue creating impactful campaigns with enhanced credibility
                            </div>
                            
                            <div class="cta-section">
                                <a href="https://sahayognepal.com/profile" class="cta-button">
                                    View Your Verified Profile
                                </a>
                            </div>
                        </div>
                        
                        <!-- Footer Section -->
                        <div class="footer">
                            <div class="footer-brand">Sahayog Nepal</div>
                            <div class="footer-tagline">Empowering Communities Through Verified Partnerships</div>
                            
                            <div class="social-links">
                                <a href="#">Facebook</a>
                                <a href="#">Twitter</a>
                                <a href="#">Instagram</a>
                                <a href="#">LinkedIn</a>
                            </div>
                            
                            <div class="footer-info">
                                This verification notification was sent to ${email}<br>
                                For support inquiries: <strong>support@sahayognepal.com</strong><br><br>
                                © ${new Date().getFullYear()} Sahayog Nepal. All rights reserved.<br>
                                Trusted by thousands of verified campaign creators across Nepal
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        
        // Track successful email send
        await redis.set(emailKey, Date.now().toString(), 'EX', 24 * 60 * 60); // 24 hours expiry
        
        console.log(`[VERIFICATION EMAIL SENT] Email: ${email}, Name: ${name}, IP: ${ipAddress}`);
        
    } catch (error) {
        console.error(`[VERIFICATION EMAIL ERROR] Email: ${email}, IP: ${ipAddress}, Error: ${error.message}`);
        throw error;
    }
};

module.exports = { sendVerificationEmail };