// utils/sendTransactionEmail.js
import { SendMailClient } from "zeptomail";
import redis from "../utils/RedisClient.js"; 

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_TOKEN_TRANSACTION; // keep token in .env
const zeptoClient = new SendMailClient({ url, token });

export const sendTransactionEmail = async (email, payment, ipAddress = null) => {
    const {
      donorName,
      totalAmount,
      amount,
      platformFee,
      campaignId,
      transactionId,
      paymentMethod,
      createdAt
    } = payment;
  
    const formattedDate = new Date(createdAt).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
  
    const nameToUse = donorName === "Anonymous" ? "Valued Supporter" : donorName;
  
    try {
        await zeptoClient.sendMail({
            from: {
                address: "transactions@sahayognepal.org",
                name: "Sahayog Nepal - Transaction Confirmation"
            },
      to: [
        {
          email_address: {
            address: email,
            name: nameToUse
          }
        }
      ],
      subject: `Donation Confirmation - ${campaignId.title}`,
      htmlbody: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa;">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #ffffff; padding: 40px 40px 20px 40px; border-bottom: 1px solid #e9ecef;">
            <div style="text-align: center;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 600; color: #2c3e50; letter-spacing: -0.5px;">
                    Sahayog<span style="color: #e67e22;">Nepal</span>
                </h1>
                <p style="margin: 8px 0 0 0; color: #6c757d; font-size: 14px; font-weight: 400;">
                    Building stronger communities together
                </p>
            </div>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            
            <!-- Greeting -->
            <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #2c3e50;">
                    Thank you, ${nameToUse}
                </h2>
                <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #495057;">
                    Your donation to <strong>${campaignId.title}</strong> has been successfully processed. 
                    We appreciate your generous contribution to this important cause.
                </p>
            </div>

            <!-- Transaction Details -->
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 32px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600; color: #2c3e50;">
                    Transaction Summary
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 12px 0; font-size: 15px; color: #495057; border-bottom: 1px solid #e9ecef;">
                            Donation Amount
                        </td>
                        <td style="padding: 12px 0; font-size: 15px; color: #2c3e50; text-align: right; font-weight: 500; border-bottom: 1px solid #e9ecef;">
                            NPR ${amount}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; font-size: 15px; color: #495057; border-bottom: 1px solid #e9ecef;">
                            Platform Fee
                        </td>
                        <td style="padding: 12px 0; font-size: 15px; color: #2c3e50; text-align: right; font-weight: 500; border-bottom: 1px solid #e9ecef;">
                            NPR ${platformFee}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; font-size: 16px; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #2c3e50;">
                            Total Amount
                        </td>
                        <td style="padding: 16px 0; font-size: 16px; color: #2c3e50; text-align: right; font-weight: 600; border-bottom: 2px solid #2c3e50;">
                            NPR ${totalAmount}
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e9ecef;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #6c757d;">
                                Transaction ID
                            </td>
                            <td style="padding: 8px 0; font-size: 14px; color: #495057; text-align: right; font-family: 'Courier New', monospace;">
                                ${transactionId}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #6c757d;">
                                Payment Method
                            </td>
                            <td style="padding: 8px 0; font-size: 14px; color: #495057; text-align: right;">
                                ${paymentMethod.toUpperCase()}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #6c757d;">
                                Date & Time
                            </td>
                            <td style="padding: 8px 0; font-size: 14px; color: #495057; text-align: right;">
                                ${formattedDate}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Impact Message -->
            <div style="margin-bottom: 40px;">
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #495057;">
                    Your contribution makes a meaningful difference in our community. Thank you for being part of our mission 
                    to create positive change and support those in need.
                </p>
            </div>

            <!-- Self-Care Message -->
            <div style="background-color: #f1f8f4; border-left: 4px solid #28a745; padding: 24px; margin-bottom: 32px; border-radius: 0 4px 4px 0;">
                <h4 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #28a745;">
                    Take care of yourself
                </h4>
                <div style="font-size: 15px; line-height: 1.6; color: #495057;">
                    <p style="margin: 0 0 12px 0; font-style: italic;">
                        Call your family<br>
                        Smile at a stranger<br>
                        Write to a friend<br>
                        Appreciate the little things<br>
                        Eat good food
                    </p>
                    <p style="margin: 12px 0 0 0; font-style: italic; font-weight: 500;">
                        Lots of love — may it return to you, eternally.
                    </p>
                </div>
            </div>

            <!-- Closing -->
            <div style="margin-bottom: 32px;">
                <p style="margin: 0; font-size: 16px; color: #495057;">
                    With sincere gratitude,<br>
                    <strong style="color: #2c3e50;">The Sahayog Nepal Team</strong>
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 32px 40px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
                Questions or concerns? Contact our support team at 
                <a href="mailto:support@sahayognepal.org" style="color: #e67e22; text-decoration: none;">
                    support@sahayognepal.org
                </a>
            </p>        </div>

    </div>

</body>
</html>`        });
        
        console.log(`[TRANSACTION EMAIL SENT] Email: ${email}, IP: ${ipAddress}, Transaction: ${transactionId}`);
        
    } catch (emailError) {
        console.error(`[TRANSACTION EMAIL ERROR] Email: ${email}, IP: ${ipAddress}, Error: ${emailError.message}`);
        throw emailError;
    }
};