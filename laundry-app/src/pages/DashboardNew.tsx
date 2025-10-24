export {};

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Stack, CircularProgress } from '@mui/material';
import { useAppSelector } from '../app/hooks';
import { useNavigate } from 'react-router-dom';
import { ServiceProviderUser } from '../types/auth';

// Define interfaces for the data structures
interface OrderStats {
  statusBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  totalOrders: number;
  totalRevenue: number;
}

interface DashboardStats {
  pendingOrders: number;
  completedToday: number;
  todayEarnings: number;
  inProgressOrders: number;
  totalEarnings: number;
  isShowingTotalEarnings: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    pendingOrders: 0,
    completedToday: 0,
    todayEarnings: 0,
    inProgressOrders: 0,
    totalEarnings: 0,
    isShowingTotalEarnings: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch dashboard statistics for service providers
  const fetchProviderStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token'); // Adjust based on how you store the auth token
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Fetch general order statistics
      const statsResponse = await fetch(
        `/api/orders/stats-overview?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch order statistics');
      }

      const statsData: OrderStats = await statsResponse.json();

      // Fetch assigned orders to get more detailed information
      const ordersResponse = await fetch('/api/orders/provider/assigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch assigned orders');
      }

      const ordersData = await ordersResponse.json();
      const orders = ordersData.data || [];

      // Debug logging
      console.log('Current user ID:', user?.id);
      console.log('Total orders fetched:', orders.length);
      console.log('Sample order:', orders[0]);
      
      // Calculate dashboard metrics with better logic
      const assignedOrders = orders.filter((order: any) => {
        const isAssignedToUser = order.serviceProvider?._id === user?.id || order.serviceProvider === user?.id;
        console.log(`Order ${order._id}: serviceProvider = ${order.serviceProvider}, assigned to user = ${isAssignedToUser}`);
        return isAssignedToUser;
      });

      console.log('Orders assigned to user:', assignedOrders.length);

      const pendingOrders = assignedOrders.filter((order: any) => 
        ['pending', 'confirmed', 'assigned'].includes(order.status)
      ).length;

      const inProgressOrders = assignedOrders.filter((order: any) => 
        order.status === 'in_progress'
      ).length;

      // For completed orders, let's be more flexible with the date range
      // and also check all completed orders for this provider
      const completedOrders = assignedOrders.filter((order: any) => 
        order.status === 'completed'
      );

      console.log('All completed orders for user:', completedOrders.length);

      // Calculate today's completed orders - be more lenient with date matching
      const todayCompleted = completedOrders.filter((order: any) => {
        const orderDate = new Date(order.updatedAt || order.createdAt);
        const isToday = orderDate.toDateString() === today.toDateString();
        console.log(`Order ${order._id} date: ${orderDate.toDateString()}, is today: ${isToday}`);
        return isToday;
      });

      const completedToday = todayCompleted.length;
      
      // Calculate earnings from all completed orders (not just today) as fallback
      const totalEarningsFromCompleted = completedOrders.reduce((sum: number, order: any) => 
        sum + (order.totalAmount || 0), 0
      );
      
      const todayEarnings = todayCompleted.reduce((sum: number, order: any) => 
        sum + (order.totalAmount || 0), 0
      );

      console.log('Dashboard stats calculated:', {
        pendingOrders,
        completedToday,
        todayEarnings,
        inProgressOrders,
        totalEarningsFromCompleted
      });

      setDashboardStats({
        pendingOrders,
        completedToday,
        todayEarnings,
        inProgressOrders,
        totalEarnings: totalEarningsFromCompleted,
        isShowingTotalEarnings: todayEarnings === 0 && totalEarningsFromCompleted > 0
      });

    } catch (err) {
      console.error('Error fetching provider stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      
      // Fallback to user earnings if available
      if (user && 'earnings' in user) {
        const serviceProvider = user as ServiceProviderUser;
        setDashboardStats({
          pendingOrders: serviceProvider.earnings?.pending ?? 0,
          completedToday: serviceProvider.earnings?.completed ?? 0,
          todayEarnings: serviceProvider.earnings?.total ?? 0,
          inProgressOrders: 0,
          totalEarnings: serviceProvider.earnings?.total ?? 0,
          isShowingTotalEarnings: false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats when component mounts and user is a service provider
  useEffect(() => {
    if (user?.role === 'service_provider') {
      fetchProviderStats();
    }
  }, [user]);

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <Stack spacing={3} direction="row" useFlexGap flexWrap="wrap">
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={2} direction="row" useFlexGap flexWrap="wrap">
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/users')}
                    >
                      Manage Users
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/orders')}
                    >
                      View Orders
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/services')}
                    >
                      Manage Services
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/analytics')}
                    >
                      View Analytics
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/payments')}
                    >
                      Manage Payments
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/reviews')}
                    >
                      Moderate Reviews
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        );

      case 'customer':
        return (
          <Stack spacing={3} direction="row" useFlexGap flexWrap="wrap">
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={2} direction="row" useFlexGap flexWrap="wrap">
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/customer/new-order')}
                    >
                      Place New Order
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/customer/orders')}
                    >
                      View Orders
                    </Button>
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/customer/services')}
                    >
                      Browse Services
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        );

      case 'service_provider':
        return (
          <Stack spacing={3}>
            {/* Error Display */}
            {error && (
              <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
                <Typography color="white" variant="body2">
                  {error}
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={fetchProviderStats}
                  sx={{ mt: 1, color: 'white', borderColor: 'white' }}
                >
                  Retry
                </Button>
              </Paper>
            )}

            {/* Stats Overview */}
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Today's Overview
                  </Typography>
                  {loading && <CircularProgress size={20} />}
                </Stack>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                      <Typography variant="h4" color="white">
                        {loading ? '...' : dashboardStats.pendingOrders}
                      </Typography>
                      <Typography variant="subtitle1" color="white">
                        Pending Orders
                      </Typography>
                    </Paper>
                  </Box>
                  
                  <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <Typography variant="h4" color="white">
                        {loading ? '...' : dashboardStats.inProgressOrders}
                      </Typography>
                      <Typography variant="subtitle1" color="white">
                        In Progress
                      </Typography>
                    </Paper>
                  </Box>

                  <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="h4" color="white">
                        {loading ? '...' : dashboardStats.completedToday}
                      </Typography>
                      <Typography variant="subtitle1" color="white">
                        Completed Today
                      </Typography>
                    </Paper>
                  </Box>

                  <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h4" color="white">
                        {loading ? '...' : `${dashboardStats.todayEarnings.toFixed(2)}`}
                      </Typography>
                      <Typography variant="subtitle1" color="white">
                        {dashboardStats.isShowingTotalEarnings ? 'Total Earnings' : "Today's Earnings"}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Quick Actions */}
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={2} direction="row" useFlexGap flexWrap="wrap">
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/provider/orders')}
                    >
                      View Active Orders
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={fetchProviderStats}
                      disabled={loading}
                    >
                      {loading ? 'Refreshing...' : 'Refresh Stats'}
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        );

      default:
        return (
          <Typography variant="body1" color="text.secondary">
            Welcome! Please select an action from the menu.
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user ? `${user.firstName} ${user.lastName}` : 'User'}
      </Typography>
      {getDashboardContent()}
    </Box>
  );
};

export default Dashboard;