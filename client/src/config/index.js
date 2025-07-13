/**
 * Application Configuration
 */

// API URL for different environments
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// MinIO URL for file storage
export const MINIO_URL = import.meta.env.VITE_MINIO_URL || 'http://127.0.0.1:9000/mybucket';

// Payment gateway config
export const PAYMENT_CONFIG = {
  // If true, use production endpoints, otherwise use test/sandbox endpoints
  production: import.meta.env.VITE_ENV === 'production',
  
  // Minimum donation amount in paisa (Rs 10 = 1000 paisa)
  minimumAmount: 1000,
  
  // Default platform fee percentage
  defaultPlatformFee: 13,
};

// App configuration
export const APP_CONFIG = {
  appName: 'NepalCrowdRise',
  currency: 'NPR',
  currencySymbol: 'Rs.',
};

// Turnstile configuration
export const TURNSTILE_CONFIG = {
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAABeptj194OuOli7g', // Real site key that works
};

export default {
  API_URL,
  API_BASE_URL,
  MINIO_URL,
  PAYMENT_CONFIG,
  APP_CONFIG,
  TURNSTILE_CONFIG,
};