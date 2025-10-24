import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchPaymentHistory, fetchPaymentReceipt } from '../../features/payment/paymentSlice';

interface EarningHistory {
  _id: string;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  items: Array<{
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  completedEarnings: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  history: EarningHistory[];
}

const ProviderEarnings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { paymentHistory, selectedPayment } = useAppSelector((state) => state.payment);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedEarnings: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchEarnings();
  }, []);

  useEffect(() => {
    // Load provider's payment history
    dispatch(fetchPaymentHistory({ page: page + 1, limit: rowsPerPage }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Fetch orders assigned to this provider
      const response = await axios.get(
        `${API_BASE_URL}/orders?role=service_provider&include_available=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const orders = response.data.data.docs || response.data.data;
        console.log('Orders for earnings:', orders);

        // Calculate earnings
        let totalEarnings = 0;
        let pendingEarnings = 0;
        let completedEarnings = 0;
        let completedOrders = 0;
        let pendingOrders = 0;

        const earningHistory: EarningHistory[] = orders.map((order: any) => {
          const amount = order.totalAmount;
          const paymentStatus = order.payment?.status || 'pending';
          
          if (paymentStatus === 'completed') {
            completedEarnings += amount;
            completedOrders++;
          } else if (['pending', 'processing'].includes(paymentStatus)) {
            pendingEarnings += amount;
            pendingOrders++;
          }

          return {
            _id: order._id,
            orderNumber: order.orderNumber,
            customer: order.customer,
            items: order.items,
            totalAmount: amount,
            status: paymentStatus,
            createdAt: order.createdAt,
            completedAt: paymentStatus === 'completed' ? (order.payment?.completedAt || order.updatedAt) : undefined
          };
        });

        totalEarnings = completedEarnings + pendingEarnings;
        setEarnings({
          totalEarnings,
          pendingEarnings,
          completedEarnings,
          totalOrders: orders.length,
          completedOrders,
          pendingOrders,
          history: earningHistory
        });
      } else {
        setError('Failed to fetch earnings data');
      }
    } catch (err: any) {
      console.error('Fetch earnings error:', err);
      setError(err.response?.data?.error || 'Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(2)}`;

  const handleViewReceipt = async (paymentId: string) => {
    await dispatch(fetchPaymentReceipt(paymentId));
    setReceiptDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Earnings Overview
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h4">
              ¢{earnings.totalEarnings.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              Total Earnings
            </Typography>
            <Typography variant="body2">
              {earnings.totalOrders} orders
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Typography variant="h4">
              ¢{earnings.completedEarnings.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              Completed Earnings
            </Typography>
            <Typography variant="body2">
              {earnings.completedOrders} completed payments
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Typography variant="h4">
              ¢{earnings.pendingEarnings.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              Pending Earnings
            </Typography>
            <Typography variant="body2">
              {earnings.pendingOrders} pending payments
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Earnings History */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Earnings History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {earnings.history.length > 0 ? (
                earnings.history.map((earning) => (
                  <TableRow key={earning._id}>
                    <TableCell>{earning.orderNumber}</TableCell>
                    <TableCell>
                      {`${earning.customer.firstName} ${earning.customer.lastName}`}
                    </TableCell>
                    <TableCell>
                      {earning.items.map((item, index) => (
                        <div key={index}>
                          {item.serviceName} (x{item.quantity})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        ¢{earning.totalAmount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={earning.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(earning.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(earning.completedAt || earning.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                      No earnings history available. Start taking orders to see your earnings!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>


      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onClose={() => setReceiptDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payment Receipt</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Payment Information</Typography>
                  <Typography><strong>Transaction ID:</strong> {selectedPayment.payment?.transactionId}</Typography>
                  <Typography><strong>Amount:</strong> {selectedPayment.payment?.formattedAmount}</Typography>
                  <Typography><strong>Status:</strong> {selectedPayment.payment?.status}</Typography>
                  <Typography><strong>Method:</strong> {selectedPayment.payment?.paymentMethod}</Typography>
                  <Typography><strong>Date:</strong> {selectedPayment.payment?.createdAt && formatDateTime(selectedPayment.payment.createdAt)}</Typography>
                </Box>
                {selectedPayment.order && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Order Information</Typography>
                    <Typography><strong>Order Number:</strong> {selectedPayment.order.orderNumber}</Typography>
                    <Typography><strong>Status:</strong> {selectedPayment.order.status}</Typography>
                    <Typography><strong>Items:</strong> {selectedPayment.order.items?.length || 0} item(s)</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Typography><strong>Name:</strong> {selectedPayment.customer?.name}</Typography>
                  <Typography><strong>Email:</strong> {selectedPayment.customer?.email}</Typography>
                  <Typography><strong>Phone:</strong> {selectedPayment.customer?.phone}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProviderEarnings;
