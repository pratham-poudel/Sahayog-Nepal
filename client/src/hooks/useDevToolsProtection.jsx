/**
 * React Hook for DevTools Protection
 * Provides easy integration with React components
 */

import { useEffect, useState, useCallback } from 'react';
import { getDevToolsDetector } from '../utils/devToolsDetection';
import { getSecureApiClient } from '../utils/secureApiClient';

/**
 * Hook to detect and handle DevTools
 */
export const useDevToolsProtection = (options = {}) => {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const {
    onDetect,
    onBlock,
    blockUI = false,
    redirectUrl = null,
    showWarning = true,
    autoBlock = true
  } = options;

  useEffect(() => {
    const detector = getDevToolsDetector();
    
    // Callback for DevTools detection
    const handleDetection = (isOpen, results) => {
      setIsDevToolsOpen(isOpen);
      
      if (isOpen) {
        if (autoBlock) {
          setIsBlocked(true);
          
          // Trigger block callback
          if (onBlock) {
            onBlock(results);
          }
          
          // Redirect if URL provided
          if (redirectUrl) {
            window.location.href = redirectUrl;
          }
          
          // Show warning
          if (showWarning) {
            showDevToolsWarning();
          }
        }
        
        // Trigger detect callback
        if (onDetect) {
          onDetect(isOpen, results);
        }
      }
    };

    // Register callback
    detector.onDetect(handleDetection);
    
    // Start detection
    detector.start();

    // Cleanup
    return () => {
      detector.stop();
    };
  }, [onDetect, onBlock, redirectUrl, showWarning, autoBlock]);

  return {
    isDevToolsOpen,
    isBlocked,
    blockUI: blockUI && isBlocked
  };
};

/**
 * Hook to use secure API client
 */
export const useSecureApi = () => {
  const apiClient = getSecureApiClient();
  
  const get = useCallback(async (url, config) => {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }, []);

  const post = useCallback(async (url, data, config) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }, []);

  const put = useCallback(async (url, data, config) => {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }, []);

  const del = useCallback(async (url, config) => {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }, []);

  const patch = useCallback(async (url, data, config) => {
    try {
      const response = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }, []);

  return {
    get,
    post,
    put,
    delete: del,
    patch,
    isBlocked: () => apiClient.isRequestBlocked()
  };
};

/**
 * Handle API errors
 */
const handleApiError = (error) => {
  if (error.message === 'REQUEST_BLOCKED' || error.message === 'RESPONSE_BLOCKED') {
    console.error('API request blocked due to security policy');
  }
};

/**
 * Show DevTools warning
 */
const showDevToolsWarning = () => {
  // Clear console
  console.clear();
  
  // ASCII art warning
  console.log('%c╔══════════════════════════════════════════╗', 'color: red; font-weight: bold;');
  console.log('%c║         SECURITY WARNING                 ║', 'color: red; font-weight: bold; font-size: 16px;');
  console.log('%c╚══════════════════════════════════════════╝', 'color: red; font-weight: bold;');
  console.log('%c', '');
  console.log('%cDeveloper Tools Detected!', 'color: orange; font-size: 20px; font-weight: bold;');
  console.log('%c', '');
  console.log('%cFor security reasons, this application has been temporarily disabled.', 'color: white; font-size: 14px;');
  console.log('%cPlease close the developer tools to continue.', 'color: white; font-size: 14px;');
  console.log('%c', '');
  console.log('%c⚠️  API requests are blocked', 'color: yellow; font-size: 12px;');
  console.log('%c⚠️  Sensitive data has been cleared', 'color: yellow; font-size: 12px;');
};

/**
 * Higher-Order Component for DevTools protection
 */
export const withDevToolsProtection = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    const { isBlocked, blockUI } = useDevToolsProtection(options);

    if (blockUI) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          fontFamily: 'monospace'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
            <h1 style={{ color: '#ff0000', fontSize: '48px', marginBottom: '20px' }}>⚠️</h1>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Security Warning</h2>
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>
              Developer tools have been detected.
            </p>
            <p style={{ fontSize: '14px', color: '#ccc' }}>
              Please close the developer tools to continue using this application.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} isDevToolsBlocked={isBlocked} />;
  };
};

export default useDevToolsProtection;
