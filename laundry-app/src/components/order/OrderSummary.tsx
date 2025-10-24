import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

interface OrderSummaryProps {

  addresses: {
    pickup: string;
    delivery: string;
  };
  dates: {
    pickup: string;
    delivery: string;
  };
  onEdit: () => void;
  totalPrice: number;
  items: { serviceId: string; quantity: number; price: number }[];
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  addresses,
  dates,
  onEdit,
  totalPrice,
  items,
}) => {
  const { services } = useSelector((state: RootState) => state.services);
  const { user } = useSelector((state: RootState) => state.auth);

  const getAddressById = (addressId: string) => {
    return user?.addresses?.find(addr => addr.id === addressId);
  };

  const pickupAddress = getAddressById(addresses.pickup);
  const deliveryAddress = getAddressById(addresses.delivery);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Order Summary
      </Typography>
      <Box display="flex" flexDirection="column" gap={3}>
        {/* Items */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Items
            </Typography>
            {items.map((item: { serviceId: string; quantity: number; price: number }) => {
              const service = services.find((s) => s.id === item.serviceId);
              return (
                <Box key={item.serviceId} mb={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>
                      {service?.name} x {item.quantity}
                    </Typography>
                    <Typography>
                      ¢{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="subtitle1">Total:</Typography>
              <Typography variant="subtitle1" color="primary">
                ¢{totalPrice.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Pickup and Delivery Details */}
        <Box display="flex" flexWrap="wrap" gap={3}>
          {/* Pickup Details */}
          <Box flex={1} minWidth={300}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Pickup Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Address: {pickupAddress ? `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}` : 'Not selected'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date & Time: {dates.pickup || 'Not selected'}
              </Typography>
            </Paper>
          </Box>

          {/* Delivery Details */}
          <Box flex={1} minWidth={300}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Delivery Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Address: {deliveryAddress ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}` : 'Not selected'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date & Time: {dates.delivery || 'Not selected'}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderSummary; 