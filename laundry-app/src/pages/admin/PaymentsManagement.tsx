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
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  method: 'momo' | 'card' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const PaymentsManagement: React.FC = () => {
  const { canManagePayments } = usePermissions();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // Fetch real payments data from API
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { API_BASE_URL } = await import('../../services/api');
        const response = await fetch(`${API_BASE_URL}/payments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch payments');
        }

        const data = await response.json();
        // Ensure payments is always an array
        const paymentsArray = Array.isArray(data) ? data : (data.payments || data.data || []);
        setPayments(paymentsArray);
      } catch (error) {
        console.error('Payments fetch error:', error);
        setError('Failed to load payments');
        setPayments([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const { API_BASE_URL } = await import('../../services/api');
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve payment');
      }

      const updatedPayment = await response.json();
      // Ensure payments is always an array
      const paymentsArray = Array.isArray(payments) ? payments : [];
      setPayments(paymentsArray.map(payment => 
        payment.id === paymentId ? updatedPayment : payment
      ));
      setError(null);
    } catch (err) {
      setError('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { API_BASE_URL } = await import('../../services/api');
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject payment');
      }

      const updatedPayment = await response.json();
      // Ensure payments is always an array
      const paymentsArray = Array.isArray(payments) ? payments : [];
      setPayments(paymentsArray.map(payment => 
        payment.id === paymentId ? updatedPayment : payment
      ));
      setError(null);
    } catch (err) {
      setError('Failed to reject payment');
    }
  };

  const handleRefundPayment = async (paymentId: string) => {
    if (window.confirm('Are you sure you want to refund this payment?')) {
      try {
        const { API_BASE_URL } = await import('../../services/api');
        const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/refund`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to refund payment');
        }

        const updatedPayment = await response.json();
        // Ensure payments is always an array
        const paymentsArray = Array.isArray(payments) ? payments : [];
        setPayments(paymentsArray.map(payment => 
          payment.id === paymentId ? updatedPayment : payment
        ));
        setError(null);
      } catch (err) {
        setError('Failed to refund payment');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'default';
      default: return 'default';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'momo': return 'primary';
      case 'card': return 'secondary';
      case 'cash': return 'warning';
      default: return 'default';
    }
  };

  // Ensure payments is always an array before filtering
  const paymentsArray = Array.isArray(payments) ? payments : [];
  const filteredPayments = paymentsArray.filter(payment => {
    const statusMatch = filterStatus === 'all' || payment.status === filterStatus;
    const methodMatch = filterMethod === 'all' || payment.method === filterMethod;
    return statusMatch && methodMatch;
  });

  const totalRevenue = paymentsArray
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = paymentsArray
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (!canManagePayments()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to manage payments.
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Payments Management
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
                Total Revenue
              </Typography>
              <Typography variant="h4" color="success.main">
                ¢{totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Amount
              </Typography>
              <Typography variant="h4" color="warning.main">
                ¢{pendingAmount.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h4">
                {paymentsArray.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4" color="success.main">
                {((paymentsArray.filter(p => p.status === 'completed').length / paymentsArray.length) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Method</InputLabel>
          <Select
            value={filterMethod}
            label="Filter by Method"
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <MenuItem value="all">All Methods</MenuItem>
            <MenuItem value="momo">Mobile Money</MenuItem>
            <MenuItem value="card">Card</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {filteredPayments.map((payment) => (
          <Box key={payment.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 18px)' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    #{payment.id}
                  </Typography>
                  <Chip
                    label={payment.status}
                    color={getStatusColor(payment.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="subtitle1" gutterBottom>
                  {payment.customerName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Order: #{payment.orderId}
                </Typography>
                
                <Typography variant="h6" color="primary" gutterBottom>
                  ¢{payment.amount.toFixed(2)}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={payment.method.toUpperCase()}
                    color={getMethodColor(payment.method)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {payment.transactionId && (
                    <Typography variant="body2" color="text.secondary">
                      TXN: {payment.transactionId.slice(-8)}
                    </Typography>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(payment.createdAt).toLocaleDateString()}
                </Typography>
                
                {payment.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Note: {payment.notes}
                  </Typography>
                )}
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 1 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewPayment(payment)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  {payment.status === 'pending' && (
                    <Tooltip title="Approve Payment">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleApprovePayment(payment.id)}
                      >
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {payment.status === 'pending' && (
                    <Tooltip title="Reject Payment">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRejectPayment(payment.id)}
                      >
                        <RejectIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {payment.status === 'completed' && (
                    <Tooltip title="Issue Refund">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleRefundPayment(payment.id)}
                      >
                        <ReceiptIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Payment Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Payment Details #{selectedPayment?.id}
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              <Typography>Order ID: #{selectedPayment.orderId}</Typography>
              <Typography>Customer: {selectedPayment.customerName}</Typography>
              <Typography>Amount: ¢{selectedPayment.amount.toFixed(2)}</Typography>
              <Typography>Method: {selectedPayment.method.toUpperCase()}</Typography>
              <Typography>Status: {selectedPayment.status}</Typography>
              {selectedPayment.transactionId && (
                <Typography>Transaction ID: {selectedPayment.transactionId}</Typography>
              )}
              {selectedPayment.notes && (
                <Typography>Notes: {selectedPayment.notes}</Typography>
              )}
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Timestamps
              </Typography>
              <Typography>Created: {new Date(selectedPayment.createdAt).toLocaleString()}</Typography>
              <Typography>Updated: {new Date(selectedPayment.updatedAt).toLocaleString()}</Typography>
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

export default PaymentsManagement; 