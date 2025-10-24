import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  LocalShipping,
  Star,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProviders: number;
  averageOrderValue: number;
  completionRate: number;
  customerSatisfaction: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  topServices: Array<{ name: string; orders: number; revenue: number }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

const Analytics: React.FC = () => {
  const { canViewAnalytics } = usePermissions();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [error, setError] = useState<string | null>(null);

  // Fetch real analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { API_BASE_URL } = await import('../../services/api');
        // Fetch core metrics
        const coreRes = await fetch(`${API_BASE_URL}/analytics?timeRange=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!coreRes.ok) throw new Error('Failed to fetch analytics data');
        const core = await coreRes.json();

        // Fetch top performing services if available (fallback to empty array on failure)
        let topServices = [] as Array<{ name: string; orders: number; revenue: number }>;
        try {
          const topRes = await fetch(`${API_BASE_URL}/analytics/top-services?timeRange=${timeRange}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          });
          if (topRes.ok) {
            const topData = await topRes.json();
            // Accept either topServices or data field shapes
            topServices = Array.isArray(topData?.topServices)
              ? topData.topServices
              : Array.isArray(topData?.data)
              ? topData.data
              : [];
          }
        } catch {}

        // Ensure analytics data has the expected structure
        const analyticsData = {
          totalRevenue: core.totalRevenue || 0,
          totalOrders: core.totalOrders || 0,
          totalCustomers: core.totalCustomers || 0,
          totalProviders: core.totalProviders || 0,
          averageOrderValue: core.averageOrderValue || 0,
          completionRate: core.completionRate || 0,
          customerSatisfaction: core.customerSatisfaction || 0,
          monthlyRevenue: Array.isArray(core.monthlyRevenue) ? core.monthlyRevenue : [],
          topServices,
          recentOrders: Array.isArray(core.recentOrders) ? core.recentOrders : [],
        } as AnalyticsData;
        setAnalyticsData(analyticsData);
      } catch (error) {
        console.error('Analytics fetch error:', error);
        setError('Failed to load analytics data');
        // Set default empty data structure
        setAnalyticsData({
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalProviders: 0,
          averageOrderValue: 0,
          completionRate: 0,
          customerSatisfaction: 0,
          monthlyRevenue: [],
          topServices: [],
          recentOrders: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (!canViewAnalytics()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view analytics.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load analytics data.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ¢{analyticsData.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                +12.5% from last month
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping color="secondary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Total Orders
                </Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {analyticsData.totalOrders.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                +8.3% from last month
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Total Customers
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {analyticsData.totalCustomers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                +15.2% from last month
              </Typography>
            </CardContent>
          </Card>
        </Box>


      </Box>

      {/* Additional Metrics */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: 'calc(50% - 8px)' }}>
                  <Typography variant="body2" color="textSecondary">
                    Average Order Value
                  </Typography>
                  <Typography variant="h6">
                    ¢{analyticsData.averageOrderValue.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ width: 'calc(50% - 8px)' }}>
                  <Typography variant="body2" color="textSecondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="h6">
                    {analyticsData.completionRate}%
                  </Typography>
                </Box>
                <Box sx={{ width: 'calc(50% - 8px)' }}>
                  <Typography variant="body2" color="textSecondary">
                    Active Service Providers
                  </Typography>
                  <Typography variant="h6">
                    {analyticsData.totalProviders}
                  </Typography>
                </Box>
                <Box sx={{ width: 'calc(50% - 8px)' }}>
                  <Typography variant="body2" color="textSecondary">
                    Customer Growth
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    +15.2%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Services
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.topServices.map((service) => (
                      <TableRow key={service.name}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell align="right">{service.orders}</TableCell>
                        <TableCell align="right">¢{service.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Recent Orders */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>¢{order.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={order.status === 'completed' ? 'success.main' : 'warning.main'}
                      >
                        {order.status.replace('_', ' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(order.date).toLocaleDateString()}
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

export default Analytics; 