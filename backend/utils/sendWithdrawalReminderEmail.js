const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_BULK_EMAILER;
const zeptoClient = new SendMailClient({ url, token });

/**
 * Send withdrawal reminder email
 * @param {Object} campaign - Campaign object
 * @param {Object} user - User/Creator object
 * @param {String} reminderType - '9-month', '11-month', 'final'
 * @param {Number} daysRemaining - Days remaining until deadline
 * @param {Number} availableAmount - Amount available for withdrawal
 */
const sendWithdrawalReminderEmail = async (campaign, user, reminderType, daysRemaining, availableAmount) => {
  if (!token) {
    throw new Error('ZEPTO_BULK_EMAILER token is not configured');
  }

  const urgencyLevel = {
    '9-month': { color: '#17a2b8', icon: '', title: 'Withdrawal Reminder' },
    '11-month': { color: '#ffc107', icon: '', title: 'Urgent: Withdrawal Deadline Approaching' },
    'final': { color: '#dc3545', icon: '', title: 'Final Notice: Immediate Action Required' }
  };

  const urgency = urgencyLevel[reminderType];
  
  const deadlineDate = new Date(campaign.endDate);
  deadlineDate.setFullYear(deadlineDate.getFullYear() + 1);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const messageByType = {
    '9-month': `
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #495057;">
        This is a friendly reminder that your campaign funds should be withdrawn within one year of campaign completion. 
        You currently have <strong>${daysRemaining} days remaining</strong> to withdraw your funds.
      </p>
    `,
    '11-month': `
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #495057;">
        <strong>Important:</strong> Your withdrawal deadline is approaching soon. You have only 
        <strong style="color: #ffc107;">${daysRemaining} days remaining</strong> to withdraw your campaign funds. 
        Please take action to avoid automatic fund reallocation.
      </p>
    `,
    'final': `
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #dc3545;">
        <strong style="font-size: 18px;">FINAL NOTICE:</strong> This is your last reminder. You have only 
        <strong>${daysRemaining} days remaining</strong> before the withdrawal deadline expires. 
        If funds are not withdrawn by <strong>${formattedDeadline}</strong>, they will be automatically 
        reallocated according to our policy.
      </p>
    `
  };

  try {
    await zeptoClient.sendMail({
      from: {
        address: "withdrawals@sahayognepal.org",
        name: "Sahayog Nepal - Withdrawal Management"
      },
      to: [
        {
          email_address: {
            address: user.email,
            name: user.name
          }
        }
      ],
      subject: `${urgency.title} - ${campaign.title}`,
      htmlbody: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #2c3e50; padding: 40px 40px 30px 40px;">
            <div style="text-align: center;">
                <img src="https://filesatsahayognepal.dallytech.com/misc/SahayogNepal%20(1).png" 
                     alt="Sahayog Nepal" 
                     style="height: 70px; width: auto; margin-bottom: 20px; filter: brightness(0) invert(1);" />
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 500;">
                    Sahayog Nepal
                </h1>
                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 400;">
                    Withdrawal Management Department
                </p>
            </div>
        </div>

        <!-- Urgency Banner -->
        <div style="background-color: ${urgency.color}; padding: 20px 40px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 500;">
                ${urgency.title}
            </h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            
            <!-- Greeting -->
            <div style="margin-bottom: 28px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                    Dear <strong>${user.name}</strong>,
                </p>
                ${messageByType[reminderType]}
            </div>

            <!-- Campaign Details -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 28px; border-left: 4px solid ${urgency.color};">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #2c3e50;">
                    Campaign Information
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                            Campaign Title
                        </td>
                        <td style="padding: 10px 0; font-size: 15px; color: #2c3e50; text-align: right; font-weight: 500; border-bottom: 1px solid #e9ecef;">
                            ${campaign.title}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                            Available Amount
                        </td>
                        <td style="padding: 10px 0; font-size: 16px; color: #28a745; text-align: right; font-weight: 700; border-bottom: 1px solid #e9ecef;">
                            NPR ${availableAmount.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #6c757d; border-bottom: 1px solid #e9ecef;">
                            Campaign End Date
                        </td>
                        <td style="padding: 10px 0; font-size: 15px; color: #2c3e50; text-align: right; font-weight: 500; border-bottom: 1px solid #e9ecef;">
                            ${new Date(campaign.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #6c757d;">
                            Withdrawal Deadline
                        </td>
                        <td style="padding: 10px 0; font-size: 15px; color: ${urgency.color}; text-align: right; font-weight: 700;">
                            ${formattedDeadline}
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Countdown -->
            <div style="text-align: center; padding: 32px; background: linear-gradient(135deg, ${urgency.color}15 0%, ${urgency.color}25 100%); border-radius: 8px; margin-bottom: 28px;">
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #6c757d; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                    Time Remaining
                </p>
                <p style="margin: 0; font-size: 48px; color: ${urgency.color}; font-weight: 700; line-height: 1;">
                    ${daysRemaining}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 18px; color: #495057; font-weight: 600;">
                    DAYS
                </p>
            </div>

            <!-- Policy Information -->
            <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 24px; margin-bottom: 28px;">
                <h4 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 500; color: #856404;">
                    Withdrawal Policy Reminder
                </h4>
                <div style="font-size: 15px; line-height: 1.7; color: #495057;">
                    <p style="margin: 0 0 12px 0;">
                        <strong>If funds are NOT withdrawn within 1 year of campaign completion:</strong>
                    </p>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">
                            Funds will be automatically transferred to another verified needy campaign on the platform 
                            (prioritized to similar category campaigns)
                        </li>
                        <li style="margin-bottom: 8px;">
                            If no suitable active campaign is identified, funds will be transferred to Sahayog Nepal's 
                            main charitable fund "DHUKUTI"
                        </li>
                        <li>
                            This policy ensures donated funds reach beneficiaries promptly and are not left unused
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-bottom: 32px;">
                <a href="${process.env.WEBSITE_URL}/dashboard/campaigns/${campaign._id}/withdraw" 
                   style="display: inline-block; background-color: ${urgency.color}; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    Withdraw Funds Now
                </a>
            </div>

            <!-- Support Information -->
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 0 4px 4px 0; margin-bottom: 28px;">
                <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #1976d2;">
                    Need Help?
                </h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #495057;">
                    If you have any questions about the withdrawal process or need assistance, 
                    please don't hesitate to contact our withdrawal support team.
                </p>
            </div>

            <!-- Closing -->
            <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #495057;">
                    Best regards,
                </p>
                <p style="margin: 0; font-size: 16px; color: #2c3e50; font-weight: 600;">
                    Withdrawal Management Team
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6c757d;">
                    Sahayog Nepal
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #2c3e50; padding: 28px 40px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #ecf0f1;">
                Questions? Contact us at 
                <a href="mailto:withdrawals@sahayognepal.org" style="color: #3498db; text-decoration: none;">
                    withdrawals@sahayognepal.org
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

    console.log(`[WITHDRAWAL REMINDER EMAIL] Sent to: ${user.email}, Campaign: ${campaign.title}, Type: ${reminderType}, Days Remaining: ${daysRemaining}`);
    return true;
  } catch (error) {
    console.error(`[WITHDRAWAL REMINDER EMAIL ERROR] Email: ${user.email}, Campaign: ${campaign._id}, Type: ${reminderType}, Error:`, error.message);
    throw error;
  }
};

module.exports = { sendWithdrawalReminderEmail };
