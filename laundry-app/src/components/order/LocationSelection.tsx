import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MyLocation,
  LocationOn,
  Edit,
  Save,
} from '@mui/icons-material';
import { formatAddress } from '../../utils/textUtils';

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

interface LocationSelectionProps {
  type: 'pickup' | 'delivery';
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
}

const LocationSelection: React.FC<LocationSelectionProps> = ({
  type,
  onLocationSelect,
  initialLocation,
}) => {
  const [location, setLocation] = useState<Location>(initialLocation || {
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!initialLocation);
  const [showMap, setShowMap] = useState(false);

  const handleManualInput = (field: keyof Location, value: string) => {
    setLocation(prev => ({
      ...prev,
      [field]: value,
    }));
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
            
            // Format location data before saving
            const formattedLocation = formatAddress(newLocation);
            setLocation(formattedLocation);
            onLocationSelect(formattedLocation);
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

  const handleSave = () => {
    if (!location.street || !location.city || !location.state || !location.zipCode) {
      setError('Please fill in all address fields');
      return;
    }
    
    // Format location data before saving
    const formattedLocation = formatAddress(location);
    onLocationSelect(formattedLocation);
    setIsEditing(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {type === 'pickup' ? 'Pickup Location' : 'Delivery Location'}
        </Typography>
        {!isEditing && (
          <IconButton onClick={() => setIsEditing(true)}>
            <Edit />
          </IconButton>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isEditing ? (
        <Box>
          <TextField
            fullWidth
            label="Street Address"
            value={location.street}
            onChange={(e) => handleManualInput('street', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="City"
            value={location.city}
            onChange={(e) => handleManualInput('city', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="State"
            value={location.state}
            onChange={(e) => handleManualInput('state', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="ZIP Code"
            value={location.zipCode}
            onChange={(e) => handleManualInput('zipCode', e.target.value)}
            margin="normal"
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<MyLocation />}
              onClick={getCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Use Current Location'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
            >
              Save Location
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="primary" />
          <Typography>
            {`${location.street}, ${location.city}, ${location.state} ${location.zipCode}`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default LocationSelection; 