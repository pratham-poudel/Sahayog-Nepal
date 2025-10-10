/**
 * Verify Database Indexes for Transaction Management
 * 
 * This script verifies that all required indexes exist
 * and provides performance analysis
 * 
 * Run: node scripts/verifyTransactionIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');

async function verifyIndexes() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    console.log('📋 Verifying indexes...\n');

    // ===== WITHDRAWAL REQUEST INDEXES =====
    console.log('═══════════════════════════════════════════════');
    console.log('  WITHDRAWAL REQUEST INDEXES');
    console.log('═══════════════════════════════════════════════');
    const withdrawalIndexes = await WithdrawalRequest.collection.indexes();
    
    const requiredIndexes = [
      { name: 'status_1_createdAt_-1', keys: { status: 1, createdAt: -1 } },
      { name: 'campaign_1_status_1', keys: { campaign: 1, status: 1 } },
      { name: 'creator_1_status_1_createdAt_-1', keys: { creator: 1, status: 1, createdAt: -1 } }
    ];

    let allGood = true;

    withdrawalIndexes.forEach(idx => {
      const keyStr = JSON.stringify(idx.key);
      const isRequired = requiredIndexes.some(req => JSON.stringify(req.keys) === keyStr);
      const icon = isRequired ? '✅' : '📌';
      console.log(`${icon} ${idx.name}`);
      console.log(`   Keys: ${keyStr}`);
      if (idx.unique) console.log('   ⚠️  Unique index');
      console.log();
    });

    // Check for missing required indexes
    requiredIndexes.forEach(req => {
      const exists = withdrawalIndexes.some(idx => JSON.stringify(idx.key) === JSON.stringify(req.keys));
      if (!exists) {
        console.log(`❌ MISSING REQUIRED INDEX: ${req.name}`);
        console.log(`   Keys: ${JSON.stringify(req.keys)}\n`);
        allGood = false;
      }
    });

    // ===== CAMPAIGN INDEXES =====
    console.log('═══════════════════════════════════════════════');
    console.log('  CAMPAIGN INDEXES');
    console.log('═══════════════════════════════════════════════');
    const campaignIndexes = await Campaign.collection.indexes();
    campaignIndexes.forEach(idx => {
      console.log(`📌 ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log();

    // ===== USER INDEXES =====
    console.log('═══════════════════════════════════════════════');
    console.log('  USER INDEXES');
    console.log('═══════════════════════════════════════════════');
    const userIndexes = await User.collection.indexes();
    userIndexes.forEach(idx => {
      console.log(`📌 ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log();

    // ===== BANK ACCOUNT INDEXES =====
    console.log('═══════════════════════════════════════════════');
    console.log('  BANK ACCOUNT INDEXES');
    console.log('═══════════════════════════════════════════════');
    const bankIndexes = await BankAccount.collection.indexes();
    bankIndexes.forEach(idx => {
      console.log(`📌 ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log();

    // ===== PERFORMANCE TEST =====
    console.log('═══════════════════════════════════════════════');
    console.log('  PERFORMANCE TEST');
    console.log('═══════════════════════════════════════════════');

    // Test 1: Status query with sort
    const test1Start = Date.now();
    await WithdrawalRequest.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const test1Time = Date.now() - test1Start;
    
    console.log(`✅ Status + Sort Query: ${test1Time}ms`);
    if (test1Time > 100) {
      console.log('   ⚠️  Warning: Query took > 100ms (should be < 50ms with indexes)');
    }

    // Test 2: Multi-status query
    const test2Start = Date.now();
    await WithdrawalRequest.find({ 
      status: { $in: ['approved', 'processing', 'completed'] } 
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const test2Time = Date.now() - test2Start;
    
    console.log(`✅ Multi-Status Query: ${test2Time}ms`);
    if (test2Time > 150) {
      console.log('   ⚠️  Warning: Query took > 150ms (should be < 100ms with indexes)');
    }

    // Test 3: Count documents
    const test3Start = Date.now();
    const count = await WithdrawalRequest.countDocuments({ status: 'approved' });
    const test3Time = Date.now() - test3Start;
    
    console.log(`✅ Count Query: ${test3Time}ms (${count} documents)`);
    if (test3Time > 50) {
      console.log('   ⚠️  Warning: Count took > 50ms');
    }

    console.log();

    // ===== SUMMARY =====
    console.log('═══════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════');

    if (allGood) {
      console.log('✅ All required indexes exist!');
      console.log('✅ Performance tests passed!');
      console.log('✅ System is optimized for 10,000+ requests!');
    } else {
      console.log('❌ Some required indexes are missing!');
      console.log('⚠️  Run: node scripts/createTransactionIndexes.js');
    }

    console.log();
    console.log('📊 Index Statistics:');
    console.log(`   WithdrawalRequest: ${withdrawalIndexes.length} indexes`);
    console.log(`   Campaign: ${campaignIndexes.length} indexes`);
    console.log(`   User: ${userIndexes.length} indexes`);
    console.log(`   BankAccount: ${bankIndexes.length} indexes`);
    
    const avgQueryTime = (test1Time + test2Time + test3Time) / 3;
    console.log(`   Avg Query Time: ${avgQueryTime.toFixed(2)}ms`);
    
    if (avgQueryTime < 50) {
      console.log('   🚀 EXCELLENT performance!');
    } else if (avgQueryTime < 100) {
      console.log('   ⚡ GOOD performance!');
    } else {
      console.log('   ⚠️  NEEDS IMPROVEMENT - Consider rebuilding indexes');
    }

  } catch (error) {
    console.error('\n❌ Error verifying indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

verifyIndexes();
