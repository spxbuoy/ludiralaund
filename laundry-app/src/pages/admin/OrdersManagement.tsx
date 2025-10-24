import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';

interface Order {
  _id: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  serviceProvider?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    businessDetails?: any;
  };
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'ready_for_pickup' | 'completed' | 'cancelled';
  totalAmount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  items: Array<{
    service: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string;
  }>;
  pickupAddress: {
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  deliveryAddress: {
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  pickupDate: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
  orderNumber: string;
  formattedTotal: string;
}

const OrdersManagement: React.FC = () => {
  const { canManageOrders } = usePermissions();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [unreadChats, setUnreadChats] = useState<{ [orderId: string]: boolean }>({});
  const [adminId, setAdminId] = useState<string | null>(null);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setAdminId(user._id || user.id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const { API_BASE_URL } = await import('../../services/api');
        // Fetch a large page size so admin can see all orders
        const response = await fetch(`${API_BASE_URL}/orders?page=1&limit=1000`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        console.log('Orders API response:', JSON.stringify(data, null, 2));

        const ordersArray = data.success && data.data?.docs ? data.data.docs : [];
        // Set true total count from pagination if present
        const totalFromPagination = (data.data?.totalDocs ?? data.data?.total) ?? 0;
        setTotalOrdersCount(Number(totalFromPagination) || ordersArray.length);

        const mappedOrders = ordersArray.map((order: any) => ({
          _id: order._id,
          customer: {
            _id: order.customer?._id || '',
            firstName: order.customer?.firstName || '',
            lastName: order.customer?.lastName || '',
            email: order.customer?.email || '',
            phoneNumber: order.customer?.phoneNumber || '',
          },
          serviceProvider: order.serviceProvider
            ? {
                _id: order.serviceProvider._id,
                firstName: order.serviceProvider.firstName,
                lastName: order.serviceProvider.lastName,
                email: order.serviceProvider.email,
                phoneNumber: order.serviceProvider.phoneNumber,
                businessDetails: order.serviceProvider.businessDetails,
              }
            : undefined,
          status: order.status,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          tax: order.tax,
          deliveryFee: order.deliveryFee,
          items: order.items.map((item: any) => ({
            service: item.service,
            serviceName: item.serviceName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            specialInstructions: item.specialInstructions,
          })),
          pickupAddress: {
            type: order.pickupAddress?.type || '',
            street: order.pickupAddress?.street || '',
            city: order.pickupAddress?.city || '',
            state: order.pickupAddress?.state || '',
            zipCode: order.pickupAddress?.zipCode || '',
            instructions: order.pickupAddress?.instructions || '',
          },
          deliveryAddress: {
            type: order.deliveryAddress?.type || '',
            street: order.deliveryAddress?.street || '',
            city: order.deliveryAddress?.city || '',
            state: order.deliveryAddress?.state || '',
            zipCode: order.deliveryAddress?.zipCode || '',
            instructions: order.deliveryAddress?.instructions || '',
          },
          pickupDate: order.pickupDate,
          deliveryDate: order.deliveryDate,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          orderNumber: order.orderNumber,
          formattedTotal: order.formattedTotal,
        }));
        setOrders(mappedOrders);
        console.log('Mapped orders:', mappedOrders);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Orders fetch error:', errorMessage, error);
        setError('Failed to load orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!adminId) return;
      const badgeMap: { [orderId: string]: boolean } = {};
      for (const order of orders) {
        try {
          const token = localStorage.getItem('token');
          const { API_BASE_URL } = await import('../../services/api');
          const chatRoomRes = await axios.post(
            `${API_BASE_URL}/chats/room`,
            { customerId: order.customer._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const chatRoomId = chatRoomRes.data._id;
          const messagesRes = await axios.get(
            `${API_BASE_URL}/chats/${chatRoomId}/messages`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const messages = messagesRes.data;
          badgeMap[order._id] = messages.some((msg: any) => !msg.readBy || !msg.readBy.includes(adminId));
        } catch {
          badgeMap[order._id] = false;
        }
      }
      setUnreadChats(badgeMap);
    };
    fetchUnread();
  }, [orders, adminId]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleAssignOrder = async (orderId: string, serviceProviderId: string) => {
    try {
      const { API_BASE_URL } = await import('../../services/api');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceProviderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign order');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(order =>
        order._id === orderId ? updatedOrder.data : order
      ));
      setError(null);
    } catch (err) {
      setError('Failed to assign order');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(order =>
        order._id === orderId ? updatedOrder.data : order
      ));
      setError(null);
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const handleViewChat = async (order: Order) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chats/room`,
        { customerId: order.customer._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatRoomId = res.data._id;
      navigate(`/chat/admin/${chatRoomId}`);
    } catch (err) {
      alert('Failed to open chat.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'ready_for_pickup': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (!canManageOrders()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to manage orders.
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

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Orders Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4">
                {totalOrdersCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {orders.filter(o => o.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" color="primary.main">
                {orders.filter(o => o.status === 'in_progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {orders.filter(o => o.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="ready_for_pickup">Ready for Pickup</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {filteredOrders.map((order) => (
          <Box key={order._id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 18px)' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" color="primary" sx={{ minWidth: 'fit-content' }}>
                    #{order.orderNumber}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={order.status.replace('_', ' ')}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{
                        maxWidth: '120px',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }
                      }}
                    />
                  </Box>
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                  {`${order.customer.firstName} ${order.customer.lastName}`}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Provider: {order.serviceProvider ? `${order.serviceProvider.firstName} ${order.serviceProvider.lastName}` : 'Unassigned'}
                </Typography>

                <Typography variant="h6" color="primary" gutterBottom>
                  {order.formattedTotal}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pickup: {new Date(order.pickupDate).toLocaleDateString()}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                </Typography>

                <Typography component="div" variant="body2" color="text.secondary" gutterBottom>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Services:
                    </Typography>
                    {order.items.map((item, index) => (
                      <Box key={index} sx={{ ml: 1, mb: 0.5 }}>
                        <Typography variant="body2" component="span">• </Typography>
                        <Typography variant="body2" component="span" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {item.serviceName} x{item.quantity} - ¢{item.unitPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Typography>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewOrder(order)}
                    sx={{ minWidth: 'fit-content' }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleViewChat(order)}
                    sx={{ minWidth: 'fit-content' }}
                  >
                    💬 Chat {unreadChats[order._id] && '•'}
                  </Button>
                  {order.status === 'pending' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={async () => {
                        const spId = prompt('Enter Service Provider ID to assign:');
                        if (spId) await handleAssignOrder(order._id, spId);
                      }}
                      sx={{ minWidth: 'fit-content' }}
                    >
                      Assign Provider
                    </Button>
                  )}
                  {order.status === 'assigned' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUpdateStatus(order._id, 'in_progress')}
                      sx={{ minWidth: 'fit-content' }}
                    >
                      Start Work
                    </Button>
                  )}
                  {order.status === 'in_progress' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUpdateStatus(order._id, 'ready_for_pickup')}
                      sx={{ minWidth: 'fit-content' }}
                    >
                      Ready for Pickup
                    </Button>
                  )}
                  {order.status === 'ready_for_pickup' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleUpdateStatus(order._id, 'completed')}
                      sx={{ minWidth: 'fit-content' }}
                    >
                      Complete Order
                    </Button>
                  )}
                  {['pending', 'confirmed', 'assigned', 'in_progress', 'ready_for_pickup'].includes(order.status) && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                      sx={{ minWidth: 'fit-content' }}
                    >
                      Cancel Order
                    </Button>
                  )}
                </Box>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Order Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details #{selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Typography>Name: {`${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`}</Typography>
              <Typography>Email: {selectedOrder.customer.email}</Typography>
              <Typography>Phone: {selectedOrder.customer.phoneNumber}</Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Order Items
              </Typography>
              {selectedOrder.items.map((item, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography>
                    {item.serviceName} x {item.quantity} - ¢{item.unitPrice.toFixed(2)} (Total: ¢{item.totalPrice.toFixed(2)})
                  </Typography>
                  {item.specialInstructions && (
                    <Typography variant="body2" color="text.secondary">
                      Instructions: {item.specialInstructions}
                    </Typography>
                  )}
                </Box>
              ))}

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Addresses
              </Typography>
              <Typography>
                Pickup: {`${selectedOrder.pickupAddress.street}, ${selectedOrder.pickupAddress.city}, ${selectedOrder.pickupAddress.state} ${selectedOrder.pickupAddress.zipCode}`}
              </Typography>
              {selectedOrder.pickupAddress.instructions && (
                <Typography variant="body2" color="text.secondary">
                  Instructions: {selectedOrder.pickupAddress.instructions}
                </Typography>
              )}
              <Typography>
                Delivery: {`${selectedOrder.deliveryAddress.street}, ${selectedOrder.deliveryAddress.city}, ${selectedOrder.deliveryAddress.state} ${selectedOrder.deliveryAddress.zipCode}`}
              </Typography>
              {selectedOrder.deliveryAddress.instructions && (
                <Typography variant="body2" color="text.secondary">
                  Instructions: {selectedOrder.deliveryAddress.instructions}
                </Typography>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Dates
              </Typography>
              <Typography>Pickup: {new Date(selectedOrder.pickupDate).toLocaleDateString()}</Typography>
              <Typography>Delivery: {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Financials
              </Typography>
              <Typography>Subtotal: ¢{selectedOrder.subtotal.toFixed(2)}</Typography>
              <Typography>Tax: ¢{selectedOrder.tax.toFixed(2)}</Typography>
              <Typography>Delivery Fee: ¢{selectedOrder.deliveryFee.toFixed(2)}</Typography>
              <Typography variant="h5" color="primary">
                Total: {selectedOrder.formattedTotal}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersManagement;
