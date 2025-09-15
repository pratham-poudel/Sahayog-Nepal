const mongoose = require('mongoose');
const Donation = require('./models/Donation');

async function testFixedLogic() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sahayog');
        console.log('Connected to MongoDB');
        
        console.log('Testing FIXED logic...\n');
        
        // Test the fixed aggregation pipeline
        const pipeline = [
            // Match only donations with donors (exclude null donors)
            {
                $match: {
                    donorId: { $exists: true, $ne: null }
                }
            },
            // Group by donor and calculate statistics
            {
                $group: {
                    _id: '$donorId',
                    totalDonated: { $sum: '$amount' },
                    donationCount: { $sum: 1 },
                    lastDonation: { $max: '$date' },
                    hasNonAnonymousDonations: {
                        $max: {
                            $cond: [{ $ne: ['$anonymous', true] }, 1, 0]
                        }
                    },
                    anonymousFlags: { $push: '$anonymous' } // For debugging
                }
            },
            // Filter out donors who made only anonymous donations
            {
                $match: {
                    hasNonAnonymousDonations: 1
                }
            },
            // Sort by total donated (descending)
            {
                $sort: { totalDonated: -1 }
            }
        ];

        const result = await Donation.aggregate(pipeline);
        console.log('Fixed pipeline result:');
        result.forEach((donor, index) => {
            console.log(`Donor ${index + 1}:`, {
                _id: donor._id,
                totalDonated: donor.totalDonated,
                donationCount: donor.donationCount,
                hasNonAnonymousDonations: donor.hasNonAnonymousDonations,
                anonymousFlags: donor.anonymousFlags
            });
        });
        
        console.log(`\nTotal donors found: ${result.length}`);
        
        mongoose.disconnect();
        console.log('\nTest complete');
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
}

testFixedLogic();