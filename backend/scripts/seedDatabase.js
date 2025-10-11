const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const BankAccount = require('../models/BankAccount');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Blog = require('../models/Blog');
const Payment = require('../models/Payment');
const Alert = require('../models/Alert');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nepalcrowdrise');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// Sample data generators
const generateRandomName = () => {
    const firstNames = ['Raj', 'Sita', 'Ram', 'Gita', 'Krishna', 'Maya', 'Arun', 'Sarita', 'Bikram', 'Anjali', 
                        'Suresh', 'Kamala', 'Dipak', 'Mina', 'Prakash', 'Sunita', 'Ramesh', 'Puja', 'Niraj', 'Binita'];
    const lastNames = ['Sharma', 'Thapa', 'Gurung', 'Rai', 'Tamang', 'Shrestha', 'Karki', 'Poudel', 'Adhikari', 'Gautam',
                       'Khadka', 'Magar', 'Limbu', 'Subedi', 'Bhandari', 'Chhetri', 'Basnet', 'Pandey', 'Koirala', 'Dahal'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

const generateRandomPhone = () => {
    const prefixes = ['984', '985', '986', '980', '981', '982'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000000 + Math.random() * 9000000);
    return `${prefix}${number}`;
};

const generateRandomEmail = (name) => {
    const cleanName = name.toLowerCase().replace(/\s+/g, '.');
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
};

const categories = [
    'Healthcare', 'Education', 'Animals', 'Environment', 
    'Emergency Relief', 'Community Development', 'Sports', 'Arts & Culture'
];

const subcategories = {
    'Healthcare': ['Surgery', 'Treatment', 'Medical Equipment', 'Mental Health'],
    'Education': ['School Fees', 'Scholarships', 'Books & Supplies', 'Infrastructure'],
    'Animals': ['Animal Rescue', 'Veterinary Care', 'Shelter', 'Wildlife Conservation'],
    'Environment': ['Tree Planting', 'Clean Water', 'Waste Management', 'Climate Action'],
    'Emergency Relief': ['Disaster Relief', 'Flood Relief', 'Earthquake Recovery', 'Fire Victims'],
    'Community Development': ['Women Empowerment', 'Youth Programs', 'Rural Development', 'Infrastructure'],
    'Sports': ['Sports Equipment', 'Training', 'Tournaments', 'Facilities'],
    'Arts & Culture': ['Traditional Arts', 'Music', 'Dance', 'Heritage Preservation']
};

const generateCampaignTitle = (category, subcategory) => {
    const templates = [
        `Help ${generateRandomName()} with ${subcategory}`,
        `Support ${subcategory} Initiative in Rural Nepal`,
        `Emergency ${subcategory} Fund for ${generateRandomName()}`,
        `${subcategory} Support Campaign`,
        `Urgent: ${subcategory} Required`,
        `Community ${subcategory} Project`,
        `${subcategory} for a Better Tomorrow`,
        `Join Our ${subcategory} Mission`,
        `${subcategory} Campaign - Make a Difference`,
        `Help Us Build ${subcategory} Facilities`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
};

const generateCampaignStory = (title, category) => {
    return `This is a heartfelt campaign for ${title.toLowerCase()}. 
    
We are reaching out to the compassionate community to help us in this ${category.toLowerCase()} initiative. The funds raised will be used for important purposes that will make a real difference in people's lives.

**Why This Campaign Matters:**
Our community has been facing significant challenges, and this campaign aims to address some of the most pressing needs. Every contribution, no matter how small, will help us achieve our goal and bring positive change.

**How Funds Will Be Used:**
- 40% for immediate expenses
- 30% for long-term sustainability
- 20% for administrative costs
- 10% for contingency

**Our Commitment:**
We are committed to transparency and will provide regular updates on how the funds are being utilized. All donors will receive detailed reports showing the impact of their contributions.

**Join Us:**
Together, we can make a difference. Your support means everything to us and to those we serve. Thank you for considering our campaign.

नमस्ते! हामीलाई तपाईंको सहयोग चाहिन्छ। यो अभियानले हाम्रो समुदायमा सकारात्मक परिवर्तन ल्याउनेछ।`;
};

const bankNames = [
    'Nepal Bank Limited', 'Rastriya Banijya Bank', 'Agricultural Development Bank',
    'Nabil Bank', 'Nepal Investment Bank', 'Standard Chartered Bank',
    'Himalayan Bank', 'Nepal SBI Bank', 'Nepal Bangladesh Bank',
    'Everest Bank', 'Kumari Bank', 'Laxmi Bank', 'Citizens Bank International',
    'Prime Commercial Bank', 'Sunrise Bank', 'Century Commercial Bank',
    'Sanima Bank', 'Machhapuchchhre Bank', 'NIC Asia Bank', 'Global IME Bank',
    'NMB Bank', 'Prabhu Bank', 'Siddhartha Bank'
];

// Main seeding function
const seedDatabase = async () => {
    try {
        await connectDB();
        
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({ role: 'user' }); // Don't delete admins
        await Campaign.deleteMany({});
        await Donation.deleteMany({});
        await BankAccount.deleteMany({});
        await WithdrawalRequest.deleteMany({});
        await Blog.deleteMany({});
        await Payment.deleteMany({});
        await Alert.deleteMany({});
        
        console.log('✅ Existing data cleared!\n');

        // Create 10 users
        console.log('👥 Creating 10 users...');
        const users = [];
        
        for (let i = 0; i < 10; i++) {
            const name = generateRandomName();
            const user = await User.create({
                name: name,
                email: generateRandomEmail(name),
                phone: generateRandomPhone(),
                password: 'Test@123', // Will be hashed automatically
                role: 'user',
                bio: `Hello! I am ${name}. I believe in the power of community and helping others. Together we can make Nepal a better place.`,
                kycVerified: true,
                isPremiumAndVerified: true,
                country: 'Nepal',
                countryCode: 'NP',
                riskScore: Math.floor(Math.random() * 20) // Low risk scores
            });
            users.push(user);
            console.log(`   ✓ Created user: ${user.name} (${user.email})`);
        }

        console.log(`\n✅ ${users.length} users created!\n`);

        // Create bank accounts for users
        console.log('🏦 Creating bank accounts for users...');
        const bankAccounts = [];
        
        for (const user of users) {
            const account = await BankAccount.create({
                userId: user._id,
                bankName: bankNames[Math.floor(Math.random() * bankNames.length)],
                accountNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`,
                accountName: user.name,
                associatedPhoneNumber: user.phone,
                documentType: ['citizenship', 'license', 'passport'][Math.floor(Math.random() * 3)],
                documentNumber: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
                documentImage: '/uploads/documents/sample-document.jpg',
                verificationStatus: 'verified',
                verificationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
                isPrimary: true,
                isActive: true
            });
            bankAccounts.push(account);
            console.log(`   ✓ Bank account created for ${user.name}`);
        }

        console.log(`\n✅ ${bankAccounts.length} bank accounts created!\n`);

        // Create 10 campaigns for each user (100 total campaigns)
        console.log('🎯 Creating campaigns...');
        const campaigns = [];
        let totalCampaigns = 0;

        for (const user of users) {
            const userCampaigns = [];
            
            for (let i = 0; i < 10; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const subcategory = subcategories[category][Math.floor(Math.random() * subcategories[category].length)];
                const title = generateCampaignTitle(category, subcategory);
                const targetAmount = Math.floor(50000 + Math.random() * 950000); // 50k to 1M
                
                // Random start date in the past (last 90 days)
                const startDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
                // End date 30-90 days after start date
                const endDate = new Date(startDate.getTime() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000);
                
                const campaign = await Campaign.create({
                    title: title,
                    shortDescription: `Support our ${category.toLowerCase()} initiative. Every contribution makes a difference in ${subcategory.toLowerCase()}.`,
                    story: generateCampaignStory(title, category),
                    category: category,
                    subcategory: subcategory,
                    tags: Math.random() > 0.7 ? ['Verified', 'Urgent'] : ['Verified'],
                    featured: Math.random() > 0.8, // 20% chance of being featured
                    targetAmount: targetAmount,
                    amountRaised: 0, // Will be updated with donations
                    amountWithdrawn: 0,
                    pendingWithdrawals: 0,
                    donors: 0,
                    startDate: startDate,
                    endDate: endDate,
                    coverImage: `/uploads/campaigns/campaign-${Math.floor(Math.random() * 10)}.jpg`,
                    images: [
                        `/uploads/campaigns/img-${Math.floor(Math.random() * 20)}.jpg`,
                        `/uploads/campaigns/img-${Math.floor(Math.random() * 20)}.jpg`
                    ],
                    verificationDocuments: [
                        `/uploads/verification/doc-${Math.floor(Math.random() * 100)}.pdf`
                    ],
                    lapLetter: `/uploads/lap/letter-${Math.floor(Math.random() * 100)}.pdf`,
                    creator: user._id,
                    status: 'active',
                    verifiedBy: {
                        employeeName: 'System Admin',
                        employeeDesignation: 'Campaign Verifier',
                        verifiedAt: startDate
                    },
                    verificationNotes: 'Campaign verified and approved. All documents are in order.'
                });
                
                userCampaigns.push(campaign._id);
                campaigns.push(campaign);
                totalCampaigns++;
            }
            
            // Update user with campaign references
            user.campaigns = userCampaigns;
            await user.save();
            
            console.log(`   ✓ Created 10 campaigns for ${user.name} (Total: ${totalCampaigns})`);
        }

        console.log(`\n✅ ${campaigns.length} campaigns created!\n`);

        // Create donations for campaigns
        console.log('💰 Creating donations...');
        const donations = [];
        const payments = [];
        let totalDonations = 0;

        for (const campaign of campaigns) {
            // Each campaign gets 3-15 donations
            const numDonations = Math.floor(3 + Math.random() * 13);
            
            for (let i = 0; i < numDonations; i++) {
                const isDonorUser = Math.random() > 0.3; // 70% are from registered users
                const donor = isDonorUser ? users[Math.floor(Math.random() * users.length)] : null;
                const isAnonymous = Math.random() > 0.7; // 30% anonymous
                
                const donationAmount = Math.floor(100 + Math.random() * 9900); // 100 to 10,000 NPR
                const platformFeePercentage = 2.5;
                const platformFee = Math.floor(donationAmount * (platformFeePercentage / 100));
                const totalAmount = donationAmount + platformFee;
                
                const donorName = donor ? donor.name : generateRandomName();
                const donorEmail = donor ? donor.email : generateRandomEmail(donorName);
                const donorPhone = donor ? donor.phone : generateRandomPhone();
                
                // Create donation
                const donation = await Donation.create({
                    campaignId: campaign._id,
                    donorId: donor ? donor._id : undefined,
                    donorName: isAnonymous ? 'Anonymous' : donorName,
                    donorEmail: donorEmail,
                    donorPhone: donorPhone,
                    amount: donationAmount,
                    message: Math.random() > 0.5 ? 'Best wishes for your campaign!' : '',
                    date: new Date(campaign.startDate.getTime() + Math.random() * (Date.now() - campaign.startDate.getTime())),
                    anonymous: isAnonymous,
                    riskScore: Math.floor(Math.random() * 15), // Low risk
                    flags: []
                });
                
                donations.push(donation);
                
                // Create corresponding payment
                const payment = await Payment.create({
                    amount: donationAmount,
                    currency: 'NPR',
                    campaignId: campaign._id,
                    donationId: donation._id,
                    userId: donor ? donor._id : undefined,
                    donorName: isAnonymous ? 'Anonymous' : donorName,
                    donorEmail: donorEmail,
                    donorPhone: donorPhone,
                    donorMessage: donation.message,
                    isAnonymous: isAnonymous,
                    platformFee: platformFee,
                    platformFeePercentage: platformFeePercentage,
                    totalAmount: totalAmount,
                    paymentMethod: ['khalti', 'esewa', 'fonepay'][Math.floor(Math.random() * 3)],
                    status: 'Completed',
                    transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`,
                    purchaseOrderId: `PO${Date.now()}${Math.floor(Math.random() * 10000)}`,
                    purchaseOrderName: campaign.title.substring(0, 50),
                    isProcessed: true,
                    riskScore: donation.riskScore,
                    flags: [],
                    amlStatus: 'ok',
                    country: 'Nepal',
                    countryCode: 'NP',
                    isVPNDetected: false
                });
                
                payments.push(payment);
                
                // Update campaign stats
                campaign.amountRaised += donationAmount;
                campaign.donors += 1;
                campaign.donations.push(donation._id);
                
                totalDonations++;
            }
            
            await campaign.save();
        }

        console.log(`   ✓ Created ${totalDonations} donations across all campaigns`);
        console.log(`   ✓ Created ${payments.length} payment records`);
        console.log(`\n✅ Donations and payments created!\n`);

        // Create some withdrawal requests
        console.log('📤 Creating withdrawal requests...');
        const withdrawalRequests = [];
        
        // Create withdrawal requests for campaigns with sufficient funds
        const eligibleCampaigns = campaigns.filter(c => c.amountRaised >= 10000);
        const numWithdrawals = Math.min(20, eligibleCampaigns.length);
        
        for (let i = 0; i < numWithdrawals; i++) {
            const campaign = eligibleCampaigns[Math.floor(Math.random() * eligibleCampaigns.length)];
            const creator = users.find(u => u._id.toString() === campaign.creator.toString());
            const bankAccount = bankAccounts.find(b => b.userId.toString() === creator._id.toString());
            
            if (bankAccount) {
                const availableAmount = campaign.amountRaised - campaign.amountWithdrawn - campaign.pendingWithdrawals;
                const requestedAmount = Math.floor(availableAmount * (0.3 + Math.random() * 0.5)); // 30-80% of available
                
                if (requestedAmount >= 1000) {
                    const statuses = ['pending', 'approved', 'processing', 'completed'];
                    const status = statuses[Math.floor(Math.random() * statuses.length)];
                    
                    const withdrawal = await WithdrawalRequest.create({
                        campaign: campaign._id,
                        creator: creator._id,
                        bankAccount: bankAccount._id,
                        requestedAmount: requestedAmount,
                        availableAmount: availableAmount,
                        withdrawalType: requestedAmount === availableAmount ? 'full' : 'partial',
                        reason: 'Funds needed for campaign expenses and beneficiary support.',
                        status: status,
                        employeeProcessedBy: status !== 'pending' ? {
                            employeeName: 'Withdrawal Officer',
                            employeeDesignation: 'Withdrawal Department',
                            processedAt: new Date(),
                            action: 'approved',
                            notes: 'Documents verified and approved.'
                        } : undefined,
                        adminResponse: status === 'processing' || status === 'completed' ? {
                            reviewedAt: new Date(),
                            comments: 'Transaction being processed',
                            action: status === 'completed' ? 'completed' : 'processing'
                        } : undefined,
                        processingDetails: status === 'completed' ? {
                            processedAt: new Date(),
                            transactionReference: `TXN-WD-${Date.now()}`,
                            processingFee: Math.floor(requestedAmount * 0.02), // 2% fee
                            finalAmount: Math.floor(requestedAmount * 0.98)
                        } : undefined
                    });
                    
                    withdrawalRequests.push(withdrawal);
                    
                    // Update campaign amounts
                    if (status === 'completed') {
                        campaign.amountWithdrawn += requestedAmount;
                    } else if (status === 'pending' || status === 'approved' || status === 'processing') {
                        campaign.pendingWithdrawals += requestedAmount;
                    }
                    
                    await campaign.save();
                }
            }
        }

        console.log(`   ✓ Created ${withdrawalRequests.length} withdrawal requests`);
        console.log(`\n✅ Withdrawal requests created!\n`);

        // Create some blogs
        console.log('📝 Creating blog posts...');
        const blogs = [];
        const blogTopics = [
            'How Crowdfunding is Changing Lives in Nepal',
            'Success Stories: Campaigns That Made a Difference',
            'Guide to Creating an Effective Campaign',
            'The Power of Community Support',
            'Understanding Crowdfunding in Nepal',
            'Tips for Campaign Creators',
            'How to Choose the Right Campaign to Support',
            'Impact of Your Donations',
            'Transparency in Crowdfunding',
            'Building Trust with Donors'
        ];

        for (let i = 0; i < 10; i++) {
            const author = users[Math.floor(Math.random() * users.length)];
            const title = blogTopics[i];
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            const blog = await Blog.create({
                title: title,
                slug: slug + '-' + Date.now(),
                excerpt: `Learn about ${title.toLowerCase()} and how it impacts our community in Nepal.`,
                content: [
                    {
                        type: 'heading',
                        level: 1,
                        content: title
                    },
                    {
                        type: 'paragraph',
                        content: 'This is an important topic that affects many people in our community. In this article, we will explore various aspects and provide valuable insights.'
                    },
                    {
                        type: 'heading',
                        level: 2,
                        content: 'Why This Matters'
                    },
                    {
                        type: 'paragraph',
                        content: 'Understanding this topic is crucial for anyone involved in crowdfunding or community support initiatives. The impact reaches far beyond individual campaigns.'
                    },
                    {
                        type: 'paragraph',
                        content: 'Through our platform, thousands of Nepali citizens have been able to receive support for their causes, whether medical emergencies, education needs, or community projects.'
                    }
                ],
                author: author._id,
                coverImage: `/uploads/blogs/blog-${Math.floor(Math.random() * 10)}.jpg`,
                tags: ['crowdfunding', 'nepal', 'community', 'support'],
                readTime: Math.floor(3 + Math.random() * 7),
                status: 'published',
                publishedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
                views: Math.floor(100 + Math.random() * 2000),
                likes: Math.floor(10 + Math.random() * 200)
            });
            
            blogs.push(blog);
        }

        console.log(`   ✓ Created ${blogs.length} blog posts`);
        console.log(`\n✅ Blog posts created!\n`);

        // Print summary
        console.log('\n═══════════════════════════════════════════════');
        console.log('           🎉 SEEDING COMPLETE! 🎉');
        console.log('═══════════════════════════════════════════════\n');
        console.log('📊 Database Statistics:');
        console.log(`   👥 Users: ${users.length}`);
        console.log(`   🎯 Campaigns: ${campaigns.length}`);
        console.log(`   💰 Donations: ${donations.length}`);
        console.log(`   💳 Payments: ${payments.length}`);
        console.log(`   🏦 Bank Accounts: ${bankAccounts.length}`);
        console.log(`   📤 Withdrawal Requests: ${withdrawalRequests.length}`);
        console.log(`   📝 Blogs: ${blogs.length}`);
        console.log('\n');
        
        // Print test user credentials
        console.log('🔐 Test User Credentials (Password for all: Test@123):');
        console.log('═══════════════════════════════════════════════\n');
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Campaigns: ${user.campaigns.length}`);
            console.log('');
        });
        
        console.log('═══════════════════════════════════════════════');
        console.log('✅ You can now log in with any of the above credentials');
        console.log('🔑 Password for all accounts: Test@123');
        console.log('═══════════════════════════════════════════════\n');

        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seeding
seedDatabase();
