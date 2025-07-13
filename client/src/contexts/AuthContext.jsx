import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import useAuth from '../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Create the context
export const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  const [, navigate] = useLocation();
  const [updateCounter, setUpdateCounter] = useState(0);
  const updateTimeoutRef = useRef(null);
  const navigationTimeoutRef = useRef(null);
  const { toast } = useToast();

  // Clean up timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Function to force update of auth state with debounce
  const forceUpdate = useCallback(() => {
    // Clear any existing timeout to prevent multiple successive updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set a new timeout to update the counter
    updateTimeoutRef.current = setTimeout(() => {
      setUpdateCounter(prev => prev + 1);
      updateTimeoutRef.current = null;
    }, 200);
  }, []);

  // Extended auth object with additional functionality
  const authWithExtras = {
    ...auth,
    loginAndRedirect: async (email, password, redirectTo = '/',turnstileToken) => {
      const success = await auth.login(email, password,turnstileToken);
      if (success) {
        // Show success toast
        toast({
          title: "Login successful",
          description: "Welcome back! You are now logged in."
        });
        
        // Clear any existing navigation timeout
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        
        // Use direct window navigation as a fallback to avoid React rendering issues
        navigationTimeoutRef.current = setTimeout(() => {
          window.location.href = redirectTo;
          navigationTimeoutRef.current = null;
        }, 500);
      }
      return success;
    },
    registerAndRedirect: async (name, email, password, redirectTo = '/') => {
      const success = await auth.register(name, email, password);
      if (success) {
        // Show success toast - already shown in register function
        
        // Clear any existing navigation timeout
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        
        // Use direct window navigation to ensure a clean state
        navigationTimeoutRef.current = setTimeout(() => {
          window.location.href = redirectTo;
          navigationTimeoutRef.current = null;
        }, 500);
      }
      return success;
    },
    logoutAndRedirect: (redirectTo = '/') => {
      auth.logout();
      // Clear any existing navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      // Use setTimeout for navigation to ensure state updates first
      navigationTimeoutRef.current = setTimeout(() => {
        navigate(redirectTo);
        navigationTimeoutRef.current = null;
      }, 100);
    },
    refreshAndRedirect: async (redirectTo = null) => {
      const success = await auth.refreshAuth();
      if (success && redirectTo) {
        // Clear any existing navigation timeout
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        
        // Use setTimeout for navigation to ensure state updates first
        navigationTimeoutRef.current = setTimeout(() => {
          navigate(redirectTo);
          navigationTimeoutRef.current = null;
        }, 100);
      }
      return success;
    },
    requireAuth: (callback) => {
      if (!auth.isAuthenticated && !auth.loading) {
        navigate('/login');
        return null;
      }
      return callback();
    },
    forceUpdate, // Expose the forceUpdate function
    updateCounter // Expose the counter to trigger re-renders
  };
  
  return (
    <AuthContext.Provider value={authWithExtras}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

// HOC to protect routes that require authentication
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuthContext();
    const [, navigate] = useLocation();

    useEffect(() => {
      if (!isAuthenticated && !loading) {
        navigate('/login');
      }
    }, [isAuthenticated, loading, navigate]);

    // Show loading state or redirect
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-[#8B2325] border-r-[#8B2325] border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} />;
  };
};
