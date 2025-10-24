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
  TablePagination,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  Clear as ClearIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchPaymentHistory,
  fetchPaymentStats,
  exportPaymentHistory,
  fetchPaymentReceipt,
} from '../features/payment/paymentSlice';

// Status and method configurations
const paymentStatuses = [
  { value: 'all', label: 'All Statuses', color: 'default' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'processing', label: 'Processing', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
];

const paymentMethods = [
  { value: 'all', label: 'All Methods' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'digital_wallet', label: 'Digital Wallet' },
  { value: 'momo', label: 'Mobile Money (Legacy)' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'amount', label: 'Amount' },
  { value: 'status', label: 'Status' },
  { value: 'paymentMethod', label: 'Payment Method' },
];

const PaymentHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    paymentHistory, 
    paymentStats, 
    selectedPayment,
  } = useAppSelector((state) => state.payment);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Filter states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dialog states
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
    loadPaymentStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, status, paymentMethod, startDate, endDate, sortBy, sortOrder]);

  const loadPaymentHistory = () => {
    const params: any = {
      page: page + 1,
      limit: rowsPerPage,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    if (paymentMethod !== 'all') params.paymentMethod = paymentMethod;
    if (startDate) params.startDate = startOfDay(startDate).toISOString();
    if (endDate) params.endDate = endOfDay(endDate).toISOString();

    dispatch(fetchPaymentHistory(params));
  };

  const loadPaymentStats = () => {
    const params: any = {};
    if (startDate) params.startDate = startOfDay(startDate).toISOString();
    if (endDate) params.endDate = endOfDay(endDate).toISOString();

    dispatch(fetchPaymentStats(params));
  };

  // Call Paystack status for all pending/processing payments in current page
  const syncPendingWithPaystack = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { Authorization: `Bearer ${token}` };
      const pending = (paymentHistory.data || []).filter((p: any) => ['pending', 'processing'].includes((p.status || '').toLowerCase()) && p.reference);
      // sequential requests to avoid rate limits; can be parallel if needed
      for (const p of pending) {
        await fetch(`${(window as any).API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/paystack/status/${p.reference}`, {
          headers,
        });
      }
      // reload after syncing
      loadPaymentHistory();
      loadPaymentStats();
    } catch (e) {
      console.error('Sync with Paystack failed:', e);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleViewReceipt = async (paymentId: string) => {
    await dispatch(fetchPaymentReceipt(paymentId));
    setReceiptDialog(true);
  };

  const handleDownloadReceipt = () => {
    if (!selectedPayment) return;

    // Create receipt content
    const receiptContent = `
PAYMENT RECEIPT
================

Transaction Details:
-------------------
Transaction ID: ${selectedPayment.payment?.transactionId || selectedPayment.payment?._id?.slice(-8) || 'N/A'}
Amount: ${selectedPayment.payment?.formattedAmount || 'N/A'}
Status: ${selectedPayment.payment?.status || 'N/A'}
Payment Method: ${selectedPayment.payment?.paymentMethod || 'N/A'}
Date: ${selectedPayment.payment?.createdAt ? formatDate(selectedPayment.payment.createdAt) : 'N/A'}

${selectedPayment.order ? `
Order Information:
-----------------
Order Number: ${selectedPayment.order.orderNumber || 'N/A'}
Order Status: ${selectedPayment.order.status || 'N/A'}
Items: ${selectedPayment.order.items?.length || 0} item(s)
` : ''}

${selectedPayment.customer ? `
Customer Information:
--------------------
Name: ${selectedPayment.customer.name || 'N/A'}
Email: ${selectedPayment.customer.email || 'N/A'}
Phone: ${selectedPayment.customer.phone || 'N/A'}
` : ''}

Generated on: ${new Date().toLocaleString()}
================
Thank you for your business!
    `.trim();

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const transactionId = selectedPayment.payment?.transactionId || selectedPayment.payment?._id?.slice(-8) || 'receipt';
    link.download = `receipt-${transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (formatType: 'csv' | 'json' = 'csv') => {
    const params: any = { format: formatType };
    if (status !== 'all') params.status = status;
    if (paymentMethod !== 'all') params.paymentMethod = paymentMethod;
    if (startDate) params.startDate = startOfDay(startDate).toISOString();
    if (endDate) params.endDate = endOfDay(endDate).toISOString();

    try {
      const result = await dispatch(exportPaymentHistory(params));
      if (formatType === 'csv' && result.payload instanceof Blob) {
        const url = window.URL.createObjectURL(result.payload);
        const link = document.createElement('a');
        link.href = url;
        const ymd = new Date().toISOString().slice(0, 10);
        link.download = `payment-history-${ymd}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      setExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const applyQuickFilter = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setPaymentMethod('all');
    setStartDate(null);
    setEndDate(null);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(0);
  };

  const getStatusColor = (s: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const statusConfig = paymentStatuses.find(ps => ps.value === s);
    return (statusConfig?.color as any) || 'default';
  };

  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  const formatCurrency = (amount: number) => `¢${amount.toFixed(2)}`;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" color="primary">
          Payment History
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadPaymentHistory} disabled={paymentHistory.loading} fullWidth={isMobile}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<SyncIcon />} onClick={syncPendingWithPaystack} disabled={paymentHistory.loading} fullWidth={isMobile}>
            Sync with Paystack
          </Button>
          <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setFilterDialog(true)} fullWidth={isMobile}>
            Filters
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => setExportDialog(true)} fullWidth={isMobile}>
            Export
          </Button>
        </Stack>
      </Box>


      {/* Search and Quick Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 280px', minWidth: 280 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by transaction ID, order number, or notes..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearch('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 240px', minWidth: 240, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => applyQuickFilter(7)}>Last 7 days</Button>
              <Button size="small" onClick={() => applyQuickFilter(30)}>Last 30 days</Button>
              <Button size="small" onClick={() => applyQuickFilter(90)}>Last 90 days</Button>
              <Button size="small" onClick={clearFilters} color="secondary">Clear All</Button>
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <Paper>
        {paymentHistory.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : paymentHistory.error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {paymentHistory.error}
          </Alert>
        ) : (
          <>
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Channel</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Gateway Resp</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Ref</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.data.map((payment) => (
                    <TableRow key={payment._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {payment.transactionId || payment.paymentDetails?.transactionRef || payment._id.slice(-8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {payment.orderInfo && (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {payment.orderInfo.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {payment.orderInfo.itemCount} item(s)
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {payment.formattedAmount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={payment.paymentMethod.replace('_', ' ').toUpperCase()} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={payment.status.toUpperCase()} color={getStatusColor(payment.status)} size="small" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2">{payment.paystackData?.channel || '-'}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Typography variant="body2" noWrap maxWidth={160} title={payment.paystackData?.gateway_response || ''}>
                          {payment.paystackData?.gateway_response || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" fontFamily="monospace">{payment.reference || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(payment.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Receipt">
                          <span>
                            <IconButton size="small" onClick={() => handleViewReceipt(payment._id)} disabled={payment.status !== 'completed'}>
                              <ReceiptIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {paymentHistory.pagination && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={paymentHistory.pagination.total || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </>
        )}
      </Paper>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
                {paymentStatuses.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method">
                {paymentMethods.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort By">
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sort Order</InputLabel>
              <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} label="Sort Order">
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters}>Clear All</Button>
          <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
          <Button onClick={() => setFilterDialog(false)} variant="contained">Apply Filters</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} fullScreen={isMobile}>
        <DialogTitle>Export Payment History</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Export your payment history data in the selected format.
          </Typography>
          <Stack spacing={2}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')} fullWidth>
              Export as CSV
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('json')} fullWidth>
              Export as JSON
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onClose={() => setReceiptDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
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
                  <Typography><strong>Date:</strong> {selectedPayment.payment?.createdAt && formatDate(selectedPayment.payment.createdAt)}</Typography>
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
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReceipt}
            disabled={!selectedPayment}
          >
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistory;
