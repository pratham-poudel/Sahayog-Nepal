const mongoose = require('mongoose');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Payment = require('../models/Payment');
const Blog = require('../models/Blog');
const BankAccount = require('../models/BankAccount');
const WithdrawalRequest = require('../models/WithdrawalRequest');
require('dotenv').config();

async function optimizeDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB. Starting database optimization...');

        // 1. User Collection Optimization
        console.log('Optimizing User collection...');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        await User.collection.createIndex({ createdAt: -1 });
        await User.collection.createIndex({ _id: 1, campaigns: 1 });

        // 2. Campaign Collection Optimization (some indexes already exist from model)
        console.log('Optimizing Campaign collection...');
        await Campaign.collection.createIndex({ status: 1, createdAt: -1 });
        await Campaign.collection.createIndex({ status: 1, featured: 1 });
        await Campaign.collection.createIndex({ creator: 1, status: 1 });
        await Campaign.collection.createIndex({ category: 1, status: 1, createdAt: -1 });
        await Campaign.collection.createIndex({ tags: 1, status: 1 });
        await Campaign.collection.createIndex({ endDate: 1, status: 1 });
        await Campaign.collection.createIndex({ amountRaised: -1, status: 1 });
        await Campaign.collection.createIndex({ targetAmount: 1, status: 1 });
        
        // Compound index for complex queries
        await Campaign.collection.createIndex({ 
            status: 1, 
            category: 1, 
            featured: 1, 
            createdAt: -1 
        });

        // 3. Donation Collection Optimization (indexes already added to model)
        console.log('Optimizing Donation collection...');
        await Donation.collection.createIndex({ campaignId: 1, date: -1 });
        await Donation.collection.createIndex({ donorId: 1, date: -1 });
        await Donation.collection.createIndex({ campaignId: 1, anonymous: 1, date: -1 });
        await Donation.collection.createIndex({ campaignId: 1, amount: -1 });
        await Donation.collection.createIndex({ date: -1 });
        await Donation.collection.createIndex({ amount: -1 });
        await Donation.collection.createIndex({ campaignId: 1, donorId: 1 });

        // 4. Payment Collection Optimization (indexes already added to model)
        console.log('Optimizing Payment collection...');
        await Payment.collection.createIndex({ userId: 1, status: 1, createdAt: -1 });
        await Payment.collection.createIndex({ campaignId: 1, status: 1 });
        await Payment.collection.createIndex({ status: 1, createdAt: -1 });
        await Payment.collection.createIndex({ pidx: 1 }, { unique: true, sparse: true });
        await Payment.collection.createIndex({ transactionId: 1 }, { unique: true, sparse: true });
        await Payment.collection.createIndex({ purchaseOrderId: 1 });
        await Payment.collection.createIndex({ paymentMethod: 1, status: 1 });

        // 5. Blog Collection Optimization (indexes already added to model)
        console.log('Optimizing Blog collection...');
        await Blog.collection.createIndex({ status: 1, publishedAt: -1 });
        await Blog.collection.createIndex({ slug: 1 }, { unique: true });
        await Blog.collection.createIndex({ author: 1, status: 1 });
        await Blog.collection.createIndex({ tags: 1, status: 1 });
        await Blog.collection.createIndex({ createdAt: -1 });
        await Blog.collection.createIndex({ views: -1 });
        await Blog.collection.createIndex({ likes: -1 });

        // 6. BankAccount Collection Optimization (indexes already exist from model)
        console.log('Optimizing BankAccount collection...');
        await BankAccount.collection.createIndex({ userId: 1, isPrimary: 1 });
        await BankAccount.collection.createIndex({ verificationStatus: 1 });
        await BankAccount.collection.createIndex({ bankName: 1 });
        await BankAccount.collection.createIndex({ createdAt: -1 });
        await BankAccount.collection.createIndex({ accountNumber: 1 }, { unique: true });

        // 7. WithdrawalRequest Collection Optimization (indexes already exist from model)
        console.log('Optimizing WithdrawalRequest collection...');
        await WithdrawalRequest.collection.createIndex({ campaign: 1, status: 1 });
        await WithdrawalRequest.collection.createIndex({ creator: 1, status: 1, createdAt: -1 });
        await WithdrawalRequest.collection.createIndex({ status: 1, createdAt: -1 });

        // Get index information for each collection
        console.log('\n=== DATABASE OPTIMIZATION COMPLETE ===');
        
        const collections = [
            { name: 'User', model: User },
            { name: 'Campaign', model: Campaign },
            { name: 'Donation', model: Donation },
            { name: 'Payment', model: Payment },
            { name: 'Blog', model: Blog },
            { name: 'BankAccount', model: BankAccount },
            { name: 'WithdrawalRequest', model: WithdrawalRequest }
        ];

        for (const collection of collections) {
            const indexes = await collection.model.collection.getIndexes();
            console.log(`\n${collection.name} Collection Indexes:`);
            console.log(Object.keys(indexes).length + ' indexes total');
            Object.keys(indexes).forEach(indexName => {
                console.log(`  - ${indexName}`);
            });
        }

        console.log('\n=== OPTIMIZATION SUMMARY ===');
        console.log('✅ All indexes have been created successfully');
        console.log('✅ Text search indexes are active for Campaign and Blog collections');
        console.log('✅ Compound indexes created for complex queries');
        console.log('✅ Unique indexes enforced where necessary');
        console.log('✅ Performance should be significantly improved');

        console.log('\n=== RECOMMENDED QUERY PATTERNS ===');
        console.log('• Use aggregation pipelines for complex queries');
        console.log('• Always include status in Campaign queries');
        console.log('• Use lean() for read-only operations');
        console.log('• Prefer compound indexes over multiple single-field queries');
        console.log('• Use $lookup with pipeline for efficient joins');

    } catch (error) {
        console.error('Error optimizing database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the optimization
if (require.main === module) {
    optimizeDatabase();
}

module.exports = optimizeDatabase;