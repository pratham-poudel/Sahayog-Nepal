import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page.",
        variant: "destructive"
      });
      
      // Use window.location.href for more reliable navigation with full page refresh
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    }
  }, [isAuthenticated, loading, toast]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-t-[#8B2325] border-r-[#8B2325] border-b-transparent border-l-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // User is authenticated, render children
  return children;
};

export default ProtectedRoute; 