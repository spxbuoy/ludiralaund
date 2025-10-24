import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { register } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import LocationPreference from './LocationPreference';
import { AppDispatch } from '../../app/store';
import { UserRole } from '../../types';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  location?: {
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
  };
}

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSave = (location: any) => {
    setFormData(prev => ({
      ...prev,
      location,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.location?.address) {
      setError('Please provide your location');
      return;
    }

    try {
      await dispatch(register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
        role: 'customer' as UserRole,
        verificationCode: '', // Add empty string as placeholder since this component is not used in the new flow
      })).unwrap();
      
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Create an Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <LocationPreference onLocationSave={handleLocationSave} />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
          >
            Register
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;
export {}; 