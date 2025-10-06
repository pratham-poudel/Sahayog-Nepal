const Payment = require('../models/Payment');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const redis=require('../utils/RedisClient')
const { sendTransactionEmail } = require('../utils/sendTransactionEmail');
const { clearCampaignCaches, clearSpecificCampaignCache } = require('../utils/cacheUtils');
const WebSocket = require('ws');


// Config variables
const KHALTI_API_URL = 'https://a.khalti.com/api/v2';
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
const WEBSITE_URL = process.env.WEBSITE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Fonepay config variables
const FONEPAY_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty'
  : 'https://dev-merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty';
const FONEPAY_WEBSOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'wss://ws.fonepay.com/convergent-webSocket-web/merchantEndPoint'
  : 'wss://dev-ws.fonepay.com/convergent-webSocket-web/merchantEndPoint';
const FONEPAY_MERCHANT_CODE = process.env.FONEPAY_MERCHANT_CODE || 'NBQM';
const FONEPAY_SECRET_KEY = process.env.FONEPAY_SECRET_KEY || 'a7e3512f5032480a83137793cb2021dc';
const FONEPAY_USERNAME = process.env.FONEPAY_USERNAME || '9861101076';
const FONEPAY_PASSWORD = process.env.FONEPAY_PASSWORD || 'admin123456';

/**
 * Initialize a payment with Khalti
 */
exports.initiateKhaltiPayment = async (req, res) => {
  try {
    console.log('Khalti payment initiation request:', req.body);
    const { 
      campaignId, 
      amount, 
      platformFee,
      platformFeePercentage,
      totalAmount,
      donorName, 
      donorEmail, 
      donorMessage,
      isAnonymous,
      userId
    } = req.body;

    // Validate required fields
    if (!campaignId || !amount || !totalAmount || !donorEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Ensure minimum amount (Khalti requires minimum 10 NPR = 1000 paisa)
    if (amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Amount should be at least Rs. 10 (1000 paisa)'
      });
    }

    // Find campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    if (campaign.status == 'cancelled' || campaign.status == 'rejected' ) {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not active'
      });
    }

    // Generate a unique purchase order ID
    const purchaseOrderId = `PN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create payment object in database with initial status
    const payment = new Payment({
      amount: amount/100,
      campaignId,
      userId: userId || null, // Use userId from request body
      donorName: isAnonymous ? 'Anonymous' : donorName,
      donorEmail,
      donorMessage,
      isAnonymous,
      platformFee: platformFee/100,
      platformFeePercentage,
      totalAmount: totalAmount/100,
      paymentMethod: 'khalti',
      status: 'Initiated',
      purchaseOrderId,
      purchaseOrderName: `Donation to ${campaign.title}`,
    });

    await payment.save();

    // Prepare payment initiation request to Khalti
    const khaltiPayload = {
      // Set the return URL to our backend callback endpoint which will then redirect to frontend
      return_url: `${API_URL}/api/payments/khalti/callback`,
      website_url: WEBSITE_URL,
      amount: parseInt(totalAmount), // Amount in paisa
      purchase_order_id: purchaseOrderId,
      purchase_order_name: `Donation to ${campaign.title}`,
      customer_info: {
        name: isAnonymous ? 'Anonymous Donor' : donorName || 'Donor',
        email: donorEmail,
        phone: ''  // Phone is required by Khalti but can be empty
      },
      amount_breakdown: [
        {
          label: 'Donation Amount',
          amount: parseInt(amount) // Amount in paisa
        },
        {
          label: 'Platform Fee',
          amount: parseInt(platformFee) // Amount in paisa
        }
      ],
      product_details: [
        {
          identity: campaignId,
          name: campaign.title,
          total_price: parseInt(totalAmount), // Amount in paisa
          quantity: 1,
          unit_price: parseInt(totalAmount) // Amount in paisa
        }
      ],
      merchant_extra: payment._id.toString()
    };

    console.log('Khalti payload:', khaltiPayload);

    // Make request to Khalti API
    const response = await axios.post(
      `${KHALTI_API_URL}/epayment/initiate/`,
      khaltiPayload,
      {
        headers: {
          'Authorization': `Key ${KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Khalti response:', response.data);

    // Update payment with Khalti response data
    payment.pidx = response.data.pidx;
    payment.paymentUrl = response.data.payment_url;
    await payment.save();

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        paymentUrl: response.data.payment_url,
        pidx: response.data.pidx,
        expiresAt: response.data.expires_at
      }
    });

  } catch (error) {
    console.error('Khalti payment initiation error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Verify Khalti payment status
 */
exports.verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID (pidx) is required'
      });
    }

    // Look up the payment in our database first
    const payment = await Payment.findOne({ pidx });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    console.log('Verifying payment with pidx:', pidx);

    // Call Khalti API to verify payment status
    const response = await axios.post(
      `${KHALTI_API_URL}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          'Authorization': `Key ${KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Khalti verification response:', response.data);

    // Update payment status based on Khalti response
    payment.status = response.data.status;
    payment.transactionId = response.data.transaction_id;
    payment.fee = response.data.fee;
    payment.refunded = response.data.refunded;
    
    await payment.save();

    // If payment is completed, update campaign donation count and amount
    if (response.data.status === 'Completed' && !payment.isProcessed) {
      await Campaign.findByIdAndUpdate(payment.campaignId, {
        $inc: {
          donors: 1,
          amountRaised: payment.amount
        }
      });
      
      // Mark payment as processed to avoid double counting
      payment.isProcessed = true;
      await payment.save();
      console.log(`Marked payment ${payment._id} as processed after verification`);
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        transactionId: payment.transactionId,
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        refunded: payment.refunded,
        campaignId: payment.campaignId
      }
    });

  } catch (error) {
    console.error('Khalti payment verification error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Handle Khalti payment callback/webhook
 */
exports.handleKhaltiCallback = async (req, res) => {
  try {
    const { 
      pidx, 
      transaction_id, 
      amount, 
      mobile, 
      purchase_order_id,
      purchase_order_name,
      status
    } = req.query;

    console.log('Khalti callback received:', req.query);

    if (!transaction_id) {
      console.error('No pidx found in callback');
      return res.redirect(`${WEBSITE_URL}/payment/error?message=No+payment+identifier+found`);
    }

    // Find the payment record
    const payment = await Payment.findOne({ pidx }).populate('campaignId');
    if (!payment) {
      console.error('Payment not found for pidx:', pidx);
      return res.redirect(`${WEBSITE_URL}/payment/error?message=Payment+not+found`);
    }
    console.log('Payment found:yo wala hai', payment.campaignId);

    // Store the returning data from Khalti
    payment.returningData = req.query;
    
    // Update payment status only if the status is provided in the callback
    if (status) {
      payment.status = status;
      console.log(`Updated payment status to: ${status} for payment ID: ${payment._id}`);
    }
    
    // If transaction is completed, update the transaction ID
    if ((status === 'Completed' || transaction_id) && transaction_id) {
      payment.transactionId = transaction_id;
      
      // Update campaign donation metrics if not already processed
      if (!payment.isProcessed) {
        await Campaign.findByIdAndUpdate(payment.campaignId, {
          $inc: {
            donors: 1,
            amountRaised: payment.amount
          }
        });
        
        // Mark as processed
        payment.isProcessed = true;
        console.log(`Marked payment ${payment._id} as processed and updated campaign metrics`);
      }
    }
    
    await payment.save();
    const isAnonymous = payment.donorName === 'Anonymous';

const donation = new Donation({
  campaignId: payment.campaignId,
  donorId: payment.userId, // Can be null for guest donations
  donorName: payment.donorName,
  donorEmail: payment.donorEmail,
  amount: payment.amount,
  message: payment.donorMessage,
  anonymous: isAnonymous,
});
    await donation.save();
    
    // Clear campaign-related caches since payment affects campaign statistics
    await clearCampaignCaches();
    await clearSpecificCampaignCache(payment.campaignId._id);
    
    await sendTransactionEmail(payment.donorEmail, payment);

    // Determine redirect URL based on payment status
    let redirectUrl;
    if (!status || status === 'Completed' || status === 'Pending') {
      redirectUrl = `${WEBSITE_URL}/payment/success?paymentId=${payment._id}`;
    } else {
      redirectUrl = `${WEBSITE_URL}/payment/cancel?paymentId=${payment._id}&status=${status || 'Unknown'}`;
    }

    console.log(`Redirecting to: ${redirectUrl}`);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Khalti callback error:', error);
    return res.redirect(`${WEBSITE_URL}/payment/error?message=Payment+processing+error`);
  }
};

/**
 * Get payment details by ID
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('campaignId', 'title imageUrl')
      .select('-__v');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const paymentMethod = payment.paymentMethod;

    if (payment.status !== 'Completed') {
      if (paymentMethod === 'khalti') {
        const response = await axios.post(
          `${KHALTI_API_URL}/epayment/lookup/`,
          { pidx: payment.pidx },
          {
            headers: {
              'Authorization': `Key ${KHALTI_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        payment.status = response.data.status;
        payment.transactionId = response.data.transaction_id;
        payment.fee = response.data.fee;
        payment.refunded = response.data.refunded;
        await payment.save();

      } else if (paymentMethod === 'esewa') {
        const verificationUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${ESEWA_PRODUCT_CODE}&total_amount=${Math.round(payment.totalAmount / 100)}&transaction_uuid=${payment.transactionId}`;
        const response = await axios.get(verificationUrl);

        if (response.data.status === 'COMPLETE') {
          payment.status = 'Completed';
          payment.transactionId = response.data.transaction_uuid;
          payment.pidx= response.data.ref_id;

          if (!payment.isProcessed) {
            await Campaign.findByIdAndUpdate(payment.campaignId, {
              $inc: {
                donors: 1,
                amountRaised: payment.amount / 100
              }
            });
            payment.isProcessed = true;
          }
        }
        await payment.save();
      }
    }

    return res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};


/**
 * List user payments (for user dashboard)
 */
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const payments = await Payment.find({ userId })
      .populate('campaignId', 'title imageUrl')
      .sort('-createdAt')
      .select('-__v');
      
    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('List user payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user payments',
      error: error.message
    });
  }
};

/**
 * List campaign payments (for campaign owner or admin)
 */
exports.getCampaignPayments = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Check if user is admin or campaign owner
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && campaign.userId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view campaign payments'
      });
    }
    
    const payments = await Payment.find({ 
      campaignId,
      status: 'Completed' // Only show completed payments
    })
    .populate('userId', 'name email')
    .sort('-createdAt');
    
    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('List campaign payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign payments',
      error: error.message
    });
  }
};

/**
 * Initialize a payment with eSewa
 */
exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { 
      campaignId, 
      amount, 
      platformFee,
      platformFeePercentage,
      totalAmount,
      donorName, 
      donorEmail, 
      donorMessage,
      isAnonymous,
      userId
    } = req.body;

    console.log('eSewa payment initiation request:', req.body);

    // Validate required fields
    if (!campaignId || !amount || !totalAmount || !donorEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    if (amount < 100) { // 100 paisa = 1 rupee
      return res.status(400).json({
        success: false,
        message: 'Amount should be at least Rs. 1'
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    if(campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not active'
      });
    }

    const transaction_uuid = `PN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Convert amounts from paisa -> rupees
    const amountInRupees = Math.round(amount / 100);
    const platformFeeInRupees = Math.round(platformFee / 100);
    const totalAmountInRupees = Math.round(totalAmount / 100);

    console.log('eSewa amounts:', { 
      amountInRupees, 
      platformFeeInRupees, 
      totalAmountInRupees 
    });

    // Save initial Payment in database
    const payment = new Payment({
      amount,
      userId: userId || null, // Use userId from request body
      campaignId,
      donorName: isAnonymous ? 'Anonymous' : donorName,
      donorEmail,
      donorMessage,
      isAnonymous,
      platformFee,
      platformFeePercentage,
      totalAmount,
      paymentMethod: 'esewa',
      status: 'Initiated',
      purchaseOrderId: transaction_uuid,
      purchaseOrderName: `Donation to ${campaign.title}`,
      transactionId: transaction_uuid,
    });

    await payment.save();

    // IMPORTANT: Signing total_amount in rupees
    const signedFieldsString = `total_amount,transaction_uuid,product_code`;
    const valueString = `total_amount=${totalAmountInRupees},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;

    const signature = crypto
      .createHmac('sha256', ESEWA_SECRET_KEY)
      .update(valueString)
      .digest('base64');

    console.log('eSewa signing:', { valueString, signature });

    // Correct Form Data
    const esewaFormData = {
      amount: amountInRupees,                // donation amount
      tax_amount: 0,
      total_amount: totalAmountInRupees,      // amount + platform fee
      product_service_charge: platformFeeInRupees,
      product_delivery_charge: 0,
      transaction_uuid,
      product_code: ESEWA_PRODUCT_CODE,
      success_url: `${API_URL}/api/payments/esewa/callback?paymentId=${payment._id}`,
      failure_url: `${API_URL}/api/payments/esewa/callback?paymentId=${payment._id}&status=FAILED`,
      signed_field_names: signedFieldsString,
      signature
    };

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        esewaFormData,
        formUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
      }
    });

  } catch (error) {
    console.error('eSewa payment initiation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate eSewa payment',
      error: error.message
    });
  }
};

/**
 * Handle eSewa payment callback
 */
exports.handleEsewaCallback = async (req, res) => {
  try {
    const raw = req.query.paymentId;
    const status = req.query.status;

    if (status === 'FAILED') {
      return res.redirect(`${WEBSITE_URL}/payment/error?message=Payment+failed`);
    }

    let [paymentId, encodedData] = raw.split('?data=');
    let decodedData = {};

    if (encodedData) {
      try {
        const decodedDataString = Buffer.from(encodedData, 'base64').toString('utf-8');
        decodedData = JSON.parse(decodedDataString);
      } catch (err) {
        console.error('Error decoding eSewa data:', err);
        return res.redirect(`${WEBSITE_URL}/payment/error?message=Invalid+data+format`);
      }
    }

    console.log('Payment ID:', paymentId);
    console.log('Decoded Data:', decodedData);

    if (!paymentId) {
      return res.redirect(`${WEBSITE_URL}/payment/error?message=Missing+payment+ID`);
    }

    const payment = await Payment.findById(paymentId).populate('campaignId');
    if (!payment) {
      return res.redirect(`${WEBSITE_URL}/payment/error?message=Payment+not+found`);
    }
    payment.returningData = req.query;

    if (decodedData.status === 'COMPLETE') {
      payment.status = 'Completed';
      payment.transactionId = decodedData.transaction_uuid;
      payment.pidx = decodedData.transaction_code;
      if (!payment.isProcessed) {
        await Campaign.findByIdAndUpdate(payment.campaignId, {
          $inc: {
            donors: 1,
            amountRaised: payment.amount / 100
          }
        });
        payment.isProcessed = true;
      }

      await payment.save();
      const isAnonymous = payment.donorName === 'Anonymous';

        const donation = new Donation({
            campaignId: payment.campaignId,
            donorId: payment.userId, // Can be null for guest donations
            donorName: payment.donorName,
            donorEmail: payment.donorEmail,
            amount: payment.amount,
            message: payment.donorMessage,
            anonymous: isAnonymous,
});
      await donation.save();
      
      // Clear campaign-related caches since payment affects campaign statistics
      await clearCampaignCaches();
      await clearSpecificCampaignCache(payment.campaignId._id);
      
      await sendTransactionEmail(payment.donorEmail, payment);
      return res.redirect(`${WEBSITE_URL}/payment/success?paymentId=${payment._id}`);
    } else {
      payment.status = 'Failed';
      await payment.save();
      return res.redirect(`${WEBSITE_URL}/payment/cancel?paymentId=${payment._id}&status=FAILED`);
    }

  } catch (error) {
    console.error('eSewa callback error:', error);
    return res.redirect(`${WEBSITE_URL}/payment/error?message=Unexpected+server+error`);
  }
};


/**
 * Verify eSewa payment status
 */
exports.verifyEsewaPayment = async (req, res) => {
  try {
    const { transaction_uuid, paymentId } = req.body;

    if (!transaction_uuid && !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction UUID or Payment ID is required'
      });
    }

    // Find the payment in our database
    let payment;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else {
      payment = await Payment.findOne({ purchaseOrderId: transaction_uuid });
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const verificationUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${ESEWA_PRODUCT_CODE}&total_amount=${Math.round(payment.totalAmount/ 100)}&transaction_uuid=${transaction_uuid}`;
    
    const response = await axios.get(verificationUrl);
    console.log('eSewa verification response:', response.data);

    // Update payment status based on eSewa response
    if (response.data.status === 'COMPLETE') {
      payment.status = 'Completed';
      payment.transactionId = response.data.ref_id;

      // Update campaign donation metrics if not already processed
      if (!payment.isProcessed) {
        await Campaign.findByIdAndUpdate(payment.campaignId, {
          $inc: {
            donors: 1,
            amountRaised: payment.amount / 100
          }
        });

        payment.isProcessed = true;
        await payment.save();
        console.log(`Marked payment ${payment._id} as processed after verification`);
      }
    } else {
      payment.status = 'Failed';
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        transactionId: payment.transactionId,
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        campaignId: payment.campaignId
      }
    });

  } catch (error) {
    console.error('eSewa payment verification error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Initialize a payment with Fonepay (PhonePay)
 */
exports.initiateFonepayPayment = async (req, res) => {
  try {
    const { 
      campaignId, 
      amount, // in paisa
      platformFee,
      platformFeePercentage,
      totalAmount, // in paisa
      donorName, 
      donorEmail, 
      donorMessage,
      isAnonymous,
      userId
    } = req.body;

    // Validate required fields
    if (!campaignId || !amount || !totalAmount || !donorEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Ensure minimum amount
    if (amount < 1000) { // 10 NPR in paisa
      return res.status(400).json({
        success: false,
        message: 'Amount should be at least Rs. 10 (1000 paisa)'
      });
    }

    // Find campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not active'
      });
    }

    // Generate a unique purchase order ID/PRN
    const prn = uuidv4();
    
    // Convert amount from paisa to NPR for Fonepay
    const amountInNpr = (amount / 100).toFixed(2);
    const totalAmountInNpr = (totalAmount / 100).toFixed(2);
    
    // Create payment record in database
    const payment = new Payment({
      amount,
      userId: userId || null, // Use userId from request body
      campaignId,
      donorName: isAnonymous ? 'Anonymous' : donorName,
      donorEmail,
      donorMessage,
      isAnonymous,
      platformFee,
      platformFeePercentage,
      totalAmount,
      paymentMethod: 'fonepay',
      status: 'Initiated',
      purchaseOrderId: prn,
      purchaseOrderName: `Donation to ${campaign.title}`,
    });

    await payment.save();

    // Generate HMAC signature for Fonepay
    const message = `${totalAmountInNpr},${prn},${FONEPAY_MERCHANT_CODE},Donation to ${campaign.title},Campaign ID: ${campaignId}`;
    const dataValidation = generateFonepayHmac(message);

    // Prepare request payload for Fonepay
    const fonepayPayload = {
      amount: totalAmountInNpr,
      remarks1: `Donation to ${campaign.title}`,
      remarks2: `Campaign ID: ${campaignId}`,
      prn: prn,
      merchantCode: FONEPAY_MERCHANT_CODE,
      dataValidation: dataValidation,
      username: FONEPAY_USERNAME,
      password: FONEPAY_PASSWORD
    };

    console.log('Fonepay payload:', fonepayPayload);

    // Make request to Fonepay API
    const response = await axios.post(
      `${FONEPAY_API_URL}/thirdPartyDynamicQrDownload`,
      fonepayPayload
    );

    console.log('Fonepay response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate QR code');
    }

    // Update payment with Fonepay response data
    payment.fonepayQrCode = response.data.qrMessage;
    payment.fonepayWebSocketUrl = response.data.thirdpartyQrWebSocketUrl;
    payment.fonepayDeviceId = response.data.thirdpartyQrWebSocketUrl.split('/').pop();
    await payment.save();

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        qrCode: response.data.qrMessage,
        webSocketUrl: response.data.thirdpartyQrWebSocketUrl,
        deviceId: payment.fonepayDeviceId,
        status: response.data.status
      }
    });

  } catch (error) {
    console.error('Fonepay payment initiation error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Check Fonepay payment status
 */
exports.checkFonepayStatus = async (req, res) => {
  try {
    const { paymentId } = req.body;

    // Find payment in database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const prn = payment.purchaseOrderId;

    // Generate HMAC signature for status check
    const message = `${prn},${FONEPAY_MERCHANT_CODE}`;
    const dataValidation = generateFonepayHmac(message);

    // Prepare request payload
    const statusPayload = {
      prn: prn,
      merchantCode: FONEPAY_MERCHANT_CODE,
      dataValidation: dataValidation,
      username: FONEPAY_USERNAME,
      password: FONEPAY_PASSWORD
    };

    console.log('Fonepay status check payload:', statusPayload);

    // Make request to Fonepay API
    const response = await axios.post(
      `${FONEPAY_API_URL}/thirdPartyDynamicQrGetStatus`,
      statusPayload
    );

    console.log('Fonepay status response:', response.data);

    // Update payment status based on response
    if (response.data.paymentStatus === 'success') {
      payment.status = 'Completed';
      payment.fonepayTraceId = response.data.fonepayTraceId;
      
      // Update campaign donation metrics if not already processed
      if (!payment.isProcessed) {
        await Campaign.findByIdAndUpdate(payment.campaignId, {
          $inc: {
            donors: 1,
            amountRaised: payment.amount / 100
          }
        });
        
        // Create donation record
        const donation = new Donation({
          campaignId: payment.campaignId,
          donorId: payment.userId, // Can be null for guest donations
          donorName: payment.donorName,
          donorEmail: payment.donorEmail,
          amount: payment.amount,
          message: payment.donorMessage,
          anonymous: payment.isAnonymous,
        });
        
        await donation.save();
        
        // Clear campaign-related caches since payment affects campaign statistics
        await clearCampaignCaches();
        await clearSpecificCampaignCache(payment.campaignId);
        
        await sendTransactionEmail(payment.donorEmail, payment);
        
        // Mark as processed
        payment.isProcessed = true;
      }
    } else if (response.data.paymentStatus === 'failed') {
      payment.status = 'Failed';
    } else {
      payment.status = 'Pending';
    }
    
    await payment.save();

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        fonepayTraceId: payment.fonepayTraceId,
        amount: payment.amount,
        totalAmount: payment.totalAmount
      }
    });

  } catch (error) {
    console.error('Fonepay status check error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Handle Fonepay payment webhook/callback
 */
exports.handleFonepayCallback = async (req, res) => {
  try {
    const { paymentId, status } = req.query;

    console.log('Fonepay callback received:', req.query);

    if (!paymentId) {
      return res.redirect(`${WEBSITE_URL}/payment/error?message=No+payment+identifier+found`);
    }

    // Find payment in database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.redirect(`${WEBSITE_URL}/payment/error?message=Payment+not+found`);
    }

    // Store callback data
    payment.returningData = req.query;
    
    // Check payment status if not already completed
    if (payment.status !== 'Completed') {
      await exports.checkFonepayStatus({ body: { paymentId } }, { 
        status: () => ({ json: () => {} })
      });
    }
    
    // Determine redirect URL based on payment status
    let redirectUrl;
    if (payment.status === 'Completed') {
      redirectUrl = `${WEBSITE_URL}/payment/success?paymentId=${payment._id}`;
    } else {
      redirectUrl = `${WEBSITE_URL}/payment/cancel?paymentId=${payment._id}&status=${payment.status}`;
    }

    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('Fonepay callback error:', error);
    return res.redirect(`${WEBSITE_URL}/payment/error?message=Payment+processing+error`);
  }
};

/**
 * Submit tax refund information to Fonepay (for IRD)
 */
exports.submitFonepayTaxRefund = async (req, res) => {
  try {
    const { paymentId, invoiceNumber, invoiceDate } = req.body;

    // Find payment in database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (!payment.fonepayTraceId) {
      return res.status(400).json({
        success: false,
        message: 'Fonepay trace ID not found for this payment'
      });
    }

    // Convert amount from paisa to NPR
    const transactionAmount = (payment.totalAmount / 100).toFixed(2);

    // Generate HMAC signature for tax refund
    const message = `${payment.fonepayTraceId},${payment.purchaseOrderId},${invoiceNumber},${invoiceDate},${transactionAmount},${FONEPAY_MERCHANT_CODE}`;
    const dataValidation = generateFonepayHmac(message);

    // Prepare request payload
    const taxRefundPayload = {
      fonepayTraceId: payment.fonepayTraceId,
      merchantPRN: payment.purchaseOrderId,
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate,
      transactionAmount: transactionAmount,
      merchantCode: FONEPAY_MERCHANT_CODE,
      dataValidation: dataValidation,
      username: FONEPAY_USERNAME,
      password: FONEPAY_PASSWORD
    };

    console.log('Fonepay tax refund payload:', taxRefundPayload);

    // Make request to Fonepay API
    const response = await axios.post(
      `${FONEPAY_API_URL}/thirdPartyPostTaxRefund`,
      taxRefundPayload
    );

    console.log('Fonepay tax refund response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Tax refund request failed');
    }

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Fonepay tax refund error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit tax refund information',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Generate HMAC SHA512 hash for Fonepay
 */
function generateFonepayHmac(message) {
  try {
    const hmac = crypto.createHmac('sha512', FONEPAY_SECRET_KEY);
    hmac.update(message);
    return hmac.digest('hex').toLowerCase();
  } catch (error) {
    console.error('Error generating HMAC:', error);
    throw new Error('Failed to generate signature');
  }
} 