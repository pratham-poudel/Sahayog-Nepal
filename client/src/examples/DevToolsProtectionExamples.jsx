/**
 * Example Implementation Guide for DevTools Protection
 * 
 * This file demonstrates various ways to integrate DevTools protection
 * into your React application.
 */

// ============================================================================
// METHOD 1: Global App-Level Protection
// ============================================================================

import React from 'react';
import { useDevToolsProtection } from '../hooks/useDevToolsProtection';

function AppWithGlobalProtection() {
  // Enable protection at app level
  const { isDevToolsOpen, isBlocked, blockUI } = useDevToolsProtection({
    autoBlock: true,
    blockUI: true,
    showWarning: true,
    onDetect: (isOpen, results) => {
      console.log('DevTools detected:', isOpen, results);
      
      // You can add custom logic here
      // e.g., log to analytics, notify backend, etc.
    },
    onBlock: () => {
      // Called when app is blocked
      console.log('Application blocked due to DevTools');
    }
  });

  // Block UI if DevTools detected
  if (blockUI) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[99999]">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold mb-4">Security Warning</h1>
          <p className="text-lg mb-2">Developer tools detected.</p>
          <p className="text-sm text-gray-400">
            Please close developer tools to continue.
          </p>
        </div>
      </div>
    );
  }

  return <YourMainApp />;
}

// ============================================================================
// METHOD 2: Protected Component using HOC
// ============================================================================

import { withDevToolsProtection } from '../hooks/useDevToolsProtection';

function SensitiveComponent({ isDevToolsBlocked }) {
  if (isDevToolsBlocked) {
    return <div>This content is protected</div>;
  }
  
  return (
    <div>
      {/* Your sensitive content */}
      <h1>Protected Content</h1>
    </div>
  );
}

// Wrap with protection
export const ProtectedSensitiveComponent = withDevToolsProtection(
  SensitiveComponent,
  {
    autoBlock: true,
    blockUI: true
  }
);

// ============================================================================
// METHOD 3: Using Secure API Client in Components
// ============================================================================

import { useSecureApi } from '../hooks/useDevToolsProtection';

function UserDashboard() {
  const api = useSecureApi();
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    // This will automatically fail if DevTools is open
    api.get('/user/profile')
      .then(data => setUserData(data))
      .catch(error => {
        if (error.message === 'REQUEST_BLOCKED') {
          console.log('Request blocked - DevTools detected');
        }
      });
  }, []);

  return (
    <div>
      {userData ? (
        <div>Welcome, {userData.name}</div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

// ============================================================================
// METHOD 4: Manual Detection and Custom Logic
// ============================================================================

import { getDevToolsDetector } from '../utils/devToolsDetection';

function ManualProtectionExample() {
  const [blocked, setBlocked] = React.useState(false);

  React.useEffect(() => {
    const detector = getDevToolsDetector();
    
    detector.onDetect((isOpen) => {
      if (isOpen) {
        setBlocked(true);
        
        // Custom logic
        // - Clear sensitive data
        localStorage.removeItem('token');
        
        // - Redirect
        // window.location.href = '/blocked';
        
        // - Log to backend
        // logSecurityEvent('devtools_detected');
      }
    });

    detector.start();

    return () => detector.stop();
  }, []);

  if (blocked) {
    return <div>Access Denied</div>;
  }

  return <div>Normal Content</div>;
}

// ============================================================================
// METHOD 5: Initialize in main.jsx or App.jsx
// ============================================================================

// In your main.jsx or App.jsx:
/*
import { initDevToolsDetector } from './utils/devToolsDetection';
import { initSecureApiClient } from './utils/secureApiClient';

// Initialize on app start
initDevToolsDetector({
  checkInterval: 1000,
  debuggerCheckInterval: 100,
  thresholdWidth: 160,
  thresholdHeight: 160
});

// Initialize secure API client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
initSecureApiClient(API_BASE_URL);

// Then use in your components
*/

// ============================================================================
// METHOD 6: Selective Route Protection
// ============================================================================

import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isBlocked } = useDevToolsProtection({
    autoBlock: true,
    showWarning: true
  });

  if (isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  return children;
}

// Usage in routes:
/*
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
*/

// ============================================================================
// ADDITIONAL SECURITY MEASURES
// ============================================================================

// 1. Disable right-click
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// 2. Disable keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // F12
  if (e.keyCode === 123) {
    e.preventDefault();
    return false;
  }
  // Ctrl+Shift+I
  if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
    e.preventDefault();
    return false;
  }
  // Ctrl+Shift+J
  if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
    e.preventDefault();
    return false;
  }
  // Ctrl+Shift+C
  if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
    e.preventDefault();
    return false;
  }
  // Ctrl+U
  if (e.ctrlKey && e.keyCode === 85) {
    e.preventDefault();
    return false;
  }
});

// 3. Obfuscate code (use at build time)
// Use tools like webpack-obfuscator or javascript-obfuscator

// 4. Add infinite debugger loop (aggressive approach)
/*
setInterval(() => {
  debugger; // This will constantly trigger if DevTools is open
}, 100);
*/

// ============================================================================
// NOTES AND WARNINGS
// ============================================================================

/*
⚠️ IMPORTANT DISCLAIMERS:

1. NO PROTECTION IS UNBREAKABLE
   - Determined developers can always bypass these measures
   - These are deterrents, not absolute security

2. USE RESPONSIBLY
   - Don't use this to hide malicious code
   - Legitimate security should be server-side
   - This is for protecting client-side logic and user experience

3. ACCESSIBILITY CONCERNS
   - May affect legitimate users with certain tools
   - Consider providing alternative access methods

4. LEGAL CONSIDERATIONS
   - Ensure compliance with terms of service
   - Some jurisdictions may have laws about this

5. PERFORMANCE IMPACT
   - Continuous detection uses CPU cycles
   - Adjust check intervals based on needs

6. BEST PRACTICES
   - Always implement real security on the backend
   - Use HTTPS for all API calls
   - Implement proper authentication and authorization
   - Validate and sanitize all inputs on server
   - Use rate limiting and API security measures
*/

// Dummy component to avoid errors
function YourMainApp() {
  return <div>Your App</div>;
}

export default AppWithGlobalProtection;
