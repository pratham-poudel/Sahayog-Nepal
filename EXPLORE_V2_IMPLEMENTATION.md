# Explore Page V2 - Complete Implementation

## Overview
Redesigned the Explore page with improved search, filtering, and infinite scroll capabilities.

## Key Features

### 1. **Two-Tab System**
- **Regular Tab**: Smart algorithm mixing featured, high-engagement, less-funded, ending-soon, and recent campaigns
- **Urgent Tab**: Shows only campaigns with "Urgent" tag, prioritized by urgency score

### 2. **MongoDB Text Search**
- Implemented proper MongoDB `$text` search for better performance
- Searches across: title, shortDescription, story, and category fields
- Uses text search score for relevance ranking when searching

### 3. **Debounced Search**
- 500ms delay after user stops typing before making API calls
- Reduces server load and improves UX
- Instant search for empty queries

### 4. **Advanced Sorting Options**

#### Regular Tab:
- **Smart Mix** (default): Intelligent algorithm distributing campaign types
- **Newest**: Recently created campaigns first
- **Ending Soon**: Campaigns nearing deadline
- **Needs Support**: Least funded campaigns
- **Most Funded**: Highest funded campaigns

#### Urgent Tab:
- **Most Urgent** (default): Based on urgency score (days left + funding percentage)
- **Ending Soon**: Campaigns nearing deadline
- **Newest**: Recently created campaigns
- **Needs Support**: Least funded campaigns
- **Most Funded**: Highest funded campaigns

### 5. **Infinite Scroll**
- Automatic loading as user scrolls down
- Loading skeleton while fetching
- "End of list" indicator
- Optimized with IntersectionObserver API

### 6. **Featured Campaign Badge**
- Small "Needs Attention" badge on featured campaigns
- Maroon background with white text
- Subtle indicator without overwhelming the design

### 7. **Dynamic Category Selector**
- Fetched from backend
- All categories available in both tabs
- Updates results in real-time

## Backend Changes

### New Controller: `exploreController.js`

#### Smart Algorithm (Regular Tab)
```javascript
// Distribution for page 1:
// - Featured: 20%
// - High Engagement (donors/amount): 25%
// - Less Funded: 20%
// - Ending Soon: 15%
// - Random Recent: 20%
// 
// Shuffled for variety
// Subsequent pages: regular pagination
```

#### Urgency Score (Urgent Tab)
```javascript
urgencyScore = (daysLeft/30 * -50) + ((100 - percentageRaised) * -0.3)
// Lower score = more urgent
// Prioritizes campaigns with fewer days and less funding
```

### New Routes: `exploreRoutes.js`
```javascript
GET /api/explore/regular - Smart explore with mixed content
GET /api/explore/urgent  - Urgent campaigns only
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 12, max: 24)
- `category`: Filter by category
- `subcategory`: Filter by subcategory
- `search`: Text search term
- `sortBy`: Sort option (see sorting options above)

### Caching Strategy
```javascript
// Regular explore: 60 seconds cache
// Urgent explore: 30 seconds cache (more dynamic)
// Categories: 3600 seconds (1 hour) cache
```

## Frontend Changes

### New Component: `NewExplore.jsx`
- Clean, modern UI with Tailwind CSS
- Shadcn/ui components (Tabs, Select, Input, Skeleton)
- Responsive design (mobile-first)
- Dark mode support

### Updated Hook: `useExplore.js`
```javascript
- getRegularCampaigns(options)
- getUrgentCampaigns(options)
- debouncedSearch(fetchFunction, options)
- cancelDebouncedSearch()
```

### Updated Component: `CampaignCard.jsx`
- Added "Needs Attention" badge for featured campaigns
- Badge only shows when `campaign.featured === true`

## Database Requirements

### Text Index (Required for Search)
The Campaign model must have a text index on searchable fields:

```javascript
// In Campaign.js model:
campaignSchema.index({ 
  title: 'text', 
  shortDescription: 'text', 
  story: 'text',
  category: 'text'
}, {
  weights: {
    title: 10,
    shortDescription: 5,
    story: 3,
    category: 2
  },
  name: 'campaign_text_search'
});
```

**To create the index manually:**
```javascript
db.campaigns.createIndex({
  title: "text",
  shortDescription: "text",
  story: "text",
  category: "text"
}, {
  weights: {
    title: 10,
    shortDescription: 5,
    story: 3,
    category: 2
  },
  name: "campaign_text_search"
});
```

## Performance Optimizations

1. **Aggregation Pipelines**: Used for complex queries instead of multiple separate queries
2. **Pagination**: Proper skip/limit to reduce memory usage
3. **Debouncing**: Reduces API calls during typing
4. **Caching**: Redis caching for frequently accessed data
5. **Indexes**: Text indexes for fast search, regular indexes on commonly queried fields
6. **Lazy Loading**: Only loads images as they come into viewport

## User Experience Improvements

1. **Instant Feedback**: Loading states for all actions
2. **Smooth Transitions**: No page reloads, smooth infinite scroll
3. **Clear Indicators**: Loading skeletons, end-of-list message
4. **Search Suggestions**: Real-time search results as user types
5. **Empty States**: Friendly messages when no results found
6. **Mobile Optimized**: Touch-friendly, responsive design

## Testing Checklist

- [ ] Text search works across all fields
- [ ] Debounced search delays 500ms
- [ ] Infinite scroll loads next page automatically
- [ ] Featured badge shows on featured campaigns
- [ ] Both tabs work independently
- [ ] Category filter works in both tabs
- [ ] All sort options work correctly
- [ ] Loading states show properly
- [ ] Empty state shows when no results
- [ ] Mobile responsive design works
- [ ] Dark mode displays correctly
- [ ] Cache invalidation works on campaign updates

## API Response Format

```json
{
  "success": true,
  "count": 12,
  "total": 145,
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
  "debug": { // Only in regular tab, page 1
    "featured": 2,
    "highEngagement": 3,
    "lessFunded": 2,
    "endingSoon": 2,
    "randomRecent": 3
  }
}
```

## Error Handling

1. **Backend Errors**: Returns 500 with error message
2. **No Results**: Empty array with success: true
3. **Invalid Parameters**: Defaults to safe values
4. **Network Errors**: Caught in frontend with toast notification
5. **Search Timeout**: Cancels previous request before new one

## Cache Keys

```javascript
// Regular explore
`explore:regular:${category}:${search}:${sortBy}:${page}`

// Urgent explore
`explore:urgent:${category}:${search}:${sortBy}:${page}`

// Clear on:
- Campaign create/update/delete
- Campaign status change
- Tag changes
```

## Future Enhancements

1. **Saved Searches**: Allow users to save their favorite searches
2. **Email Alerts**: Notify users of new campaigns matching their interests
3. **Filters**: Add more filters (funding range, date range, location)
4. **Map View**: Show campaigns on a map
5. **Recommendations**: Personalized campaign recommendations
6. **Share**: Social media sharing for search results
7. **Export**: Export campaign list as PDF/CSV

## Notes

- The smart algorithm ensures fair distribution of visibility
- Urgent tab uses a calculated urgency score for better prioritization
- Text search is more efficient than regex for large datasets
- Infinite scroll improves perceived performance
- Featured badge is subtle to avoid feeling like advertising

## Deployment Steps

1. Create text index on campaigns collection
2. Deploy backend changes (controller, routes)
3. Update app.js to include explore routes
4. Clear Redis cache
5. Deploy frontend changes
6. Test all functionality
7. Monitor server performance

## Performance Metrics

**Target Metrics:**
- Page load: < 2 seconds
- Search response: < 500ms
- Infinite scroll load: < 1 second
- Cache hit rate: > 80%

**Expected Database Impact:**
- Text search uses indexes: Low impact
- Aggregation pipelines: Optimized queries
- Pagination: Efficient memory usage
