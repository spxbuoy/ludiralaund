// src/pages/provider/ProviderOrders.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChatIcon from '@mui/icons-material/Chat';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { shallowEqual } from 'react-redux';

// Import the centralized types
import { Order, OrderStatus } from '../../types/order';
import {
  statusColors,
  paymentStatusColors,
  statusLabels,
  paymentStatusLabels
} from '../../types/order';
import { formatOrderForDisplay } from '../../utils/typeUtils';

// Slice thunks
import { fetchProviderOrders, setError, updateOrderStatus } from '../../features/orders/orderSlice';

import { API_BASE_URL } from '../../services/api';

const statusFlow: OrderStatus[] = [
  'pending',
  'confirmed',
  'assigned',
  'in_progress',
  'ready_for_pickup',
  'picked_up',
  'ready_for_delivery',
  'completed',
];

const nextStatus = (current: OrderStatus | string): OrderStatus | null => {
  const idx = statusFlow.indexOf(current as OrderStatus);
  if (idx === -1) return null;
  const next = statusFlow[idx + 1];
  return next || null;
};

const nextStatusButtonLabel = (next: OrderStatus | null): string => {
  if (!next) return '';
  const map: Record<OrderStatus, string> = {
    pending: 'Confirm',
    confirmed: 'Assign',
    assigned: 'Start Work',
    in_progress: 'Ready for Pickup',
    ready_for_pickup: 'Mark Picked Up',
    picked_up: 'Ready for Delivery',
    ready_for_delivery: 'Complete Order',
    completed: 'Completed',
    cancelled: 'Cancelled',
  } as any;
  return map[next] || 'Advance Status';
};

const ProviderOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders || { orders: [], loading: false, error: null }, shallowEqual);
  const navigate = useNavigate();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchProviderOrders({ includeAvailable: true }));
  }, [dispatch]);

  const authHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleSelfAssign = async (order: Order) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/orders/${order._id}/assign-self`,
        {},
        { headers: authHeader() }
      );

      if (response.data.success) {
        dispatch(fetchProviderOrders({ includeAvailable: true }));
      } else {
        dispatch(setError('Failed to assign order'));
      }
    } catch (err: any) {
      console.error('Self-assign error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to assign order'));
    }
  };

  const handleConfirmPayment = async (order: Order) => {
    if (!order.payment || order.payment.status === 'completed') return;
    try {
      setConfirming(order._id);

      // Use the order-based helper that enforces valid transitions
      const headers = { ...authHeader(), 'Content-Type': 'application/json' };

      // Transition: pending -> processing
      await axios.put(
        `${API_BASE_URL}/orders/${order._id}/payment-status`,
        { status: 'processing' },
        { headers }
      );

      // Immediately transition: processing -> completed
      await axios.put(
        `${API_BASE_URL}/orders/${order._id}/payment-status`,
        { status: 'completed' },
        { headers }
      );

      dispatch(fetchProviderOrders({ includeAvailable: true }));
    } catch (err: any) {
      console.error('Confirm payment error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to confirm payment'));
    } finally {
      setConfirming(null);
    }
  };

  const handleViewChat = async (order: Order) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chats/room`,
        { customerId: (order as any).customer?._id || (order as any).customer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatRoomId = res.data._id;
      navigate(`/chat/supplier/${chatRoomId}`);
    } catch (err) {
      dispatch(setError('Failed to open chat'));
    }
  };

  const handleAdvanceStatus = async (order: Order) => {
    const target = nextStatus(order.status);
    if (!target) return;
    try {
      setAdvancing(order._id);
      await dispatch(updateOrderStatus({ orderId: order._id, status: target })).unwrap();
    } catch (err: any) {
      console.error('Advance status error:', err);
      dispatch(setError(err?.message || 'Failed to update order status'));
    } finally {
      setAdvancing(null);
    }
  };

  const handleConfirmItem = async (orderId: string, itemId: string) => {
    try {
      setConfirmingItem(itemId);
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/clothing-items/${itemId}/confirm`,
        { confirmed: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dispatch(fetchProviderOrders({ includeAvailable: true }));
      } else {
        dispatch(setError('Failed to confirm clothing item'));
      }
    } catch (err: any) {
      console.error('Confirm clothing item error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to confirm clothing item'));
    } finally {
      setConfirmingItem(null);
    }
  };


  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM dd, yyyy hh:mm a');

  const getActionButtons = (order: Order) => {
    const buttons: React.ReactNode[] = [];

    // Chat
    buttons.push(
      <Button
        key="chat"
        size="small"
        variant="outlined"
        onClick={() => handleViewChat(order)}
        startIcon={<ChatIcon />}
        sx={{
          mb: 1,
          minWidth: 'fit-content',
          whiteSpace: 'nowrap'
        }}
      >
        Chat
      </Button>
    );

    // Cash payment confirmation button for providers
    if (order.payment?.status === 'pending' && order.payment?.paymentMethod === 'cash') {
      buttons.push(
        <Button
          key="confirm-payment"
          size="small"
          variant="contained"
          color="primary"
          onClick={() => handleConfirmPayment(order)}
          startIcon={<CheckCircleIcon />}
          disabled={confirming === order._id}
          sx={{
            mb: 1,
            minWidth: 'fit-content',
            whiteSpace: 'nowrap'
          }}
        >
          {confirming === order._id ? 'Confirming...' : 'Payment Made'}
        </Button>
      );
    }

    // Self-assign if not assigned yet
    if (!order.serviceProvider && ['pending', 'confirmed'].includes(order.status)) {
      buttons.push(
        <Button
          key="assign-self"
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => handleSelfAssign(order)
          }
          sx={{
            mb: 1,
            minWidth: 'fit-content',
            whiteSpace: 'nowrap'
          }}
        >
          Assign to Me
        </Button>
      );
    }

    // Advance Status
    const next = nextStatus(order.status);
    if (next) {
      const label = nextStatusButtonLabel(next);
      // Hide any generic "Assign" advance button; rely on "Assign to Me" only
      if (label !== 'Assign') {
        buttons.push(
          <Button
            key="advance-status"
            size="small"
            variant="outlined"
            onClick={() => handleAdvanceStatus(order)}
            disabled={advancing === order._id}
            sx={{
              mb: 1,
              minWidth: 'fit-content',
              whiteSpace: 'nowrap'
            }}
          >
            {advancing === order._id ? 'Updating...' : label}
          </Button>
        );
      }
    }

    // Cancel Order (provider side) - only when order is not completed/cancelled
    // Require that the order is assigned to the current provider to enable cancel
    const isAssignedToMe = order.serviceProvider && (order.serviceProvider as any)._id === authUser?.id;
    if (!['completed', 'cancelled'].includes(order.status) && isAssignedToMe) {
      buttons.push(
        <Button
          key="cancel-order"
          size="small"
          variant="outlined"
          color="error"
          onClick={() => dispatch(updateOrderStatus({ orderId: order._id, status: 'cancelled' }) as any)}
          sx={{
            mb: 1,
            minWidth: 'fit-content',
            whiteSpace: 'nowrap'
          }}
        >
          Cancel Order
        </Button>
      );
    }

    return buttons.length > 0 ? buttons : null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button
            onClick={() => dispatch(fetchProviderOrders({ includeAvailable: true }))}
            sx={{ ml: 2 }}
            variant="outlined"
            size="small"
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  // Derived data for stats and filtering
  const assignedOrders = orders.filter((o: any) => {
    const providerId = o.serviceProvider?._id || o.serviceProvider;
    const userId = authUser?.id;
    return !!o.serviceProvider && providerId === userId;
  });
  const availableOrders = orders.filter((o: any) => !o.serviceProvider && ['pending', 'confirmed'].includes(o.status));

  const filteredAssigned = filterStatus === 'all'
    ? assignedOrders
    : assignedOrders.filter((o: any) => o.status === filterStatus);

  const stats = {
    total: assignedOrders.length,
    pending: assignedOrders.filter((o: any) => o.status === 'pending').length,
    inProgress: assignedOrders.filter((o: any) => o.status === 'in_progress').length,
    completed: assignedOrders.filter((o: any) => o.status === 'completed').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 0 }}>
          My Orders
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filter-status-label">Filter by Status</InputLabel>
          <Select
            labelId="filter-status-label"
            id="filter-status"
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="ready_for_pickup">Ready for Pickup</MenuItem>
            <MenuItem value="picked_up">Picked Up</MenuItem>
            <MenuItem value="ready_for_delivery">Ready for Delivery</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 14px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 14px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 14px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" color="primary.main">{stats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 14px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Available (Unassigned) Orders for Self-Assignment */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Orders (Unassigned)
        </Typography>
        {availableOrders.length === 0 ? (
          <Typography color="text.secondary">No available orders at the moment.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {availableOrders.map((od: any) => {
              const order = formatOrderForDisplay(od);
              return (
                <Card key={`avail-${order._id}`} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 10px)' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>#{order.orderNumber}</Typography>
                      <Chip
                        label={statusLabels[order.status] || order.status}
                        size="small"
                        color={statusColors[order.status] || 'default'}
                        sx={{
                          minWidth: 'fit-content',
                          '& .MuiChip-label': {
                            whiteSpace: 'nowrap',
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Customer: {order.customer.firstName} {order.customer.lastName}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Total: {order.formattedTotal}
                    </Typography>
                    <Button variant="outlined" color="secondary" onClick={() => handleSelfAssign(order)}>
                      Accept 
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Paper>

      <Divider sx={{ mb: 2 }} />

      {/* Assigned Orders List (filtered) */}
      {filteredAssigned.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" color="text.secondary">
            No orders found for selected filter
          </Typography>
          <Button
            onClick={() => dispatch(fetchProviderOrders({ includeAvailable: true }))}
            sx={{ mt: 2 }}
            variant="outlined"
            color="primary"
          >
            Refresh
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'flex-start',
          }}
        >
          {filteredAssigned.map((orderData: any) => {
            const order = formatOrderForDisplay(orderData);
            return (
            <Box
              key={order._id}
              sx={{
                width: {
                  xs: '100%',
                  sm: 'calc(50% - 12px)',
                  md: 'calc(33.33% - 16px)',
                  lg: 'calc(25% - 18px)',
                },
                minWidth: '300px',
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" color="primary" sx={{ minWidth: 'fit-content' }}>
                      #{order.orderNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end', flex: 1 }}>
                      <Chip
                        label={statusLabels[order.status] || order.status}
                        color={statusColors[order.status] || 'default'}
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
                      <Chip
                        label={paymentStatusLabels[order.payment.status] || order.payment.status}
                        color={paymentStatusColors[order.payment.status] || 'default'}
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
                    {order.serviceProvider
                      ? `Provider: ${order.serviceProvider.firstName} ${order.serviceProvider.lastName}`
                      : 'Provider: Not assigned'}
                  </Typography>

                  <Typography variant="subtitle1" gutterBottom>
                    Customer: {order.customer.firstName} {order.customer.lastName}
                  </Typography>

                  <Typography component="div" variant="body2" color="text.secondary" gutterBottom>
                    {/* Show individual items if available, otherwise show service summary */}
                    {order.items.some(item => item.clothingItems && item.clothingItems.length > 0) ? (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Individual Items:
                        </Typography>
                        {order.items.map((item) =>
                          item.clothingItems?.map((clothingItem) => (
                            <Box key={clothingItem.itemId} sx={{ ml: 1, mb: 0.5 }}>
                              <Typography variant="body2" component="span">• </Typography>
                              <Typography variant="body2" component="span" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}><strong>{clothingItem.itemId}</strong>: {clothingItem.description} </Typography>
                              <Typography variant="body2" component="span" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>({clothingItem.serviceName}) - ¢{clothingItem.unitPrice.toFixed(2)}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={clothingItem.isConfirmed ? 'Received ✓' : 'Pending Receipt'}
                                  size="small"
                                  color={clothingItem.isConfirmed ? 'success' : 'warning'}
                                  variant={clothingItem.isConfirmed ? 'filled' : 'outlined'}
                                />
                                {order.serviceProvider && !clothingItem.isConfirmed && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleConfirmItem(order._id, clothingItem.itemId)}
                                    disabled={confirmingItem === clothingItem.itemId}
                                    sx={{ fontSize: '0.7rem', py: 0.3, px: 1.5 }}
                                  >
                                    {confirmingItem === clothingItem.itemId ? 'Confirming...' : 'Confirm'}
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          ))
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" component="span">Services: </Typography>
                        <Typography variant="body2" component="span" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {order.items.map((item) => `${item.serviceName} (${item.quantity})`).join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Typography>

                  <Typography variant="h6" color="primary" gutterBottom>
                    Total: {order.formattedTotal}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created: {formatDate(order.createdAt)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Delivery: {formatDate(order.deliveryDate)}
                  </Typography>

                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {getActionButtons(order)}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ProviderOrders;
