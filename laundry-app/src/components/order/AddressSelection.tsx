import React from 'react';
import { Box, Typography } from '@mui/material';
import LocationSelection from './LocationSelection';
import DateTimeSelection from './DateTimeSelection';
import { User } from '../../types/auth';

interface Location {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface OrderAddresses {
  pickup: string;
  delivery: string;
}

interface FormattedDates {
  pickup: string;
  delivery: string;
}

interface AddressSelectionProps {
  addresses: OrderAddresses;
  dates: FormattedDates;
  onAddressChange: (newAddresses: OrderAddresses) => void;
  onDateChange: (newDates: FormattedDates) => void;
  user: User;
  isDelivery?: boolean;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({
  addresses,
  dates,
  onAddressChange,
  onDateChange,
  user,
  isDelivery = false,
}) => {
  const handleLocationSelect = (type: 'pickup' | 'delivery', location: Location) => {
    // Generate a temporary ID if one doesn't exist
    const locationId = location.id || `${type}-${Date.now()}`;
    onAddressChange({
      ...addresses,
      [type]: locationId,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {isDelivery ? 'Delivery Details' : 'Pickup Details'}
      </Typography>

      {/* Location Selection */}
      <LocationSelection
        type={isDelivery ? 'delivery' : 'pickup'}
        onLocationSelect={(location: Location) => handleLocationSelect(isDelivery ? 'delivery' : 'pickup', location)}
        initialLocation={user?.addresses?.find((addr: Location) => addr.id === (isDelivery ? addresses.delivery : addresses.pickup))}
      />

      {/* Date and Time Selection */}
      <DateTimeSelection
        type={isDelivery ? 'delivery' : 'pickup'}
        value={isDelivery ? dates.delivery : dates.pickup}
        onChange={(value) => {
          onDateChange({
            ...dates,
            [isDelivery ? 'delivery' : 'pickup']: value,
          });
        }}
      />
    </Box>
  );
};

export default AddressSelection; 