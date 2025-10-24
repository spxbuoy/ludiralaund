import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isCustomer } = usePermissions();
  const { user: reduxUser } = useAppSelector((state) => state.auth);
  const [user, setUser] = useState<any>(reduxUser);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [unreadSupportChat, setUnreadSupportChat] = useState(false);
  const [error, setError] = useState<string | null>(null); // Added state for error handling

  // Fetch up-to-date user profile
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setUser(data);
      } catch (err: any) {
        setProfileError(err.message || 'Failed to fetch profile');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch active orders
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/orders?role=customer&status=pending`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        // Support both paginated and non-paginated
        let ordersArr: any[] = [];
        if (Array.isArray(data.data)) ordersArr = data.data;
        else if (Array.isArray(data.data?.docs)) ordersArr = data.data.docs;
        setOrders(ordersArr);
      } catch (err: any) {
        setOrdersError(err.message || 'Failed to fetch orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Fetch payment methods - restrict display to Mobile Money and Cash only
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setPaymentLoading(true);
      setPaymentError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/payments/methods/list`);
        if (!res.ok) throw new Error('Failed to fetch payment methods');
        const data = await res.json();

        const raw: any[] = Array.isArray(data.data) ? data.data : [];
        const normalized = raw.map((m: any) => ({
          id: String(m.id || m._id || m.code || m.key || '').toLowerCase(),
          name: String(m.name || m.title || m.label || m.method || '').trim(),
        }));
        const allowIds = ['mobile_money', 'momo', 'cash', 'cash_payment', 'cash-on-delivery', 'cash_on_delivery'];
        const filtered = normalized.filter((m) => {
          const id = (m.id || '').toLowerCase();
          const name = (m.name || '').toLowerCase();
          return allowIds.some((a) => id.includes(a)) || name.includes('mobile money') || name.includes('momo') || name === 'cash';
        });

        const display = filtered.length ? filtered : [
          { id: 'mobile_money', name: 'Mobile Money' },
          { id: 'cash', name: 'Cash' },
        ];
        setPaymentMethods(display);
      } catch (err: any) {
        setPaymentError(err.message || 'Failed to fetch payment methods');
        // Fallback to the two supported methods on error as well
        setPaymentMethods([
          { id: 'mobile_money', name: 'Mobile Money' },
          { id: 'cash', name: 'Cash' },
        ]);
      } finally {
        setPaymentLoading(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!user?._id) return;
      try {
        const token = localStorage.getItem('token');
        // Get or create main support chat room for this customer
        const chatRoomRes = await axios.post(
          `${API_BASE_URL}/chats/room`,
          { customerId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const chatRoomId = chatRoomRes.data._id;
        // Fetch messages
        const messagesRes = await axios.get(
          `${API_BASE_URL}/chats/${chatRoomId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const messages = messagesRes.data;
        // If any message is not read by this customer, show badge
        setUnreadSupportChat(messages.some((msg: any) => !msg.readBy || !msg.readBy.includes(user._id)));
      } catch {
        setUnreadSupportChat(false);
      }
    };
    fetchUnread();
    // eslint-disable-next-line
  }, [user?._id]);

  if (!isCustomer) {
    return null;
  }

  const handleViewOrders = () => navigate('/customer/orders');
  const handleNewOrder = () => navigate('/customer/new-order');
  const handleViewServices = () => navigate('/customer/services');
  const handleManageAddresses = () => navigate('/customer/profile?tab=addresses');
  const handleManagePayments = () => navigate('/customer/profile?tab=payments');
  const handleManageNotifications = () => navigate('/customer/settings?tab=notifications');
  
  const handleChatWithSupport = async () => {
    try {
      const token = localStorage.getItem('token');

      // Find or create general support chat room for this customer
      const response = await axios.post(
        `${API_BASE_URL}/chats/room`,
        { customerId: user?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatRoomId = response.data._id;
      navigate(`/chat/customer/${chatRoomId}`);
    } catch (err: any) {
      console.error('Error opening support chat:', err);
      setError('Failed to open support chat');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Quick Actions */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNewOrder}
                  startIcon={<AddIcon />}
                >
                  Place New Order
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleViewOrders}
                  startIcon={<VisibilityIcon />}
                >
                  View Order History
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleViewServices}
                  startIcon={<VisibilityIcon />}
                >
                  Browse Services
                </Button>
                <Badge color="error" variant="dot" invisible={!unreadSupportChat}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleChatWithSupport}
                  >
                    Chat with Support
                  </Button>
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Active Orders */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Orders</Typography>
              {ordersLoading ? (
                <CircularProgress />
              ) : ordersError ? (
                <Alert severity="error">{ordersError}</Alert>
              ) : orders.length === 0 ? (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="No active orders"
                      secondary="Place a new order to get started"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleNewOrder}
                      >
                        New Order
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              ) : (
                <List>
                  {orders.map((order) => (
                    <ListItem
                      key={order._id || order.id}
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        py: 2,
                      }}
                    >
                      <ListItemText
                        primary={`Order #${order._id || order.id}`}
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              Status: {order.status}
                            </Typography>
                            <br />
                            <Typography variant="body2" color="text.secondary" component="span">
                              Total: ¢{Number(order.totalAmount || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        }
                        sx={{
                          flex: 1,
                          mr: { xs: 0, sm: 2 },
                          mb: { xs: 1, sm: 0 },
                        }}
                      />
                      <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleViewOrders}
                          sx={{
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: { xs: '100%', sm: '80px' },
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Loyalty Points */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Loyalty Points</Typography>
              {profileLoading ? (
                <CircularProgress />
              ) : profileError ? (
                <Alert severity="error">{profileError}</Alert>
              ) : (
                <>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {user?.loyaltyPoints || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Points available for rewards and discounts
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Saved Addresses */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Saved Addresses</Typography>
                <IconButton onClick={handleManageAddresses} color="primary">
                  <EditIcon />
                </IconButton>
              </Box>
              {profileLoading ? (
                <CircularProgress />
              ) : profileError ? (
                <Alert severity="error">{profileError}</Alert>
              ) : (
                <List>
                  {user?.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((address: any) => (
                      <ListItem key={address.id || address._id}>
                        <ListItemText
                          primary={`${address.street}, ${address.city}`}
                          secondary={`${address.state} ${address.zipCode}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No saved addresses"
                        secondary="Add an address to get started"
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Payment Methods */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Payment Methods</Typography>
                <IconButton onClick={handleManagePayments} color="primary">
                  <EditIcon />
                </IconButton>
              </Box>
              {paymentLoading ? (
                <CircularProgress />
              ) : paymentError ? (
                <Alert severity="error">{paymentError}</Alert>
              ) : (
                <List>
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <ListItem key={method.id}>
                        <ListItemText
                          primary={method.name}
                          secondary={method.id}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No saved payment methods"
                        secondary="Add a payment method to get started"
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Notifications */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Notifications</Typography>
                <IconButton onClick={handleManageNotifications} color="primary">
                  <EditIcon />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Manage your notification preferences
              </Typography>
              {/* TODO: Connect to backend when endpoint is available */}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomerDashboard;
