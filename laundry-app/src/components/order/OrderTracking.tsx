import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  CheckCircle,
  LocalShipping,
  Build,
  Home,
  Schedule,
  LocationOn,
  Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import io from 'socket.io-client';
import api, { API_BASE_URL } from '../../services/api';

interface TrackingStep {
  status: string;
  timestamp: string;
  notes?: string;
  location?: string;
}

interface OrderTrackingProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

const trackingSteps = [
  { key: 'pending', label: 'Order Placed', icon: <Schedule /> },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled', icon: <Schedule /> },
  { key: 'picked_up', label: 'Picked Up', icon: <LocalShipping /> },
  { key: 'at_facility', label: 'At Facility', icon: <Build /> },
  { key: 'cleaning', label: 'Cleaning in Progress', icon: <Build /> },
  { key: 'ready_for_delivery', label: 'Ready for Delivery', icon: <CheckCircle /> },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: <LocalShipping /> },
  { key: 'delivered', label: 'Delivered', icon: <Home /> }
];

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, open, onClose }) => {
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && orderId) {
      fetchTrackingData();

      // Setup socket connection for real-time updates
      const socketBase = (API_BASE_URL || '').replace(/\/api$/, '') || 'http://localhost:5000';
      const socket = io(socketBase);
      socket.emit('joinRoom', { chatRoomId: `order_${orderId}` });

      socket.on('trackingUpdate', (data) => {
        console.log('Real-time tracking update:', data);
        fetchTrackingData(); // Refresh tracking data
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [open, orderId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tracking/${orderId}`);
      // Type assertion to handle the unknown response type
      setTracking((response.data as any).data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!tracking) return 0;
    return trackingSteps.findIndex(step => step.key === tracking.currentLocation);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Order Tracking</Typography>
          <Button startIcon={<Refresh />} onClick={fetchTrackingData}>
            Refresh
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tracking && (
          <Box>
            {/* Current Status */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Chip
                    label={tracking.currentLocation.replace('_', ' ').toUpperCase()}
                    color="primary"
                    size="medium"
                  />
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="h6">Order #{tracking.order.orderNumber}</Typography>
                    {tracking.estimatedDelivery && (
                      <Typography variant="body2" color="text.secondary">
                        Estimated Delivery: {format(new Date(tracking.estimatedDelivery), 'PPp')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Driver Info */}
            {tracking.driverInfo && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <LocalShipping /> Driver Information
                  </Typography>
                  <Typography><strong>Name:</strong> {tracking.driverInfo.name}</Typography>
                  <Typography><strong>Phone:</strong> {tracking.driverInfo.phone}</Typography>
                  <Typography><strong>Vehicle:</strong> {tracking.driverInfo.vehicleNumber}</Typography>
                </CardContent>
              </Card>
            )}

            {/* Tracking Steps */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Tracking Progress
              </Typography>
              <Stepper activeStep={getCurrentStepIndex()} orientation="vertical">
                {trackingSteps.map((step, index) => (
                  <Step key={step.key}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            color: getStepStatus(index) === 'completed' ? 'success.main' :
                                   getStepStatus(index) === 'active' ? 'primary.main' : 'grey.400'
                          }}
                        >
                          {step.icon}
                        </Box>
                      )}
                    >
                      <Typography
                        variant="body1"
                        fontWeight={getStepStatus(index) === 'active' ? 'bold' : 'normal'}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {tracking.trackingSteps
                        .filter((ts: TrackingStep) => ts.status === step.key)
                        .map((ts: TrackingStep, idx: number) => (
                          <Box key={idx} sx={{ pb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(ts.timestamp), 'PPp')}
                            </Typography>
                            {ts.notes && (
                              <Typography variant="body2">
                                {ts.notes}
                              </Typography>
                            )}
                            {ts.location && (
                              <Typography variant="body2" color="primary">
                                <LocationOn fontSize="small" /> {ts.location}
                              </Typography>
                            )}
                          </Box>
                        ))
                      }
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderTracking;
