// utils/sendWithdrawalEmail.js
const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = process.env.ZEPTOP_TOKEN_WITHDRAW;
const zeptoClient = new SendMailClient({ url, token });

const sendWithdrawalRequestEmail = async (email, withdrawalData) => {
  const { 
    requestedAmount, 
    campaignTitle, 
    bankAccountName, 
    bankName, 
    accountNumber, 
    reason,
    requestId,
    withdrawalId
  } = withdrawalData;

  await zeptoClient.sendMail({
    from: {
      address: "Accounts@sahayognepal.org",
      name: "Submission Succesfull • Sahayog Nepal"
    },
    to: [
      {
        email_address: {
          address: email,
          name: email.split('@')[0]
        }
      }
    ],
    subject: "Withdrawal Request Submitted Successfully - Sahayog Nepal",
    htmlbody: `<div style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #cccccc;">
  
  <!-- Header -->
  <div style="border-bottom: 2px solid #8B2325; padding-bottom: 20px; margin-bottom: 30px; position: relative;">
    <div style="float: left; width: 60%;">
      <img src="https://filesatsahayognepal.dallytech.com/misc/SahayogNepal%20(1).png" alt="Sahayog Nepal" style="height: 60px; width: auto; max-width: 100%;" />
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #666666;">Withdrawal Status Update</p>
    </div>
    <div style="float: right; width: 35%; text-align: right;">
      <img src="https://barcode.tec-it.com/barcode.ashx?data=${withdrawalData.withdrawalId}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&codepage=&qunit=Mm&quiet=0&width=150&height=40" 
           alt="Barcode" 
           style="max-width: 150px; height: 40px; border: 1px solid #cccccc;">
      <p style="margin: 5px 0 0 0; font-size: 10px; color: #999999; font-family: monospace;">${withdrawalData.withdrawalId}</p>
    </div>
    <div style="clear: both;"></div>
  </div>

  <!-- Status -->
  <div style="margin-bottom: 30px;">
    <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #333333;">Request Status: SUBMITTED</h2>
    <p style="margin: 0; font-size: 14px; color: #666666;">Your withdrawal request has been received and is under review.</p>
  </div>

  <!-- Request Details -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">REQUEST DETAILS</h3>
    
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333; width: 35%;">Request ID:</td>
        <td style="padding: 8px 0; color: #666666;">#${requestId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Campaign:</td>
        <td style="padding: 8px 0; color: #666666;">${campaignTitle}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Amount:</td>
        <td style="padding: 8px 0; color: #333333; font-weight: bold;">NPR ${requestedAmount.toLocaleString()}</td>
      </tr>
      ${reason ? `<tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Purpose:</td>
        <td style="padding: 8px 0; color: #666666;">${reason}</td>
      </tr>` : ''}
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Bank:</td>
        <td style="padding: 8px 0; color: #666666;">${bankName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Account Holder:</td>
        <td style="padding: 8px 0; color: #666666;">${bankAccountName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Account Number:</td>
        <td style="padding: 8px 0; color: #666666; font-family: monospace;">****${accountNumber.slice(-4)}</td>
      </tr>
    </table>
  </div>

  <!-- Process Timeline -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">PROCESSING TIMELINE</h3>
    <ol style="margin: 0; padding-left: 20px; color: #666666; line-height: 1.6;">
      <li>Review and verification: 1-3 business days</li>
      <li>Approval notification via email</li>
      <li>Fund transfer to bank account: 3-5 business days</li>
      <li>Transaction completion confirmation</li>
    </ol>
  </div>

  <!-- Important Information -->
  <div style="background-color: #f8f9fa; padding: 20px; margin-bottom: 30px; border-left: 3px solid #8B2325;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333333;">IMPORTANT INFORMATION</h4>
    <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.5;">
      Please ensure all bank account details are accurate. Any discrepancies may result in processing delays. 
      You will receive email notifications for status updates. Contact support if you need to modify this request.
    </p>
  </div>

  <p style="margin: 0 0 30px 0; font-size: 14px; color: #666666;">
    For inquiries regarding this withdrawal request, please contact our support team with your Request ID.
  </p>

  <!-- Footer -->
  <div style="border-top: 1px solid #cccccc; padding-top: 20px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999999;">
      Sahayog Nepal<br>
      Email: <a href="mailto:support@sahayognepal.org" style="color: #8B2325; text-decoration: none;">support@sahayognepal.org</a>
    </p>
  </div>
</div>`
  });
};

const sendWithdrawStatusEmail = async (email, statusData) => {
  const { 
    status,
    requestedAmount, 
    campaignTitle, 
    bankAccountName, 
    bankName, 
    accountNumber, 
    reason,
    requestId,
    withdrawalId,
    comments,
    transactionReference,
    processingFee,
    finalAmount,
    processedDate
  } = statusData;

  // Define status-specific content
  const statusConfig = {
    completed: {
      subject: "Withdrawal Request Completed - Sahayog Nepal",
      headerText: "Withdrawal Request Status: COMPLETED",
      statusMessage: "Your withdrawal request has been successfully processed and completed.",
      statusColor: "#28a745",
      statusBg: "#f8f9fa"
    },
    rejected: {
      subject: "Withdrawal Request Rejected - Sahayog Nepal", 
      headerText: "Withdrawal Request Status: REJECTED",
      statusMessage: "Your withdrawal request has been reviewed and rejected.",
      statusColor: "#dc3545",
      statusBg: "#f8f9fa"
    },
    failed: {
      subject: "Withdrawal Request Failed - Sahayog Nepal",
      headerText: "Withdrawal Request Status: FAILED", 
      statusMessage: "Your withdrawal request processing has failed.",
      statusColor: "#fd7e14",
      statusBg: "#f8f9fa"
    }
  };

  const config = statusConfig[status];

  await zeptoClient.sendMail({
    from: {
      address: "Accounts@sahayognepal.org",
      name: "Withdrawal Status Update • Sahayog Nepal"
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
      <img src="https://filesatsahayognepal.dallytech.com/misc/SahayogNepal%20(1).png" alt="Sahayog Nepal" style="height: 60px; width: auto; max-width: 100%;" />
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #666666;">Withdrawal Request</p>
    </div>
    <div style="float: right; width: 35%; text-align: right;">
      <img src="https://barcode.tec-it.com/barcode.ashx?data=${withdrawalId}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&codepage=&qunit=Mm&quiet=0&width=150&height=40" 
           alt="Barcode" 
           style="max-width: 150px; height: 40px; border: 1px solid #cccccc;">
      <p style="margin: 5px 0 0 0; font-size: 10px; color: #999999; font-family: monospace;">${withdrawalId}</p>
    </div>
    <div style="clear: both;"></div>
  </div>

  <!-- Status -->
  <div style="margin-bottom: 30px; background-color: ${config.statusBg}; padding: 20px; border-left: 4px solid ${config.statusColor};">
    <h2 style="margin: 0 0 10px 0; font-size: 18px; color: ${config.statusColor};">${config.headerText}</h2>
    <p style="margin: 0; font-size: 14px; color: #666666;">${config.statusMessage}</p>
    ${processedDate ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">Processed on: ${processedDate}</p>` : ''}
  </div>

  <!-- Request Details -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">REQUEST DETAILS</h3>
    
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333; width: 35%;">Request ID:</td>
        <td style="padding: 8px 0; color: #666666;">#${requestId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Campaign:</td>
        <td style="padding: 8px 0; color: #666666;">${campaignTitle}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Requested Amount:</td>
        <td style="padding: 8px 0; color: #333333; font-weight: bold;">NPR ${requestedAmount.toLocaleString()}</td>
      </tr>
      ${status === 'completed' && processingFee ? `<tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Processing Fee:</td>
        <td style="padding: 8px 0; color: #666666;">NPR ${processingFee.toLocaleString()}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Final Amount:</td>
        <td style="padding: 8px 0; color: #28a745; font-weight: bold;">NPR ${finalAmount.toLocaleString()}</td>
      </tr>` : ''}
      ${status === 'completed' && transactionReference ? `<tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Transaction Ref:</td>
        <td style="padding: 8px 0; color: #666666; font-family: monospace;">${transactionReference}</td>
      </tr>` : ''}
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Bank:</td>
        <td style="padding: 8px 0; color: #666666;">${bankName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Account Holder:</td>
        <td style="padding: 8px 0; color: #666666;">${bankAccountName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Account Number:</td>
        <td style="padding: 8px 0; color: #666666; font-family: monospace;">****${accountNumber.slice(-4)}</td>
      </tr>
    </table>
  </div>

  ${comments ? `<!-- Admin Comments -->
  <div style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 5px;">ADMIN NOTES</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-left: 3px solid #8B2325;">
      <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.5;">${comments}</p>
    </div>
  </div>` : ''}

  ${status === 'completed' ? `<!-- Success Information -->
  <div style="background-color: #d4edda; padding: 20px; margin-bottom: 30px; border-left: 3px solid #28a745;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #155724;">TRANSACTION COMPLETED</h4>
    <p style="margin: 0; font-size: 13px; color: #155724; line-height: 1.5;">
      Your withdrawal has been processed successfully. The funds have been transferred to your registered bank account. 
      Please allow 1-2 business days for the amount to reflect in your account statement.
    </p>
  </div>` : ''}

  ${status === 'rejected' ? `<!-- Rejection Information -->
  <div style="background-color: #f8d7da; padding: 20px; margin-bottom: 30px; border-left: 3px solid #dc3545;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #721c24;">REQUEST REJECTED</h4>
    <p style="margin: 0; font-size: 13px; color: #721c24; line-height: 1.5;">
      Your withdrawal request has been rejected. The requested amount has been returned to your campaign's available balance. 
      Please review the admin notes above and submit a new request if needed.
    </p>
  </div>` : ''}

  ${status === 'failed' ? `<!-- Failure Information -->
  <div style="background-color: #f8d7da; padding: 20px; margin-bottom: 30px; border-left: 3px solid #fd7e14;">
    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #721c24;">PROCESSING FAILED</h4>
    <p style="margin: 0; font-size: 13px; color: #721c24; line-height: 1.5;">
      Your withdrawal request processing has failed due to technical issues. The requested amount has been returned to your campaign's available balance. 
      Please contact support or submit a new withdrawal request.
    </p>
  </div>` : ''}

  <p style="margin: 0 0 30px 0; font-size: 14px; color: #666666;">
    For any inquiries regarding this withdrawal request, please contact our support team with your Request ID.
  </p>

  <!-- Footer -->
  <div style="border-top: 1px solid #cccccc; padding-top: 20px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999999;">
      Sahayog Nepal<br>
      Email: <a href="mailto:support@sahayognepal.org" style="color: #8B2325; text-decoration: none;">support@sahayognepal.org</a>
    </p>
  </div>
</div>`
  });
};

module.exports = { sendWithdrawalRequestEmail, sendWithdrawStatusEmail };

