import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { Payment } from '../../types/order'; // Assuming Payment is in types/order

interface PaymentListProps {
  payments: Payment[];
}

const PaymentList: React.FC<PaymentListProps> = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="textSecondary">
          No payment history found.
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {payments.map((payment) => (
        <Paper
          key={payment._id} // Using _id as key based on your Payment type
          elevation={0}
          sx={{
            mb: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="subtitle1">
                  Amount: ¢{payment.amount.toFixed(2)}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Method: {payment.paymentMethod}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {payment.status}
                  </Typography>
                  {/* Assuming 'order' property in Payment is the order ID */}
                  {payment.order && (
                    <Typography variant="body2" color="textSecondary">
                      Order ID: {payment.order}
                    </Typography>
                  )}
                  {/* You might want to display more details like date, transaction ID etc. */}
                </Box>
              }
            />
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

export default PaymentList;