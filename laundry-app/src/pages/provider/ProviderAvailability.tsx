import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Divider,
  TextField,
} from '@mui/material';

interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

const daysOfWeek: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const ProviderAvailability: React.FC = () => {
  const [availability, setAvailability] = useState<Record<DayOfWeek, DayAvailability>>({
    Monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Saturday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Sunday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  });

  const [breakTime, setBreakTime] = useState({
    start: '13:00',
    end: '14:00',
  });

  const handleDayToggle = (day: DayOfWeek) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleTimeChange = (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleBreakTimeChange = (field: 'start' | 'end', value: string) => {
    setBreakTime(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log('Saving availability:', availability);
    console.log('Break time:', breakTime);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Set Your Availability
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Operating Hours
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Set your working hours for each day of the week.
        </Typography>

        <Stack spacing={3}>
          {daysOfWeek.map((day) => (
            <Box key={day}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box sx={{ width: { xs: '100%', sm: '25%' } }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={availability[day].enabled}
                        onChange={() => handleDayToggle(day)}
                      />
                    }
                    label={day}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '75%' } }}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Start Time"
                      type="time"
                      value={availability[day].startTime}
                      onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                      disabled={!availability[day].enabled}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      fullWidth
                    />
                    <TextField
                      label="End Time"
                      type="time"
                      value={availability[day].endTime}
                      onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                      disabled={!availability[day].enabled}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      fullWidth
                    />
                  </Stack>
                </Box>
              </Box>
              {day !== 'Sunday' && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            size="large"
          >
            Save Availability
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Break Time
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Set your break time during the day.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              label="Break Start Time"
              type="time"
              value={breakTime.start}
              onChange={(e) => handleBreakTimeChange('start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              label="Break End Time"
              type="time"
              value={breakTime.end}
              onChange={(e) => handleBreakTimeChange('end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
            />
          </Box>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            size="large"
          >
            Save Break Time
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProviderAvailability; 