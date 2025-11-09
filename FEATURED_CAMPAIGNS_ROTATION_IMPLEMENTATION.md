# Featured Campaigns Dynamic Rotation Implementation

## Overview
Implemented a truly dynamic and scalable rotation system for featured campaigns that fetches fresh campaigns from the backend on each rotation cycle instead of pre-fetching and cycling through cached data.

## Changes Made

### 1. Backend Changes (`backend/controllers/campaignController.js`)

#### Updated `getRotatingFeaturedCampaigns` Function
- **Changed from page-based to offset-based pagination**
  - Replaced `page` parameter with `offset` for seamless rotation
  - Each request fetches exactly 3 campaigns (fixed for consistent UI)
  - Returns `nextOffset` for the frontend to use in the next request

- **Improved rotation logic**
  - Uses modulo arithmetic to wrap around when offset exceeds total campaigns
  - Weighted random strategy selection for better variety:
    - "Recently Added" (weight: 1)
    - "Most Popular" (weight: 1)
    - "Ending Soon" (weight: 2 - higher priority for urgency)
    - "Nearly Funded" (weight: 1.5)

- **Better logging and monitoring**
  - Added comprehensive console logs with `[Featured Rotation]` prefix
  - Tracks offset, strategy, and campaign counts

#### Response Structure
```json
{
  "success": true,
  "count": 3,
  "total": 12,
  "offset": 0,
  "nextOffset": 3,
  "strategy": "Ending Soon",
  "isFallback": false,
  "hasMore": true,
  "campaigns": [...]
}
```

### 2. Route Configuration (`backend/routes/campaignRoutes.js`)

- **Reduced cache TTL from 60s to 30s**
  - Allows for fresher content while maintaining performance
  - Cache key includes offset for proper cache segregation
  - Short cache prevents stale data while reducing database load

### 3. Frontend Changes (`client/src/components/home/FeaturedCampaigns.jsx`)

#### State Management Refactoring
**Removed:**
- `currentIndex`, `currentPage` - No longer needed for pre-fetched rotation
- `allCampaignsRef`, `totalFetchedRef` - Not storing campaign pool
- `isLoadingMore` - Simplified to single `isFetching` state

**Added:**
- `currentOffset` - Tracks rotation position
- `isFetching` & `isFetchingRef` - Prevents concurrent API calls
- `totalCampaigns` - Stores total available campaigns

#### Dynamic Fetching Implementation

```javascript
const fetchFeaturedCampaigns = async (offset = 0) => {
  // Prevents concurrent fetches
  if (isFetchingRef.current) return false;
  
  // Fetch exactly 3 campaigns at given offset
  const result = await getRotatingFeaturedCampaigns({
    offset,
    category: activeCategory !== 'All Campaigns' ? activeCategory : null
  });
  
  // Update state with fresh campaigns
  setCampaigns(result.campaigns);
  setCurrentOffset(result.nextOffset);
  
  return true;
};
```

#### Auto-Rotation Logic

```javascript
useEffect(() => {
  const rotationInterval = setInterval(async () => {
    if (isAnimatingRef.current || isFetchingRef.current) return;
    
    setIsAnimating(true);
    
    // Fetch next batch using stored offset
    await fetchFeaturedCampaigns(currentOffset);
    
    setTimeout(() => setIsAnimating(false), 800);
  }, 6000); // 6 second rotation cycle
  
  return () => clearInterval(rotationInterval);
}, [loading, hasMore, currentOffset, activeCategory]);
```

### 4. API Hook Updates (`client/src/hooks/useCampaigns.js`)

#### Updated `getRotatingFeaturedCampaigns`
- Changed from `page` parameter to `offset` parameter
- Removed unnecessary `count` parameter (always 3)
- Returns enhanced data structure with `nextOffset` and `hasMore`
- Improved error handling and logging

## Architecture Benefits

### 1. **Truly Dynamic Rotation**
- Each rotation fetches fresh data from the database
- No client-side campaign pool to manage
- Real-time updates reflected in rotation

### 2. **Scalability**
- Offset-based pagination handles large campaign databases efficiently
- Constant memory footprint (always 3 campaigns in state)
- No frontend limits on total campaigns

### 3. **Performance Optimization**
- 30-second cache on backend reduces database load
- Offset-based queries are highly optimized in MongoDB
- Prevents race conditions with proper state management

### 4. **User Experience**
- Smooth animations with 800ms cooldown
- 6-second rotation cycle for good visibility
- Variety through weighted strategy selection
- Seamless wrap-around when reaching end of campaigns

### 5. **Maintainability**
- Clean separation of concerns
- Comprehensive logging for debugging
- Clear state management flow
- Easy to adjust rotation parameters

## API Request Flow

```
Frontend                          Backend                       Database
   |                                 |                              |
   |-- GET /featured/rotation ------>|                              |
   |   ?offset=0&category=X          |                              |
   |                                 |------ Query with offset ---->|
   |                                 |<----- 3 campaigns -----------|
   |<-- Response with nextOffset ---|                              |
   |                                 |                              |
   |-- Wait 6 seconds ------------->|                              |
   |                                 |                              |
   |-- GET /featured/rotation ------>|                              |
   |   ?offset=3&category=X          |                              |
   |                                 |------ Query with offset ---->|
   |                                 |<----- Next 3 campaigns ------|
   |<-- Response with nextOffset ---|                              |
   |                                 |                              |
```

## Cache Strategy

### Redis Cache Keys
```
featuredRotation:category:Education|offset:0
featuredRotation:category:Healthcare|offset:3
featuredRotation:offset:0
```

### Cache TTL: 30 seconds
- Fresh enough for dynamic content
- Long enough to reduce database load
- Automatically invalidates when campaigns are created/updated

## Testing Recommendations

1. **Test rotation with different category filters**
   - Verify offset wraps correctly
   - Check strategy variety

2. **Test with various campaign counts**
   - < 3 campaigns
   - Exactly 3 campaigns
   - > 3 campaigns
   - Large numbers (100+)

3. **Test concurrent requests**
   - Verify fetch prevention works
   - Check animation state management

4. **Monitor performance**
   - Check Redis hit rates
   - Monitor database query times
   - Verify no memory leaks

## Environment Variables Required

```env
REDIS_HOST=<redis-connection-url>
```

## Performance Metrics

### Expected Performance:
- **First Load:** ~200-500ms (cache miss)
- **Subsequent Rotations:** ~50-150ms (cache hit)
- **Memory Usage:** ~1-2MB constant (3 campaigns)
- **Database Load:** Minimal (cached 30s)

## Monitoring & Logging

All log messages are prefixed with `[Featured Rotation]` or `[Rotation]` for easy filtering:

```bash
# Backend logs
[Featured Rotation] Query: {...} Offset: 0
[Featured Rotation] Found 12 featured campaigns total
[Featured Rotation] Using strategy: Ending Soon, Offset: 0
[Featured Rotation] Retrieved 3 campaigns at offset 0

# Frontend logs
[Rotation] Fetching campaigns for category: Education, offset: 0
[Rotation] Received 3 campaigns (strategy: Ending Soon)
[Rotation] Starting rotation cycle...
```

## Future Enhancements

1. **Personalization**
   - Track user preferences
   - Show campaigns based on donation history

2. **A/B Testing**
   - Test different rotation intervals
   - Compare strategy effectiveness

3. **Analytics**
   - Track which strategies get most clicks
   - Monitor rotation engagement metrics

4. **Smart Caching**
   - Predictive pre-fetching
   - User-specific cache warming

## Troubleshooting

### Issue: Campaigns not rotating
- Check Redis connection
- Verify `hasMore` is true
- Check console for fetch errors

### Issue: Same campaigns repeating
- Verify offset is incrementing
- Check total campaign count
- Review database query results

### Issue: Slow rotation
- Check cache hit rates
- Monitor database response times
- Review network latency

## Conclusion

This implementation provides a robust, scalable, and maintainable solution for dynamically rotating featured campaigns. The offset-based approach with short caching strikes the perfect balance between freshness and performance, while the weighted strategy selection ensures variety and relevance.
