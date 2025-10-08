/**
 * Migration Script: Add Phone Number to Existing Records
 * 
 * This script updates existing Donation and Payment records that don't have
 * phone numbers to include a default value for legacy records.
 * 
 * Run this script BEFORE deploying the updated models that require phone numbers.
 * 
 * Usage:
 *   node backend/scripts/migratePhoneNumbers.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models (before schema changes are applied)
const Donation = require('../models/Donation');
const Payment = require('../models/Payment');

const MONGODB_URI = process.env.MONGODB_URI;
const LEGACY_PHONE_VALUE = 'N/A - Pre-Policy';

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateDonations() {
  console.log('\n📋 Starting Donation records migration...');
  
  try {
    // Find all donations without donorPhone field
    const donationsWithoutPhone = await Donation.countDocuments({
      donorPhone: { $exists: false }
    });
    
    console.log(`   Found ${donationsWithoutPhone} donations without phone numbers`);
    
    if (donationsWithoutPhone > 0) {
      // Update all donations without phone numbers
      const result = await Donation.updateMany(
        { donorPhone: { $exists: false } },
        { $set: { donorPhone: LEGACY_PHONE_VALUE } }
      );
      
      console.log(`   ✅ Updated ${result.modifiedCount} donation records`);
    } else {
      console.log('   ℹ️  No donations need migration');
    }
  } catch (error) {
    console.error('   ❌ Error migrating donations:', error);
    throw error;
  }
}

async function migratePayments() {
  console.log('\n💳 Starting Payment records migration...');
  
  try {
    // Find all payments without donorPhone field
    const paymentsWithoutPhone = await Payment.countDocuments({
      donorPhone: { $exists: false }
    });
    
    console.log(`   Found ${paymentsWithoutPhone} payments without phone numbers`);
    
    if (paymentsWithoutPhone > 0) {
      // Update all payments without phone numbers
      const result = await Payment.updateMany(
        { donorPhone: { $exists: false } },
        { $set: { donorPhone: LEGACY_PHONE_VALUE } }
      );
      
      console.log(`   ✅ Updated ${result.modifiedCount} payment records`);
    } else {
      console.log('   ℹ️  No payments need migration');
    }
  } catch (error) {
    console.error('   ❌ Error migrating payments:', error);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    // Check donations
    const donationsWithoutPhone = await Donation.countDocuments({
      donorPhone: { $exists: false }
    });
    
    const totalDonations = await Donation.countDocuments();
    
    console.log(`   Donations: ${totalDonations} total, ${donationsWithoutPhone} still missing phone`);
    
    // Check payments
    const paymentsWithoutPhone = await Payment.countDocuments({
      donorPhone: { $exists: false }
    });
    
    const totalPayments = await Payment.countDocuments();
    
    console.log(`   Payments: ${totalPayments} total, ${paymentsWithoutPhone} still missing phone`);
    
    if (donationsWithoutPhone === 0 && paymentsWithoutPhone === 0) {
      console.log('\n   ✅ All records have phone numbers!');
      return true;
    } else {
      console.log('\n   ⚠️  Some records still missing phone numbers');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error verifying migration:', error);
    throw error;
  }
}

async function generateReport() {
  console.log('\n📊 Migration Report');
  console.log('═══════════════════════════════════════');
  
  try {
    // Donation statistics
    const totalDonations = await Donation.countDocuments();
    const legacyDonations = await Donation.countDocuments({
      donorPhone: LEGACY_PHONE_VALUE
    });
    const modernDonations = totalDonations - legacyDonations;
    
    console.log('\nDonations:');
    console.log(`  Total: ${totalDonations}`);
    console.log(`  Legacy (migrated): ${legacyDonations} (${((legacyDonations/totalDonations)*100).toFixed(1)}%)`);
    console.log(`  Modern (with phone): ${modernDonations} (${((modernDonations/totalDonations)*100).toFixed(1)}%)`);
    
    // Payment statistics
    const totalPayments = await Payment.countDocuments();
    const legacyPayments = await Payment.countDocuments({
      donorPhone: LEGACY_PHONE_VALUE
    });
    const modernPayments = totalPayments - legacyPayments;
    
    console.log('\nPayments:');
    console.log(`  Total: ${totalPayments}`);
    console.log(`  Legacy (migrated): ${legacyPayments} (${((legacyPayments/totalPayments)*100).toFixed(1)}%)`);
    console.log(`  Modern (with phone): ${modernPayments} (${((modernPayments/totalPayments)*100).toFixed(1)}%)`);
    
    console.log('\n═══════════════════════════════════════');
  } catch (error) {
    console.error('   ❌ Error generating report:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Phone Number Migration Script');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Perform migrations
    await migrateDonations();
    await migratePayments();
    
    // Verify migration success
    const success = await verifyMigration();
    
    // Generate report
    await generateReport();
    
    if (success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('  1. Deploy the updated models (Donation.js and Payment.js)');
      console.log('  2. Deploy the updated controllers (paymentController.js)');
      console.log('  3. Deploy the updated frontend (DonationForm.jsx)');
      console.log('  4. Test donation flow with all payment methods');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration completed with warnings');
      console.log('Please review the logs above and retry if necessary.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle script errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run migration
main();
