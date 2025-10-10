import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Protected Route Component for Employee Dashboards
 * Validates employee authentication and department access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.requiredDepartment - Required department for access
 * @param {string} [props.redirectTo='/employee'] - Redirect path on unauthorized access
 */
const ProtectedEmployeeRoute = ({ children, requiredDepartment, redirectTo = '/employee' }) => {
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('employeeToken');
        
        if (!token) {
          console.log('No token found, redirecting to employee portal');
          setLocation(redirectTo);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/employee/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        
        // Check if employee belongs to required department
        if (data.employee.department !== requiredDepartment) {
          console.log(`Access denied. Required: ${requiredDepartment}, Got: ${data.employee.department}`);
          alert(`Access denied. This dashboard is only for ${requiredDepartment.replace(/_/g, ' ')} Department.`);
          setLocation(redirectTo);
          return;
        }

        // Authorization successful
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('employeeToken'); // Clear invalid token
        setLocation(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requiredDepartment, redirectTo, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Render children if authorized
  return isAuthorized ? children : null;
};

export default ProtectedEmployeeRoute;
