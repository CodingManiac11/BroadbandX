import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials } from '../types';
import { authService } from '../services/authService';
import { tokenManager } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated - using tokenManager for consistency
  const isAuthenticated = !!user && !!tokenManager.getToken();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Check for stored auth token and validate
    const checkAuth = async () => {
      try {
        const token = tokenManager.getToken();
        if (token) {
          console.log('Found token, validating with backend');
          try {
            // Use authService to get current user
            const userData = await authService.getCurrentUser();
            console.log('Token validation successful, user:', userData);
            setUser(userData);
          } catch (err) {
            console.error('Token validation failed:', err);
            // Token is invalid or expired
            tokenManager.clearTokens();
            throw new Error('Token validation failed');
          }
        } else {
          console.log('No authentication token found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log('Login attempt:', email);
      
      // Clear any existing tokens first
      tokenManager.clearTokens();
      setUser(null);
      
      // Use the authService for login instead of direct fetch
      const credentials: LoginCredentials = { email, password };
      const authResponse = await authService.login(credentials);
      
      console.log('Login successful, received:', { 
        user: authResponse.user,
        hasToken: !!authResponse.tokens.accessToken
      });
      
      // Store tokens using tokenManager
      tokenManager.setToken(authResponse.tokens.accessToken);
      tokenManager.setRefreshToken(authResponse.tokens.refreshToken);
      
      // Update user in state
      setUser(authResponse.user);
      
      // Force the authenticated state to update immediately
      setTimeout(() => {
        console.log('Auth state after login:', { 
          user: authResponse.user,
          token: tokenManager.getToken()
        });
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      // Clear tokens on error
      tokenManager.clearTokens();
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      console.log('Registering user:', userData.email);
      
      // Use authService for registration
      const authResponse = await authService.register(userData);
      
      console.log('Registration successful:', {
        user: authResponse.user,
        hasToken: !!authResponse.tokens.accessToken
      });
      
      // Set user with proper role from response
      setUser(authResponse.user);
      tokenManager.setToken(authResponse.tokens.accessToken);
      tokenManager.setRefreshToken(authResponse.tokens.refreshToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Make actual logout API call
      const token = tokenManager.getToken();
      if (token) {
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clean up local state even if API call fails
      console.log('Cleaning up auth state');
      setUser(null);
      setError(null);
      tokenManager.clearTokens();
      
      // Force a small delay to ensure state is cleared
      setTimeout(() => {
        console.log('Auth cleanup complete');
      }, 100);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      logout, 
      loading, 
      error,
      isAuthenticated,
      isAdmin,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};