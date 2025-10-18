// utils/sendCampaignVerificationEmail.js
const { SendMailClient } = require("zeptomail");
const redis = require("./RedisClient.js"); 

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_VERIFICATION_CAMPAIGN; // keep token in .env

if (!token) {
    console.error('[CAMPAIGN VERIFICATION EMAIL] WARNING: ZEPTO_VERIFICATION_CAMPAIGN token not set in environment variables');
}

let client = new SendMailClient({url, token});

const sendCampaignVerificationEmail = async (email, name, campaignTitle, campaignId, verificationNotes = '', ipAddress = null) => {
    // Check if token is configured
    if (!token) {
        console.error('[CAMPAIGN VERIFICATION EMAIL ERROR] Email service not configured - missing ZEPTO_VERIFICATION_CAMPAIGN token');
        return;
    }
    
    // Check email frequency to prevent abuse
    const emailKey = `campaign-verification-email-freq:${campaignId}`;
    const lastEmailTime = await redis.get(emailKey);
    
    if (lastEmailTime) {
        const timeDiff = Date.now() - parseInt(lastEmailTime);
        const minInterval = 6 * 60 * 60 * 1000; // 6 hours minimum between verification emails for same campaign
        
        if (timeDiff < minInterval) {
            console.warn(`[CAMPAIGN VERIFICATION EMAIL THROTTLED] Campaign: ${campaignId}, Email: ${email}, Last sent: ${Math.ceil((minInterval - timeDiff) / 1000 / 60)}m ago`);
            return; // Silently skip sending duplicate verification email
        }
    }
    
    // Get campaign URL based on environment
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const campaignUrl = `${baseUrl}/campaign/${campaignId}`;
    
    try {
        await client.sendMail({
            "from": 
            {
                "address": "noreply@sahayognepal.org",
                "name": "Sahayog Nepal - Campaign Verification Team"
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
            "subject": `Campaign Verification Confirmation - ${campaignTitle}`,
            "htmlbody": `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Campaign Verification Receipt</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        
                        body { 
                            font-family: 'Courier New', Courier, monospace;
                            line-height: 1.5; 
                            color: #000; 
                            background: #f5f5f5;
                            padding: 20px;
                        }
                        
                        .receipt { 
                            max-width: 600px; 
                            margin: 0 auto; 
                            background: #fff; 
                            border: 2px solid #000;
                            padding: 0;
                        }
                        
                        .header { 
                            background: #000;
                            color: #fff;
                            padding: 20px;
                            text-align: center;
                            border-bottom: 2px solid #000;
                        }
                        
                        .header h1 {
                            font-size: 24px;
                            font-weight: bold;
                            letter-spacing: 2px;
                        }
                        
                        .header p {
                            font-size: 12px;
                            margin-top: 5px;
                        }
                        
                        .content { 
                            padding: 30px;
                        }
                        
                        .receipt-title {
                            text-align: center;
                            font-size: 18px;
                            font-weight: bold;
                            text-transform: uppercase;
                            border-bottom: 2px dashed #000;
                            padding-bottom: 15px;
                            margin-bottom: 20px;
                        }
                        
                        .field {
                            display: flex;
                            padding: 8px 0;
                            border-bottom: 1px dotted #ccc;
                        }
                        
                        .field-label {
                            font-weight: bold;
                            width: 180px;
                            flex-shrink: 0;
                        }
                        
                        .field-value {
                            flex: 1;
                        }
                        
                        .section {
                            margin: 25px 0;
                        }
                        
                        .section-title {
                            font-weight: bold;
                            font-size: 14px;
                            text-transform: uppercase;
                            border-bottom: 2px solid #000;
                            padding-bottom: 5px;
                            margin-bottom: 15px;
                        }
                        
                        .message-box {
                            background: #f9f9f9;
                            border: 1px solid #000;
                            padding: 15px;
                            margin: 20px 0;
                        }
                        
                        .verification-stamp {
                            text-align: center;
                            margin: 30px 0;
                            padding: 20px;
                            border: 3px double #000;
                        }
                        
                        .stamp-text {
                            font-size: 20px;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        
                        .instructions {
                            background: #f0f0f0;
                            border-left: 4px solid #000;
                            padding: 15px;
                            margin: 20px 0;
                        }
                        
                        .instructions ol {
                            margin-left: 20px;
                        }
                        
                        .instructions li {
                            margin: 8px 0;
                        }
                        
                        .warning {
                            background: #fff;
                            border: 2px solid #000;
                            padding: 15px;
                            margin: 20px 0;
                        }
                        
                        .warning-title {
                            font-weight: bold;
                            text-transform: uppercase;
                            margin-bottom: 10px;
                        }
                        
                        .button {
                            display: block;
                            background: #000;
                            color: #fff;
                            text-align: center;
                            padding: 15px;
                            text-decoration: none;
                            font-weight: bold;
                            text-transform: uppercase;
                            margin: 20px 0;
                            border: 2px solid #000;
                        }
                        
                        .footer { 
                            background: #f5f5f5;
                            border-top: 2px solid #000;
                            padding: 20px;
                            text-align: center;
                            font-size: 11px;
                        }
                        
                        .footer-line {
                            margin: 5px 0;
                        }
                        
                        hr {
                            border: none;
                            border-top: 1px dashed #000;
                            margin: 20px 0;
                        }
                        
                        @media (max-width: 600px) {
                            body { padding: 10px; }
                            .content { padding: 20px; }
                            .field { flex-direction: column; }
                            .field-label { width: 100%; margin-bottom: 5px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <!-- Header -->
                        <div class="header">
                            <h1>SAHAYOGNEPAL</h1>
                            <p>Government Registered Crowdfunding Platform</p>
                            <p>Campaign Verification Department</p>
                        </div>
                        
                        <!-- Content -->
                        <div class="content">
                            <div class="receipt-title">Campaign Verification Receipt</div>
                            
                            <div class="verification-stamp">
                                <div class="stamp-text">✓ VERIFIED & APPROVED</div>
                                <p style="margin-top: 10px; font-size: 12px;">Status: ACTIVE</p>
                            </div>
                            
                            <div class="section">
                                <div class="section-title">Campaign Information</div>
                                <div class="field">
                                    <div class="field-label">Campaign Title:</div>
                                    <div class="field-value">${campaignTitle}</div>
                                </div>
                                <div class="field">
                                    <div class="field-label">Campaign ID:</div>
                                    <div class="field-value">${campaignId}</div>
                                </div>
                                <div class="field">
                                    <div class="field-label">Campaign Creator:</div>
                                    <div class="field-value">${name}</div>
                                </div>
                                <div class="field">
                                    <div class="field-label">Verification Date:</div>
                                    <div class="field-value">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} ${new Date().toLocaleTimeString('en-GB')}</div>
                                </div>
                                <div class="field">
                                    <div class="field-label">Campaign Status:</div>
                                    <div class="field-value"><strong>ACTIVE & ACCEPTING DONATIONS</strong></div>
                                </div>
                            </div>
                            
                            ${verificationNotes ? `
                            <div class="message-box">
                                <strong>VERIFICATION NOTES:</strong><br><br>
                                ${verificationNotes}
                            </div>
                            ` : ''}
                            
                            <hr>
                            
                            <div class="section">
                                <div class="section-title">Next Steps</div>
                                <div class="instructions">
                                    <ol>
                                        <li>Your campaign is now live and visible to all donors</li>
                                        <li>Share campaign link via social media and email</li>
                                        <li>Monitor donations through your dashboard</li>
                                        <li>Provide regular updates to donors</li>
                                        <li>Submit withdrawal request when goal is reached</li>
                                    </ol>
                                </div>
                            </div>
                            
                            <a href="${campaignUrl}" class="button">VIEW LIVE CAMPAIGN</a>
                            
                            <hr>
                            
                            <div class="section">
                                <div class="section-title">Compliance Requirements</div>
                                <div class="warning">
                                    <div class="warning-title">⚠ IMPORTANT - READ CAREFULLY</div>
                                    <ul style="margin-left: 20px; margin-top: 10px;">
                                        <li>Maintain all receipts and proof of expenditure</li>
                                        <li>Provide regular campaign updates</li>
                                        <li>Any misrepresentation may result in legal action</li>
                                        <li>Comply with all Terms of Service</li>
                                        <li>Respond to donor inquiries promptly</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="section">
                                <div class="section-title">Contact Information</div>
                                <div class="field">
                                    <div class="field-label">Campaign Support:</div>
                                    <div class="field-value">campaigns@sahayognepal.org</div>
                                </div>
                                <div class="field">
                                    <div class="field-label">Technical Support:</div>
                                    <div class="field-value">support@sahayognepal.org</div>
                                </div>
                                <div class="field">
                                    <div class="field-label">Campaign URL:</div>
                                    <div class="field-value">${campaignUrl}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="footer">
                            <div class="footer-line"><strong>SAHAYOGNEPAL</strong></div>
                            <div class="footer-line">Registered under Government of Nepal</div>
                            <div class="footer-line">Ministry of Social Development</div>
                            <div class="footer-line" style="margin-top: 10px;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                            <div class="footer-line" style="margin-top: 10px;">Official Campaign Verification Notification</div>
                            <div class="footer-line">Sent to: ${email}</div>
                            <div class="footer-line">© ${new Date().getFullYear()} SahayogNepal. All rights reserved.</div>
                            <div class="footer-line" style="margin-top: 10px; font-size: 10px;">This is an automated notification. Please do not reply to this email.</div>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        
        // Track successful email send
        await redis.set(emailKey, Date.now().toString(), 'EX', 6 * 60 * 60); // 6 hours expiry
        
        console.log(`[CAMPAIGN VERIFICATION EMAIL SENT] Campaign: ${campaignId}, Title: ${campaignTitle}, Email: ${email}, IP: ${ipAddress}`);
        
    } catch (error) {
        console.error(`[CAMPAIGN VERIFICATION EMAIL ERROR] Campaign: ${campaignId}, Email: ${email}, IP: ${ipAddress}`);
        console.error('Full error details:', error);
        // Don't throw error - email failure shouldn't block campaign verification
        console.error('Email send failed but campaign verification will proceed');
    }
};

module.exports = { sendCampaignVerificationEmail };
