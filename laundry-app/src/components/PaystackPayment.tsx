import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import { PaystackButton } from 'react-paystack';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useAppSelector } from '../app/hooks';

interface PaystackPaymentProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  // Optional defaults from order to avoid retyping
  defaultMomoPhone?: string;
  defaultMomoProvider?: 'mtn' | 'vodafone' | 'airteltigo';
  // If true, auto-initialize and redirect once config + valid phone are present
  autoStart?: boolean;
  onPaymentSuccess: (reference: string) => void;
  onPaymentError: (error: string) => void;
}

interface PaystackConfig {
  publicKey: string;
  isTestMode: boolean;
}

interface PaymentData {
  reference: string;
  authorization_url: string;
  access_code: string;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  open,
  onClose,
  orderId,
  amount,
  customerEmail,
  customerName,
  defaultMomoPhone,
  defaultMomoProvider = 'mtn',
  autoStart = false,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [config, setConfig] = useState<PaystackConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod] = useState<'card' | 'mobile_money'>('mobile_money'); // locked to MoMo
  const [momoPhone, setMomoPhone] = useState(defaultMomoPhone || '');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'vodafone' | 'airteltigo'>(defaultMomoProvider || 'mtn');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Pull email from auth as a fallback if prop not provided
  const authUser = useAppSelector((s) => (s as any).auth?.user);
  const authEmail = (authUser?.email || '').trim();

  const toMessage = (e: any, fallback: string) => {
    if (!e) return fallback;
    if (typeof e === 'string') return e;
    if (e?.message && typeof e.message === 'string') return e.message;
    if (e?.error && typeof e.error === 'string') return e.error;
    if (e?.response?.data?.error && typeof e.response.data.error === 'string') return e.response.data.error;
    try { return JSON.stringify(e); } catch { return fallback; }
  };

  // Fetch Paystack configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/paystack/config`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setConfig(response.data.data);
        } else {
          setError('Failed to load payment configuration');
        }
      } catch (err: any) {
        console.error('Config fetch error:', err);
        setError(toMessage(err, 'Failed to load payment configuration'));
      }
    };

    if (open) {
      fetchConfig();
    }
  }, [open]);

  // Auto-start flow: after config loads and we have a valid momoPhone, initialize automatically
  useEffect(() => {
    if (!open || !autoStart || !config) return;
    if (!momoPhone) return;
    if (!validateMoMoInput()) return;
    // Prevent double init
    if (!paymentData && !isInitializing) {
      initializePayment();
    }
  }, [open, autoStart, config, momoPhone]);

  // Clean phone number for Ghana format
  const cleanPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[\s-+()]/g, '');
    
    // Handle Ghana numbers
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    } else if (!cleaned.startsWith('233')) {
      cleaned = '233' + cleaned;
    }
    
    return cleaned;
  };

  // Initialize payment with backend
  const initializePayment = async () => {
    if (!config) {
      setError('Payment configuration not loaded');
      return;
    }

    if (!orderId) {
      setError('Order ID is required');
      return;
    }

    const email = (customerEmail || authEmail || '').trim();
    if (!email) {
      setError('Customer email is required');
      return;
    }

    if (amount <= 0) {
      setError('Invalid payment amount');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const paymentPayload = {
        paymentMethod: 'mobile_money',
        amount: amount,
        customerEmail: email,
        customerName: customerName,
        momoPhone: cleanPhoneNumber(momoPhone),
        momoProvider: momoProvider
      };

      console.log('🔍 Payment initialization payload:', paymentPayload);
      console.log('🔍 Order ID:', orderId);
      console.log('🔍 API URL:', `${API_BASE_URL}/paystack/initialize/${orderId}`);

      const response = await axios.post(
        `${API_BASE_URL}/paystack/initialize/${orderId}`,
        paymentPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('🔍 Payment initialization response:', response.data);

      if (response.data.success) {
        setPaymentData(response.data.data.paystack);
      } else {
        setError(toMessage(response.data?.error, 'Failed to initialize payment'));
      }
    } catch (err: any) {
      console.error('Payment initialization error:', err);

      // More specific error handling
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const errorData = err.response.data;

        console.log('🔍 Error response status:', status);
        console.log('🔍 Error response data:', errorData);

        if (status === 400) {
          setError(toMessage(errorData?.error, 'Invalid payment data. Please check your inputs.'));
        } else if (status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (status === 404) {
          setError('Order not found. Please refresh and try again.');
        } else if (status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(toMessage(errorData?.error, `Payment initialization failed (${status})`));
        }
      } else if (err.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setError(toMessage(err, 'Failed to initialize payment'));
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle successful payment
  const handlePaystackSuccess = async (reference: string) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/paystack/verify/${reference}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onPaymentSuccess(reference);
      } else {
        onPaymentError(toMessage(response.data?.error, 'Payment verification failed'));
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      onPaymentError(toMessage(err, 'Payment verification failed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle payment close/cancel
  const handlePaystackClose = () => {
    setError('Payment was cancelled');
  };

  // Poll Paystack status to auto-update after redirect
  useEffect(() => {
    let interval: any;
    const pollStatus = async () => {
      try {
        if (!paymentData?.reference) return;
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/paystack/status/${paymentData.reference}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const status = res.data?.data?.payment?.status;
        if (status === 'completed') {
          clearInterval(interval);
          onPaymentSuccess(paymentData.reference);
        } else if (status === 'failed') {
          clearInterval(interval);
          onPaymentError('Payment failed');
        }
      } catch (e) {
        // ignore temporary network errors during polling
      }
    };

    if (open && paymentData?.reference) {
      interval = setInterval(pollStatus, 5000); // poll every 5s
    }
    return () => interval && clearInterval(interval);
  }, [open, paymentData?.reference]);

  // Validate mobile money input
  const validateMoMoInput = (): boolean => {
    if (paymentMethod === 'mobile_money') {
      if (!momoPhone.trim()) {
        setError('Please enter your mobile money phone number');
        return false;
      }

      const cleaned = cleanPhoneNumber(momoPhone);
      console.log('🔍 Cleaned phone number:', cleaned);

      // More flexible validation for Ghana numbers
      if (cleaned.length < 10 || cleaned.length > 15) {
        setError('Please enter a valid phone number (e.g., 0242000000)');
        return false;
      }

      // Check if it's a valid Ghana number format
      const ghanaPattern = /^233[0-9]{9}$|^0[0-9]{9}$/;
      if (!ghanaPattern.test(cleaned) && !ghanaPattern.test(momoPhone.replace(/[\s-+()]/g, ''))) {
        setError('Please enter a valid Ghana phone number (e.g., 0242000000 or 0552000000)');
        return false;
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateMoMoInput()) return;
    initializePayment();
  };

  const paystackProps = {
    email: (customerEmail || authEmail || '').trim(),
    amount: Math.round(amount * 100), // Convert to kobo/pesewas
    currency: 'GHS',
    reference: paymentData?.reference || '',
    publicKey: config?.publicKey || '',
    text: `Pay ¢${amount.toFixed(2)}`,
    onSuccess: (reference: any) => handlePaystackSuccess(reference.reference),
    onClose: handlePaystackClose,
    channels: ['mobile_money'], // Restrict to MoMo only
    ...(momoPhone && {
      mobile_money: {
        phone: cleanPhoneNumber(momoPhone),
        provider: momoProvider
      }
    }),
    metadata: {
      custom_fields: [
        {
          display_name: 'Customer Name',
          variable_name: 'customer_name',
          value: customerName
        },
        {
          display_name: 'Order ID',
          variable_name: 'order_id',
          value: orderId
        }
      ]
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Complete Payment</Typography>
          {config?.isTestMode && (
            <Chip label="TEST MODE" color="warning" size="small" />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {config?.isTestMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Test Mode:</strong> Use test credentials for mobile money:
              <br />• Phone: 0552000001 or 0242000001
              <br />• Any valid Ghana number format works in test mode
            </Typography>
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography>Total Amount:</Typography>
              <Typography variant="h6" color="primary">
                ¢{amount.toFixed(2)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Customer: {customerName}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
          Payment Method
        </Typography>

        {/* Locked to MoMo only */}
        <RadioGroup value="mobile_money" sx={{ mb: 2 }}>
          <FormControlLabel
            value="mobile_money"
            control={<Radio checked />}
            label={
              <Box>
                <Typography variant="body1">Mobile Money</Typography>
                <Typography variant="body2" color="text.secondary">
                  MTN MoMo, Vodafone Cash, AirtelTigo Money
                </Typography>
              </Box>
            }
          />
        </RadioGroup>

        {paymentMethod === 'mobile_money' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Mobile Money Details
            </Typography>
            
            <RadioGroup
              value={momoProvider}
              onChange={(e) => setMomoProvider(e.target.value as 'mtn' | 'vodafone' | 'airteltigo')}
              row
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="mtn" control={<Radio />} label="MTN MoMo" />
              <FormControlLabel value="vodafone" control={<Radio />} label="Vodafone Cash" />
              <FormControlLabel value="airteltigo" control={<Radio />} label="AirtelTigo Money" />
            </RadioGroup>

            <TextField
              fullWidth
              label="Mobile Money Phone Number"
              placeholder="e.g., 0242000000 or 0552000000"
              value={momoPhone}
              onChange={(e) => setMomoPhone(e.target.value)}
              helperText="Enter your mobile money registered phone number"
              required
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {!paymentData && !isInitializing && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click "Initialize Payment" to proceed to secure payment gateway
          </Typography>
        )}

        {paymentData && config && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success">
              <Typography variant="body2">
                Payment initialized successfully! Click the Pay button to complete your payment.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading || isInitializing}>
          Cancel
        </Button>
        
        {!paymentData ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || isInitializing || !config}
            startIcon={isInitializing ? <CircularProgress size={20} /> : undefined}
          >
            {isInitializing ? 'Initializing...' : 'Initialize Payment'}
          </Button>
        ) : (
          <Button
            component="a"
            href={paymentData.authorization_url}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            disabled={loading}
          >
            Proceed to Paystack
          </Button>
        )}
      </DialogActions>

      {loading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.8)"
          zIndex={9999}
        >
          <CircularProgress />
        </Box>
      )}

      <style>{`
        .paystack-button {
          background-color: #1976d2 !important;
          color: white !important;
          border: none !important;
          border-radius: 4px !important;
          padding: 8px 16px !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          cursor: pointer !important;
          transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important;
        }
        
        .paystack-button:hover {
          background-color: #1565c0 !important;
        }
        
        .paystack-button:disabled {
          background-color: rgba(0, 0, 0, 0.12) !important;
          color: rgba(0, 0, 0, 0.26) !important;
          cursor: default !important;
        }
      `}</style>
    </Dialog>
  );
};

export default PaystackPayment;
