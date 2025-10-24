import React, { useState } from 'react';
import { Box, TextField, Button, Paper } from '@mui/material';
import { useAppDispatch } from '../../app/hooks';
import { addAddress } from '../../features/auth/authSlice';
import { formatAddress } from '../../utils/textUtils';

const AddAddressForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    type: '', // Add type field
    instructions: '', // Add instructions field
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Format address data before sending to database
      const formattedAddress = formatAddress(form);
      await dispatch(
        addAddress({
          street: formattedAddress.street,
          city: formattedAddress.city,
          state: formattedAddress.state,
          zipCode: formattedAddress.zipCode,
          type: formattedAddress.type || 'default', // Ensure type is included
          instructions: formattedAddress.instructions || '', // Ensure instructions is included
        })
      );
      setForm({ street: '', city: '', state: '', zipCode: '', type: '', instructions: '' });
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            fullWidth
            name="street"
            label="Street"
            value={form.street}
            onChange={handleChange}
            required
          />
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              name="city"
              label="City"
              value={form.city}
              onChange={handleChange}
              required
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              name="state"
              label="State"
              value={form.state}
              onChange={handleChange}
              required
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              name="zipCode"
              label="ZIP Code"
              value={form.zipCode}
              onChange={handleChange}
              required
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Box>
          <TextField
            fullWidth
            name="type"
            label="Address Type (e.g., Home, Work)"
            value={form.type}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            name="instructions"
            label="Delivery Instructions"
            value={form.instructions}
            onChange={handleChange}
            multiline
            rows={3}
          />
          <Button type="submit" variant="contained" color="primary">
            Add Address
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default AddAddressForm;