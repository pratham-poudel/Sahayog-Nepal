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

  const urgencyConfig = {
    '9-month': { 
      color: '#3b82f6', 
      bgColor: '#eff6ff',
      title: 'Withdrawal Reminder',
      priority: 'REMINDER'
    },
    '11-month': { 
      color: '#f59e0b', 
      bgColor: '#fef3c7',
      title: 'Withdrawal Deadline Approaching',
      priority: 'URGENT'
    },
    'final': { 
      color: '#ef4444', 
      bgColor: '#fee2e2',
      title: 'Final Withdrawal Notice',
      priority: 'CRITICAL'
    }
  };

  const config = urgencyConfig[reminderType];
  
  const deadlineDate = new Date(campaign.endDate);
  deadlineDate.setFullYear(deadlineDate.getFullYear() + 1);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const messages = {
    '9-month': `You have <strong>${daysRemaining} days</strong> remaining to withdraw your campaign funds. Please plan your withdrawal to avoid automatic reallocation.`,
    '11-month': `<strong>Action required:</strong> Only <strong style="color: #f59e0b;">${daysRemaining} days</strong> remaining until the withdrawal deadline. Please withdraw your funds soon to avoid automatic reallocation.`,
    'final': `<strong style="color: #ef4444; font-size: 15px;">FINAL NOTICE:</strong> You have only <strong>${daysRemaining} days</strong> left to withdraw your funds before <strong>${formattedDeadline}</strong>. After this date, funds will be automatically reallocated.`
  };

  try {
    await zeptoClient.sendMail({
      from: {
        address: "withdrawals@sahayognepal.org",
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
      subject: `${config.title} - ${campaign.title}`,
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
            <div style="font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">${config.title}</div>
        </div>

        <!-- Priority Banner -->
        <div style="background-color: ${config.color}; padding: 12px 40px; text-align: center;">
            <div style="font-size: 12px; font-weight: 600; letter-spacing: 1px; color: #ffffff;">${config.priority}</div>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            
            <div style="margin-bottom: 28px;">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 16px;">Hello ${user.name},</div>
                <div style="font-size: 14px; color: #475569; line-height: 1.7;">
                    ${messages[reminderType]}
                </div>
            </div>
            
            <!-- Campaign Info -->
            <div style="margin-bottom: 28px; padding: 20px; background-color: ${config.bgColor}; border-radius: 6px; border-left: 3px solid ${config.color};">
                <div style="font-size: 12px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 6px;">CAMPAIGN</div>
                <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px;">${campaign.title}</div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b;">
                            Available Amount
                        </td>
                        <td style="padding: 8px 0; font-size: 18px; color: #10b981; text-align: right; font-weight: 700;">
                            NPR ${availableAmount.toLocaleString('en-NP')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b;">
                            Campaign Ended
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #475569; text-align: right; font-weight: 500;">
                            ${new Date(campaign.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b;">
                            Withdrawal Deadline
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #ef4444; text-align: right; font-weight: 600;">
                            ${formattedDeadline}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b;">
                            Days Remaining
                        </td>
                        <td style="padding: 8px 0; font-size: 16px; color: ${config.color}; text-align: right; font-weight: 700;">
                            ${daysRemaining} days
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Important Info -->
            <div style="margin-bottom: 32px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 12px;">IMPORTANT INFORMATION</div>
                <div style="font-size: 13px; color: #475569; line-height: 1.7;">
                    According to our policy, campaign funds must be withdrawn within one year of campaign completion. If not withdrawn by the deadline, funds will be automatically reallocated to similar active campaigns.
                </div>
            </div>

            <!-- Action Steps -->
            <div style="margin-bottom: 32px; padding: 20px; background-color: #eff6ff; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <div style="font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 12px;">HOW TO WITHDRAW</div>
                <div style="font-size: 13px; color: #475569; line-height: 1.7;">
                    1. Login to your Sahayog Nepal account<br>
                    2. Go to your campaign dashboard<br>
                    3. Navigate to the withdrawal section<br>
                    4. Complete the withdrawal request form<br>
                    5. Funds will be processed within 5-7 business days
                </div>
            </div>

            <!-- CTA -->
            <div style="margin-bottom: 32px; text-align: center;">
                <a href="${process.env.WEBSITE_URL}/dashboard/campaigns/${campaign._id}" 
                   style="display: inline-block; background-color: ${config.color}; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                    Withdraw Funds Now
                </a>
            </div>

            <div style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                If you have any questions, please contact our support team.
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                <a href="mailto:withdrawals@sahayognepal.org" style="color: #64748b; text-decoration: none;">Contact Support</a>
            </div>
            <div style="font-size: 11px; color: #cbd5e1;">
                © ${new Date().getFullYear()} Sahayog Nepal. All rights reserved.
            </div>
        </div>

    </div>

</body>
</html>`
    });

    console.log(`[WITHDRAWAL REMINDER EMAIL] Sent to: ${user.email}, Campaign: ${campaign.title}, Type: ${reminderType}, Days Remaining: ${daysRemaining}`);
    return true;
  } catch (error) {
    console.error(`[WITHDRAWAL REMINDER EMAIL ERROR] Email: ${user.email}, Campaign: ${campaign._id}, Error:`, error.message);
    throw error;
  }
};

module.exports = { sendWithdrawalReminderEmail };
