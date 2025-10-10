/**
 * Create Indexes for Alert Collection
 * 
 * This script creates optimized indexes for the Alert model
 * to ensure fast query performance when dealing with thousands of alerts.
 * 
 * Run this once in production:
 * node scripts/createAlertIndexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Alert = require('../models/Alert');

async function createAlertIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Creating indexes for Alert collection...\n');

    // Drop existing indexes (except _id)
    console.log('🗑️  Dropping existing indexes...');
    try {
      await Alert.collection.dropIndexes();
      console.log('✅ Existing indexes dropped\n');
    } catch (error) {
      console.log('⚠️  No indexes to drop or error dropping:', error.message, '\n');
    }

    // 1. Primary sorting and filtering index
    console.log('1️⃣  Creating riskScore + createdAt compound index...');
    await Alert.collection.createIndex(
      { riskScore: -1, createdAt: -1 },
      { name: 'riskScore_-1_createdAt_-1' }
    );
    console.log('✅ riskScore + createdAt index created\n');

    // 2. Review status filtering index
    console.log('2️⃣  Creating reviewed + outcome compound index...');
    await Alert.collection.createIndex(
      { reviewed: 1, outcome: 1 },
      { name: 'reviewed_1_outcome_1' }
    );
    console.log('✅ reviewed + outcome index created\n');

    // 3. Review status + risk score compound index
    console.log('3️⃣  Creating reviewed + riskScore + createdAt compound index...');
    await Alert.collection.createIndex(
      { reviewed: 1, riskScore: -1, createdAt: -1 },
      { name: 'reviewed_1_riskScore_-1_createdAt_-1' }
    );
    console.log('✅ reviewed + riskScore + createdAt index created\n');

    // 4. Employee review tracking index
    console.log('4️⃣  Creating reviewedBy employeeId index...');
    await Alert.collection.createIndex(
      { 'metadata.reviewedBy.employeeId': 1 },
      { name: 'metadata_reviewedBy_employeeId_1', sparse: true }
    );
    console.log('✅ reviewedBy employeeId index created\n');

    // 5. User reference index for joins
    console.log('5️⃣  Creating userId index...');
    await Alert.collection.createIndex(
      { userId: 1 },
      { name: 'userId_1' }
    );
    console.log('✅ userId index created\n');

    // 6. Donation reference index for joins
    console.log('6️⃣  Creating donationId index...');
    await Alert.collection.createIndex(
      { donationId: 1 },
      { name: 'donationId_1', sparse: true }
    );
    console.log('✅ donationId index created\n');

    // 7. Payment reference index for joins
    console.log('7️⃣  Creating paymentId index...');
    await Alert.collection.createIndex(
      { paymentId: 1 },
      { name: 'paymentId_1', sparse: true }
    );
    console.log('✅ paymentId index created\n');

    // 8. Report type index
    console.log('8️⃣  Creating reportType index...');
    await Alert.collection.createIndex(
      { reportType: 1 },
      { name: 'reportType_1' }
    );
    console.log('✅ reportType index created\n');

    // 9. Created date index for time-based queries
    console.log('9️⃣  Creating createdAt index...');
    await Alert.collection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_-1' }
    );
    console.log('✅ createdAt index created\n');

    // 10. Risk score range queries
    console.log('🔟 Creating riskScore index...');
    await Alert.collection.createIndex(
      { riskScore: -1 },
      { name: 'riskScore_-1' }
    );
    console.log('✅ riskScore index created\n');

    console.log('✅ All indexes created successfully!\n');

    // Verify indexes
    console.log('🔍 Verifying created indexes...\n');
    const indexes = await Alert.collection.getIndexes();
    console.log('📋 Alert Collection Indexes:');
    Object.entries(indexes).forEach(([name, spec]) => {
      console.log(`   - ${name}:`, JSON.stringify(spec.key));
    });

    console.log('\n✨ Alert index creation complete!');
    console.log('💡 These indexes will optimize queries for:');
    console.log('   • Risk score sorting and filtering');
    console.log('   • Review status filtering');
    console.log('   • Employee activity tracking');
    console.log('   • Time-based queries');
    console.log('   • Outcome and report type filtering');
    console.log('   • User/donation/payment lookups\n');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createAlertIndexes();
