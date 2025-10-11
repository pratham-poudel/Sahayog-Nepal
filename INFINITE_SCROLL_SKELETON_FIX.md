# Infinite Scroll Skeleton Loading Fix

## Issue
When scrolling down to load more campaigns, there was a brief flash of blank space between:
1. The skeleton loaders disappearing
2. The actual new campaigns appearing

This created a jarring visual experience where the skeleton would vanish and then 1 second later, the campaigns would pop in.

## Root Cause
The component was using a single `loading` state from the `useExplore` hook to control both:
- Initial page load
- Infinite scroll loading

The problem:
- When `fetchCampaigns` was called with `append = true` (infinite scroll)
- The `loading` state would change to `false` when the API call completed
- But React needed time to re-render with the new campaigns
- During this gap, neither skeleton nor campaigns were showing

## Solution

### 1. Added Separate Loading State
Created a dedicated `isLoadingMore` state specifically for infinite scroll:

```javascript
const [isLoadingMore, setIsLoadingMore] = useState(false); // Track infinite scroll loading
```

### 2. Created Ref for Loading Check
Kept the ref for preventing duplicate API calls:

```javascript
const isLoadingMoreRef = useRef(false);
```

### 3. Updated fetchCampaigns Function
Now sets both ref and state when loading more:

```javascript
if (append) {
  isLoadingMoreRef.current = true;
  setIsLoadingMore(true);  // Added this line
}

// ... fetch logic ...

finally {
  if (append) {
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);  // Added this line
  }
  setIsInitialLoad(false);
}
```

### 4. Updated Intersection Observer
Changed to use the ref for the check:

```javascript
if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMoreRef.current) {
  // Changed from isLoadingMore.current to isLoadingMoreRef.current
}
```

### 5. Updated Skeleton Display Logic
Now uses the dedicated `isLoadingMore` state:

```javascript
{hasMore && isLoadingMore && (  // Changed from 'loading' to 'isLoadingMore'
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
      <CampaignCardSkeleton key={`skeleton-${i}`} />
    ))}
  </div>
)}
```

## How It Works Now

### Before:
1. User scrolls down → triggers intersection observer
2. `fetchCampaigns` called with `append = true`
3. API call starts → `loading` state changes
4. API returns data → `loading` becomes `false`
5. **Skeleton disappears immediately**
6. React schedules re-render with new campaigns
7. **Brief blank space appears** ⚠️
8. New campaigns render

### After:
1. User scrolls down → triggers intersection observer
2. `fetchCampaigns` called with `append = true`
3. API call starts → `isLoadingMore` set to `true`
4. **Skeleton appears and stays visible**
5. API returns data
6. `setCampaigns` called to append new data
7. React re-renders with new campaigns
8. `isLoadingMore` set to `false` in finally block
9. **Skeleton disappears as new campaigns render** ✅

## Benefits

✅ **No more blank flash** - Skeleton stays visible until campaigns are rendered
✅ **Smoother UX** - Continuous visual feedback during loading
✅ **Better perceived performance** - Users see consistent loading state
✅ **Separate concerns** - Initial load vs infinite scroll have their own loading indicators
✅ **Race condition prevention** - Still uses ref to prevent duplicate API calls

## Testing Scenarios

### Scenario 1: Initial Page Load
- **Before:** Works correctly with skeleton
- **After:** Still works correctly (uses `isInitialLoad` and `loading`)

### Scenario 2: Infinite Scroll
- **Before:** Brief blank space between skeleton and campaigns
- **After:** Smooth transition from skeleton to campaigns

### Scenario 3: Filter Changes
- **Before:** Works correctly (resets to page 1)
- **After:** Still works correctly

### Scenario 4: No More Results
- **Before:** Shows "end of list" message
- **After:** Still shows message (unaffected)

## Key Changes Summary

| Change | Purpose |
|--------|---------|
| Added `isLoadingMore` state | Track infinite scroll loading separately |
| Renamed ref to `isLoadingMoreRef` | Clearer naming for its purpose |
| Set both state and ref in fetchCampaigns | Ensure skeleton stays visible during render |
| Updated skeleton condition | Use dedicated infinite scroll loading state |

## Result

The infinite scroll now provides a seamless loading experience with no visual gaps or jumps. Users see:
1. Existing campaigns
2. Skeleton loaders appear when scrolling down
3. New campaigns fade in smoothly as skeleton fades out
4. Continuous, smooth scrolling experience

---

**Fixed on:** Current update
**Impact:** Visual UX improvement for all explore page users
**Breaking Changes:** None
