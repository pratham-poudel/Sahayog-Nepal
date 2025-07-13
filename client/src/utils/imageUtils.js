/**
 * Simple image URL utilities
 * Handles image URLs consistently across the application
 */

import { MINIO_URL } from '../config/index.js';

// Base URL for image server
const IMAGE_SERVER = MINIO_URL;

/**
 * Get a user's profile picture URL
 * @param {Object} user - User object from API
 * @returns {string} - Profile picture URL
 */
export const getProfilePictureUrl = (user) => {
  if (!user) return null;
  
  // Use the URL from the API if available
  if (user.profilePictureUrl) {
    return user.profilePictureUrl;
  }
  
  // Generate URL from profile picture filename
  if (user.profilePicture) {
    // Always add the profiles folder prefix (the database now only stores the filename)
    return `${IMAGE_SERVER}/profiles/${user.profilePicture}`;
  }
  
  // Default placeholder
  return 'https://via.placeholder.com/200x200?text=No+Profile+Picture';
};

/**
 * Get a campaign's cover image URL
 * @param {Object} campaign - Campaign object from API
 * @returns {string} - Cover image URL
 */
export const getCoverImageUrl = (campaign) => {
  if (!campaign) return null;
  
  // Use the URL from the API if available
  if (campaign.coverImageUrl) {
    return campaign.coverImageUrl;
  }
  
  // Generate URL from cover image filename
  if (campaign.coverImage) {
    // Always add the campaigns folder prefix (database only stores filename)
    return `${IMAGE_SERVER}/uploads/${campaign.coverImage}`;
  }
  
  // Default placeholder
  return 'https://via.placeholder.com/800x400?text=No+Cover+Image';
};

/**
 * Get a campaign's additional image URLs
 * @param {Object} campaign - Campaign object from API
 * @returns {Array<string>} - Array of image URLs
 */
export const getCampaignImageUrls = (campaign) => {
  if (!campaign) return [];
  
  // Use URLs from the API if available
  if (campaign.imageUrls && campaign.imageUrls.length > 0) {
    return campaign.imageUrls;
  }
  
  // Generate URLs from image filenames
  if (campaign.images && campaign.images.length > 0) {
    // Always add the uploads folder prefix (database only stores filenames)
    return campaign.images.map(img => `${IMAGE_SERVER}/uploads/${img}`);
  }
  
  return [];
};

/**
 * Enhance a campaign object with proper image URLs
 * @param {Object} campaign - Campaign object from API
 * @returns {Object} - Enhanced campaign object
 */
export const enrichCampaignWithImageUrls = (campaign) => {
  if (!campaign) return null;
  
  return {
    ...campaign,
    thumbnail: getCoverImageUrl(campaign),
    imageUrls: getCampaignImageUrls(campaign),
    creator: campaign.creator ? {
      ...campaign.creator,
      image: getProfilePictureUrl(campaign.creator)
    } : null
  };
}; 