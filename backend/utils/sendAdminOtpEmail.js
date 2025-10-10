// utils/sendAdminOtpEmail.js
const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_TOKEN_OTP; // keep token in .env
const zeptoClient = new SendMailClient({ url, token });

const sendAdminOtpEmail = async (email, otp) => {
  await zeptoClient.sendMail({
    from: {
      address: "noreply@sahayognepal.org",
      name: "Sahayog Nepal Admin"
    },
    to: [
      {
        email_address: {
          address: email,
          name: "Admin"
        }
      }
    ],
    subject: "Sahayog Nepal | Admin Login OTP",
    htmlbody: `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #ffffff; color: #1f2937; max-width: 520px; margin: 40px auto; padding: 28px; border: 1px solid #e5e7eb; border-radius: 8px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 28px;">
          <img src="https://filesatsahayognepal.dallytech.com/misc/SahayogNepal%20(1).png" alt="Sahayog Nepal" style="height: 70px; width: auto; max-width: 100%; margin-bottom: 10px;" />
          <p style="font-size: 14px; color: #6b7280;">Admin Authentication Portal</p>
        </div>

        <!-- OTP Section -->
        <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #8B2325; text-align: center;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #8B2325;">
            Admin Login Verification
          </h2>
          <p style="font-size: 15px; margin-bottom: 12px;">
            Use the following One-Time Password (OTP) to verify your admin login:
          </p>
          <div style="font-size: 30px; font-weight: bold; letter-spacing: 2px; color: #8B2325; margin: 15px 0;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #6b7280;">
            This OTP is valid for the next 10 minutes.
          </p>
        </div>

        <!-- Security Notice -->
        <div style="margin-top: 24px; padding: 15px; background-color: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 6px;">
          <p style="font-size: 13px; color: #78350f; margin: 0;">
            <strong>Security Notice:</strong> If you did not attempt to log in, please contact the system administrator immediately.
          </p>
        </div>

        <!-- Footer -->
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          © Sahayog Nepal • Admin Access Portal<br />
          <a href="mailto:support@sahayognepal.org" style="color: #8B2325; text-decoration: none;">support@sahayognepal.org</a>
        </p>
      </div>
    `
  });
};

module.exports = { sendAdminOtpEmail };
