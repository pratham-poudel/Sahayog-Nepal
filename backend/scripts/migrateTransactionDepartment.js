const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../models/Employee');

/**
 * Migration Script: Update TRANSACTION_DEPARTMENT to TRANSACTION_MANAGEMENT
 * 
 * This script updates all employees with department 'TRANSACTION_DEPARTMENT'
 * to use the new department name 'TRANSACTION_MANAGEMENT'
 */

async function migrateTransactionDepartment() {
    try {
        console.log('🔄 Starting department migration...');
        console.log('Connecting to database...');

        await mongoose.connect(process.env.MONGODB_URI || process.env.ASTRA_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to database');

        // Find all employees with old department name
        const employeesWithOldDept = await Employee.countDocuments({ 
            department: 'TRANSACTION_DEPARTMENT' 
        });

        if (employeesWithOldDept === 0) {
            console.log('✅ No employees found with old department name. Migration not needed.');
            process.exit(0);
        }

        console.log(`Found ${employeesWithOldDept} employee(s) with old department name`);

        // Update all employees
        const result = await Employee.updateMany(
            { department: 'TRANSACTION_DEPARTMENT' },
            { $set: { department: 'TRANSACTION_MANAGEMENT' } }
        );

        console.log(`✅ Migration complete! Updated ${result.modifiedCount} employee(s)`);
        console.log('   Old: TRANSACTION_DEPARTMENT');
        console.log('   New: TRANSACTION_MANAGEMENT');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateTransactionDepartment();
