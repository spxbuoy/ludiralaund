import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { updateProfile } from '../features/auth/authSlice';
import { useAppDispatch } from '../app/hooks';
import { formatUserData } from '../utils/textUtils';

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Format user data before sending to database
      const formattedUserData = formatUserData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      });

      await dispatch(updateProfile({
        firstName: formattedUserData.firstName,
        lastName: formattedUserData.lastName,
        phoneNumber: formattedUserData.phoneNumber,
      }));
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" flexWrap="wrap" gap={3}>
        {/* Personal Information */}
        <Box flex={1} minWidth={300}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <form onSubmit={handleSubmit}>
              <Box mb={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  sx={{ mb: 2 }}
                  disabled
                />
                <TextField
                  fullWidth
                  label="Phone"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;