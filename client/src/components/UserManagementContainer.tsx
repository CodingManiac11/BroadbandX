import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import UserManagement from './UserManagement';
import userService from '../services/userService';
import { User } from '../types/index';

const UserManagementContainer: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      const newUser = await userService.createUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await userService.updateUser(userId, userData);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? updatedUser : user
        )
      );
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    try {
      await userService.deleteUser(userId);
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  const handleToggleUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> => {
    try {
      const updatedUser = await userService.updateUserStatus(userId, status);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? updatedUser : user
        )
      );
    } catch (err) {
      console.error('Error updating user status:', err);
      throw err;
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Box sx={{ ml: 2 }}>
              <button onClick={loadUsers}>Retry</button>
            </Box>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <UserManagement
      users={users}
      onCreateUser={handleCreateUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
      onToggleUserStatus={handleToggleUserStatus}
      loading={loading}
    />
  );
};

export default UserManagementContainer;