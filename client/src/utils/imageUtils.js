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
  
  // Use the URL from the API if available (preferred method - should be full URL)
  if (user.profilePictureUrl) {
    return user.profilePictureUrl;
  }
  
  // Return stored profile picture (should be full URL for new uploads)
  if (user.profilePicture) {
    // Check if it's already a full URL (starts with http or https)
    if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
      return user.profilePicture;
    }
    // Legacy support: Check if it already contains the folder path
    if (user.profilePicture.startsWith('users/profile-pictures/')) {
      return `${IMAGE_SERVER}/${user.profilePicture}`;
    }
    // Legacy support: Add the correct users/profile-pictures folder prefix for old filenames
    return `${IMAGE_SERVER}/users/profile-pictures/${user.profilePicture}`;
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
  
  // Use the URL from the API if available (preferred method)
  if (campaign.coverImageUrl) {
    return campaign.coverImageUrl;
  }
  
  // Return stored cover image (should be full URL for new uploads)
  if (campaign.coverImage) {
    // Check if it's already a full URL (starts with http or https)
    if (campaign.coverImage.startsWith('http://') || campaign.coverImage.startsWith('https://')) {
      return campaign.coverImage;
    }
    // Legacy support: Check if it already contains the folder path
    if (campaign.coverImage.startsWith('campaigns/covers/')) {
      return `${IMAGE_SERVER}/${campaign.coverImage}`;
    }
    // Legacy support: Add the correct campaigns/covers folder prefix for old filenames
    return `${IMAGE_SERVER}/campaigns/covers/${campaign.coverImage}`;
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
  
  // Return stored image URLs (should be full URLs for new uploads)
  if (campaign.images && campaign.images.length > 0) {
    return campaign.images.map(img => {
      // Check if it's already a full URL (starts with http or https)
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      // Legacy support: Check if it already contains the folder path
      if (img.startsWith('campaigns/images/')) {
        return `${IMAGE_SERVER}/${img}`;
      }
      // Legacy support: Add the correct campaigns/images folder prefix for old filenames
      return `${IMAGE_SERVER}/campaigns/images/${img}`;
    });
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