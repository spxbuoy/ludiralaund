import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Popover,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  IconButton,
  Chip,
  Fade,
  Slide,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../app/hooks';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { usersApi, authApi } from '../services/api';

const Settings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Change Password Dropdown State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [chatEmailNotifications, setChatEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  // Theme switching
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = createTheme({ palette: { mode } });

  // Load user preferences
  useEffect(() => {
    if (user?.preferences?.notificationPreferences) {
      setEmailNotifications(user.preferences.notificationPreferences.email !== false);
      setChatEmailNotifications(user.preferences.notificationPreferences.chatEmail !== false);
    }
  }, [user]);

  // Update notification preferences
  const updateNotificationPreferences = async (preferences: any) => {
    setLoading(true);
    try {
      const response = await usersApi.updateUserPreferences({ notificationPreferences: preferences });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      if (preferences.email !== undefined) {
        setEmailNotifications(preferences.email);
      }
      if (preferences.chatEmail !== undefined) {
        setChatEmailNotifications(preferences.chatEmail);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      if (preferences.email !== undefined) {
        setEmailNotifications(!preferences.email);
      }
      if (preferences.chatEmail !== undefined) {
        setChatEmailNotifications(!preferences.chatEmail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
  };
  const handleSavePhoneNumber = () => {
    // TODO: Implement API call to update phone number
    console.log('Saving phone number:', phoneNumber);
  };
  const handleDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleDropdownClose = () => {
    setAnchorEl(null);
    setChangeError(null);
    setChangeSuccess(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };
  const open = Boolean(anchorEl);
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setChangeSuccess(null);
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangeError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangeError('New passwords do not match.');
      return;
    }
    setChangeLoading(true);
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.error) {
        setChangeError(response.error);
      } else {
        setChangeSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setChangeError('Network error. Please try again.');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleEmailToggle = () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    updateNotificationPreferences({ email: newValue });
  };

  const handleChatEmailToggle = () => {
    const newValue = !chatEmailNotifications;
    setChatEmailNotifications(newValue);
    updateNotificationPreferences({ chatEmail: newValue });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          py: 4,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Header Section */}
          <Fade in={true} timeout={600}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Settings
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                Manage your account preferences and security settings
              </Typography>

              {/* Theme Toggle */}
              <Chip
                icon={<PaletteIcon />}
                label={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}
                onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  },
                }}
              />
            </Box>
          </Fade>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
            {/* Notifications Card */}
            <Box sx={{ flex: 1 }}>
              <Slide direction="up" in={true} timeout={800}>
                <Card
                  elevation={8}
                  sx={{
                    borderRadius: 3,
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: '#667eea' }}>
                        <NotificationsIcon />
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Notifications
                      </Typography>
                    }
                    subheader="Control your notification preferences"
                  />
                  <Divider />
                  <CardContent>
                    <Stack spacing={3}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          borderRadius: 2,
                          background: mode === 'dark' ? '#333' : '#f8f9fa',
                          border: `1px solid ${mode === 'dark' ? '#555' : '#e9ecef'}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <EmailIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              General Email Notifications
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Receive updates about your orders and account
                            </Typography>
                          </Box>
                        </Box>
                        <Switch
                          checked={emailNotifications}
                          onChange={handleEmailToggle}
                          disabled={loading}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#667eea',
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                              },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#667eea',
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          borderRadius: 2,
                          background: mode === 'dark' ? '#333' : '#f8f9fa',
                          border: `1px solid ${mode === 'dark' ? '#555' : '#e9ecef'}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <ChatIcon color="primary" />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              Chat Message Notifications
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Get notified when you receive new chat messages
                            </Typography>
                          </Box>
                        </Box>
                        <Switch
                          checked={chatEmailNotifications}
                          onChange={handleChatEmailToggle}
                          disabled={loading}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#667eea',
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                              },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#667eea',
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Slide>
            </Box>

            {/* Security Card */}
            <Box sx={{ flex: 1 }}>
              <Slide direction="up" in={true} timeout={1000}>
                <Card
                  elevation={8}
                  sx={{
                    borderRadius: 3,
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: '#ff6b6b' }}>
                        <LockIcon />
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Security
                      </Typography>
                    }
                    subheader="Manage your account security"
                  />
                  <Divider />
                  <CardContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleDropdownClick}
                        sx={{
                          background: 'linear-gradient(45deg, #ff6b6b 30%, #ee5a24 90%)',
                          color: 'white',
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(45deg, #ff5252 30%, #d84315 90%)',
                          },
                        }}
                      >
                        Change Password
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Box>
          </Box>

          {/* Profile Information Card */}
          <Slide direction="up" in={true} timeout={1200}>
            <Card
              elevation={8}
              sx={{
                borderRadius: 3,
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: '#4ecdc4' }}>
                    <PersonIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Profile Information
                  </Typography>
                }
                subheader="Update your contact details"
              />
              <Divider />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    type="tel"
                    placeholder="Enter your phone number"
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSavePhoneNumber}
                    disabled={!phoneNumber}
                    sx={{
                      background: 'linear-gradient(45deg, #4ecdc4 30%, #44a08d 90%)',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      minWidth: { xs: '100%', md: 'auto' },
                      '&:hover': {
                        background: 'linear-gradient(45deg, #26d0ce 30%, #2e7d6b 90%)',
                      },
                      '&:disabled': {
                        background: '#e0e0e0',
                        color: '#999',
                      },
                    }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Slide>

          {/* Change Password Dialog */}
          <Dialog
            open={open}
            onClose={handleDropdownClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              },
            }}
          >
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
              Change Password
            </DialogTitle>
            <DialogContent>
              <form onSubmit={handleChangePassword}>
                <Stack spacing={3} sx={{ mt: 1 }}>
                  <TextField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                  <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                  <TextField
                    label="Confirm New Password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />

                  {changeError && (
                    <Alert
                      severity="error"
                      icon={<ErrorIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      {changeError}
                    </Alert>
                  )}

                  {changeSuccess && (
                    <Alert
                      severity="success"
                      icon={<CheckCircleIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      {changeSuccess}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={changeLoading}
                    sx={{
                      background: 'linear-gradient(45deg, #ff6b6b 30%, #ee5a24 90%)',
                      color: 'white',
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #ff5252 30%, #d84315 90%)',
                      },
                    }}
                  >
                    {changeLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </Stack>
              </form>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
export default Settings;