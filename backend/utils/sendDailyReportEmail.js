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
        name: "Sahayog Nepal - Daily Reports"
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
    <title>Daily Campaign Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #fafbfc;">
    
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #2c3e50; padding: 36px 40px 28px 40px;">
            <div style="text-align: center;">
                <img src="https://filesatsahayognepal.dallytech.com/misc/SahayogNepal%20(1).png" 
                     alt="Sahayog Nepal" 
                     style="height: 65px; width: auto; margin-bottom: 18px; filter: brightness(0) invert(1);" />
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 500; letter-spacing: 0.5px;">
                    Daily Campaign Report
                </h1>
                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 400;">
                    ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            
            <!-- Greeting -->
            <div style="margin-bottom: 32px; text-align: center;">
                <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 500; color: #2c3e50;">
                    Hello, ${user.name}
                </h2>
                <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #5a6c7d; font-weight: 400;">
                    ${hasDonationsToday 
                      ? `Today brought wonderful support to your campaign. Here's a summary of the day's impact.` 
                      : `Here's today's summary for your campaign. Keep sharing your story to reach more supporters.`}
                </p>
            </div>

            <!-- Campaign Name -->
            <div style="text-align: center; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 1px solid #e9ecef;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 500; color: #2c3e50;">
                    ${campaign.title}
                </h3>
            </div>

            <!-- Today's Performance -->
            <div style="margin-bottom: 36px;">
                <h3 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 500; color: #2c3e50; text-align: center;">
                    Today's Impact
                </h3>
                
                <!-- Stats Cards -->
                <div style="display: table; width: 100%; margin-bottom: 20px;">
                    <div style="display: table-cell; width: 50%; padding-right: 10px;">
                        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 28px 20px; text-align: center; border: 2px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                                Amount Raised
                            </p>
                            <p style="margin: 0; font-size: 32px; color: #2c3e50; font-weight: 600;">
                                ${todayAmount > 0 ? `₹${todayAmount.toLocaleString('en-NP')}` : '—'}
                            </p>
                        </div>
                    </div>
                    <div style="display: table-cell; width: 50%; padding-left: 10px;">
                        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 28px 20px; text-align: center; border: 2px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                                New Donors
                            </p>
                            <p style="margin: 0; font-size: 32px; color: #28a745; font-weight: 600;">
                                ${todayDonors > 0 ? todayDonors : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                ${hasDonationsToday ? `
                <!-- Additional Today's Stats -->
                <div style="background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin-top: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; font-size: 14px; color: #6c757d; border-bottom: 1px solid #f8f9fa;">
                                Average Donation Today
                            </td>
                            <td style="padding: 10px 0; font-size: 15px; color: #2c3e50; text-align: right; font-weight: 500; border-bottom: 1px solid #f8f9fa;">
                                NPR ${averageDonationToday.toLocaleString('en-NP')}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; font-size: 14px; color: #6c757d;">
                                Highest Donation Today
                            </td>
                            <td style="padding: 10px 0; font-size: 15px; color: #28a745; text-align: right; font-weight: 600;">
                                NPR ${topDonationToday.toLocaleString('en-NP')}
                            </td>
                        </tr>
                    </table>
                </div>
                ` : ''}
            </div>

            <!-- Overall Campaign Progress -->
            <div style="margin-bottom: 36px;">
                <h3 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 500; color: #2c3e50; text-align: center;">
                    Overall Campaign Progress
                </h3>
                
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 28px; border: 1px solid #e9ecef;">
                    <!-- Progress Bar -->
                    <div style="margin-bottom: 20px;">
                        <div style="display: table; width: 100%; margin-bottom: 8px;">
                            <div style="display: table-cell; text-align: left;">
                                <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Progress</span>
                            </div>
                            <div style="display: table-cell; text-align: right;">
                                <span style="font-size: 16px; color: #667eea; font-weight: 600;">${percentageComplete}%</span>
                            </div>
                        </div>
                        <div style="background-color: #e9ecef; border-radius: 10px; height: 12px; overflow: hidden;">
                            <div style="background-color: #2c3e50; height: 100%; width: ${Math.min(percentageComplete, 100)}%; border-radius: 10px;"></div>
                        </div>
                    </div>

                    <!-- Stats Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 12px 0; font-size: 14px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                                Total Raised
                            </td>
                            <td style="padding: 12px 0; font-size: 16px; color: #28a745; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">
                                NPR ${totalRaised.toLocaleString('en-NP')}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; font-size: 14px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                                Goal Amount
                            </td>
                            <td style="padding: 12px 0; font-size: 15px; color: #2c3e50; text-align: right; font-weight: 500; border-bottom: 1px solid #e9ecef;">
                                NPR ${goalAmount.toLocaleString('en-NP')}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; font-size: 14px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                                Total Supporters
                            </td>
                            <td style="padding: 12px 0; font-size: 15px; color: #2c3e50; text-align: right; font-weight: 500; border-bottom: 1px solid #e9ecef;">
                                ${totalDonors}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; font-size: 14px; color: #6c757d;">
                                Days Remaining
                            </td>
                            <td style="padding: 12px 0; font-size: 15px; color: #667eea; text-align: right; font-weight: 600;">
                                ${daysRemaining} days
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Encouragement Message -->
            <div style="background-color: #f8f9fa; border-left: 3px solid #2c3e50; padding: 24px; margin-bottom: 32px; border-radius: 0 6px 6px 0;">
                <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #5a6c7d;">
                    ${hasDonationsToday 
                      ? `Every donation today represents someone who believes in your cause. Thank you for creating positive change in our community.` 
                      : `Keep sharing your story. Every voice matters, and every share brings you closer to your goal. Your cause is important.`}
                </p>
            </div>

            <!-- Action Suggestion -->
            <div style="text-align: center; margin-bottom: 32px;">
                <a href="${process.env.WEBSITE_URL}/dashboard/campaigns/${campaign._id}" 
                   style="display: inline-block; background-color: #2c3e50; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 15px; font-weight: 500;">
                    View Full Dashboard
                </a>
            </div>

            <!-- Closing -->
            <div style="text-align: center; margin-bottom: 28px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #5a6c7d;">
                    With warm wishes for your continued success,
                </p>
                <p style="margin: 0; font-size: 16px; color: #2c3e50; font-weight: 500;">
                    The Sahayog Nepal Team
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 28px 40px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6c757d;">
                Don't want daily reports? 
                <a href="${process.env.WEBSITE_URL}/dashboard/settings/notifications" style="color: #667eea; text-decoration: none;">
                    Manage email preferences
                </a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #95a5a6;">
                © ${new Date().getFullYear()} Sahayog Nepal. All rights reserved.
            </p>
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
