import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { PhoneAndroid } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  createPaymentIntent,
  fetchPaymentMethods,
  savePaymentMethod,
  processPayment,
} from '../../features/payment/paymentSlice';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
}) => {
  const dispatch = useAppDispatch();
  const { loading, error, paymentMethods } = useAppSelector(
    (state) => state.payment
  );
  const [selectedMethod, setSelectedMethod] = useState<string>('momo');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [momoLoading, setMomoLoading] = useState(false);
  const [momoDialog, setMomoDialog] = useState(false);
  const [momoStatus, setMomoStatus] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedMethod === 'momo') {
      await handleMoMoPayment();
    } else {
      await handleCardPayment();
    }
  };

  const handleMoMoPayment = async () => {
    if (!phoneNumber) {
      onError('Please enter your phone number');
      return;
    }

    setMomoLoading(true);
    try {
      // First create a payment record
      const paymentIntent = await dispatch(
        createPaymentIntent(amount)
      ).unwrap();

      // Process MoMo payment
      const response = await fetch(`/api/payments/${paymentIntent.id}/momo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ phoneNumber })
      });

      const result = await response.json();

      if (result.success) {
        setMomoStatus(result);
        setMomoDialog(true);
        
        if (result.momoDetails.status === 'completed') {
          setTimeout(() => {
            setMomoDialog(false);
            onSuccess();
          }, 2000);
        } else if (result.momoDetails.status === 'pending') {
          // Start polling for status updates
          startStatusPolling(paymentIntent.id);
        }
      } else {
        onError(result.message || 'MoMo payment failed');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'MoMo payment failed');
    } finally {
      setMomoLoading(false);
    }
  };

  const handleCardPayment = async () => {
    try {
      let paymentMethodId = selectedMethod;

      if (selectedMethod === 'new') {
        // Mock creating a new payment method
        const mockPaymentMethod = {
          id: 'mock_' + Date.now(),
          card: {
            brand: 'visa',
            last4: cardNumber.slice(-4)
          }
        };
        await dispatch(savePaymentMethod(mockPaymentMethod.id));
        paymentMethodId = mockPaymentMethod.id;
      }

      const paymentIntent = await dispatch(
        createPaymentIntent(amount)
      ).unwrap();

      const result = await dispatch(
        processPayment({
          paymentIntentId: paymentIntent.id,
          paymentMethodId,
        })
      ).unwrap();

      if (result.status === 'succeeded') {
        onSuccess();
      } else {
        onError('Payment failed');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const startStatusPolling = (paymentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}/momo/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await response.json();

        if (result.success) {
          setMomoStatus((prev: any) => ({ ...prev, data: result.data }));
          
          if (result.data.status === 'completed') {
            clearInterval(pollInterval);
            setTimeout(() => {
              setMomoDialog(false);
              onSuccess();
            }, 2000);
          } else if (result.data.status === 'failed') {
            clearInterval(pollInterval);
            setMomoDialog(false);
            onError('Payment was declined');
          }
        }
      } catch (err) {
        console.error('Status polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (momoDialog) {
        setMomoDialog(false);
        onError('Payment timeout - please try again');
      }
    }, 300000);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Select Payment Method</FormLabel>
          <RadioGroup
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            <FormControlLabel
              value="momo"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneAndroid />
                  Mobile Money (MoMo)
                </Box>
              }
            />
            {paymentMethods.map((method) => (
              <FormControlLabel
                key={method.id}
                value={method.id}
                control={<Radio />}
                label={`${method.card.brand.toUpperCase()} ending in ${method.card.last4}`}
              />
            ))}
            <FormControlLabel
              value="new"
              control={<Radio />}
              label="Add new card"
            />
          </RadioGroup>
        </FormControl>

        {selectedMethod === 'momo' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Mobile Money Details
            </Typography>
            <TextField
              label="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+233 24 123 4567"
              fullWidth
              helperText="Enter your mobile money registered phone number"
            />
          </Box>
        )}

        {selectedMethod === 'new' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Card Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Expiry Date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  sx={{ width: '50%' }}
                />
                <TextField
                  label="CVC"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                  sx={{ width: '50%' }}
                />
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Total Amount:</Typography>
          <Typography variant="h6" color="primary">
            ¢{(amount / 100).toFixed(2)}
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={
            loading || 
            momoLoading ||
            (selectedMethod === 'new' && (!cardNumber || !expiryDate || !cvc)) ||
            (selectedMethod === 'momo' && !phoneNumber)
          }
          sx={{ mt: 3 }}
        >
          {(loading || momoLoading) ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            selectedMethod === 'momo' ? 'Pay with MoMo' : 'Pay Now'
          )}
        </Button>

        {/* MoMo Payment Dialog */}
        <Dialog open={momoDialog} onClose={() => {}}>
          <DialogTitle>Mobile Money Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {momoStatus?.momoDetails?.status === 'pending' ? (
                <>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Payment Request Sent
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please check your phone and approve the payment request.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Transaction Ref: {momoStatus?.momoDetails?.transactionRef}
                  </Typography>
                </>
              ) : momoStatus?.momoDetails?.status === 'completed' ? (
                <>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    ✅ Payment Successful!
                  </Typography>
                  <Typography variant="body2">
                    Your payment has been processed successfully.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" color="error.main" gutterBottom>
                    ❌ Payment Failed
                  </Typography>
                  <Typography variant="body2">
                    {momoStatus?.message || 'Payment could not be processed'}
                  </Typography>
                </>
              )}
            </Box>
          </DialogContent>
          {momoStatus?.momoDetails?.status === 'failed' && (
            <DialogActions>
              <Button onClick={() => setMomoDialog(false)}>Close</Button>
            </DialogActions>
          )}
        </Dialog>
      </form>
    </Paper>
  );
};

export default PaymentForm; 