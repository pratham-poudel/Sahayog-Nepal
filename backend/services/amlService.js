// services/amlService.js
let redisClient;

try {
  // Try connecting to the dedicated Redis (used for Bull/AML)
  redisClient = require('../utils/bullRedis');
  console.log('[AML] Using Bull Redis ✅');
} catch (err) {
  // Fallback to general cache Redis if Bull Redis is unavailable
  redisClient = require('../utils/redis');
  console.warn('[AML] Bull Redis unavailable, using fallback cache Redis ⚠️');
}



// ... rest of your AML logic
// your redis client; must export async get/set/etc.
const Payment = require('../models/Payment');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const Alert = require('../models/Alert');

/**
 * Configurable thresholds
 */
const CONFIG = {
  HIGH_AMOUNT_MULTIPLIER: 10,    // txn > 10x avg => flag
  NEW_ACCOUNT_HOURS: 24,         // age window for new-account checks
  NEW_ACCOUNT_HIGH_VALUE: 5000,  // amount threshold for new-account flag (NPR)
  STRUCTURING_COUNT: 5,          // >5 txns in 1h for small amounts => structuring
  STRUCTURING_AMOUNT_BOUND: 500, // under this considered small (NPR)
  SHARED_IP_THRESHOLD: 3,        // >3 distinct users from same IP in 24h
  CRITICAL_SCORE: 80,
  HIGH_SCORE: 60,
  
  // Enhanced thresholds for guest donors and fraud prevention
  GUEST_RAPID_DONATION_THRESHOLD: 15,  // >15 donations in 1 hour from same phone/email
  GUEST_RAPID_SAME_CAMPAIGN_THRESHOLD: 8, // >8 donations to SAME campaign in 1 hour
  SELF_DONATION_CHECK_WINDOW: 30 * 24 * 3600, // 30 days in seconds
  CAMPAIGN_DIVERSITY_MIN: 2,     // minimum unique campaigns for high-frequency donors
  VELOCITY_CHECK_MINUTES: 5,     // check for donations in rapid succession
  VELOCITY_THRESHOLD: 3          // >3 donations in 5 minutes
};

/**
 * Helper: compute simple avg donation for user (fallback default if none)
 */
async function getUserAvgDonation(userId) {
  const res = await Donation.aggregate([
    { $match: { donorId: userId } },
    { $group: { _id: null, avg: { $avg: "$amount" } } }
  ]);
  return (res && res[0] && res[0].avg) || 500; // default avg 500 NPR (tune)
}

/**
 * Helper: compute avg donation for guest donor by phone
 */
async function getGuestAvgDonationByPhone(phone) {
  const res = await Donation.aggregate([
    { $match: { donorPhone: phone, donorId: null } },
    { $group: { _id: null, avg: { $avg: "$amount" } } }
  ]);
  return (res && res[0] && res[0].avg) || 500;
}

/**
 * Helper: compute avg donation for guest donor by email
 */
async function getGuestAvgDonationByEmail(email) {
  const res = await Donation.aggregate([
    { $match: { donorEmail: email, donorId: null } },
    { $group: { _id: null, avg: { $avg: "$amount" } } }
  ]);
  return (res && res[0] && res[0].avg) || 500;
}

/**
 * Helper: Check for self-donation patterns
 * Uses userId, email, and phone to detect if donor is donating to their own campaign
 */
async function checkSelfDonation(txnObj, userObj) {
  try {
    const campaign = await Campaign.findById(txnObj.campaignId);
    if (!campaign) return false;

    const creatorId = campaign.creator?.toString();
    const donorUserId = txnObj.userId?.toString();
    
    // Direct user ID match
    if (donorUserId && creatorId && donorUserId === creatorId) {
      return true;
    }

    // Check email match (campaign creator email vs donor email)
    if (userObj && campaign.creator) {
      const creator = await User.findById(campaign.creator);
      if (creator && creator.email && txnObj.donorEmail) {
        if (creator.email.toLowerCase() === txnObj.donorEmail.toLowerCase()) {
          return true;
        }
      }
      
      // Check phone number match
      if (creator && creator.phoneNumber && txnObj.donorPhone) {
        const normalizedCreatorPhone = creator.phoneNumber.replace(/\D/g, '');
        const normalizedDonorPhone = txnObj.donorPhone.replace(/\D/g, '');
        if (normalizedCreatorPhone === normalizedDonorPhone) {
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error('[AML] Error checking self-donation:', err);
    return false;
  }
}

/**
 * isVPN / isHighRiskCountry - enhanced versions
 */
function isHighRiskCountry(countryCode) {
  // Expand this list based on your compliance requirements
  // These are examples of high-risk countries for AML
  const highRisk = [
    'IR', // Iran
    'KP', // North Korea
    'SY', // Syria
    'CU', // Cuba
    'SD', // Sudan
    'AF', // Afghanistan
    'MM', // Myanmar
    'ZW', // Zimbabwe
    'IQ'  // Iraq
  ];
  if (!countryCode) return false;
  return highRisk.includes(countryCode.toUpperCase());
}

function isVPN(ipOrPayment) {
  // If payment object is passed with VPN detection flag
  if (typeof ipOrPayment === 'object' && ipOrPayment.isVPNDetected !== undefined) {
    return ipOrPayment.isVPNDetected;
  }
  // Legacy: if just IP string (should not happen now)
  return false;
}

/**
 * Main analyze function
 * - txnObj: payment document (Mongoose) or plain object with at least { _id, amount, userId, ip, paymentMethod }
 * - userObj: user document (Mongoose)
 */
async function analyzeTransaction(txnObj, userObj = null) {
  // ensure we have fresh user
  const user = userObj || (txnObj.userId ? await User.findById(txnObj.userId) : null);

  let score = 0;
  const flags = [];

  // ========== REGISTERED USER CHECKS ==========
  if (user) {
    // 1) Large vs user avg
    const avg = await getUserAvgDonation(user._id);
    if (txnObj.amount > CONFIG.HIGH_AMOUNT_MULTIPLIER * avg) {
      flags.push('high_amount_vs_user_avg');
      score += 30;
    }

    // 2) New account high value
    let accountAgeHours = 999999;
    if (user.createdAt) {
      accountAgeHours = (Date.now() - new Date(user.createdAt).getTime()) / 1000 / 3600;
    }
    if (accountAgeHours < CONFIG.NEW_ACCOUNT_HOURS && txnObj.amount > CONFIG.NEW_ACCOUNT_HIGH_VALUE) {
      flags.push('new_account_high_value');
      score += 35;
    }

    // 3) Structuring pattern: many small txns in 1 hour for registered users
    const txnCountKey = `aml:txncount:uid:${user._id.toString()}`;
    const cnt = await redisClient.incr(txnCountKey);
    if (cnt === 1) await redisClient.expire(txnCountKey, 3600); // 1 hour TTL
    if (cnt > CONFIG.STRUCTURING_COUNT && txnObj.amount < CONFIG.STRUCTURING_AMOUNT_BOUND) {
      flags.push('structuring_many_small_txns');
      score += 40;
    }
  }

  // ========== GUEST DONOR CHECKS (userId is null) ==========
  if (!txnObj.userId && txnObj.donorPhone) {
    // 1) Guest donor average check by phone
    const avgByPhone = await getGuestAvgDonationByPhone(txnObj.donorPhone);
    if (txnObj.amount > CONFIG.HIGH_AMOUNT_MULTIPLIER * avgByPhone) {
      flags.push('guest_high_amount_vs_phone_avg');
      score += 25;
    }

    // 2) Rapid donation check for guests - Track by phone
    const guestRapidKey = `aml:guest:rapid:phone:${txnObj.donorPhone}`;
    const rapidCnt = await redisClient.incr(guestRapidKey);
    if (rapidCnt === 1) await redisClient.expire(guestRapidKey, 3600); // 1 hour
    
    if (rapidCnt > CONFIG.GUEST_RAPID_DONATION_THRESHOLD) {
      flags.push('guest_excessive_donations_1h');
      score += 45;
    }

    // 3) Same campaign rapid donations for guests
    const sameCampaignKey = `aml:guest:campaign:${txnObj.donorPhone}:${txnObj.campaignId}`;
    const sameCampaignCnt = await redisClient.incr(sameCampaignKey);
    if (sameCampaignCnt === 1) await redisClient.expire(sameCampaignKey, 3600); // 1 hour
    
    if (sameCampaignCnt > CONFIG.GUEST_RAPID_SAME_CAMPAIGN_THRESHOLD) {
      flags.push('guest_excessive_same_campaign_donations');
      score += 50;
    }

    // 4) Check campaign diversity for high-frequency guest donors
    if (rapidCnt > 10) {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const recentDonations = await Donation.find({
        donorPhone: txnObj.donorPhone,
        donorId: null,
        createdAt: { $gte: oneHourAgo }
      }).select('campaignId');

      const uniqueCampaigns = new Set(recentDonations.map(d => d.campaignId.toString()));
      if (uniqueCampaigns.size < CONFIG.CAMPAIGN_DIVERSITY_MIN) {
        flags.push('guest_low_campaign_diversity');
        score += 30;
      }
    }

    // 5) Velocity check - donations in rapid succession (5 minutes)
    const velocityKey = `aml:guest:velocity:phone:${txnObj.donorPhone}`;
    const velocityCnt = await redisClient.incr(velocityKey);
    if (velocityCnt === 1) await redisClient.expire(velocityKey, CONFIG.VELOCITY_CHECK_MINUTES * 60);
    
    if (velocityCnt > CONFIG.VELOCITY_THRESHOLD) {
      flags.push('guest_high_velocity_donations');
      score += 35;
    }

    // 6) Small amount structuring for guests
    if (rapidCnt > CONFIG.STRUCTURING_COUNT && txnObj.amount < CONFIG.STRUCTURING_AMOUNT_BOUND) {
      flags.push('guest_structuring_small_amounts');
      score += 40;
    }
  }

  // Cross-check by email for guests (if provided)
  if (!txnObj.userId && txnObj.donorEmail) {
    const avgByEmail = await getGuestAvgDonationByEmail(txnObj.donorEmail);
    if (txnObj.amount > CONFIG.HIGH_AMOUNT_MULTIPLIER * avgByEmail) {
      flags.push('guest_high_amount_vs_email_avg');
      score += 20;
    }

    // Email-based rapid donation tracking
    const emailRapidKey = `aml:guest:rapid:email:${txnObj.donorEmail}`;
    const emailRapidCnt = await redisClient.incr(emailRapidKey);
    if (emailRapidCnt === 1) await redisClient.expire(emailRapidKey, 3600);
    
    if (emailRapidCnt > CONFIG.GUEST_RAPID_DONATION_THRESHOLD) {
      flags.push('guest_excessive_donations_email_1h');
      score += 40;
    }
  }

  // ========== SELF-DONATION DETECTION ==========
  const isSelfDonation = await checkSelfDonation(txnObj, user);
  if (isSelfDonation) {
    flags.push('self_donation_detected');
    score += 70; // Very high risk for self-donations
  }

  // ========== SHARED IP NETWORK ==========
  if (txnObj.ip) {
    const ipKey = `aml:ip:${txnObj.ip}`;
    try {
      await redisClient.sadd(ipKey, txnObj.userId ? txnObj.userId.toString() : `guest:${txnObj.donorPhone||txnObj.donorEmail||'unknown'}`);
      await redisClient.expire(ipKey, 24 * 3600);
      const members = await redisClient.scard(ipKey);
      if (members >= CONFIG.SHARED_IP_THRESHOLD) {
        flags.push('shared_ip_network');
        score += 40;
      }
    } catch (e) {
      console.error('redis ip set error', e);
    }
  }

  // ========== PAYMENT METHOD & GEO RISK ==========
  // 5) Payment method risk (local methods might be lower risk, but keep the rule)
  if (['khalti', 'esewa'].includes((txnObj.paymentMethod||'').toLowerCase())) {
    // treat as normal; you could reduce score, or ignore; leaving empty here
  } else {
    flags.push('unknown_payment_method');
    score += 10;
  }

  // 6) Geo / VPN - use payment object data
  // Check country from payment object first, then from user
  const paymentCountry = txnObj.countryCode || (user && user.country);
  if (paymentCountry && isHighRiskCountry(paymentCountry)) {
    flags.push('high_risk_country');
    score += 40;
  }
  
  // Check VPN detection from payment object
  if (isVPN(txnObj)) {
    flags.push('vpn_or_tor');
    score += 30;
  }

  // 7) Refund/chargeback pattern (if txnObj has such metadata — check in your flows)
  if (txnObj.refunded || txnObj.status === 'Refunded') {
    flags.push('refund_flag');
    score += 20;
  }

  // 8) Bound score and determine status
  const riskScore = Math.min(Math.round(score), 100);
  let amlStatus = 'ok';
  if (riskScore >= CONFIG.CRITICAL_SCORE) amlStatus = 'blocked';
  else if (riskScore >= CONFIG.HIGH_SCORE) amlStatus = 'pending_review';

  // 9) Persist changes to payment document and create alert if needed
  try {
    await Payment.updateOne({ _id: txnObj._id }, {
      $set: { riskScore, flags, amlStatus }
    });
    console.log(`[AML] Updated payment ${txnObj._id} with riskScore: ${riskScore}, status: ${amlStatus}`);
  } catch (err) {
    console.error('[AML] Failed to update payment with AML data', err);
  }

  if (riskScore >= CONFIG.HIGH_SCORE) {
    try {
      const alert = await Alert.create({
        userId: txnObj.userId || null,
        paymentId: txnObj._id,
        donationId: txnObj.donationId || null,
        riskScore,
        indicators: flags,
        metadata: {
          ip: txnObj.ip,
          country: txnObj.country,
          countryCode: txnObj.countryCode,
          amount: txnObj.amount,
          paymentMethod: txnObj.paymentMethod,
          donorPhone: txnObj.donorPhone,
          donorEmail: txnObj.donorEmail,
          isVPNDetected: txnObj.isVPNDetected || false,
          campaignId: txnObj.campaignId,
          isSelfDonation: isSelfDonation
        }
      });
      console.log(`[AML] Alert created: ${alert._id} for payment ${txnObj._id} with score ${riskScore}`);
      // TODO: notify compliance team (email/webhook) here
      return { riskScore, flags, amlStatus, alertId: alert._id };
    } catch (err) {
      console.error('[AML] Failed to create alert:', err);
      return { riskScore, flags, amlStatus };
    }
  }

  console.log(`[AML] Payment ${txnObj._id} analyzed - Score: ${riskScore}, Status: ${amlStatus}`);
  return { riskScore, flags, amlStatus };
}

module.exports = { analyzeTransaction };
