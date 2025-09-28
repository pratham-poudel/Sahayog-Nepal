// utils/sendAdminOtpEmail.js
const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_TOKEN_OTP; // keep token in .env
const zeptoClient = new SendMailClient({ url, token });

const sendAdminOtpEmail = async (email, otp) => {
  // Send OTP via ZeptoMail for admin authentication
  await zeptoClient.sendMail({
    from: {
      address: "noreply@gogoiarmaantech.me",
      name: "Admin Authentication • Sahayog Nepal"
    },
    to: [
      {
        email_address: {
          address: email,
          name: "Admin"
        }
      }
    ],
    subject: "Admin Login OTP - Sahayog Nepal",
    htmlbody: `<div style="font-family: 'Segoe UI', sans-serif; background-color: #fff; color: #333; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
  <!-- Header / Logo -->
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 26px; font-weight: bold;">
      <span style="color: #8B2325;">Sahayog</span><span style="color: #D5A021;">Nepal</span>
    </h1>
    <p style="font-size: 14px; color: #666;">🔐 Admin Authentication</p>
  </div>

  <!-- OTP Message -->
  <div style="background-color: #fef2f2; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border-left: 4px solid #8B2325;">
    <h2 style="margin: 0 0 10px 0; color: #8B2325;">Admin Login Verification</h2>
    <p style="font-size: 16px; margin-bottom: 10px;">Your One-Time Password (OTP) is:</p>
    <p style="font-size: 32px; font-weight: bold; color: #8B2325; letter-spacing: 2px; background: #fff; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</p>
    <p style="font-size: 14px; color: #777; margin-top: 10px;">⏰ This code is valid for 10 minutes.</p>
  </div>

  <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
    <p style="font-size: 14px; color: #92400e; margin: 0;">
      <strong>🛡️ Security Notice:</strong> This is a sensitive admin login attempt. 
      If you did not initiate this login, please secure your admin account immediately.
    </p>
  </div>

  <!-- Footer -->
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
  <p style="font-size: 12px; color: #888; text-align: center;">
    Sent by Sahayog Nepal Admin Portal • <a href="mailto:support@gogoiarmaantech.me" style="color: #8B2325;">support@gogoiarmaantech.me</a>
  </p>
</div>`
  });
};

module.exports = { sendAdminOtpEmail };