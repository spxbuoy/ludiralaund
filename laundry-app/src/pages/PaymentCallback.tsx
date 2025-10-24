import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';

const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();

  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let timeout: any;

    const verifyAndRedirect = async () => {
      try {
        const reference = searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('ref');
        const token = localStorage.getItem('token');

        // If we have a reference, attempt to verify it on the backend
        if (reference && token) {
          try {
            await axios.post(`${API_BASE_URL}/paystack/verify/${reference}`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (e: any) {
            // Non-blocking: even if verification fails here, the polling in the app and status endpoint can still catch it
            setError(e?.response?.data?.error || e?.message || 'Payment verification encountered an issue. Redirecting...');
          }
        }
      } finally {
        // Always redirect to the Orders page after a short delay
        timeout = setTimeout(() => {
          navigate('/orders', { replace: true });
        }, 1000);
      }
    };

    verifyAndRedirect();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [navigate, searchParams, orderId]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" p={3}>
      <CircularProgress />
      <Typography variant="h6" mt={2} textAlign="center">
        Confirming your payment...
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1} textAlign="center">
        You will be redirected to your orders shortly.
      </Typography>
      {error && (
        <Alert severity="warning" sx={{ mt: 2, maxWidth: 560 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PaymentCallback;
