import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import { RootState } from '../../app/store'; // Adjust the import path if necessary
import { Payment } from '../../types/order'; // Import Payment from order.ts
import PaymentList from '../../components/payment/PaymentList'; // Import PaymentList
import api from '../../services/api'; // Adjust the import path if necessary

const CustomerPaymentHistory: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth as any);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id || !token) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ data: { data: any } }>(`/payments?userId=${user.id}`); // Assuming API service has a get method

        const resp: any = response.data;
        if (resp && Array.isArray(resp.data?.docs)) {
          setPayments(resp.data.docs);
        } else if (resp && Array.isArray(resp.data)) {
          setPayments(resp.data);
        } else {
          setPayments([]);
        }
      } catch (err: any) {
        console.error('Error fetching customer payments:', err);
        setError(err.message || 'Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user?.id, token]); // Refetch when user ID or token changes

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        My Payment History
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
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
    </Container>
  );
};

export default CustomerPaymentHistory;