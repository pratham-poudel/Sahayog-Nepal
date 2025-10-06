# Database Index Creation Script for Explore Optimization

## Run these commands in MongoDB Shell or MongoDB Compass

```javascript
// Switch to your database
use your_database_name;

// ==========================================
// CAMPAIGN COLLECTION INDEXES
// ==========================================

// 1. Main filtering index (status + endDate + featured)
db.campaigns.createIndex({ 
    status: 1, 
    endDate: -1, 
    featured: 1 
}, {
    name: "idx_status_endDate_featured"
});

// 2. Category filtering index
db.campaigns.createIndex({ 
    status: 1, 
    category: 1, 
    endDate: -1 
}, {
    name: "idx_status_category_endDate"
});

// 3. Urgent tab index (tags + status + endDate)
db.campaigns.createIndex({ 
    status: 1, 
    tags: 1, 
    endDate: -1 
}, {
    name: "idx_status_tags_endDate"
});

// 4. Sorting indexes
db.campaigns.createIndex({ 
    amountRaised: -1 
}, {
    name: "idx_amountRaised_desc"
});

db.campaigns.createIndex({ 
    donors: -1 
}, {
    name: "idx_donors_desc"
});

db.campaigns.createIndex({ 
    createdAt: -1 
}, {
    name: "idx_createdAt_desc"
});

// 5. Smart mix indexes
db.campaigns.createIndex({ 
    status: 1, 
    donors: -1,
    amountRaised: -1
}, {
    name: "idx_highEngagement"
});

db.campaigns.createIndex({ 
    status: 1, 
    percentageRaised: 1,
    createdAt: -1
}, {
    name: "idx_lessFunded"
});

// 6. Text search index (for search functionality)
db.campaigns.createIndex({ 
    title: "text", 
    description: "text", 
    shortDescription: "text",
    category: "text"
}, {
    name: "idx_text_search",
    weights: {
        title: 10,
        shortDescription: 5,
        category: 3,
        description: 1
    }
});

// 7. Compound index for featured rotation
db.campaigns.createIndex({ 
    status: 1, 
    featured: 1, 
    category: 1,
    endDate: -1 
}, {
    name: "idx_featured_rotation"
});

// ==========================================
// VERIFY INDEXES
// ==========================================

// List all indexes on campaigns collection
db.campaigns.getIndexes();

// ==========================================
// ANALYZE QUERY PERFORMANCE
// ==========================================

// Test your queries with explain() to see if indexes are being used
// Example:
db.campaigns.find({ 
    status: 'active', 
    endDate: { $gte: new Date('2025-09-26') } 
}).explain("executionStats");

// ==========================================
// OPTIONAL: ANALYZE INDEX USAGE
// ==========================================

// After running for a while, check which indexes are actually being used
db.campaigns.aggregate([
    { $indexStats: {} }
]);

// ==========================================
// PERFORMANCE NOTES
// ==========================================

/*
These indexes will significantly improve query performance for:
1. Explore page regular tab (status + endDate + featured filtering)
2. Explore page urgent tab (status + tags + endDate filtering)
3. Category filtering (status + category + endDate)
4. Sorting options (amountRaised, donors, createdAt)
5. Smart mix algorithm (various compound queries)
6. Search functionality (text index)
7. Featured rotation (featured + category + endDate)

Expected improvements:
- Query time: 50-80% faster
- Reduces collection scans
- Better sorting performance
- Faster aggregation pipelines

Monitor index usage and size regularly.
Drop unused indexes to save space and improve write performance.
*/
```
