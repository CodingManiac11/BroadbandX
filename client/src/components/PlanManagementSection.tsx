import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Chip
} from '@mui/material';
import { Plan } from '../types/index';

const mockPlans: Plan[] = [
  {
    _id: '1',
    name: 'Basic Plan',
    description: 'Perfect for individual users',
    category: 'residential',
    pricing: {
      monthly: 29.99,
      yearly: 299.99,
      setupFee: 0,
      currency: 'USD'
    },
    features: {
      speed: {
        download: 100,
        upload: 20,
        unit: 'Mbps'
      },
      dataLimit: {
        amount: 500,
        unit: 'GB',
        unlimited: false
      },
      features: [
        {
          name: 'Basic Support',
          description: '24/7 email support',
          included: true
        },
        {
          name: 'Streaming Quality',
          description: 'HD streaming support',
          included: true
        }
      ]
    },
    availability: {
      regions: ['US'],
      cities: ['All Cities']
    },
    technicalSpecs: {
      technology: 'cable',
      latency: 20,
      reliability: 99.5,
      installation: {
        required: true,
        fee: 0,
        timeframe: '1-2 business days'
      }
    },
    targetAudience: 'residential-users',
    contractTerms: {
      minimumTerm: 12,
      earlyTerminationFee: 50,
      autoRenewal: true
    },
    isActive: true,
    popularity: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Premium Plan',
    description: 'Ideal for power users',
    category: 'business',
    pricing: {
      monthly: 99.99,
      yearly: 999.99,
      setupFee: 0,
      currency: 'USD'
    },
    features: {
      speed: {
        download: 500,
        upload: 100,
        unit: 'Mbps'
      },
      dataLimit: {
        unlimited: true
      },
      features: [
        {
          name: 'Priority Support',
          description: '24/7 priority phone & email support',
          included: true
        },
        {
          name: 'Streaming Quality',
          description: '4K streaming support',
          included: true
        }
      ]
    },
    availability: {
      regions: ['US'],
      cities: ['All Cities']
    },
    technicalSpecs: {
      technology: 'fiber',
      latency: 10,
      reliability: 99.8,
      installation: {
        required: true,
        fee: 0,
        timeframe: '1 business day'
      }
    },
    targetAudience: 'business-users',
    contractTerms: {
      minimumTerm: 24,
      earlyTerminationFee: 100,
      autoRenewal: true
    },
    isActive: true,
    popularity: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const PlanManagementSection: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Implement actual API call here
        setPlans(mockPlans);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Plan Management</Typography>
        <Button variant="contained" color="primary">Add New Plan</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Price (Monthly)</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Speed</TableCell>
              <TableCell>Data Limit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan._id}>
                <TableCell>{plan.name}</TableCell>
                <TableCell>₹{plan.pricing.monthly.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={plan.category} 
                    color={plan.category === 'business' ? 'secondary' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {plan.features.speed.download}/{plan.features.speed.upload} {plan.features.speed.unit}
                </TableCell>
                <TableCell>
                  {plan.features.dataLimit.unlimited ? 'Unlimited' : `${plan.features.dataLimit.amount} ${plan.features.dataLimit.unit}`}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={plan.isActive ? 'Active' : 'Inactive'}
                    color={plan.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PlanManagementSection;