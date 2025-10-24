// src/pages/Orders.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../app/store';
import { shallowEqual } from 'react-redux';

import { Order } from '../types/order';
import {
  statusColors,
  paymentStatusColors,
  statusLabels,
  paymentStatusLabels
} from '../types/order';
import { formatOrderForDisplay } from '../utils/typeUtils';
import PaystackPayment from '../components/PaystackPayment';

// Use thunks from the central slice instead of local ones
import { fetchOrdersByRole, setError } from '../features/orders/orderSlice';
 

const Orders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders || { orders: [], loading: false, error: null }, shallowEqual);
  const [showPaystackDialog, setShowPaystackDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const navigate = useNavigate();

  // Prefer Redux auth user; safely fallback to localStorage
  const authUser = useSelector((state: RootState) => (state as any)?.auth?.user);
  const safeLocalUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {} as any;
    }
  }, []);
  const customerEmail = authUser?.email || safeLocalUser?.email || '';
  const customerName = `${authUser?.firstName || safeLocalUser?.firstName || ''} ${authUser?.lastName || safeLocalUser?.lastName || ''}`.trim();

  useEffect(() => {
    dispatch(fetchOrdersByRole('customer'));
  }, [dispatch]);

  const handlePayNow = (order: Order) => {
    setSelectedOrder(order);
    setShowPaystackDialog(true);
  };

  // Handle successful payment
  const handlePaymentSuccess = async (reference: string) => {
    setPaymentProcessing(false);
    setShowPaystackDialog(false);
    
    // Refresh orders to show updated payment status
    dispatch(fetchOrdersByRole('customer'));
    
    alert('Payment completed successfully! Your order is now confirmed.');
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentProcessing(false);
    console.error('Payment error:', error);
    dispatch(setError(`Payment failed: ${error}`));
  };

  // Handle payment dialog close
  const handlePaymentDialogClose = () => {
    if (!paymentProcessing) {
      setShowPaystackDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const getActionButtons = (order: Order) => {
    const paymentStatus = (order.payment?.status || 'pending').toLowerCase();
    const orderStatus = (order.status || '').toLowerCase();
    const paymentMethod = (order.payment?.paymentMethod || 'cash') as string;

    // Show Pay Now if order is active and payment not completed
    // Only for electronic payment methods (not cash)
    const canPay = !['cancelled', 'completed'].includes(orderStatus)
      && !['completed'].includes(paymentStatus)
      && paymentMethod !== 'cash'
      && ['momo', 'mobile_money', 'credit_card', 'debit_card'].includes(paymentMethod);

    if (canPay) {
      const buttonText = paymentStatus === 'failed' ? 'Retry Payment' : 'Pay Now';
      const buttonColor = paymentStatus === 'failed' ? 'warning' : 'primary';
      
      return (
        <Button
          size="small"
          variant="contained"
          color={buttonColor}
          onClick={() => handlePayNow(order)}
          startIcon={<CheckCircleIcon />}
          sx={{ mb: 1 }}
        >
          {buttonText}
        </Button>
      );
    }
    return null;
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
            onClick={() => dispatch(fetchOrdersByRole('customer'))}
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" color="text.secondary">
            No orders available
          </Typography>
          <Button
            onClick={() => dispatch(fetchOrdersByRole('customer'))}
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
          {orders.map((orderData) => {
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" color="primary">
                      #{order.orderNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={statusLabels[order.status] || order.status}
                        color={statusColors[order.status] || 'default'}
                        size="small"
                        sx={{ maxWidth: '100%', whiteSpace: 'normal' }}
                      />
                      <Chip
                        label={paymentStatusLabels[order.payment.status] || order.payment.status}
                        color={paymentStatusColors[order.payment.status] || 'default'}
                        size="small"
                        sx={{ maxWidth: '100%', whiteSpace: 'normal' }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" gutterBottom sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {order.serviceProvider
                      ? `Provider: ${order.serviceProvider.firstName} ${order.serviceProvider.lastName}`
                      : 'Provider: Not assigned'}
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

                  <Stack spacing={1}>
                    {getActionButtons(order)}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            );
          })}
        </Box>
      )}

      {/* Paystack Payment Dialog */}
      {showPaystackDialog && selectedOrder && (
        <PaystackPayment
          open={showPaystackDialog}
          onClose={handlePaymentDialogClose}
          orderId={selectedOrder._id}
          amount={selectedOrder.totalAmount}
          customerEmail={customerEmail}
          customerName={customerName}
          defaultMomoPhone={(selectedOrder.payment?.paymentDetails?.phoneNumber || selectedOrder.customer?.phoneNumber || '') as string}
          defaultMomoProvider={(() => {
            const p = (selectedOrder.payment?.paymentDetails?.momoNetwork || '').toLowerCase();
            return (p === 'mtn' || p === 'vodafone' || p === 'airteltigo') ? (p as 'mtn' | 'vodafone' | 'airteltigo') : 'mtn';
          })()}
          autoStart={Boolean(selectedOrder.payment?.paymentDetails?.phoneNumber || selectedOrder.customer?.phoneNumber)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </Box>
  );
};

export default Orders;
