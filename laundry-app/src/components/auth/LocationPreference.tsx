import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  MyLocation,
  LocationOn,
} from '@mui/icons-material';
import LocationSelection from '../order/LocationSelection';
import { formatAddress } from '../../utils/textUtils';

interface LocationPreferenceProps {
  onLocationSave: (location: {
    useLiveLocation: boolean;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  }) => void;
}

const LocationPreference: React.FC<LocationPreferenceProps> = ({ onLocationSave }) => {
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [location, setLocation] = useState<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  } | null>(null);

  const handleLiveLocationToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseLiveLocation(event.target.checked);
    if (!event.target.checked) {
      setShowManualInput(true);
    } else {
      setShowManualInput(false);
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data) {
            const newLocation = {
              street: data.address.road || data.address.pedestrian || '',
              city: data.address.city || data.address.town || '',
              state: data.address.state || '',
              zipCode: data.address.postcode || '',
              coordinates: {
                lat: latitude,
                lng: longitude,
              },
            };
            setLocation(newLocation);
            onLocationSave({
              useLiveLocation: true,
              address: newLocation,
            });
          }
        } catch (err) {
          setError('Failed to get address from coordinates');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setError('Unable to retrieve your location');
        setIsLoading(false);
      }
    );
  };

  const handleManualLocationSave = (manualLocation: any) => {
    // Format location data before saving
    const formattedLocation = formatAddress(manualLocation);
    setLocation({
      ...formattedLocation,
      coordinates: manualLocation.coordinates,
    });
    onLocationSave({
      useLiveLocation: false,
      address: {
        ...formattedLocation,
        coordinates: manualLocation.coordinates,
      },
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Location Preferences
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useLiveLocation}
              onChange={handleLiveLocationToggle}
              disabled={isLoading}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MyLocation />
              <Typography>
                Use live location tracking
              </Typography>
            </Box>
          }
        />
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {!useLiveLocation && showManualInput && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Enter your address manually
          </Typography>
          <LocationSelection
            type="pickup"
            onLocationSelect={handleManualLocationSave}
          />
        </Box>
      )}

      {location && !isLoading && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="primary" />
          <Typography>
            {`${location.street}, ${location.city}, ${location.state} ${location.zipCode}`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default LocationPreference; 