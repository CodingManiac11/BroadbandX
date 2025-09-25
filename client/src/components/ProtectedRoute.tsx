import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('ProtectedRoute Debug:', {
    user: user,
    userRole: user?.role,
    loading,
    isAuthenticated,
    requiredRole,
    location: location.pathname
  });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute: Showing loading spinner');
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    console.log('ProtectedRoute: Role mismatch', { userRole: user?.role, requiredRole });
    
    // Strict role separation - always redirect to appropriate dashboard based on role
    if (user?.role === 'admin') {
      // Admin users can only access admin routes
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'customer') {
      // Customers can only access customer routes
      return <Navigate to="/dashboard" replace />;
    } else {
      // For other role mismatches, show access denied
      return (
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          p={3}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="textSecondary" align="center">
            You don't have permission to access this page.
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
            Your role: {user?.role || 'None'} | Required role: {requiredRole}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.history.back()} 
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Box>
      );
    }
  }

  console.log('ProtectedRoute: Access granted, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;