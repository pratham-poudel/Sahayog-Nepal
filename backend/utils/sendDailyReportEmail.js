const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_BULK_EMAILER;
const zeptoClient = new SendMailClient({ url, token });

/**
 * Send daily campaign performance report
 * @param {Object} campaign - Campaign object
 * @param {Object} user - User/Creator object
 * @param {Object} todayStats - Today's statistics
 */
const sendDailyReportEmail = async (campaign, user, todayStats) => {
  if (!token) {
    throw new Error('ZEPTO_BULK_EMAILER token is not configured');
  }

  // Validate required parameters
  if (!user || !user.email) {
    throw new Error('User or user email is missing');
  }

  if (!campaign || !campaign._id || !campaign.title) {
    throw new Error('Campaign data is incomplete');
  }

  const {
    todayAmount,
    todayDonors,
    totalRaised,
    totalDonors,
    goalAmount,
    percentageComplete,
    daysRemaining,
    topDonationToday,
    averageDonationToday
  } = todayStats;

  const hasDonationsToday = todayDonors > 0;

  try {
    await zeptoClient.sendMail({
      from: {
        address: "reports@sahayognepal.org",
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
      subject: `Daily Report: ${campaign.title}`,
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
            <div style="font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">Daily Campaign Report</div>
            <div style="font-size: 13px; color: #cbd5e1;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            
            <div style="margin-bottom: 28px;">
                <div style="font-size: 14px; color: #64748b;">Hello ${user.name},</div>
            </div>
            
            <div style="margin-bottom: 28px; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 3px solid #1e293b;">
                <div style="font-size: 12px; color: #94a3b8; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 6px;">CAMPAIGN</div>
                <div style="font-size: 16px; font-weight: 600; color: #0f172a;">${campaign.title}</div>
            </div>

            <!-- Today's Stats -->
            <div style="margin-bottom: 32px;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 16px;">TODAY'S ACTIVITY</div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Amount Raised
                        </td>
                        <td style="padding: 14px 0; font-size: 18px; color: #0f172a; text-align: right; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            NPR ${todayAmount > 0 ? todayAmount.toLocaleString('en-NP') : '0'}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            New Donors
                        </td>
                        <td style="padding: 14px 0; font-size: 18px; color: #0f172a; text-align: right; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            ${todayDonors}
                        </td>
                    </tr>
                    ${hasDonationsToday ? `
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Average Donation
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #475569; text-align: right; font-weight: 500; border-bottom: 1px solid #e2e8f0;">
                            NPR ${averageDonationToday.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569;">
                            Top Donation
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #10b981; text-align: right; font-weight: 600;">
                            NPR ${topDonationToday.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    ` : `
                    <tr>
                        <td colspan="2" style="padding: 14px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                            No donations today yet
                        </td>
                    </tr>
                    `}
                </table>
            </div>

            <!-- Overall Progress -->
            <div style="margin-bottom: 32px;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 16px;">CAMPAIGN PROGRESS</div>
                
                <div style="margin-bottom: 16px;">
                    <div style="margin-bottom: 8px; overflow: hidden;">
                        <span style="font-size: 13px; color: #64748b; float: left;">Progress to Goal</span>
                        <span style="font-size: 14px; color: #1e293b; font-weight: 600; float: right;">${percentageComplete}%</span>
                    </div>
                    <div style="background-color: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="background-color: #1e293b; height: 100%; width: ${Math.min(percentageComplete, 100)}%;"></div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #e2e8f0;">
                            Total Raised
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #10b981; text-align: right; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
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
                        <td style="padding: 14px 0; font-size: 16px; color: #475569; text-align: right; font-weight: 500; border-bottom: 1px solid #e2e8f0;">
                            ${totalDonors}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: #475569;">
                            Days Remaining
                        </td>
                        <td style="padding: 14px 0; font-size: 16px; color: #475569; text-align: right; font-weight: 500;">
                            ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}
                        </td>
                    </tr>
                </table>
            </div>

            <!-- CTA -->
            <div style="margin-bottom: 32px; text-align: center;">
                <a href="${process.env.WEBSITE_URL}/dashboard/campaigns/${campaign._id}" 
                   style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                    View Dashboard
                </a>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                <a href="${process.env.WEBSITE_URL}/dashboard/settings" style="color: #64748b; text-decoration: none;">Manage Preferences</a>
            </div>
            <div style="font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Sahayog Nepal. All rights reserved.
            </div>
        </div>

    </div>

</body>
</html>`
    });

    console.log(`[DAILY REPORT EMAIL] Sent to: ${user.email}, Campaign: ${campaign.title}, Today's Amount: ${todayAmount}, Today's Donors: ${todayDonors}`);
    return true;
  } catch (error) {
    console.error(`[DAILY REPORT EMAIL ERROR] Email: ${user.email}, Campaign: ${campaign._id}, Error:`, error.message);
    throw error;
  }
};

module.exports = { sendDailyReportEmail };
