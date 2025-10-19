const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_BULK_EMAILER;

if (!token) {
  console.error('[Campaign Completion Email] ZEPTO_BULK_EMAILER token not configured');
}

const zeptoClient = new SendMailClient({ url, token });

/**
 * Send campaign completion summary email
 * @param {Object} campaign - Campaign object
 * @param {Object} user - User/Creator object
 * @param {Object} stats - Campaign statistics
 */
const sendCampaignCompletionEmail = async (campaign, user, stats) => {
  const {
    goalAchieved,
    totalRaised,
    goalAmount,
    achievementPercentage,
    totalDonors,
    averageDonation,
    topDonation,
    campaignDuration
  } = stats;

  const completionStatus = goalAchieved 
    ? '✅ Goal Successfully Achieved' 
    : '⚠️ Campaign Time Ended';

  const statusColor = goalAchieved ? '#28a745' : '#ffc107';
  const statusMessage = goalAchieved
    ? 'Congratulations! Your campaign has successfully reached its funding goal.'
    : 'Your campaign period has ended. While the goal was not fully reached, every contribution makes a difference.';

  try {
    await zeptoClient.sendMail({
      from: {
        address: "campaigns@sahayognepal.org",
        name: "Sahayog Nepal - Campaign Management"
      },
      to: [
        {
          email_address: {
            address: user.email,
            name: user.name
          }
        }
      ],
      subject: `Campaign Summary Report - ${campaign.title}`,
      htmlbody: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campaign Completion Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #2c3e50; padding: 40px 40px 30px 40px;">
            <div style="text-align: center;">
                <img src="https://filesatsahayognepal.dallytech.com/misc/SahayogNepal%20(1).png" 
                     alt="Sahayog Nepal" 
                     style="height: 70px; width: auto; margin-bottom: 20px; filter: brightness(0) invert(1);" />
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 500; letter-spacing: 0.5px;">
                    Campaign Summary Report
                </h1>
                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 400;">
                    Official Summary from Sahayog Nepal
                </p>
            </div>
        </div>

        <!-- Status Banner -->
        <div style="background-color: ${statusColor}; padding: 24px 40px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 500;">
                ${completionStatus}
            </h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            
            <!-- Greeting -->
            <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                    Dear <strong>${user.name}</strong>,
                </p>
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #495057;">
                    ${statusMessage}
                </p>
            </div>

            <!-- Campaign Details -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #2c3e50;">
                    ${campaign.title}
                </h3>
                <p style="margin: 0; font-size: 14px; color: #6c757d;">
                    Campaign ID: ${campaign._id}
                </p>
            </div>

            <!-- Performance Metrics -->
            <div style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; padding-bottom: 12px;">
                    Campaign Performance Summary
                </h3>
                
                <!-- Funding Overview -->
                <div style="background-color: #fff; border: 2px solid #e9ecef; border-radius: 8px; padding: 28px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.5px;">
                        Funding Overview
                    </h4>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; font-size: 15px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                                Goal Amount
                            </td>
                            <td style="padding: 12px 0; font-size: 16px; color: #2c3e50; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">
                                NPR ${goalAmount.toLocaleString('en-NP')}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; font-size: 15px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                                Amount Raised
                            </td>
                            <td style="padding: 12px 0; font-size: 16px; color: #28a745; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">
                                NPR ${totalRaised.toLocaleString('en-NP')}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 16px 0; font-size: 16px; color: #2c3e50; font-weight: 600;">
                                Achievement Rate
                            </td>
                            <td style="padding: 16px 0; font-size: 20px; color: #667eea; text-align: right; font-weight: 700;">
                                ${achievementPercentage}%
                            </td>
                        </tr>
                    </table>

                    <!-- Progress Bar -->
                    <div style="margin-top: 20px; background-color: #e9ecef; border-radius: 10px; height: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${Math.min(achievementPercentage, 100)}%; border-radius: 10px;"></div>
                    </div>
                </div>

                <!-- Donor Statistics -->
                <div style="background-color: #fff; border: 2px solid #e9ecef; border-radius: 8px; padding: 28px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.5px;">
                        Donor Statistics
                    </h4>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; font-size: 15px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                                Total Donors
                            </td>
                            <td style="padding: 12px 0; font-size: 16px; color: #2c3e50; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">
                                ${totalDonors}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; font-size: 15px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                                Average Donation
                            </td>
                            <td style="padding: 12px 0; font-size: 16px; color: #2c3e50; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">
                                NPR ${averageDonation.toLocaleString('en-NP')}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; font-size: 15px; color: #6c757d;">
                                Highest Donation
                            </td>
                            <td style="padding: 12px 0; font-size: 16px; color: #2c3e50; text-align: right; font-weight: 600;">
                                NPR ${topDonation.toLocaleString('en-NP')}
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Campaign Duration -->
                <div style="background-color: #fff; border: 2px solid #e9ecef; border-radius: 8px; padding: 28px;">
                    <h4 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.5px;">
                        Campaign Duration
                    </h4>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; font-size: 15px; color: #6c757d;">
                                Total Days Active
                            </td>
                            <td style="padding: 12px 0; font-size: 16px; color: #2c3e50; text-align: right; font-weight: 600;">
                                ${campaignDuration} days
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 24px; margin-bottom: 32px; border-radius: 0 4px 4px 0;">
                <h4 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 500; color: #1976d2;">
                    Important: Next Steps
                </h4>
                <div style="font-size: 15px; line-height: 1.7; color: #495057;">
                    ${goalAchieved ? `
                    <p style="margin: 0 0 12px 0;">
                        • <strong>Withdrawal:</strong> You can now request withdrawal of the raised funds through your campaign dashboard.
                    </p>
                    <p style="margin: 0 0 12px 0;">
                        • <strong>Deadline:</strong> Please withdraw within 1 year of campaign completion to avoid automatic fund reallocation.
                    </p>
                    <p style="margin: 0;">
                        • <strong>Updates:</strong> Keep your donors informed about how the funds are being utilized.
                    </p>
                    ` : `
                    <p style="margin: 0 0 12px 0;">
                        • Your campaign has been marked as completed as the time period has ended.
                    </p>
                    <p style="margin: 0 0 12px 0;">
                        • You can still withdraw any funds raised through your campaign dashboard.
                    </p>
                    <p style="margin: 0;">
                        • Please withdraw within 1 year to avoid automatic fund reallocation as per our policy.
                    </p>
                    `}
                </div>
            </div>

            <!-- Gratitude Message -->
            <div style="text-align: center; padding: 32px 20px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0 0 16px 0; font-size: 18px; line-height: 1.6; color: #2c3e50; font-weight: 500;">
                    Thank you for trusting Sahayog Nepal with your campaign.
                </p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6c757d;">
                    Together, we're making a difference in our community.
                </p>
            </div>

            <!-- Closing -->
            <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #495057;">
                    With warm regards,
                </p>
                <p style="margin: 0; font-size: 16px; color: #2c3e50; font-weight: 600;">
                    The Sahayog Nepal Team
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6c757d;">
                    Campaign Management Department
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #2c3e50; padding: 32px 40px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #ecf0f1;">
                Need assistance? Contact us at 
                <a href="mailto:campaigns@sahayognepal.org" style="color: #3498db; text-decoration: none;">
                    campaigns@sahayognepal.org
                </a>
            </p>
            <p style="margin: 0; font-size: 13px; color: #95a5a6;">
                © ${new Date().getFullYear()} Sahayog Nepal. All rights reserved.
            </p>
        </div>

    </div>

</body>
</html>`
    });

    console.log(`[CAMPAIGN COMPLETION EMAIL] Sent to: ${user.email}, Campaign: ${campaign.title}, Goal Achieved: ${goalAchieved}`);
    return true;
  } catch (error) {
    console.error(`[CAMPAIGN COMPLETION EMAIL ERROR] Email: ${user.email}, Campaign: ${campaign._id}, Error:`, error.message);
    throw error;
  }
};

module.exports = { sendCampaignCompletionEmail };
