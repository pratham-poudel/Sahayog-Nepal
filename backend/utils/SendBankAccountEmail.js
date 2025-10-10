    // utils/sendBankAccountEmail.js
const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_TOKEN_WALLETMAILER;
const zeptoClient = new SendMailClient({ url, token });

const sendBankAccountEmail = async (email, data) => {
    try {
        await zeptoClient.sendMail({
            from: {
                address: "Accounts@sahayognepal.org",
                name: "Submission Successful • Sahayog Nepal"
            },
            to: [
                {
                    email_address: {
                        address: email,
                        name: email.split('@')[0]
                    }
                }
            ],        subject: "Bank Account Verification Submitted - Sahayog Nepal",
        htmlbody: `<div style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #cccccc;">
  
  <!-- Header -->
  <div style="border-bottom: 2px solid #8B2325; padding-bottom: 20px; margin-bottom: 30px; position: relative;">
    <div style="float: left; width: 60%;">
      <h1 style="margin: 0; font-size: 24px; font-weight: normal; color: #333333;">
        <span style="color: #8B2325;">SAHAYOG</span> <span style="color: #D5A021;">NEPAL</span>
      </h1>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #666666;">Bank Account Verification</p>
    </div>
    <div style="float: right; width: 35%; text-align: right;">
      <img src="https://barcode.tec-it.com/barcode.ashx?data=BA${Date.now()}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&codepage=&qunit=Mm&quiet=0&width=150&height=40" 
           alt="Barcode" 
           style="max-width: 150px; height: 40px; border: 1px solid #cccccc;">
      <p style="margin: 5px 0 0 0; font-size: 10px; color: #999999; font-family: monospace;">BA${Date.now()}</p>
    </div>
    <div style="clear: both;"></div>
  </div>

  <!-- Status -->
  <div style="margin-bottom: 30px;">
    <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #333333;">Verification Status: UNDER REVIEW</h2>
    <p style="margin: 0; font-size: 14px; color: #666666;">Your bank account information has been received and is currently under verification.</p>
  </div>

  <!-- Account Details -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">SUBMITTED ACCOUNT DETAILS</h3>
    
    <table style="width: 100%; border-collapse: collapse;">      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333; width: 35%;">Account Holder:</td>
        <td style="padding: 8px 0; color: #666666;">${data.accountName || 'N/A'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Bank Name:</td>
        <td style="padding: 8px 0; color: #666666;">${data.bankName || 'N/A'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Account Number:</td>
        <td style="padding: 8px 0; color: #666666; font-family: monospace;">****${data.accountNumber ? data.accountNumber.slice(-4) : 'XXXX'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Document Type:</td>
        <td style="padding: 8px 0; color: #666666;">${data.documentType ? data.documentType.charAt(0).toUpperCase() + data.documentType.slice(1) : 'N/A'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Document Number:</td>
        <td style="padding: 8px 0; color: #666666; font-family: monospace;">****${data.documentNumber ? data.documentNumber.slice(-4) : 'XXXX'}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Submission Date:</td>
        <td style="padding: 8px 0; color: #666666;">${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</td>
      </tr>
    </table>
  </div>

  <!-- Verification Timeline -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">VERIFICATION PROCESS</h3>
    <ol style="margin: 0; padding-left: 20px; color: #666666; line-height: 1.6;">
      <li><strong>Document Review:</strong> Our team verifies your submitted documents and information</li>
      <li><strong>Identity Verification:</strong> Cross-checking with official records for authenticity</li>
      <li><strong>Bank Account Validation:</strong> Confirming account details with banking partner</li>
      <li><strong>Final Approval:</strong> Account activation and confirmation email</li>
    </ol>
  </div>

  <!-- Processing Time -->
  <div style="background-color: #e8f5e8; padding: 20px; margin-bottom: 30px; border-left: 3px solid #28a745;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #155724;">EXPECTED PROCESSING TIME</h4>
    <p style="margin: 0; font-size: 13px; color: #155724; line-height: 1.5;">
      <strong>2-3 Business Days:</strong> Standard verification process<br>
      <strong>Email Notification:</strong> You will receive updates at each stage<br>
      <strong>Support Available:</strong> Contact us if you need assistance during verification
    </p>
  </div>

  <!-- Important Information -->
  <div style="background-color: #f8f9fa; padding: 20px; margin-bottom: 30px; border-left: 3px solid #8B2325;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">IMPORTANT REMINDERS</h4>
    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #666666; line-height: 1.5;">
      <li>Ensure all bank account details are accurate to avoid processing delays</li>
      <li>Keep your documents ready in case additional verification is needed</li>
      <li>Do not submit duplicate requests - this may slow down the process</li>
      <li>Check your email regularly for verification status updates</li>
    </ul>
  </div>

  <!-- Next Steps -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">WHAT HAPPENS NEXT?</h3>
    <p style="margin: 0 0 15px 0; font-size: 14px; color: #666666; line-height: 1.6;">
      Our verification team will carefully review your submitted information and documents. You will receive email notifications at each stage of the process:
    </p>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666666; line-height: 1.6;">
      <li><strong>Under Review:</strong> Verification process has started</li>
      <li><strong>Additional Info Required:</strong> If any clarification is needed</li>
      <li><strong>Verified:</strong> Your account has been successfully verified</li>
      <li><strong>Activated:</strong> Account is ready for transactions</li>
    </ul>
  </div>

  <p style="margin: 0 0 30px 0; font-size: 14px; color: #666666;">
    Thank you for choosing Sahayog Nepal. If you have any questions about your bank account verification, 
    please contact our support team with your reference number.
  </p>

  <!-- Footer -->
  <div style="border-top: 1px solid #cccccc; padding-top: 20px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999999;">
      Sahayog Nepal - Empowering Communities Through Collective Support<br>
      Email: <a href="mailto:support@sahayognepal.org" style="color: #8B2325; text-decoration: none;">support@sahayognepal.org</a><br>
      <span style="font-size: 10px; color: #cccccc;">This is an automated message. Please do not reply to this email.</span>
    </p>
  </div>
</div>`});

    } catch (error) {
        console.error("Error sending bank account verification email:", error);
        throw new Error("Failed to send verification email");
    }
};

const sendBankAccountStatusEmail = async (email, statusData) => {
    const { 
        status,
        accountName,
        bankName,
        accountNumber,
        documentType,
        rejectionReason,
        adminNotes,
        verificationDate,
        verifiedBy
    } = statusData;

    // Define status-specific content
    const statusConfig = {
        verified: {
            subject: "Bank Account Verified Successfully - Sahayog Nepal",
            headerText: "Verification Status: VERIFIED",
            statusMessage: "Congratulations! Your bank account has been successfully verified and activated.",
            statusColor: "#28a745",
            statusBg: "#e8f5e8"
        },
        rejected: {
            subject: "Bank Account Verification - Action Required - Sahayog Nepal", 
            headerText: "Verification Status: REJECTED",
            statusMessage: "Your bank account verification has been rejected. Please review the details below.",
            statusColor: "#dc3545",
            statusBg: "#f8d7da"
        },
        under_review: {
            subject: "Bank Account Under Review - Sahayog Nepal",
            headerText: "Verification Status: UNDER REVIEW", 
            statusMessage: "Your bank account is currently under detailed review by our verification team.",
            statusColor: "#fd7e14",
            statusBg: "#fff3cd"
        }
    };

    const config = statusConfig[status] || {
        subject: "Bank Account Status Update - Sahayog Nepal",
        headerText: "Verification Status: UNKNOWN",
        statusMessage: "Your bank account status has been updated.",
        statusColor: "#6c757d",
        statusBg: "#f8f9fa"
    };

    try {
        await zeptoClient.sendMail({
            from: {
                address: "Accounts@sahayognepal.org",
                name: "Verification Update • Sahayog Nepal"
            },
            to: [
                {
                    email_address: {
                        address: email,
                        name: email.split('@')[0]
                    }
                }
            ],
            subject: config.subject,
            htmlbody: `<div style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #cccccc;">
  
  <!-- Header -->
  <div style="border-bottom: 2px solid #8B2325; padding-bottom: 20px; margin-bottom: 30px; position: relative;">
    <div style="float: left; width: 60%;">
      <h1 style="margin: 0; font-size: 24px; font-weight: normal; color: #333333;">
        <span style="color: #8B2325;">SAHAYOG</span> <span style="color: #D5A021;">NEPAL</span>
      </h1>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #666666;">Bank Account Verification Update</p>
    </div>
    <div style="float: right; width: 35%; text-align: right;">
      <img src="https://barcode.tec-it.com/barcode.ashx?data=BV${Date.now()}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&codepage=&qunit=Mm&quiet=0&width=150&height=40" 
           alt="Barcode" 
           style="max-width: 150px; height: 40px; border: 1px solid #cccccc;">
      <p style="margin: 5px 0 0 0; font-size: 10px; color: #999999; font-family: monospace;">BV${Date.now()}</p>
    </div>
    <div style="clear: both;"></div>
  </div>

  <!-- Status -->
  <div style="margin-bottom: 30px; background-color: ${config.statusBg}; padding: 20px; border-left: 4px solid ${config.statusColor};">
    <h2 style="margin: 0 0 10px 0; font-size: 18px; color: ${config.statusColor};">${config.headerText}</h2>
    <p style="margin: 0; font-size: 14px; color: #666666;">${config.statusMessage}</p>
    ${verificationDate ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">Updated on: ${new Date(verificationDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>` : ''}
  </div>

  <!-- Account Details -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">ACCOUNT DETAILS</h3>
      <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333; width: 35%;">Account Holder:</td>
        <td style="padding: 8px 0; color: #666666;">${accountName || 'N/A'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Bank Name:</td>
        <td style="padding: 8px 0; color: #666666;">${bankName || 'N/A'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Account Number:</td>
        <td style="padding: 8px 0; color: #666666; font-family: monospace;">****${accountNumber ? accountNumber.slice(-4) : 'XXXX'}</td>
      </tr><tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Document Type:</td>
        <td style="padding: 8px 0; color: #666666;">${documentType ? documentType.charAt(0).toUpperCase() + documentType.slice(1) : 'N/A'}</td>
      </tr>
      ${verifiedBy ? `<tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Verified By:</td>
        <td style="padding: 8px 0; color: #666666;">${verifiedBy}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Status:</td>
        <td style="padding: 8px 0; color: ${config.statusColor}; font-weight: bold;">${status ? status.toUpperCase().replace('_', ' ') : 'UNKNOWN'}</td>
      </tr>
    </table>
  </div>

  ${rejectionReason ? `<!-- Rejection Reason -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">REJECTION REASON</h3>
    <div style="background-color: #f8d7da; padding: 15px; border-left: 3px solid #dc3545;">
      <p style="margin: 0; font-size: 14px; color: #721c24; line-height: 1.5;">${rejectionReason}</p>
    </div>
  </div>` : ''}

  ${adminNotes ? `<!-- Admin Notes -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">ADDITIONAL NOTES</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-left: 3px solid #8B2325;">
      <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.5;">${adminNotes}</p>
    </div>
  </div>` : ''}

  ${status === 'verified' ? `<!-- Success Information -->
  <div style="background-color: #d4edda; padding: 20px; margin-bottom: 30px; border-left: 3px solid #28a745;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #155724;">ACCOUNT ACTIVATED</h4>
    <p style="margin: 0; font-size: 13px; color: #155724; line-height: 1.5;">
      Your bank account has been successfully verified and is now active. You can now use this account for withdrawals 
      and other transactions within the Sahayog Nepal platform. Welcome to our verified community!
    </p>
  </div>` : ''}

  ${status === 'rejected' ? `<!-- Rejection Information -->
  <div style="background-color: #f8d7da; padding: 20px; margin-bottom: 30px; border-left: 3px solid #dc3545;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #721c24;">NEXT STEPS</h4>
    <p style="margin: 0; font-size: 13px; color: #721c24; line-height: 1.5;">
      Please review the rejection reason above and resubmit your bank account information with the correct details. 
      Ensure all documents are clear and match the account information provided. You can update your bank account 
      details through your dashboard.
    </p>
  </div>` : ''}

  ${status === 'under_review' ? `<!-- Under Review Information -->
  <div style="background-color: #fff3cd; padding: 20px; margin-bottom: 30px; border-left: 3px solid #fd7e14;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">REVIEW IN PROGRESS</h4>
    <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.5;">
      Your bank account is currently under detailed review. This may take an additional 1-2 business days. 
      We may contact you if additional information or documentation is required. Thank you for your patience.
    </p>
  </div>` : ''}

  <!-- Contact Information -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">NEED ASSISTANCE?</h3>
    <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
      If you have any questions about your bank account verification status or need help with the process, 
      our support team is here to assist you. Please include your reference number when contacting us.
    </p>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #cccccc; padding-top: 20px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999999;">
      Sahayog Nepal - Empowering Communities Through Collective Support<br>
      Email: <a href="mailto:support@sahayognepal.org" style="color: #8B2325; text-decoration: none;">support@sahayognepal.org</a><br>
      <span style="font-size: 10px; color: #cccccc;">This is an automated message. Please do not reply to this email.</span>
    </p>
  </div>
</div>`
        });

    } catch (error) {
        console.error("Error sending bank account status email:", error);
        throw new Error("Failed to send bank account status email");
    }
};

module.exports = { sendBankAccountEmail, sendBankAccountStatusEmail };
    