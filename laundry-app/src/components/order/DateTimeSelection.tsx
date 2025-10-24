import React from 'react';
import { Box, TextField, Paper, Typography } from '@mui/material';

interface DateTimeSelectionProps {
  type: 'pickup' | 'delivery';
  value: string;
  onChange: (value: string) => void;
}

const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({
  type,
  value,
  onChange,
}) => {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    const time = value.split(' ')[1] || '12:00';
    onChange(`${date} ${time}`);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = event.target.value;
    const date = value.split(' ')[0] || new Date().toISOString().split('T')[0];
    onChange(`${date} ${time}`);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {type === 'pickup' ? 'Pickup Date & Time' : 'Delivery Date & Time'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Date"
          type="date"
          value={value.split(' ')[0] || ''}
          onChange={handleDateChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Time"
          type="time"
          value={value.split(' ')[1] || ''}
          onChange={handleTimeChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ step: 300 }}
          fullWidth
        />
      </Box>
    </Paper>
  );
};

export default DateTimeSelection; 