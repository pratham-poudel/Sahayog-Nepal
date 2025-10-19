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
                    <title>Campaign Verification Confirmation</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif;
                            line-height: 1.6; 
                            color: #333; 
                            background: #f4f4f4;
                            padding: 20px;
                            margin: 0;
                        }
                        
                        .container { 
                            max-width: 600px; 
                            margin: 0 auto; 
                            background: #ffffff; 
                            padding: 0;
                        }
                        
                        .header { 
                            background: #2c3e50;
                            color: #ffffff;
                            padding: 30px 20px;
                            text-align: center;
                        }
                        
                        .header h1 {
                            font-size: 24px;
                            margin: 0 0 10px 0;
                        }
                        
                        .header p {
                            font-size: 14px;
                            margin: 5px 0;
                        }
                        
                        .content { 
                            padding: 30px 20px;
                        }
                        
                        .greeting {
                            font-size: 16px;
                            margin-bottom: 20px;
                        }
                        
                        .status-box {
                            background: #e8f5e9;
                            border-left: 4px solid #4caf50;
                            padding: 15px;
                            margin: 20px 0;
                        }
                        
                        .status-box strong {
                            color: #2e7d32;
                            font-size: 16px;
                        }
                        
                        .info-section {
                            margin: 25px 0;
                        }
                        
                        .info-title {
                            font-weight: bold;
                            font-size: 16px;
                            margin-bottom: 10px;
                            color: #2c3e50;
                        }
                        
                        .info-table {
                            width: 100%;
                            margin: 10px 0;
                        }
                        
                        .info-table td {
                            padding: 8px 0;
                            border-bottom: 1px solid #e0e0e0;
                        }
                        
                        .info-table td:first-child {
                            font-weight: 600;
                            width: 40%;
                            color: #555;
                        }
                        
                        .notes-box {
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                        }
                        
                        .notes-box strong {
                            color: #856404;
                        }
                        
                        .button {
                            display: inline-block;
                            background: #2c3e50;
                            color: #ffffff;
                            text-align: center;
                            padding: 12px 30px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                        
                        .button:hover {
                            background: #34495e;
                        }
                        
                        .section {
                            margin: 25px 0;
                        }
                        
                        .section ul, .section ol {
                            margin: 10px 0;
                            padding-left: 25px;
                        }
                        
                        .section li {
                            margin: 8px 0;
                        }
                        
                        .important-box {
                            background: #fff3f3;
                            border-left: 4px solid #f44336;
                            padding: 15px;
                            margin: 20px 0;
                        }
                        
                        .important-box strong {
                            color: #c62828;
                        }
                        
                        .footer { 
                            background: #f9f9f9;
                            border-top: 1px solid #e0e0e0;
                            padding: 20px;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                        }
                        
                        .footer p {
                            margin: 5px 0;
                        }
                        
                        hr {
                            border: none;
                            border-top: 1px solid #e0e0e0;
                            margin: 25px 0;
                        }
                        
                        @media (max-width: 600px) {
                            body { padding: 10px; }
                            .content { padding: 20px 15px; }
                            .info-table td:first-child { width: 100%; display: block; }
                            .info-table td:last-child { width: 100%; display: block; padding-left: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>SahayogNepal</h1>
                            <p>Government Registered Crowdfunding Platform</p>
                            <p>Campaign Verification Department</p>
                        </div>
                        
                        <div class="content">
                            <div class="greeting">
                                Dear ${name},
                            </div>
                            
                            <p>We are pleased to inform you that your campaign has been successfully verified and approved by our team.</p>
                            
                            <div class="status-box">
                                <strong>Campaign Status: VERIFIED AND ACTIVE</strong>
                                <p style="margin: 5px 0 0 0;">Your campaign is now live and accepting donations.</p>
                            </div>
                            
                            <div class="info-section">
                                <div class="info-title">Campaign Details</div>
                                <table class="info-table">
                                    <tr>
                                        <td>Campaign Title:</td>
                                        <td>${campaignTitle}</td>
                                    </tr>
                                    <tr>
                                        <td>Campaign ID:</td>
                                        <td>${campaignId}</td>
                                    </tr>
                                    <tr>
                                        <td>Campaign Creator:</td>
                                        <td>${name}</td>
                                    </tr>
                                    <tr>
                                        <td>Verification Date:</td>
                                        <td>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-GB')}</td>
                                    </tr>
                                    <tr>
                                        <td>Campaign URL:</td>
                                        <td><a href="${campaignUrl}">${campaignUrl}</a></td>
                                    </tr>
                                </table>
                            </div>
                            
                            ${verificationNotes ? `
                            <div class="notes-box">
                                <strong>Verification Notes:</strong>
                                <p style="margin: 10px 0 0 0;">${verificationNotes}</p>
                            </div>
                            ` : ''}
                            
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${campaignUrl}" class="button">View Your Campaign</a>
                            </div>
                            
                            <hr>
                            
                            <div class="section">
                                <div class="info-title">Next Steps</div>
                                <ol>
                                    <li>Your campaign is now visible to all potential donors on our platform</li>
                                    <li>Share your campaign link through social media, email, and other channels</li>
                                    <li>Monitor donations and donor messages through your dashboard</li>
                                    <li>Provide regular updates to keep donors informed about your progress</li>
                                    <li>Submit a withdrawal request once you reach your fundraising goal</li>
                                </ol>
                            </div>
                            
                            <div class="section">
                                <div class="info-title">Important Compliance Requirements</div>
                                <div class="important-box">
                                    <strong>Please Note:</strong>
                                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                        <li>Keep all receipts and proof of expenditure for audit purposes</li>
                                        <li>Provide regular campaign updates to maintain donor trust</li>
                                        <li>Any misrepresentation of facts may result in legal action</li>
                                        <li>Ensure full compliance with our Terms of Service</li>
                                        <li>Respond to donor inquiries in a timely manner</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="section">
                                <div class="info-title">Need Help?</div>
                                <p>Our support team is here to assist you:</p>
                                <ul>
                                    <li><strong>Campaign Support:</strong> campaigns@sahayognepal.org</li>
                                    <li><strong>Technical Support:</strong> support@sahayognepal.org</li>
                                </ul>
                            </div>
                            
                            <p style="margin-top: 30px;">Best regards,<br><strong>SahayogNepal Verification Team</strong></p>
                        </div>
                        
                        <div class="footer">
                            <p><strong>SahayogNepal</strong></p>
                            <p>Registered under Government of Nepal - Ministry of Social Development</p>
                            <p style="margin-top: 10px;">This is an automated notification sent to: ${email}</p>
                            <p>© ${new Date().getFullYear()} SahayogNepal. All rights reserved.</p>
                            <p style="margin-top: 10px; font-size: 11px;">Please do not reply to this email. For assistance, contact support@sahayognepal.org</p>
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
