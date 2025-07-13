// utils/sendLoginOtp.js
const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_TOKEN_LOGINWITHOTP; // keep token in .env
const zeptoClient = new SendMailClient({ url, token });


const sendLoginWithOtp = async (email, otp) => {
  // Send Login OTP via ZeptoMail
  await zeptoClient.sendMail({
    from: {
      address: "authentication@gogoiarmaantech.me",
      name: "Login OTP • Sahayog Nepal"
    },
    to: [
      {
        email_address: {
          address: email,
          name: email.split('@')[0]
        }
      }
    ],
    subject: "Your SahayogNepal Login OTP Code",
    htmlbody: `<div style="font-family: 'Segoe UI', sans-serif; background-color: #fff; color: #333; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
  <!-- Header / Logo -->
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 26px; font-weight: bold;">
      <span style="color: #8B2325;">Sahayog</span><span style="color: #D5A021;">Nepal</span>
    </h1>
    <p style="font-size: 14px; color: #666;">Secure Login Verification</p>
  </div>

  <!-- OTP Message -->
  <div style="background-color: #fdf8f3; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
    <p style="font-size: 16px; margin-bottom: 10px;">Your Login OTP is:</p>
    <p style="font-size: 32px; font-weight: bold; color: #8B2325; letter-spacing: 2px;">${otp}</p>
    <p style="font-size: 14px; color: #777; margin-top: 10px;">This code is valid for 10 minutes.</p>
  </div>

  <p style="font-size: 14px; text-align: center; color: #555;">
    Use this OTP to complete your login. If you did not request this, please ignore this email.
  </p>

  <!-- Footer -->
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
  <p style="font-size: 12px; color: #888; text-align: center;">
    Sent by Sahayog Nepal • <a href="mailto:support@gogoiarmaantech.me" style="color: #8B2325;">support@gogoiarmaantech.me</a>
  </p>
</div>
`  });

  console.log(`[LOGIN OTP SENT] Email: ${email}, Timestamp: ${new Date().toISOString()}`);
};

module.exports = { sendLoginWithOtp };
