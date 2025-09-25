import { loadStripe } from '@stripe/stripe-js';
import { apiClient } from './api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

export interface PaymentIntent {
  clientSecret: string;
  id: string;
}

export const paymentService = {
  // Create a payment intent for subscription
  createPaymentIntent: async (planId: string, billingCycle: 'monthly' | 'yearly'): Promise<PaymentIntent> => {
    try {
      console.log('Creating payment intent with:', { planId, billingCycle });
      
      const response = await apiClient.post<PaymentIntent>('/payments/create-intent', {
        planId,
        billingCycle
      });
      
      console.log('Payment intent response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        throw new Error('Plan not found. Please select a valid plan.');
      } else if (error.response?.status === 500) {
        throw new Error('Payment system configuration error. Please contact support.');
      } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to create payment intent');
      }
    }
  },

  // Confirm card payment
  confirmCardPayment: async (clientSecret: string, card: any): Promise<any> => {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            email: localStorage.getItem('userEmail') || undefined
          }
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.paymentIntent;
    } catch (error) {
      throw error;
    }
  },

  // Get payment methods for user
  getPaymentMethods: async (): Promise<Array<any>> => {
    try {
      interface PaymentMethodsResponse {
        paymentMethods: Array<any>;
      }
      const response = await apiClient.get<PaymentMethodsResponse>('/payments/methods');
      return response.data.paymentMethods;
    } catch (error) {
      throw new Error('Failed to fetch payment methods');
    }
  },

  // Add new payment method
  addPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    try {
      await apiClient.post('/payments/methods', { paymentMethodId });
    } catch (error) {
      throw new Error('Failed to add payment method');
    }
  },

  // Delete payment method
  deletePaymentMethod: async (paymentMethodId: string): Promise<void> => {
    try {
      await apiClient.delete(`/payments/methods/${paymentMethodId}`);
    } catch (error) {
      throw new Error('Failed to delete payment method');
    }
  }
};