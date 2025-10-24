import React from 'react';
import { Box, Typography, Paper, Button, Stack } from '@mui/material';
import { useAppSelector } from '../app/hooks';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

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
                      onClick={() => navigate('/chats')}
                    >
                      Chats
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
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
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
                      onClick={() => navigate('/provider/orders')}
                    >
                      View Orders
                    </Button>
                  </Box>
                   <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/provider/orders')}
                    >
                      Chat (via Orders)
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/provider/services')}
                    >
                      Manage Services
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/provider/earnings')}
                    >
                      View Earnings
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/provider/availability')}
                    >
                      Set Availability
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/chats')}
                    >
                      Chats
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