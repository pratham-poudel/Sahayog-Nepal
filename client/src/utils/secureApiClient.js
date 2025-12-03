/**
 * Secure API Client with DevTools Detection
 * Blocks API requests when DevTools is detected
 */

import axios from 'axios';
import { getDevToolsDetector } from './devToolsDetection';

class SecureApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.isBlocked = false;
    this.detector = getDevToolsDetector();
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Setup request interceptor
    this.setupInterceptors();
    
    // Start detection
    this.detector.start();
    
    // Register detection callback
    this.detector.onDetect((isOpen) => {
      this.isBlocked = isOpen;
      if (isOpen) {
        this.handleDevToolsDetected();
      }
    });
  }

  /**
   * Setup axios interceptors
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Block request if DevTools detected
        if (this.isBlocked) {
          return Promise.reject(new Error('REQUEST_BLOCKED'));
        }

        // Add anti-tampering headers
        config.headers['X-Request-Time'] = Date.now();
        config.headers['X-Client-ID'] = this.generateClientId();
        
        // Add fingerprint
        config.headers['X-Fingerprint'] = this.generateFingerprint();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Verify response integrity
        if (this.isBlocked) {
          return Promise.reject(new Error('RESPONSE_BLOCKED'));
        }
        return response;
      },
      (error) => {
        if (error.message === 'REQUEST_BLOCKED' || error.message === 'RESPONSE_BLOCKED') {
          // Clear any sensitive data
          this.clearSensitiveData();
          
          // Optionally redirect or show error
          this.handleBlockedRequest();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    // Use session storage to persist across page loads
    let clientId = sessionStorage.getItem('_cid');
    if (!clientId) {
      clientId = this.generateRandomId();
      sessionStorage.setItem('_cid', clientId);
    }
    return clientId;
  }

  /**
   * Generate random ID
   */
  generateRandomId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate browser fingerprint
   */
  generateFingerprint() {
    const data = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: screen.colorDepth
    };
    
    // Simple hash function
    return this.simpleHash(JSON.stringify(data));
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Handle DevTools detection
   */
  handleDevToolsDetected() {
    console.clear();
    
    // Optionally clear console repeatedly
    setInterval(() => {
      if (this.isBlocked) {
        console.clear();
      }
    }, 100);

    // Show warning
    console.log('%c⚠️ Security Warning', 'font-size: 24px; color: red; font-weight: bold;');
    console.log('%cDeveloper tools detected. API access has been disabled for security reasons.', 
                'font-size: 16px; color: orange;');
  }

  /**
   * Handle blocked request
   */
  handleBlockedRequest() {
    // You can customize this behavior
    console.warn('API request blocked due to security policy');
    
    // Optionally show user-facing message
    if (typeof window !== 'undefined' && window.alert) {
      // Note: You might want to use a better UI notification
      // alert('For security reasons, this application cannot be used with developer tools open.');
    }
  }

  /**
   * Clear sensitive data
   */
  clearSensitiveData() {
    try {
      // Clear storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Clear cookies (if needed)
      // document.cookie.split(";").forEach(c => {
      //   document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      // });
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  /**
   * Make GET request
   */
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * Make POST request
   */
  async post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * Make PUT request
   */
  async put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }

  /**
   * Make DELETE request
   */
  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  /**
   * Make PATCH request
   */
  async patch(url, data, config = {}) {
    return this.client.patch(url, data, config);
  }

  /**
   * Get axios instance directly (use with caution)
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if blocked
   */
  isRequestBlocked() {
    return this.isBlocked;
  }
}

// Create singleton instance
let apiClientInstance = null;

/**
 * Initialize secure API client
 */
export const initSecureApiClient = (baseURL) => {
  if (!apiClientInstance) {
    apiClientInstance = new SecureApiClient(baseURL);
  }
  return apiClientInstance;
};

/**
 * Get secure API client instance
 */
export const getSecureApiClient = () => {
  if (!apiClientInstance) {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    apiClientInstance = new SecureApiClient(baseURL);
  }
  return apiClientInstance;
};

export default SecureApiClient;
