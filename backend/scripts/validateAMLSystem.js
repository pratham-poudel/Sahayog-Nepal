// Validation script for AML system
// Run with: node scripts/validateAMLSystem.js

require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Alert = require('../models/Alert');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://pratham:pratham%40123@cluster0.x302mav.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function validateModels() {
  console.log('========== VALIDATING MODELS ==========\n');
  
  // Check Payment model fields
  console.log('📋 Payment Model Fields:');
  const paymentFields = Object.keys(Payment.schema.paths);
  const requiredAMLFields = ['riskScore', 'flags', 'amlStatus', 'ip', 'country', 'countryCode', 'isVPNDetected', 'donationId'];
  
  requiredAMLFields.forEach(field => {
    if (paymentFields.includes(field)) {
      console.log(`  ✅ ${field}`);
    } else {
      console.log(`  ❌ ${field} - MISSING!`);
    }
  });
  
  // Check Donation model
  console.log('\n📋 Donation Model Fields:');
  const donationFields = Object.keys(Donation.schema.paths);
  console.log(`  Total fields: ${donationFields.length}`);
  console.log(`  Has donorId: ${donationFields.includes('donorId') ? '✅' : '❌'}`);
  console.log(`  Has campaignId: ${donationFields.includes('campaignId') ? '✅' : '❌'}`);
  
  // Check Alert model
  console.log('\n📋 Alert Model Fields:');
  const alertFields = Object.keys(Alert.schema.paths);
  const requiredAlertFields = ['userId', 'paymentId', 'donationId', 'riskScore', 'indicators', 'metadata'];
  
  requiredAlertFields.forEach(field => {
    if (alertFields.includes(field)) {
      console.log(`  ✅ ${field}`);
    } else {
      console.log(`  ❌ ${field} - MISSING!`);
    }
  });
  
  // Check User model
  console.log('\n📋 User Model Fields:');
  const userFields = Object.keys(User.schema.paths);
  console.log(`  Has country: ${userFields.includes('country') ? '✅' : '❌'}`);
  console.log(`  Has countryCode: ${userFields.includes('countryCode') ? '✅' : '❌'}`);
  console.log(`  Has riskScore: ${userFields.includes('riskScore') ? '✅' : '❌'}`);
  console.log(`  Has kycVerified: ${userFields.includes('kycVerified') ? '✅' : '❌'}`);
}

async function validateDataIntegrity() {
  console.log('\n========== VALIDATING DATA INTEGRITY ==========\n');
  
  // Check for completed payments
  const completedPayments = await Payment.countDocuments({ status: 'Completed' });
  console.log(`📊 Completed Payments: ${completedPayments}`);
  
  // Check for donations
  const totalDonations = await Donation.countDocuments();
  console.log(`📊 Total Donations: ${totalDonations}`);
  
  // Check mismatch
  if (completedPayments !== totalDonations) {
    console.log(`⚠️  WARNING: Mismatch between completed payments and donations!`);
  } else {
    console.log(`✅ Payment-Donation count matches`);
  }
  
  // Check payments with donationId
  const paymentsWithDonation = await Payment.countDocuments({ 
    status: 'Completed',
    donationId: { $ne: null }
  });
  console.log(`📊 Completed Payments with donationId: ${paymentsWithDonation}`);
  
  if (paymentsWithDonation < completedPayments) {
    console.log(`⚠️  WARNING: ${completedPayments - paymentsWithDonation} completed payments missing donationId link`);
  } else {
    console.log(`✅ All completed payments have donationId`);
  }
  
  // Check payments with IP info
  const paymentsWithIP = await Payment.countDocuments({ 
    ip: { $ne: null, $exists: true }
  });
  console.log(`📊 Payments with IP tracking: ${paymentsWithIP}`);
  
  // Check AML analyzed payments
  const analyzedPayments = await Payment.countDocuments({ 
    riskScore: { $gt: 0 }
  });
  console.log(`📊 AML Analyzed Payments: ${analyzedPayments}`);
  
  // Check alerts
  const totalAlerts = await Alert.countDocuments();
  const highRiskAlerts = await Alert.countDocuments({ riskScore: { $gte: 80 } });
  const pendingReview = await Alert.countDocuments({ riskScore: { $gte: 60, $lt: 80 } });
  
  console.log(`📊 Total Alerts: ${totalAlerts}`);
  console.log(`  🚫 Blocked (≥80): ${highRiskAlerts}`);
  console.log(`  ⚠️  Pending Review (60-79): ${pendingReview}`);
}

async function validateRecentPayments() {
  console.log('\n========== VALIDATING RECENT PAYMENTS ==========\n');
  
  const recentPayments = await Payment.find({ status: 'Completed' })
    .sort('-createdAt')
    .limit(5)
    .select('_id amount status donationId riskScore amlStatus ip country flags createdAt');
  
  if (recentPayments.length === 0) {
    console.log('No completed payments found.');
    return;
  }
  
  console.log(`Found ${recentPayments.length} recent completed payment(s):\n`);
  
  for (const payment of recentPayments) {
    console.log(`Payment ID: ${payment._id}`);
    console.log(`  Amount: NPR ${payment.amount}`);
    console.log(`  Created: ${payment.createdAt}`);
    console.log(`  Has donationId: ${payment.donationId ? '✅ ' + payment.donationId : '❌ Missing'}`);
    console.log(`  Has IP: ${payment.ip ? '✅ ' + payment.ip : '❌ Missing'}`);
    console.log(`  Country: ${payment.country || 'Not tracked'}`);
    console.log(`  Risk Score: ${payment.riskScore || 0}`);
    console.log(`  AML Status: ${payment.amlStatus || 'ok'}`);
    console.log(`  Flags: ${payment.flags && payment.flags.length > 0 ? payment.flags.join(', ') : 'None'}`);
    
    // Validate donation link
    if (payment.donationId) {
      const donation = await Donation.findById(payment.donationId);
      if (donation) {
        console.log(`  Donation Link: ✅ Valid`);
      } else {
        console.log(`  Donation Link: ❌ Broken (donation not found)`);
      }
    }
    
    // Check if alert exists for high-risk payments
    if (payment.riskScore >= 60) {
      const alert = await Alert.findOne({ paymentId: payment._id });
      if (alert) {
        console.log(`  Alert: ✅ Created (ID: ${alert._id})`);
      } else {
        console.log(`  Alert: ❌ Missing (should exist for risk ≥60)`);
      }
    }
    
    console.log('');
  }
}

async function validateAlerts() {
  console.log('\n========== VALIDATING ALERTS ==========\n');
  
  const alerts = await Alert.find()
    .sort('-createdAt')
    .limit(5)
    .populate('paymentId', 'amount status')
    .populate('donationId', 'amount')
    .populate('userId', 'name email');
  
  if (alerts.length === 0) {
    console.log('No alerts found.');
    return;
  }
  
  console.log(`Found ${alerts.length} recent alert(s):\n`);
  
  for (const alert of alerts) {
    console.log(`Alert ID: ${alert._id}`);
    console.log(`  Risk Score: ${alert.riskScore}`);
    console.log(`  Indicators: ${alert.indicators.join(', ')}`);
    console.log(`  Created: ${alert.createdAt}`);
    console.log(`  Payment Link: ${alert.paymentId ? '✅ ' + alert.paymentId._id : '❌ Missing'}`);
    console.log(`  Donation Link: ${alert.donationId ? '✅ ' + alert.donationId : '❌ Missing'}`);
    console.log(`  User: ${alert.userId ? alert.userId.name : 'Guest'}`);
    console.log(`  Reviewed: ${alert.reviewed ? '✅ Yes' : '❌ No'}`);
    
    // Validate metadata
    if (alert.metadata) {
      console.log(`  Metadata:`);
      console.log(`    IP: ${alert.metadata.ip || 'Not tracked'}`);
      console.log(`    Country: ${alert.metadata.country || 'Not tracked'}`);
      console.log(`    Amount: ${alert.metadata.amount || 'N/A'}`);
      console.log(`    Payment Method: ${alert.metadata.paymentMethod || 'N/A'}`);
      console.log(`    VPN Detected: ${alert.metadata.isVPNDetected ? '🚫 Yes' : '✅ No'}`);
    }
    console.log('');
  }
}

async function checkOrphanedRecords() {
  console.log('\n========== CHECKING FOR ORPHANED RECORDS ==========\n');
  
  // Donations without valid payment reference
  const donations = await Donation.find();
  let orphanedDonations = 0;
  
  for (const donation of donations) {
    const payment = await Payment.findOne({ donationId: donation._id });
    if (!payment) {
      orphanedDonations++;
    }
  }
  
  if (orphanedDonations > 0) {
    console.log(`⚠️  Found ${orphanedDonations} donations not linked to any payment`);
  } else {
    console.log(`✅ All donations are properly linked to payments`);
  }
  
  // Alerts without valid payment reference
  const alerts = await Alert.find();
  let invalidAlerts = 0;
  
  for (const alert of alerts) {
    if (alert.paymentId) {
      const payment = await Payment.findById(alert.paymentId);
      if (!payment) {
        invalidAlerts++;
      }
    }
  }
  
  if (invalidAlerts > 0) {
    console.log(`⚠️  Found ${invalidAlerts} alerts with invalid payment references`);
  } else {
    console.log(`✅ All alerts have valid payment references`);
  }
}

async function generateSummaryReport() {
  console.log('\n========== SUMMARY REPORT ==========\n');
  
  const stats = {
    totalPayments: await Payment.countDocuments(),
    completedPayments: await Payment.countDocuments({ status: 'Completed' }),
    totalDonations: await Donation.countDocuments(),
    totalAlerts: await Alert.countDocuments(),
    paymentsWithIP: await Payment.countDocuments({ ip: { $ne: null } }),
    analyzedPayments: await Payment.countDocuments({ riskScore: { $gt: 0 } }),
    highRiskPayments: await Payment.countDocuments({ riskScore: { $gte: 60 } }),
    blockedPayments: await Payment.countDocuments({ amlStatus: 'blocked' }),
    vpnDetected: await Payment.countDocuments({ isVPNDetected: true }),
  };
  
  console.log('📊 Overall Statistics:');
  Object.entries(stats).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').trim();
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    console.log(`  ${capitalizedLabel}: ${value}`);
  });
  
  // Calculate coverage
  const ipCoverage = stats.paymentsWithIP > 0 ? 
    ((stats.paymentsWithIP / stats.totalPayments) * 100).toFixed(1) : 0;
  const analysisCoverage = stats.analyzedPayments > 0 ? 
    ((stats.analyzedPayments / stats.completedPayments) * 100).toFixed(1) : 0;
  
  console.log('\n📈 Coverage:');
  console.log(`  IP Tracking: ${ipCoverage}% of all payments`);
  console.log(`  AML Analysis: ${analysisCoverage}% of completed payments`);
  
  // Risk distribution
  if (stats.analyzedPayments > 0) {
    const okPayments = await Payment.countDocuments({ riskScore: { $lt: 60 } });
    const pendingReview = await Payment.countDocuments({ riskScore: { $gte: 60, $lt: 80 } });
    const blocked = await Payment.countDocuments({ riskScore: { $gte: 80 } });
    
    console.log('\n🎯 Risk Distribution:');
    console.log(`  ✅ OK (0-59): ${okPayments} (${((okPayments/stats.analyzedPayments)*100).toFixed(1)}%)`);
    console.log(`  ⚠️  Pending Review (60-79): ${pendingReview} (${((pendingReview/stats.analyzedPayments)*100).toFixed(1)}%)`);
    console.log(`  🚫 Blocked (80-100): ${blocked} (${((blocked/stats.analyzedPayments)*100).toFixed(1)}%)`);
  }
  
  console.log('\n');
}

async function runValidation() {
  console.log('🔍 AML SYSTEM VALIDATION\n');
  console.log('='.repeat(50));
  
  try {
    await connectDB();
    await validateModels();
    await validateDataIntegrity();
    await validateRecentPayments();
    await validateAlerts();
    await checkOrphanedRecords();
    await generateSummaryReport();
    
    console.log('='.repeat(50));
    console.log('\n✅ Validation Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Validation Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

runValidation();
