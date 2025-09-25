import { apiClient, handleApiResponse, handleApiError } from './api';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse 
} from '../types';

export const authService = {
  // User registration
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<{user: User, token: string, refreshToken: string}>>('/auth/register', data);
      const responseData = handleApiResponse<{user: User, token: string, refreshToken: string}>(response);
      
      // Transform backend response to match AuthResponse interface
      return {
        user: responseData.user,
        tokens: {
          accessToken: responseData.token,
          refreshToken: responseData.refreshToken
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // User login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<{user: User, token: string, refreshToken: string}>>('/auth/login', credentials);
      const data = handleApiResponse<{user: User, token: string, refreshToken: string}>(response);
      
      // Transform backend response to match AuthResponse interface
      return {
        user: data.user,
        tokens: {
          accessToken: data.token,
          refreshToken: data.refreshToken
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
      console.warn('Logout request failed:', handleApiError(error));
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
        refreshToken: refreshToken,
      });
      const result = handleApiResponse<{ access_token: string }>(response);
      return { accessToken: result.access_token };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/users/profile');
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/users/profile', data);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Request password reset
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
        token,
        password: newPassword,
      });
      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token });
      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/resend-verification', { email });
      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};