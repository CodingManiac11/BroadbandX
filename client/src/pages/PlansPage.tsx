import React from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Speed, Wifi, Router } from '@mui/icons-material';

const PlansPage: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      id: 1,
      name: 'Basic Plan',
      speed: '25 Mbps',
      price: '₹599/month',
      features: ['Unlimited Data', 'Basic Support', 'WiFi Router Included'],
      recommended: false,
      color: '#f5f5f5'
    },
    {
      id: 2,
      name: 'Premium Plan',
      speed: '100 Mbps',
      price: '₹1299/month',
      features: ['Unlimited Data', '24/7 Support', 'High-Speed WiFi Router', 'Free Installation'],
      recommended: true,
      color: '#e3f2fd'
    },
    {
      id: 3,
      name: 'Ultimate Plan',
      speed: '200 Mbps',
      price: '₹2199/month',
      features: ['Unlimited Data', 'Priority Support', 'Mesh WiFi System', 'Free Installation', 'OTT Subscriptions'],
      recommended: false,
      color: '#f3e5f5'
    }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Choose Your Perfect Broadband Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          High-speed internet plans designed for your lifestyle and budget
        </Typography>
        <Divider sx={{ width: '100px', mx: 'auto', bgcolor: '#1976d2', height: 3 }} />
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 4, 
        justifyContent: 'center',
        mb: 6 
      }}>
        {plans.map((plan) => (
          <Box key={plan.id} sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
                },
                border: plan.recommended ? '3px solid #1976d2' : '1px solid #e0e0e0',
                bgcolor: plan.color
              }}
            >
              {plan.recommended && (
                <Chip 
                  label="MOST POPULAR" 
                  color="primary" 
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: -10, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontWeight: 'bold'
                  }} 
                />
              )}
              
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  <Speed sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {plan.name}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" component="div" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {plan.price}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                    <Wifi sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="h6" color="text.secondary">
                      {plan.speed}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  {plan.features.map((feature, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1, color: '#555' }}>
                      ✓ {feature}
                    </Typography>
                  ))}
                </Box>

                <Button 
                  variant={plan.recommended ? "contained" : "outlined"}
                  fullWidth 
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    py: 1.5,
                    fontWeight: 'bold',
                    ...(plan.recommended && {
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
                    })
                  }}
                >
                  {plan.recommended ? 'Get Started Now' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ textAlign: 'center', p: 4, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Router sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Why Choose Our Broadband?
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          justifyContent: 'center',
          mt: 3, 
          mb: 4 
        }}>
          <Box sx={{ flex: '1 1 200px', maxWidth: '300px' }}>
            <Typography variant="h6" gutterBottom>🚀 Lightning Fast</Typography>
            <Typography variant="body2" color="text.secondary">
              Experience blazing fast internet speeds for all your needs
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 200px', maxWidth: '300px' }}>
            <Typography variant="h6" gutterBottom>💯 99.9% Uptime</Typography>
            <Typography variant="body2" color="text.secondary">
              Reliable connection you can count on 24/7
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 200px', maxWidth: '300px' }}>
            <Typography variant="h6" gutterBottom>🎯 24/7 Support</Typography>
            <Typography variant="body2" color="text.secondary">
              Expert technical support whenever you need it
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <Button 
            variant="outlined" 
            size="large" 
            onClick={() => navigate('/')}
            sx={{ mr: 2, fontWeight: 'bold' }}
          >
            Back to Home
          </Button>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/login')}
            sx={{ fontWeight: 'bold' }}
          >
            Get Started Today
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PlansPage;