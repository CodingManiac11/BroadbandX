import React, { useState, useEffect } from 'react';
import {
  CardElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { Plan } from '../types/index';
import { paymentService } from '../services/paymentService';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

interface PaymentFormProps {
  plan: Plan;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Stripe loaded successfully
    const checkStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (stripeInstance) {
          setStripeLoaded(true);
        } else {
          setStripeError('Stripe failed to load. Please check if ad blockers are disabled and try again.');
        }
      } catch (error) {
        console.error('Stripe loading error:', error);
        setStripeError('Stripe is blocked by your browser or network. Please disable ad blockers and try again.');
      }
    };
    
    checkStripe();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system not ready. Please wait or refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating payment intent for plan:', plan._id);
      
      // Check if this is a fallback plan ID (not a real database ID)
      if (plan._id.startsWith('fallback-')) {
        throw new Error('This plan is not available for purchase at the moment. Please try again later or contact support.');
      }
      
      // Create payment intent
      const { clientSecret } = await paymentService.createPaymentIntent(
        plan._id,
        'monthly' // You can make this dynamic if needed
      );

      console.log('Payment intent created, confirming payment...');

      const card = elements.getElement(CardElement);
      if (!card) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const result = await paymentService.confirmCardPayment(clientSecret, card);

      if (result.status === 'succeeded') {
        console.log('Payment succeeded:', result.id);
        onSuccess();
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      
      // Handle specific error types
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('blocked')) {
        setError('Payment service is blocked. Please disable ad blockers and try again.');
      } else {
        setError(err.message || 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show error if Stripe failed to load
  if (stripeError) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Payment System Unavailable
          </Typography>
          <Typography variant="body2" gutterBottom>
            {stripeError}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Solutions:</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Disable ad blockers (uBlock Origin, AdBlock, etc.)</li>
            <li>Try a different browser</li>
            <li>Check your network firewall settings</li>
            <li>Refresh the page</li>
          </ul>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button onClick={() => window.location.reload()} variant="contained">
            Refresh Page
          </Button>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
        </Box>
      </Box>
    );
  }

  // Show loading while Stripe loads
  if (!stripeLoaded || !stripe || !elements) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 3, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading payment system...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          If this takes too long, please disable ad blockers and refresh.
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Plan: {plan.name}
        </Typography>
        <Typography variant="h5" color="primary" gutterBottom>
          ₹{plan.pricing.monthly.toLocaleString()}/month
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Speed: {plan.features.speed.download}/{plan.features.speed.upload} {plan.features.speed.unit}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Data: {plan.features.dataLimit.unlimited ? 'Unlimited' : `${plan.features.dataLimit.amount} ${plan.features.dataLimit.unit}`}
        </Typography>
        {plan.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {plan.description}
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            `Pay ₹${plan.pricing.monthly.toLocaleString()}`
          )}
        </Button>
      </Box>
    </Box>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = (props) => (
  <Elements stripe={stripePromise}>
    <PaymentFormContent {...props} />
  </Elements>
);