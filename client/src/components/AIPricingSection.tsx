import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
} from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import { MLRecommendation } from '../services/mlService';

interface AIPricingSectionProps {
  recommendations: MLRecommendation[];
  loading: boolean;
  error: string | null;
  onGenerateRecommendations: () => void;
  onApproveRecommendation: (planId: string) => void;
  onRejectRecommendation: (planId: string) => void;
}

export const AIPricingSection: React.FC<AIPricingSectionProps> = ({
  recommendations,
  loading,
  error,
  onGenerateRecommendations,
  onApproveRecommendation,
  onRejectRecommendation,
}) => {
  const pendingCount = recommendations.filter(r => r.status === 'pending').length;
  const averageConfidence = recommendations.length > 0
    ? Math.round(recommendations.reduce((acc, rec) => acc + rec.confidence, 0) / recommendations.length * 100)
    : 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom className="flex items-center gap-2">
        <SmartToy className="text-primary-600" />
        AI-Powered Dynamic Pricing
      </Typography>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1">ML Pricing Recommendations</Typography>
            </Box>
            <Typography variant="h3" className="mt-2">{pendingCount}</Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Approvals
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1">Average Confidence Score</Typography>
            </Box>
            <Typography variant="h3" className="mt-2">{averageConfidence}%</Typography>
            <Typography variant="body2" color="text.secondary">
              ML Model Accuracy
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Recent Pricing Recommendations
            </Typography>
            <Button
              variant="contained"
              startIcon={<SmartToy />}
              className="bg-primary-600 hover:bg-primary-700"
              onClick={onGenerateRecommendations}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Generate ML Recommendations"
              )}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plan Name</TableCell>
                  <TableCell>Current Price</TableCell>
                  <TableCell>Recommended Price</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Market Factor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recommendations.map((rec) => (
                  <TableRow key={rec.planId}>
                    <TableCell>{rec.planName || 'Unknown Plan'}</TableCell>
                    <TableCell>${rec.currentPrice?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      ${rec.recommendedPrice?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${Math.round(rec.confidence * 100)}%`}
                        color={rec.confidence > 0.8 ? "success" : rec.confidence > 0.6 ? "warning" : "error"}
                        size="small"
                        className={rec.confidence > 0.8 ? "bg-green-100 text-green-800" : ""}
                      />
                    </TableCell>
                    <TableCell>{rec.marketFactor || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.status.replace('_', ' ')}
                        color={rec.status === 'implemented' ? "success" : rec.status === 'pending' ? "warning" : "info"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {rec.status === 'pending' && (
                          <>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              onClick={() => onApproveRecommendation(rec.planId)}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => onRejectRecommendation(rec.planId)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {rec.status === 'implemented' && (
                          <Chip 
                            label="Implemented" 
                            color="success"
                            size="small"
                          />
                        )}
                        {rec.status === 'under_review' && (
                          <Chip 
                            label="Under Review" 
                            color="info"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};