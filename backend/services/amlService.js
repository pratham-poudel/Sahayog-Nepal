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
  HIGH_SCORE: 60
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

  // 1) Large vs user avg
  const avg = user ? await getUserAvgDonation(user._id) : 500;
  if (txnObj.amount > CONFIG.HIGH_AMOUNT_MULTIPLIER * avg) {
    flags.push('high_amount_vs_user_avg');
    score += 30;
  }

  // 2) New account high value
  let accountAgeHours = 999999;
  if (user && user.createdAt) {
    accountAgeHours = (Date.now() - new Date(user.createdAt).getTime()) / 1000 / 3600;
  }
  if (accountAgeHours < CONFIG.NEW_ACCOUNT_HOURS && txnObj.amount > CONFIG.NEW_ACCOUNT_HIGH_VALUE) {
    flags.push('new_account_high_value');
    score += 35;
  }

  // 3) Shared IP network
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

  // 4) Structuring pattern: many small txns in 1 hour
  if (txnObj.userId) {
    const txnCountKey = `aml:txncount:uid:${txnObj.userId.toString()}`;
    const cnt = await redisClient.incr(txnCountKey);
    if (cnt === 1) await redisClient.expire(txnCountKey, 3600); // 1 hour TTL
    if (cnt > CONFIG.STRUCTURING_COUNT && txnObj.amount < CONFIG.STRUCTURING_AMOUNT_BOUND) {
      flags.push('structuring_many_small_txns');
      score += 40;
    }
  } else {
    // for guest donors, we can track using phone/email
    const phone = txnObj.donorPhone;
    if (phone) {
      const phoneKey = `aml:txncount:phone:${phone}`;
      const cnt = await redisClient.incr(phoneKey);
      if (cnt === 1) await redisClient.expire(phoneKey, 3600);
      if (cnt > CONFIG.STRUCTURING_COUNT && txnObj.amount < CONFIG.STRUCTURING_AMOUNT_BOUND) {
        flags.push('structuring_guest_phone');
        score += 35;
      }
    }
  }

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
          isVPNDetected: txnObj.isVPNDetected || false
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
