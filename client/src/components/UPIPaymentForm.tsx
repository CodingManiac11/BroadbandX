import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  QrCode2 as QrCodeIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { Plan } from '../types/index';
import { apiClient, handleApiResponse, handleApiError } from '../services/api';

interface UPIPaymentFormProps {
  plan: Plan;
  onSuccess: () => void;
  onCancel: () => void;
}

const UPIPaymentForm: React.FC<UPIPaymentFormProps> = ({ plan, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'details' | 'qr' | 'success'>('details');
  const [transactionId, setTransactionId] = useState('');

  // Generate a unique UPI transaction ID
  const generateTransactionId = () => {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  // UPI details for payment
  const upiDetails = {
    id: '9570329856@ptyes',
    name: 'BroadbandX Services',
    amount: plan.pricing.monthly,
    transactionRef: generateTransactionId(),
  };

  const handleInitiatePayment = () => {
    setPaymentStep('qr');
    setTransactionId(upiDetails.transactionRef);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create subscription after payment confirmation
      const subscriptionData = {
        planId: plan._id,
        billingCycle: 'monthly'
      };

      console.log('🔍 Frontend Payment Success Debug:');
      console.log('  - Plan object received:', plan);
      console.log('  - Plan._id:', plan._id);
      console.log('  - Plan.name:', plan.name);
      console.log('  - Plan.pricing:', plan.pricing);
      console.log('  - Subscription data being sent:', subscriptionData);
      console.log('  - API endpoint: /customer/subscriptions');

      // Call the subscription creation API using the configured API client
      const response = await apiClient.post('/customer/subscriptions', subscriptionData);
      const result = handleApiResponse(response);

      console.log('✅ Subscription created successfully:', result);
      
      // Show success and call success callback
      setPaymentStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('❌ Subscription creation error:', err);
      console.error('  - Error details:', err.response?.data);
      console.error('  - Error status:', err.response?.status);
      console.error('  - Full error object:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage || 'Failed to create subscription. Please contact support with your transaction ID: ' + transactionId);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateUPILink = () => {
    return `upi://pay?pa=${upiDetails.id}&pn=${encodeURIComponent(upiDetails.name)}&am=${upiDetails.amount}&tr=${upiDetails.transactionRef}&tn=${encodeURIComponent('BroadbandX Subscription Payment')}`;
  };

  if (paymentStep === 'success') {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 3, textAlign: 'center' }}>
        <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom color="success.main">
          Payment Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Your subscription has been activated.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Transaction ID: {transactionId}
        </Typography>
      </Box>
    );
  }

  if (paymentStep === 'qr') {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
        <Typography variant="h6" gutterBottom align="center">
          Complete Your Payment
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Box sx={{ 
                p: 3,
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                backgroundColor: 'primary.50',
                minHeight: '200px',
                minWidth: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <QrCodeIcon sx={{ fontSize: 80, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  UPI QR Code
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Scan with PhonePe, GPay, Paytm, or any UPI app
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Scan this QR code or use the UPI ID below
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'primary.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.200'
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  UPI ID:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: 'primary.main',
                      flex: 1
                    }}
                  >
                    {upiDetails.id}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CopyIcon />}
                    onClick={() => copyToClipboard(upiDetails.id)}
                  >
                    Copy
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Copy this UPI ID and paste in your UPI app
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Amount:
                </Typography>
                <Typography variant="h6" color="primary">
                  ₹{plan.pricing.monthly.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Transaction Ref:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {transactionId}
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                component="a"
                href={generateUPILink()}
                target="_blank"
                startIcon={<PaymentIcon />}
              >
                Pay with UPI App
              </Button>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          After completing payment in your UPI app, click "I've Paid" below
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePaymentSuccess}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {loading ? 'Verifying...' : "I've Paid"}
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Popular UPI Apps:</strong> PhonePe, Google Pay, Paytm, BHIM, Amazon Pay
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon /> UPI Payment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pay instantly using any UPI app like PhonePe, Google Pay, Paytm, or BHIM
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip label="Instant" size="small" color="success" />
            <Chip label="Secure" size="small" color="primary" />
            <Chip label="0% Fee" size="small" color="info" />
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleInitiatePayment}
          disabled={loading}
          startIcon={<PaymentIcon />}
        >
          Pay ₹{plan.pricing.monthly.toLocaleString()}
        </Button>
      </Box>
    </Box>
  );
};

export default UPIPaymentForm;