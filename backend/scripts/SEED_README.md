# Database Seeding Script

This script populates your database with realistic test data for development and testing purposes.

## What Gets Created

### 📊 Data Summary
- **10 Users** - Regular users with verified KYC status
- **100 Campaigns** - 10 campaigns per user, all verified and active
- **300-1500 Donations** - Random donations across all campaigns (3-15 per campaign)
- **10 Bank Accounts** - One verified bank account per user
- **~20 Withdrawal Requests** - Various statuses (pending, approved, processing, completed)
- **10 Blog Posts** - Published articles about crowdfunding
- **Payments** - One payment record for each donation

## How to Run

### Using NPM Script (Recommended)
```bash
cd backend
npm run seed
```

### Direct Execution
```bash
cd backend
node scripts/seedDatabase.js
```

## What the Script Does

### 1. Clears Existing Data
- Removes all existing users (except admins/employees)
- Clears campaigns, donations, payments
- Removes bank accounts, withdrawal requests, blogs, and alerts

### 2. Creates Users
- 10 users with Nepali names
- Random email addresses and phone numbers
- All passwords set to: `Test@123`
- KYC verified and premium status enabled
- Low risk scores for clean testing

### 3. Creates Campaigns
- Each user creates 10 campaigns
- Various categories: Healthcare, Education, Animals, Environment, etc.
- All campaigns are pre-verified and active
- Realistic target amounts (NPR 50,000 - 1,000,000)
- Start dates in the past 90 days
- End dates 30-90 days after start
- 20% chance of being featured
- Complete with cover images, documents, and LAP letters

### 4. Creates Donations & Payments
- Each campaign receives 3-15 donations
- 70% from registered users, 30% from guests
- 30% anonymous donations
- Donation amounts: NPR 100 - 10,000
- 2.5% platform fee applied
- Complete payment records with transaction IDs
- All payments marked as "Completed"

### 5. Creates Bank Accounts
- One verified bank account per user
- Random Nepali banks
- All accounts pre-verified and active
- Set as primary accounts

### 6. Creates Withdrawal Requests
- ~20 withdrawal requests across eligible campaigns
- Various statuses for testing different workflows
- Includes employee and admin processing information
- Realistic withdrawal amounts (30-80% of available funds)

### 7. Creates Blog Posts
- 10 published blog articles
- Topics related to crowdfunding and community
- Random view counts and likes
- Published in the last 60 days

## Test Credentials

After running the script, you'll see a list of all created users with their credentials:

```
Email: raj.sharma123@gmail.com
Phone: 9841234567
Password: Test@123
```

**All users have the same password: `Test@123`**

You can log in with either email or phone number.

## Database Connection

The script uses the MongoDB connection string from:
1. Environment variable: `MONGODB_URI`
2. Default fallback: `mongodb://localhost:27017/nepalcrowdrise`

Make sure your MongoDB is running before executing the script.

## Categories & Subcategories

### Healthcare
- Surgery, Treatment, Medical Equipment, Mental Health

### Education
- School Fees, Scholarships, Books & Supplies, Infrastructure

### Animals
- Animal Rescue, Veterinary Care, Shelter, Wildlife Conservation

### Environment
- Tree Planting, Clean Water, Waste Management, Climate Action

### Emergency Relief
- Disaster Relief, Flood Relief, Earthquake Recovery, Fire Victims

### Community Development
- Women Empowerment, Youth Programs, Rural Development, Infrastructure

### Sports
- Sports Equipment, Training, Tournaments, Facilities

### Arts & Culture
- Traditional Arts, Music, Dance, Heritage Preservation

## Data Characteristics

### Realistic Data
- Nepali names from common first and last names
- Phone numbers with valid Nepali prefixes (984, 985, 986, etc.)
- Campaign stories in English with some Nepali text
- Proper date sequences (start before end, donations after start)

### Variation
- Random distribution of data
- Different campaign success rates (different amounts raised)
- Mix of featured and regular campaigns
- Various donation amounts and patterns

### Testing-Friendly
- Low risk scores (for AML testing)
- All statuses represented (for workflow testing)
- Sufficient data for pagination testing
- Pre-verified accounts (skip verification flows)

## Use Cases

### 1. Development
- Test features with realistic data
- Develop UI with proper content
- Test search and filtering functionality

### 2. Testing
- Test pagination with 100 campaigns
- Test donation flows with existing campaigns
- Test withdrawal workflows at various stages
- Test user dashboards with multiple campaigns

### 3. Demo
- Show the platform to stakeholders
- Present with meaningful data
- Demonstrate all features

### 4. Performance Testing
- Test with moderate data volume
- Identify slow queries
- Optimize database indexes

## Important Notes

⚠️ **Warning**: This script will delete existing user data (not admins/employees)

✅ **Safe**: Admin and Employee accounts are preserved

🔄 **Idempotent**: Can be run multiple times safely

📝 **Logging**: Provides detailed progress information

## Troubleshooting

### MongoDB Connection Error
```
Error connecting to MongoDB: connect ECONNREFUSED
```
**Solution**: Make sure MongoDB is running
```bash
# Windows (if using MongoDB service)
net start MongoDB

# Or check if mongod is running
```

### Duplicate Key Error
```
E11000 duplicate key error
```
**Solution**: The script should handle this, but if it persists, you may need to manually clear the database or drop the collection with the duplicate.

### Missing Dependencies
```
Cannot find module 'bcryptjs'
```
**Solution**: Install dependencies
```bash
npm install
```

## Script Output

The script provides detailed progress information:

```
🗑️  Clearing existing data...
✅ Existing data cleared!

👥 Creating 10 users...
   ✓ Created user: Raj Sharma (raj.sharma123@gmail.com)
   ...

🎯 Creating campaigns...
   ✓ Created 10 campaigns for Raj Sharma (Total: 10)
   ...

💰 Creating donations...
   ✓ Created 428 donations across all campaigns
   ...

═══════════════════════════════════════════════
           🎉 SEEDING COMPLETE! 🎉
═══════════════════════════════════════════════

📊 Database Statistics:
   👥 Users: 10
   🎯 Campaigns: 100
   💰 Donations: 428
   ...
```

## Next Steps After Seeding

1. **Start the server**: `npm run dev`
2. **Log in** with any of the test accounts
3. **Browse campaigns** - You'll see 100 active campaigns
4. **Test donations** - Make donations to campaigns
5. **Test withdrawals** - Request withdrawals from campaigns
6. **View dashboards** - Check user and campaign dashboards

## Customization

You can modify the script to:
- Change the number of users (currently 10)
- Change campaigns per user (currently 10)
- Adjust donation ranges
- Modify categories and subcategories
- Change verification status
- Adjust date ranges

Just edit `seedDatabase.js` and run it again!

---

**Happy Testing! 🚀**
