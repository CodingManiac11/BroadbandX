import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';

const DebugInfo: React.FC = () => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        p: 2, 
        maxWidth: 300,
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        fontSize: '12px',
        zIndex: 9999 
      }}
    >
      <Typography variant="h6" gutterBottom>Debug Info</Typography>
      <Typography variant="body2">
        <strong>Path:</strong> {location.pathname}
      </Typography>
      <Typography variant="body2">
        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
      </Typography>
      <Typography variant="body2">
        <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
      </Typography>
      <Typography variant="body2">
        <strong>User:</strong> {user ? user.email : 'None'}
      </Typography>
      <Typography variant="body2">
        <strong>Role:</strong> {user?.role || 'None'}
      </Typography>
      <Typography variant="body2">
        <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
      </Typography>
    </Paper>
  );
};

export default DebugInfo;