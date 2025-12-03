const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_BULK_EMAILER;
const zeptoClient = new SendMailClient({ url, token });

/**
 * Send campaign completion summary email
 * @param {Object} campaign - Campaign object
 * @param {Object} user - User/Creator object
 * @param {Object} stats - Campaign statistics
 */
const sendCampaignCompletionEmail = async (campaign, user, stats) => {
  if (!token) {
    throw new Error('ZEPTO_BULK_EMAILER token is not configured');
  }

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

  const statusColor = goalAchieved ? '#10b981' : '#f59e0b';
  const statusText = goalAchieved ? 'Goal Achieved' : 'Campaign Ended';

  try {
    await zeptoClient.sendMail({
      from: {
        address: "campaigns@sahayognepal.org",
        name: "Sahayog Nepal"
      },
      to: [
        {
          email_address: {
            address: user.email,
            name: user.name
          }
        }
      ],
      subject: `Campaign Complete: ${campaign.title}`,
      htmlbody: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
    
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px 40px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px;">SAHAYOG NEPAL</div>
            <div style="font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">Campaign Summary</div>
        </div>

        <!-- Status Banner -->
        <div style="background-color: ${statusColor}; padding: 16px 40px; text-align: center;">
            <div style="font-size: 14px; font-weight: 600; color: #ffffff;">${statusText}</div>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            
            <div style="margin-bottom: 28px;">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 12px;">Hello ${user.name},</div>
                <div style="font-size: 14px; color: #475569; line-height: 1.6;">
                    ${goalAchieved 
                      ? 'Congratulations! Your campaign has successfully reached its funding goal.' 
                      : 'Your campaign period has ended. Every contribution has made a meaningful impact.'}
                </div>
            </div>
            
            <div style="margin-bottom: 28px; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 3px solid #1e293b;">
                <div style="font-size: 12px; color: #94a3b8; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 6px;">CAMPAIGN</div>
                <div style="font-size: 16px; font-weight: 600; color: #0f172a;">${campaign.title}</div>
            </div>

            <!-- Final Stats -->
            <div style="margin-bottom: 32px;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 16px;">FINAL RESULTS</div>
                
                <div style="margin-bottom: 16px; padding: 16px; background-color: ${goalAchieved ? '#f0fdf4' : '#fef3c7'}; border-radius: 6px;">
                    <div style="margin-bottom: 8px; overflow: hidden;">
                        <span style="font-size: 13px; color: #64748b; float: left;">Achievement Rate</span>
                        <span style="font-size: 16px; color: #0f172a; font-weight: 700; float: right;">${achievementPercentage}%</span>
                    </div>
                    <div style="background-color: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="background-color: ${statusColor}; height: 100%; width: ${Math.min(achievementPercentage, 100)}%;"></div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Total Raised
                        </td>
                        <td style="padding: 14px 0; font-size: 18px; color: #10b981; text-align: right; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                            NPR ${totalRaised.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Goal Amount
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #475569; text-align: right; font-weight: 500; border-bottom: 1px solid #e2e8f0;">
                            NPR ${goalAmount.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Total Donors
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #0f172a; text-align: right; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            ${totalDonors}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Average Donation
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #475569; text-align: right; font-weight: 500; border-bottom: 1px solid #e2e8f0;">
                            NPR ${averageDonation.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Top Donation
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #10b981; text-align: right; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            NPR ${topDonation.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569;">
                            Campaign Duration
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #475569; text-align: right; font-weight: 500;">
                            ${campaignDuration} days
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Next Steps -->
            <div style="margin-bottom: 32px; padding: 20px; background-color: #eff6ff; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 12px;">NEXT STEPS</div>
                <div style="font-size: 13px; color: #475569; line-height: 1.7;">
                    • Request withdrawal of your funds through the dashboard<br>
                    • Funds must be withdrawn within 1 year of completion<br>
                    • Keep your donors updated on fund utilization
                </div>
            </div>

            <!-- CTA -->
            <div style="margin-bottom: 32px; text-align: center;">
                <a href="${process.env.WEBSITE_URL}/dashboard/campaigns/${campaign._id}" 
                   style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                    Manage Campaign
                </a>
            </div>

            <div style="font-size: 13px; color: #64748b; text-align: center; line-height: 1.6;">
                Thank you for trusting Sahayog Nepal with your campaign.
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                <a href="mailto:campaigns@sahayognepal.org" style="color: #64748b; text-decoration: none;">Need Help?</a>
            </div>
            <div style="font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Sahayog Nepal. All rights reserved.
            </div>
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
