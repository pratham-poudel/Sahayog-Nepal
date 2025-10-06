# Explore Page Redesign - Implementation Guide

## Overview
The Explore page has been completely redesigned with a focus on **fair campaign visibility** and **better user experience** through infinite scroll and smart content distribution.

## Key Features

### 1. Two-Tab System
- **Regular Tab**: Shows a smart mix of all campaigns with balanced visibility
- **Urgent Tab**: Shows only campaigns tagged as "Urgent" with urgency-based sorting

### 2. Smart Algorithm (Regular Tab)
The Regular tab uses an intelligent algorithm to ensure all campaigns get fair visibility:

**Distribution Strategy (Page 1):**
- **20% Featured Campaigns**: Randomly selected from featured pool
- **25% High Engagement**: Campaigns with ≥10 donors or ≥NPR 50,000 raised
- **20% Less Funded**: Campaigns with lower funding percentages (need attention)
- **15% Ending Soon**: Campaigns closer to their deadline
- **20% Random Recent**: Random selection from remaining campaigns

**Subsequent Pages:**
- Uses regular pagination with chronological ordering
- Ensures consistent experience while scrolling

### 3. Urgent Tab Algorithm
Campaigns with "Urgent" or "urgent" tags are shown with an urgency score calculated by:
- Days remaining (fewer days = higher urgency)
- Percentage funded (lower percentage = higher urgency)
- Weighted formula ensures truly urgent campaigns appear first

### 4. Infinite Scroll
- Loads 12 campaigns per page
- Automatically loads more as user scrolls
- Skeleton loading states for smooth UX
- "End of list" indicator when all campaigns are loaded

### 5. Visual Enhancements
- **"Needs Attention" Badge**: Featured campaigns show a subtle maroon badge
- **Dynamic Category Filter**: Fetched from backend, supports all campaign categories
- **Search Functionality**: Full-text search across all tabs
- **Responsive Design**: Works seamlessly on all device sizes

## Backend Implementation

### New Files Created

#### 1. `/backend/controllers/exploreController.js`
Contains two main controllers:
- `getRegularExplore`: Implements smart mixing algorithm
- `getUrgentExplore`: Handles urgent campaign filtering and sorting

#### 2. `/backend/routes/exploreRoutes.js`
Express routes with caching:
- `GET /api/explore/regular`: Regular tab endpoint (60s cache)
- `GET /api/explore/urgent`: Urgent tab endpoint (120s cache)

### Key Backend Changes

#### Updated Files:
1. **`/backend/app.js`**
   - Added explore routes: `app.use('/api/explore', exploreRoutes);`

2. **`/backend/utils/cacheUtils.js`**
   - Added explore cache patterns for efficient cache clearing
   - Patterns: `explore:regular:*` and `explore:urgent:*`

### Cache Strategy
- **Regular Tab**: 60 seconds (allows fresh content mixing)
- **Urgent Tab**: 120 seconds (more stable content)
- **Auto-clearing**: Cache clears when campaigns are created/updated/deleted

## Frontend Implementation

### New Files Created

#### 1. `/client/src/hooks/useExplore.js`
Custom React hook for explore functionality:
- `getRegularCampaigns(options)`: Fetches regular campaigns
- `getUrgentCampaigns(options)`: Fetches urgent campaigns
- Handles loading states and error handling

#### 2. `/client/src/pages/ExploreNew.jsx`
Complete redesigned explore page with:
- Tab switching between Regular and Urgent
- Infinite scroll with Intersection Observer
- Category filtering
- Search functionality
- URL state management (bookmarkable/shareable)
- Skeleton loading states

### Updated Files

#### 1. `/client/src/components/campaigns/CampaignCard.jsx`
- Added "Needs Attention" badge for featured campaigns
- Badge appears as maroon background with white text
- Only shows for campaigns with `featured: true`

#### 2. `/client/src/App.jsx`
- Updated route to use new `ExploreNew` component
- Changed: `import Explore from "./pages/ExploreNew";`

## API Endpoints

### Regular Explore
```
GET /api/explore/regular
```

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page, max 24 (default: 12)
- `category` (string): Filter by category
- `subcategory` (string): Filter by subcategory
- `search` (string): Search term for full-text search

**Response:**
```json
{
  "success": true,
  "count": 12,
  "total": 156,
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "campaigns": [...],
  "debug": {
    "featured": 2,
    "highEngagement": 3,
    "lessFunded": 2,
    "endingSoon": 2,
    "randomRecent": 3
  }
}
```

### Urgent Explore
```
GET /api/explore/urgent
```

**Query Parameters:** Same as Regular Explore

**Response:** Same structure (without debug info)

## Database Optimization

### Existing Indexes Used
1. **Text Index**: `title`, `shortDescription`, `story`, `category` (for search)
2. **Category Index**: `category` + `status` (for filtering)
3. **Tags Index**: `tags` (for urgent filtering)
4. **Date Index**: `createdAt` (for sorting)

### Performance Considerations
- Aggregation pipelines are optimized with early `$match` stages
- Separate queries prevent duplicate results
- Random sampling uses MongoDB's efficient `$sample`
- Redis caching reduces database load

## User Experience Improvements

### 1. Fair Visibility
- All campaigns get exposure, not just featured ones
- Less-funded campaigns get attention
- Random elements prevent stagnation

### 2. Smooth Scrolling
- No page reloads
- Skeleton loaders during fetching
- Progressive loading as you scroll

### 3. Smart Filtering
- Dynamic categories from database
- Combines with search seamlessly
- Filters persist across tabs

### 4. URL State Management
- Current filters saved in URL
- Shareable/bookmarkable states
- Browser back/forward support

## Testing the Implementation

### Backend Testing
1. Start the backend server
2. Test endpoints:
   ```bash
   # Regular explore
   curl http://localhost:5000/api/explore/regular?page=1&limit=12
   
   # Urgent explore
   curl http://localhost:5000/api/explore/urgent?page=1&limit=12
   
   # With filters
   curl "http://localhost:5000/api/explore/regular?category=Healthcare&search=medical"
   ```

### Frontend Testing
1. Start the frontend dev server
2. Navigate to `/explore`
3. Test scenarios:
   - Switch between tabs
   - Scroll to load more campaigns
   - Search for campaigns
   - Filter by category
   - Check URL updates
   - Verify "Needs Attention" badge on featured campaigns

### Cache Testing
Check Redis cache:
```bash
redis-cli KEYS "explore:*"
```

## Future Enhancements

### Potential Improvements
1. **Personalization**: User preference-based recommendations
2. **Location-based**: Prioritize campaigns in user's region
3. **Time-based Rotation**: Different content at different times
4. **A/B Testing**: Test different mixing ratios
5. **Analytics**: Track which campaigns get more views/clicks
6. **Filters Enhancement**: Price range, date range, etc.

## Migration Notes

### From Old Explore to New
The old Explore page (`/pages/Explore.jsx`) has been replaced with the new implementation. Key differences:

**Old System:**
- 3 display modes (regular/featured/curated)
- Manual pagination
- Complex state management
- Featured campaigns fetched separately

**New System:**
- 2 tabs (regular/urgent)
- Infinite scroll
- Simplified state
- Smart algorithm handles mixing

### Backward Compatibility
- All existing routes work as before
- Campaign data structure unchanged
- Category API endpoints unchanged
- Search functionality enhanced but compatible

## Troubleshooting

### Common Issues

1. **Campaigns not loading**
   - Check backend server is running
   - Verify MongoDB connection
   - Check Redis connection
   - Review browser console for errors

2. **Infinite scroll not working**
   - Verify Intersection Observer support
   - Check `hasMore` flag in response
   - Ensure ref is properly attached

3. **Cache not clearing**
   - Check Redis connection
   - Verify cache utility functions
   - Test cache patterns with Redis CLI

4. **Featured badge not showing**
   - Verify campaign has `featured: true`
   - Check CampaignCard component props
   - Review CSS classes

## Performance Metrics

### Expected Performance
- **Initial Load**: < 2 seconds
- **Scroll Load**: < 1 second (with cache)
- **Search**: < 1.5 seconds
- **Cache Hit Rate**: > 70%

### Monitoring
Monitor these metrics:
- API response times
- Cache hit/miss ratios
- User engagement (scroll depth)
- Campaign click-through rates

## Conclusion

This redesign significantly improves the explore experience by:
- ✅ Ensuring fair campaign visibility
- ✅ Providing smooth infinite scroll
- ✅ Maintaining high performance with caching
- ✅ Offering intuitive filtering and search
- ✅ Highlighting campaigns that need attention

The smart algorithm balances discoverability with priority, ensuring that all campaigns get their moment in the spotlight while urgent and featured campaigns receive appropriate attention.
