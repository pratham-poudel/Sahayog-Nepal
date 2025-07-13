# S3 Storage Migration

## Summary of Changes
1. Created `s3UploadMiddleware.js` to replace disk-based `uploadMiddleware.js`
2. Created `s3Utils.js` with helper functions for S3 URL generation and formatting
3. Updated all controllers to work with S3 URLs instead of local file paths
4. Created migration script to move existing files to S3
5. Added test script to verify S3 connection

## About
The application has been migrated from local disk storage to S3-compatible object storage (MinIO) for image uploads. This provides better scalability, reliability, and flexibility for storing user-uploaded images.

## Configuration
The S3 storage is configured in `middlewares/s3UploadMiddleware.js` with the following settings:
- Endpoint: http://127.0.0.1:9000 (MinIO server)
- Access Key: admin123
- Secret Key: strongpass123
- Bucket: mybucket

You should update these values in your production environment.

## Migration
Since you've already copied the folder structure to MinIO, the migration script isn't necessary. However, if you need to migrate additional files in the future, you can run:

```
node scripts/migrateToS3.js
```

This script will:
1. Use the existing 'mybucket' bucket
2. Upload any missing profile pictures to `profiles/`
3. Upload any missing campaign images to `uploads/`

To test your S3 connection, you can run:

```
node scripts/testS3Connection.js
```

## Accessing Images
Images are now accessed via S3 URLs instead of direct file paths:
- Old way: `/public/images/profiles/profile-12345.jpg`
- New way for profile pictures: `http://127.0.0.1:9000/mybucket/profiles/profile-12345.jpg`
- New way for uploads: `http://127.0.0.1:9000/mybucket/uploads/img-12345.jpg`

The API responses have been updated to include these URLs in the following fields:
- User objects: `profilePictureUrl`
- Campaign objects: `coverImageUrl` and `imageUrls` array

## Frontend Code Updates Required
You need to update all frontend code to use the new S3 URLs instead of the old local paths. Here's what you need to do:

1. **Update API Handling**:
   - API responses now include URL fields (`profilePictureUrl`, `coverImageUrl`, etc.)
   - Use these fields instead of constructing URLs yourself

2. **Update Image References**:
   - Replace code like this:
     ```javascript
     <img src={`/public/images/profiles/${user.profilePicture}`} />
     ```
   - With this:
     ```javascript
     <img src={user.profilePictureUrl} />
     ```

3. **Image Upload Handling**:
   - After uploading, use the returned S3 URL directly from the API response

4. **Temporary Redirection**:
   - We've added a redirection middleware that will temporarily redirect old image URLs to the S3 URLs
   - This is to help during the transition, but you should still update all frontend code to use the new URLs directly

## Testing
After making these changes, test your application to ensure that:
1. All images are loading correctly from S3
2. New uploads are correctly stored in S3
3. Profile pictures and campaign images are displaying properly 