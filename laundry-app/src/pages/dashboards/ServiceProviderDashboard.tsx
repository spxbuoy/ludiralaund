import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { ServiceProviderUser } from '../../types/auth';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
import { format, startOfDay, endOfDay } from 'date-fns';

interface DashboardStats {
  pendingOrders: number;
  completedToday: number;
  todaysEarnings: number;
}

const ServiceProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const serviceProvider = user as ServiceProviderUser;

  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    completedToday: 0,
    todaysEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Fetch orders for the provider
      const ordersResponse = await axios.get(
        `${API_BASE_URL}/orders?role=service_provider&include_available=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data.docs || ordersResponse.data.data || [];

        // Calculate stats
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        let pendingCount = 0;
        let completedTodayCount = 0;
        let todaysEarningsAmount = 0;

        orders.forEach((order: any) => {
          // Count pending orders
          if (['pending', 'confirmed', 'in_progress', 'ready_for_pickup'].includes(order.status)) {
            pendingCount++;
          }

          // Count completed today and calculate today's earnings
          const completedDate = new Date(order.completedAt || order.updatedAt);
          if (order.status === 'completed' &&
              completedDate >= startOfToday &&
              completedDate <= endOfToday) {
            completedTodayCount++;
            if (order.payment?.status === 'completed') {
              todaysEarningsAmount += order.totalAmount || 0;
            }
          }
        });

        setStats({
          pendingOrders: pendingCount,
          completedToday: completedTodayCount,
          todaysEarnings: todaysEarningsAmount,
        });
      } else {
        setError('Failed to fetch orders data');
      }
    } catch (err: any) {
      console.error('Dashboard stats fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user ? `${user.firstName} ${user.lastName}` : 'Provider'}
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Orders
              </Typography>
              <Typography variant="h3">
                {loading ? <CircularProgress size={32} color="inherit" /> : stats.pendingOrders}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completed Today
              </Typography>
              <Typography variant="h3">
                {loading ? <CircularProgress size={32} color="inherit" /> : stats.completedToday}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Earnings
              </Typography>
              <Typography variant="h3">
                {loading ? <CircularProgress size={32} color="inherit" /> : `¢${stats.todaysEarnings.toFixed(2)}`}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/orders')}
              sx={{ height: '100%', py: 2 }}
            >
              View Orders
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/earnings')}
              sx={{ height: '100%', py: 2 }}
            >
              View Earnings
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/availability')}
              sx={{ height: '100%', py: 2 }}
            >
              Set Availability
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/profile')}
              sx={{ height: '100%', py: 2 }}
            >
              Update Profile
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/chats')}
              sx={{ height: '100%', py: 2 }}
            >
              Chats
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Recent Activity */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your latest order requests
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/provider/orders')}
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Earnings Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Track your earnings and performance
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/provider/earnings')}
              >
                View Earnings Details
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ServiceProviderDashboard;
