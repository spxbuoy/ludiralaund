import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import { RootState } from '../../app/store';
import { Payment } from '../../types/order'; // Adjust the import path if necessary
import PaymentList from '../../components/payment/PaymentList'; // Adjust the import path if necessary
import api from '../../services/api'; // Assuming your API service is here

const ServiceProviderPaymentHistory: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth as any);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id || !token) {
        // Handle case where user is not logged in or token is missing
        setError('User not authenticated.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Assuming the backend filters by serviceProvider when userId query param is present for service providers
        const response = await api.get<{ data: { data: any } }>(`/payments?userId=${user.id}`);
        const resp: any = response.data;
        if (resp && Array.isArray(resp.data?.docs)) {
          setPayments(resp.data.docs);
        } else if (resp && Array.isArray(resp.data)) {
          setPayments(resp.data);
        } else {
          setPayments([]);
        }
      } catch (err: any) {
        console.error('Error fetching service provider payments:', err);
        setError(err.message || 'Failed to fetch payments.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user?.id, token]); // Re-run effect if user ID or token changes

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment History (Service Provider)
      </Typography>
      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <PaymentList payments={payments} />
      )}
    </Box>
  );
};

export default ServiceProviderPaymentHistory;