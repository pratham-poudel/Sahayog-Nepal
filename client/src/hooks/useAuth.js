import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';


const API_URL = '/api/users';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const initialLoadRef = useRef(true);

  // Function to refresh authentication state from token
  const refreshAuth = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
    
    try {
      // Verify token with backend
      const response = await apiRequest('GET', `${API_URL}/profile`);
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if user is banned
        if (response.status === 403 && errorData.isBanned) {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          
          toast({
            variant: "destructive",
            title: "⛔ Account Access Suspended",
            description: errorData.banDetails?.notice || "Your account has been suspended. Please contact support.",
            duration: 10000
          });
          
          return false;
        }
        
        throw new Error('Failed to verify token');
      }
      
      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initialize auth state from localStorage on mount - once only
  useEffect(() => {
    if (initialLoadRef.current) {
      refreshAuth();
      initialLoadRef.current = false;
    }
  }, [refreshAuth]);

  // Register a new user
  const register = async (name, email, password) => {
    setLoading(true);
    
    try {
      // Call the register API endpoint
      const response = await apiRequest('POST', `${API_URL}/register`, { 
        name, 
        email, 
        password 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // Update state
      setUser(data.user);
      setIsAuthenticated(true);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login a user
  const login = async (email, password,turnstileToken) => {
    setLoading(true);
    
    try {
      // Call the login API endpoint
      const response = await apiRequest('POST', `${API_URL}/login`, { 
        email, 
        password,
        turnstileToken
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if user is banned
        if (response.status === 403 && errorData.isBanned) {
          toast({
            variant: "destructive",
            title: "⛔ Account Access Suspended",
            description: errorData.banDetails?.notice || "Your account has been suspended and flagged for investigation.",
            duration: 10000
          });
          
          // Show detailed ban reason in console for user reference
          console.error('Account Banned:', {
            reason: errorData.banDetails?.reason,
            bannedAt: errorData.banDetails?.bannedAt
          });
          
          return false;
        }
        
        throw new Error(errorData.message || 'Invalid credentials');
      }
      
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // Update state
      setUser(data.user);
      setIsAuthenticated(true);
      
      toast({
        title: "Login successful",
        description: "You have been successfully logged in.",
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout a user
  const logout = async () => {
    try {
      // Call the logout API endpoint (optional)
      // await apiRequest('POST', `${API_URL}/logout`);
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token and user data even if API call fails
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    
    try {
      // Call the update profile API endpoint
      const response = await apiRequest('PUT', `${API_URL}/profile`, userData);
      
      const data = await response.json();
      
      // Update state
      setUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    updateProfile,
    refreshAuth
  };
};

export default useAuth;
