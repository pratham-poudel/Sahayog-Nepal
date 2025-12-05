# Quick Test Guide for Enhanced Search

## Prerequisites
Ensure your backend server is running on `http://localhost:5000`

## Test Scenarios

### 1. Test Search by Creator Name "pratham"
```
http://localhost:5000/api/explore/regular?page=1&limit=12&sortBy=smart&search=pratham
```

**Expected Result:**
- Returns campaigns where creator's name contains "pratham"
- Results sorted by search score (creator name matches get score of 80)
- Shows campaigns created by users named Pratham, Pratham Poudel, etc.

### 2. Test Search by Category (e.g., "healthcare" or "medical")
```
http://localhost:5000/api/explore/regular?page=1&limit=12&search=healthcare
```

**Expected Result:**
- Returns campaigns in Healthcare category (score: 60)
- Also returns campaigns with "healthcare" in title (score: 100) or description (score: 20)

### 3. Test Search by Tag (e.g., "urgent")
```
http://localhost:5000/api/explore/urgent?page=1&limit=12&search=urgent
```

**Expected Result:**
- Returns campaigns with "urgent" tag (score: 40)
- Also catches "urgent" in title, description, or story
- Results in urgent tab will only show campaigns with Urgent tag

### 4. Test Search by Campaign Title
```
http://localhost:5000/api/explore/regular?page=1&limit=12&search=help child education
```

**Expected Result:**
- Returns campaigns with matching words in title (highest score: 100)
- Also checks descriptions and stories
- Sorted by relevance

### 5. Test Combined Search with Category Filter
```
http://localhost:5000/api/explore/regular?page=1&limit=12&search=medical&category=Healthcare
```

**Expected Result:**
- Filters to Healthcare category first
- Then searches within that category for "medical"
- Returns most relevant healthcare campaigns

### 6. Test Empty Search (Should return all campaigns)
```
http://localhost:5000/api/explore/regular?page=1&limit=12&sortBy=smart
```

**Expected Result:**
- Returns smart mix of campaigns (no search filter applied)
- Featured, high engagement, less funded, ending soon, and random campaigns

## How to Verify Results

### Check Response Structure
```json
{
  "success": true,
  "count": 12,
  "total": 45,
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "campaigns": [
    {
      "_id": "...",
      "title": "Campaign Title",
      "creator": {
        "name": "Pratham Poudel",
        "profilePicture": "...",
        "isPremiumAndVerified": true
      },
      "category": "Healthcare",
      "tags": ["Urgent", "Featured"],
      "searchScore": 180  // Only appears when search is active
    }
  ]
}
```

### Verify Search Score (when searching)
- Higher `searchScore` values appear first
- Title matches: score includes 100
- Creator name matches: score includes 80
- Category matches: score includes 60
- Multiple matches: scores are additive

## Testing with Different User Data

### If you have a creator named "Pratham"
```
http://localhost:5000/api/explore/regular?search=pratham
```
Should return all campaigns by Pratham.

### If you have campaigns with "urgent" tag
```
http://localhost:5000/api/explore/urgent?search=emergency
```
Should return urgent campaigns with "emergency" in any field.

### If you have campaigns in "Education" category
```
http://localhost:5000/api/explore/regular?search=education&category=Education
```
Should return education campaigns.

## Common Issues and Solutions

### Issue: No results found
**Solutions:**
- Check if campaigns exist in database
- Verify campaign status is 'active'
- Check if endDate is not more than 10 days in the past
- Ensure search term matches some field in campaigns

### Issue: Wrong campaigns returned
**Solutions:**
- Check the search term spelling
- Try partial search (e.g., "prat" instead of "pratham")
- Use case-insensitive search (already implemented)

### Issue: Creator name search not working
**Solutions:**
- Verify user names in database
- Check if creator field is properly populated
- Ensure creator reference is valid

## Browser Testing

### Open in Browser
Simply paste the URLs in your browser address bar:
```
http://localhost:5000/api/explore/regular?search=pratham
```

### Use Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Make the request
4. Check the response JSON

### Use Postman or Thunder Client
1. Create GET request
2. Set URL with query parameters
3. Send request
4. Inspect response

## Expected Performance

- **Response Time**: < 500ms for most queries
- **Accuracy**: Relevant results ranked higher
- **Completeness**: All matching campaigns included
- **Pagination**: Consistent across pages

## Scoring Reference

| Field Match | Score Weight |
|-------------|-------------|
| Title | 100 |
| Creator Name | 80 |
| Category | 60 |
| Subcategory | 50 |
| Tags | 40 |
| Short Description | 20 |
| Story | 10 |

**Note**: Scores are additive - a campaign can match multiple fields!

Example: A campaign with "pratham" in title (100) and creator name (80) gets a total score of 180.

---

**Happy Testing! 🚀**
