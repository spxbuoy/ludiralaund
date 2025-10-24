import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import RoleBasedAccess from '../../components/auth/RoleBasedAccess';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Shop Owner Dashboard
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* User Management Section */}
        <RoleBasedAccess allowedRoles="admin">
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6">User Management</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/admin/users')}
                  sx={{ mt: 2 }}
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </Box>
        </RoleBasedAccess>

        {/* Analytics Section */}
        <RoleBasedAccess allowedRoles="admin">
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Analytics & Reporting</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/admin/analytics')}
                  sx={{ mt: 2 }}
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </Box>
        </RoleBasedAccess>

        {/* Order Management Section */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Order Management</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/orders')}
                sx={{ mt: 2 }}
              >
                Manage Orders
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Payment Management Section */}
        <RoleBasedAccess allowedRoles="admin">
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Payment Management</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/admin/payments')}
                  sx={{ mt: 2 }}
                >
                  Manage Payments
                </Button>
              </CardContent>
            </Card>
          </Box>
        </RoleBasedAccess>

        {/* Service Management Section */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Service Management</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/services')}
                sx={{ mt: 2 }}
              >
                Manage Services
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Review Moderation Section */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Review Moderation</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/reviews')}
                sx={{ mt: 2 }}
              >
                Moderate Reviews
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Chat Management Section */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Chat Management</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/chats')}
                sx={{ mt: 2 }}
              >
                Chats
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
