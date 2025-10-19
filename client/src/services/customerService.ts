import { apiClient, handleApiResponse, handleApiError } from './api';
import { User, ApiResponse } from '../types';
import { Plan, Subscription } from '../types/index';
import { tokenManager } from './api';

// Helper function to check if user is authenticated
const isAuthenticated = (): boolean => {
  return !!tokenManager.getToken();
};

export interface CustomerStats {
  activeSubscriptions: number;
  monthlySpending: number;
  totalDataUsage: number;
  averageSpeed: number;
  upcomingBills: number;
  supportTickets: number;
}

export interface UsageData {
  date: string;
  download: number;
  upload: number;
  total: number;
}

export interface BillingHistory {
  _id: string;
  subscription: Subscription;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'failed';
  paymentMethod?: string;
  description: string;
}

export const customerService = {
  // Customer dashboard statistics
  getCustomerStats: async (): Promise<CustomerStats> => {
    try {
      const response = await apiClient.get<ApiResponse<CustomerStats>>('/customer/stats');
      return handleApiResponse<CustomerStats>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get customer's subscriptions
  getCustomerSubscriptions: async (): Promise<{ subscriptions: Subscription[] }> => {
    try {
      console.log('Making API call to get customer subscriptions...');
      const response = await apiClient.get<ApiResponse<{ subscriptions: Subscription[] }>>('/subscriptions/my-subscriptions');
      const result = handleApiResponse<{ subscriptions: Subscription[] }>(response);
      console.log('Successfully fetched subscriptions from API:', result);
      return result;
    } catch (error) {
      console.error('API call failed for subscriptions, error:', handleApiError(error));
      
      // Only use fallback if it's a network error, not authentication error
      const errorMessage = handleApiError(error);
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        throw new Error('Authentication required');
      }
      
      console.warn('Using fallback data due to API error');
      
      // Fallback subscriptions when API is not available
      const userId = localStorage.getItem('userId') || 'user6';
      const fallbackSubscriptions: Subscription[] = [
        {
          _id: '64f8b8a4c1d2e3f4a5b6c7d8',
          user: userId,
          plan: {
            _id: '68cae95a4cfde6248e98b4f9',
            name: 'Basic Plan1',
            description: 'Perfect for light internet usage, browsing, and email',
            category: 'residential',
            pricing: {
              monthly: 57.65,
              yearly: 577,
              setupFee: 0,
              currency: 'INR'
            },
            features: {
              speed: {
                download: 25,
                upload: 5,
                unit: 'Mbps'
              },
              dataLimit: {
                unlimited: true,
                amount: 0,
                unit: 'GB'
              },
              features: []
            },
            availability: {
              regions: ['India'],
              cities: ['All Cities']
            },
            technicalSpecs: {
              technology: 'cable',
              latency: 20,
              reliability: 99.5,
              installation: {
                required: true,
                fee: 0,
                timeframe: '2-3 business days'
              }
            },
            targetAudience: 'light-users',
            contractTerms: {
              minimumTerm: 12,
              earlyTerminationFee: 50,
              autoRenewal: true
            },
            popularity: 85,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          status: 'active',
          billingCycle: 'monthly',
          pricing: {
            basePrice: 57.65,
            discount: 0,
            tax: 5.77,
            finalPrice: 85.95
          },
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
          nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenewal: true,
          paymentMethod: 'upi',
          installation: {
            scheduled: true,
            scheduledDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            completed: true,
            completedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            address: {
              street: '123 Main St',
              city: 'Mumbai',
              state: 'Maharashtra',
              zipCode: '400001',
              country: 'India'
            }
          },
          usage: {
            currentMonth: {
              dataUsed: 45.6,
              lastUpdated: new Date().toISOString()
            }
          },
          serviceHistory: [
            {
              date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'Installation',
              description: 'Service installation completed',
              performedBy: 'TechTeam'
            }
          ],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        // Second subscription for user6 - Premium Plan
        {
          _id: '64f8b8a4c1d2e3f4a5b6c7d9',
          user: userId,
          plan: {
            _id: '68cae95a4cfde6248e98b5f0',
            name: 'Premium Plan',
            description: 'High-speed internet for streaming, gaming, and heavy usage',
            category: 'residential',
            pricing: {
              monthly: 127.45,
              yearly: 1275,
              setupFee: 0,
              currency: 'INR'
            },
            features: {
              speed: {
                download: 100,
                upload: 20,
                unit: 'Mbps'
              },
              dataLimit: {
                unlimited: true,
                amount: 0,
                unit: 'GB'
              },
              features: []
            },
            availability: {
              regions: ['India'],
              cities: ['All Cities']
            },
            technicalSpecs: {
              technology: 'fiber',
              latency: 10,
              reliability: 99.9,
              installation: {
                required: true,
                fee: 0,
                timeframe: '1-2 business days'
              }
            },
            targetAudience: 'power-users',
            contractTerms: {
              minimumTerm: 12,
              earlyTerminationFee: 100,
              autoRenewal: true
            },
            popularity: 95,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          status: 'active',
          billingCycle: 'monthly',
          pricing: {
            basePrice: 127.45,
            discount: 10,
            tax: 11.75,
            finalPrice: 129.20
          },
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString(),
          nextBillingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenewal: true,
          paymentMethod: 'credit_card',
          installation: {
            scheduled: true,
            scheduledDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
            completed: true,
            completedDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
            address: {
              street: '456 Tech Avenue',
              city: 'Mumbai',
              state: 'Maharashtra',
              zipCode: '400002',
              country: 'India'
            }
          },
          usage: {
            currentMonth: {
              dataUsed: 156.8,
              lastUpdated: new Date().toISOString()
            }
          },
          serviceHistory: [
            {
              date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'Installation',
              description: 'Fiber service installation completed',
              performedBy: 'FiberTeam'
            },
            {
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'Speed Upgrade',
              description: 'Service upgraded to Premium speed',
              performedBy: 'TechTeam'
            }
          ],
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return { subscriptions: fallbackSubscriptions };
    }
  },

  // Create new subscription (purchase plan)
  createSubscription: async (subscriptionData: {
    planId: string;
    billingCycle?: 'monthly' | 'yearly';
    installationAddress?: any;
    startDate?: string;
    discountCode?: string;
  }): Promise<{ subscription: Subscription }> => {
    try {
      console.log('Creating subscription with data:', subscriptionData);
      const response = await apiClient.post<ApiResponse<{ subscription: Subscription }>>('/subscriptions', subscriptionData);
      const result = handleApiResponse<{ subscription: Subscription }>(response);
      console.log('Subscription created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating subscription:', handleApiError(error));
      throw new Error(handleApiError(error));
    }
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string): Promise<{ subscription: Subscription }> => {
    // Check if user is authenticated before making API call
    if (!isAuthenticated()) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    try {
      const response = await apiClient.put<ApiResponse<{ subscription: Subscription }>>(`/subscriptions/${subscriptionId}/cancel`);
      return handleApiResponse<{ subscription: Subscription }>(response);
    } catch (error) {
      console.error('API error in cancelSubscription:', error);
      // If it's an auth error, provide a clearer message
      const errorMessage = handleApiError(error);
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(handleApiError(error));
    }
  },

  // Modify/upgrade subscription
  modifySubscription: async (subscriptionId: string, newPlanId: string): Promise<{ subscription: Subscription }> => {
    // Check if user is authenticated before making API call
    if (!isAuthenticated()) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    try {
      const response = await apiClient.put<ApiResponse<{ subscription: Subscription }>>(`/subscriptions/${subscriptionId}/upgrade`, {
        planId: newPlanId
      });
      return handleApiResponse<{ subscription: Subscription }>(response);
    } catch (error) {
      console.error('API error in modifySubscription:', error);
      // If it's an auth error, provide a clearer message
      const errorMessage = handleApiError(error);
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(handleApiError(error));
    }
  },

  // Plan browsing
  getAvailablePlans: async (): Promise<{ plans: Plan[] }> => {
    try {
      const response = await apiClient.get<ApiResponse<{ plans: Plan[] }>>('/plans');
      return handleApiResponse<{ plans: Plan[] }>(response);
    } catch (error) {
      console.warn('API call failed, using fallback plans:', handleApiError(error));
      
      // Fallback plans when API is not available - using realistic ObjectIds
      const fallbackPlans: Plan[] = [
        {
          _id: '68cae95a4cfde6248e98b4f9',
          name: 'Basic Plan1',
          description: 'Perfect for light internet usage, browsing, and email',
          category: 'residential',
          pricing: {
            monthly: 57.65,
            yearly: 577,
            setupFee: 0,
            currency: 'INR'
          },
          features: {
            speed: {
              download: 25,
              upload: 5,
              unit: 'Mbps'
            },
            dataLimit: {
              unlimited: true,
              amount: 0,
              unit: 'GB'
            },
            features: [
              { name: 'Unlimited Data', description: 'No data limits or throttling', included: true },
              { name: 'Basic Support', description: 'Email support during business hours', included: true },
              { name: 'WiFi Router Included', description: 'Free router rental', included: true }
            ]
          },
          availability: {
            regions: ['India'],
            cities: ['All Cities']
          },
          technicalSpecs: {
            technology: 'cable',
            latency: 20,
            reliability: 99.5,
            installation: {
              required: true,
              fee: 0,
              timeframe: '2-3 business days'
            }
          },
          targetAudience: 'light-users',
          contractTerms: {
            minimumTerm: 12,
            earlyTerminationFee: 50,
            autoRenewal: true
          },
          popularity: 75,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '68cae95a4cfde6248e98b4fa',
          name: 'Standard Plan2',
          description: 'High-speed fiber for families and remote workers',
          category: 'business',
          pricing: {
            monthly: 15.30,
            yearly: 153,
            setupFee: 0,
            currency: 'INR'
          },
          features: {
            speed: {
              download: 100,
              upload: 20,
              unit: 'Mbps'
            },
            dataLimit: {
              unlimited: true,
              amount: 0,
              unit: 'GB'
            },
            features: [
              { name: 'Unlimited Data', description: 'No data limits or throttling', included: true },
              { name: '24/7 Support', description: 'Round-the-clock customer support', included: true },
              { name: 'High-Speed WiFi Router', description: 'Premium router included', included: true },
              { name: 'Free Installation', description: 'Professional installation at no cost', included: true }
            ]
          },
          availability: {
            regions: ['India'],
            cities: ['All Cities']
          },
          technicalSpecs: {
            technology: 'fiber',
            latency: 5,
            reliability: 99.9,
            installation: {
              required: true,
              fee: 0,
              timeframe: '1-2 business days'
            }
          },
          targetAudience: 'families',
          contractTerms: {
            minimumTerm: 12,
            earlyTerminationFee: 100,
            autoRenewal: true
          },
          popularity: 90,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '68cae95a4cfde6248e98b4fb',
          name: 'Premium Plan3',
          description: 'Enterprise-grade connectivity for demanding users',
          category: 'business',
          pricing: {
            monthly: 73.86,
            yearly: 738,
            setupFee: 0,
            currency: 'INR'
          },
          features: {
            speed: {
              download: 200,
              upload: 50,
              unit: 'Mbps'
            },
            dataLimit: {
              unlimited: true,
              amount: 0,
              unit: 'GB'
            },
            features: [
              { name: 'Unlimited Data', description: 'No data limits or throttling', included: true },
              { name: 'Priority Support', description: 'Dedicated support team', included: true },
              { name: 'Mesh WiFi System', description: 'Enterprise-grade mesh network', included: true },
              { name: 'Free Installation', description: 'Professional installation included', included: true },
              { name: 'OTT Subscriptions', description: 'Complimentary streaming services', included: true }
            ]
          },
          availability: {
            regions: ['India'],
            cities: ['All Cities']
          },
          technicalSpecs: {
            technology: 'fiber',
            latency: 2,
            reliability: 99.95,
            installation: {
              required: true,
              fee: 0,
              timeframe: '1 business day'
            }
          },
          targetAudience: 'business',
          contractTerms: {
            minimumTerm: 24,
            earlyTerminationFee: 200,
            autoRenewal: true
          },
          popularity: 85,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return { plans: fallbackPlans };
    }
  },

  getPlanById: async (planId: string): Promise<Plan> => {
    try {
      const response = await apiClient.get<ApiResponse<Plan>>(`/plans/${planId}`);
      return handleApiResponse<Plan>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Subscription management
  getMySubscriptions: async (): Promise<Subscription[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Subscription[]>>('/customer/subscriptions');
      return handleApiResponse<Subscription[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Usage analytics
  getUsageAnalytics: async (subscriptionId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<UsageData[]> => {
    try {
      const response = await apiClient.get<ApiResponse<UsageData[]>>(`/customer/subscriptions/${subscriptionId}/usage?period=${period}`);
      return handleApiResponse<UsageData[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getCurrentUsage: async (subscriptionId: string): Promise<{
    currentMonth: number;
    dailyAverage: number;
    peakUsage: number;
    remainingData: number;
  }> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/customer/subscriptions/${subscriptionId}/current-usage`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Billing and payments
  getBillingHistory: async (page = 1, limit = 10): Promise<{
    bills: BillingHistory[];
    total: number;
    pages: number;
    currentPage: number;
  }> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/customer/billing?page=${page}&limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getUpcomingBills: async (): Promise<BillingHistory[]> => {
    try {
      const response = await apiClient.get<ApiResponse<BillingHistory[]>>('/customer/billing/upcoming');
      return handleApiResponse<BillingHistory[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  makePayment: async (billId: string, paymentMethod: string): Promise<{
    paymentId: string;
    status: string;
    amount: number;
  }> => {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/customer/billing/${billId}/pay`, {
        paymentMethod
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Account management
  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/customer/profile');
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/customer/profile', profileData);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await apiClient.put<ApiResponse<void>>('/customer/change-password', {
        currentPassword,
        newPassword
      });
      handleApiResponse<void>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Support and recommendations
  getSupportTickets: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/customer/support/tickets');
      return handleApiResponse<any[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  createSupportTicket: async (subject: string, description: string, priority: 'low' | 'medium' | 'high'): Promise<any> => {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/customer/support/tickets', {
        subject,
        description,
        priority
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getRecommendations: async (): Promise<{
    recommendedPlans: Plan[];
    upgradeOptions: Plan[];
    savings: Array<{
      planId: string;
      currentCost: number;
      newCost: number;
      savings: number;
    }>;
  }> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/customer/recommendations');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};