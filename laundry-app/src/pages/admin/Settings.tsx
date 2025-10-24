import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';
import { API_BASE_URL } from '../../services/api';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type BusinessHours = {
  [K in DayOfWeek]: {
    open: string;
    close: string;
    closed: boolean;
  };
};

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: BusinessHours;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSettings: React.FC = () => {
  const { isAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Laundry App',
    siteDescription: 'Professional laundry services platform',
    contactEmail: 'admin@laundryapp.com',
    contactPhone: '+233 123 456 789',
    businessHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: false },
    },
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing maintenance. Please check back later.',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    paymentNotifications: true,
    userRegistrationNotifications: true,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    defaultCurrency: 'GHS',
    taxRate: 12.5,
    serviceFee: 5.0,
    minimumOrderAmount: 10.0,
    maximumOrderAmount: 1000.0,
    paymentMethods: {
      cash: true,
      mobile_money: true,
      credit_card: false,
      bank_transfer: true,
    },
    autoConfirmPayments: false,
    paymentDeadlineHours: 24,
  });

  // User Management Settings
  const [userSettings, setUserSettings] = useState({
    defaultUserRole: 'customer',
    requireEmailVerification: true,
    requirePhoneVerification: false,
    allowUserRegistration: true,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 480,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
  });

  // UI Settings
  const [uiSettings, setUiSettings] = useState({
    theme: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    itemsPerPage: 10,
    enableAnimations: true,
    compactMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch settings from the API
      // For now, we'll use the default state values
      console.log('Loading settings...');
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsType: string, settings: any) => {
    try {
      setSaving(true);
      setError(null);

      // In a real app, you would save to the API
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: settingsType,
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(`${settingsType} settings saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to save ${settingsType} settings`);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access system settings.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSettings}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120,
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab icon={<BusinessIcon />} label="General" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<PaymentIcon />} label="Payments" />
          <Tab icon={<SecurityIcon />} label="Users" />
          <Tab icon={<PaletteIcon />} label="Appearance" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Site Information" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Site Name"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Site Description"
                      multiline
                      rows={3}
                      value={systemSettings.siteDescription}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Contact Email"
                      type="email"
                      value={systemSettings.contactEmail}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Contact Phone"
                      value={systemSettings.contactPhone}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Business Hours" />
                  <CardContent>
                    {(Object.entries(systemSettings.businessHours) as [DayOfWeek, typeof systemSettings.businessHours[DayOfWeek]][]).map(([day, hours]) => (
                      <Box key={day} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>
                          {day}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            size="small"
                            type="time"
                            value={hours.open}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                [day]: { ...hours, open: e.target.value }
                              }
                            }))}
                            disabled={hours.closed}
                            sx={{ width: '120px' }}
                          />
                          <Typography>to</Typography>
                          <TextField
                            size="small"
                            type="time"
                            value={hours.close}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                [day]: { ...prev.businessHours[day], close: e.target.value }
                              }
                            }))}
                            disabled={hours.closed}
                            sx={{ width: '120px' }}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hours.closed}
                                onChange={(e) => setSystemSettings(prev => ({
                                  ...prev,
                                  businessHours: {
                                    ...prev.businessHours,
                                    [day]: { ...hours, closed: e.target.checked }
                                  }
                                }))}
                              />
                            }
                            label="Closed"
                          />
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Card>
              <CardHeader title="Maintenance Mode" />
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings(prev => ({
                        ...prev,
                        maintenanceMode: e.target.checked
                      }))}
                    />
                  }
                  label="Enable Maintenance Mode"
                />
                {systemSettings.maintenanceMode && (
                  <TextField
                    fullWidth
                    label="Maintenance Message"
                    multiline
                    rows={3}
                    value={systemSettings.maintenanceMessage}
                    onChange={(e) => setSystemSettings(prev => ({
                      ...prev,
                      maintenanceMessage: e.target.value
                    }))}
                    sx={{ mt: 2 }}
                  />
                )}
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('system', systemSettings)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save General Settings'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Notification Types" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            emailNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="Email Notifications"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            smsNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="SMS Notifications"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            pushNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="Push Notifications"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Alert Types" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.orderNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            orderNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="Order Notifications"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.paymentNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            paymentNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="Payment Notifications"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.userRegistrationNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            userRegistrationNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="User Registration Alerts"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.systemAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            systemAlerts: e.target.checked
                          }))}
                        />
                      }
                      label="System Alerts"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Reports" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.weeklyReports}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            weeklyReports: e.target.checked
                          }))}
                        />
                      }
                      label="Weekly Reports"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.monthlyReports}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            monthlyReports: e.target.checked
                          }))}
                        />
                      }
                      label="Monthly Reports"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('notifications', notificationSettings)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Payment Settings */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Payment Configuration" />
                  <CardContent>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Default Currency</InputLabel>
                      <Select
                        value={paymentSettings.defaultCurrency}
                        label="Default Currency"
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          defaultCurrency: e.target.value
                        }))}
                      >
                        <MenuItem value="GHS">Ghanaian Cedi (GHS)</MenuItem>
                        <MenuItem value="USD">US Dollar (USD)</MenuItem>
                        <MenuItem value="EUR">Euro (EUR)</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography gutterBottom>Tax Rate (%)</Typography>
                    <Slider
                      value={paymentSettings.taxRate}
                      onChange={(e, newValue) => setPaymentSettings(prev => ({
                        ...prev,
                        taxRate: newValue as number
                      }))}
                      valueLabelDisplay="auto"
                      min={0}
                      max={30}
                      step={0.5}
                      sx={{ mb: 3 }}
                    />

                    <Typography gutterBottom>Service Fee (%)</Typography>
                    <Slider
                      value={paymentSettings.serviceFee}
                      onChange={(e, newValue) => setPaymentSettings(prev => ({
                        ...prev,
                        serviceFee: newValue as number
                      }))}
                      valueLabelDisplay="auto"
                      min={0}
                      max={20}
                      step={0.5}
                      sx={{ mb: 3 }}
                    />

                    <TextField
                      fullWidth
                      label="Minimum Order Amount"
                      type="number"
                      value={paymentSettings.minimumOrderAmount}
                      onChange={(e) => setPaymentSettings(prev => ({
                        ...prev,
                        minimumOrderAmount: parseFloat(e.target.value) || 0
                      }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Maximum Order Amount"
                      type="number"
                      value={paymentSettings.maximumOrderAmount}
                      onChange={(e) => setPaymentSettings(prev => ({
                        ...prev,
                        maximumOrderAmount: parseFloat(e.target.value) || 0
                      }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Payment Deadline (Hours)"
                      type="number"
                      value={paymentSettings.paymentDeadlineHours}
                      onChange={(e) => setPaymentSettings(prev => ({
                        ...prev,
                        paymentDeadlineHours: parseInt(e.target.value) || 24
                      }))}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Payment Methods" />
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Enabled Payment Methods
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {Object.entries(paymentSettings.paymentMethods).map(([method, enabled]) => (
                        <Chip
                          key={method}
                          label={method.replace('_', ' ').toUpperCase()}
                          color={enabled ? 'success' : 'default'}
                          variant={enabled ? 'filled' : 'outlined'}
                          onClick={() => setPaymentSettings(prev => ({
                            ...prev,
                            paymentMethods: {
                              ...prev.paymentMethods,
                              [method]: !enabled
                            }
                          }))}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={paymentSettings.autoConfirmPayments}
                          onChange={(e) => setPaymentSettings(prev => ({
                            ...prev,
                            autoConfirmPayments: e.target.checked
                          }))}
                        />
                      }
                      label="Auto-confirm payments"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('payments', paymentSettings)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* User Management Settings */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="User Registration" />
                  <CardContent>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Default User Role</InputLabel>
                      <Select
                        value={userSettings.defaultUserRole}
                        label="Default User Role"
                        onChange={(e) => setUserSettings(prev => ({
                          ...prev,
                          defaultUserRole: e.target.value
                        }))}
                      >
                        <MenuItem value="customer">Customer</MenuItem>
                        <MenuItem value="service_provider">Service Provider</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.requireEmailVerification}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            requireEmailVerification: e.target.checked
                          }))}
                        />
                      }
                      label="Require Email Verification"
                      sx={{ mb: 2, display: 'block' }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.requirePhoneVerification}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            requirePhoneVerification: e.target.checked
                          }))}
                        />
                      }
                      label="Require Phone Verification"
                      sx={{ mb: 2, display: 'block' }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.allowUserRegistration}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            allowUserRegistration: e.target.checked
                          }))}
                        />
                      }
                      label="Allow User Registration"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Security Settings" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Max Login Attempts"
                      type="number"
                      value={userSettings.maxLoginAttempts}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        maxLoginAttempts: parseInt(e.target.value) || 5
                      }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Session Timeout (Minutes)"
                      type="number"
                      value={userSettings.sessionTimeoutMinutes}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        sessionTimeoutMinutes: parseInt(e.target.value) || 480
                      }))}
                      sx={{ mb: 2 }}
                    />

                    <Typography variant="h6" gutterBottom>
                      Password Requirements
                    </Typography>

                    <TextField
                      fullWidth
                      label="Minimum Password Length"
                      type="number"
                      value={userSettings.passwordMinLength}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        passwordMinLength: parseInt(e.target.value) || 8
                      }))}
                      sx={{ mb: 2 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.passwordRequireSpecialChars}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            passwordRequireSpecialChars: e.target.checked
                          }))}
                        />
                      }
                      label="Require Special Characters"
                      sx={{ mb: 1, display: 'block' }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.passwordRequireNumbers}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            passwordRequireNumbers: e.target.checked
                          }))}
                        />
                      }
                      label="Require Numbers"
                      sx={{ mb: 1, display: 'block' }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.passwordRequireUppercase}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            passwordRequireUppercase: e.target.checked
                          }))}
                        />
                      }
                      label="Require Uppercase Letters"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('users', userSettings)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save User Settings'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* UI Settings */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Appearance" />
                  <CardContent>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={uiSettings.theme}
                        label="Theme"
                        onChange={(e) => setUiSettings(prev => ({
                          ...prev,
                          theme: e.target.value
                        }))}
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto (System)</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={uiSettings.language}
                        label="Language"
                        onChange={(e) => setUiSettings(prev => ({
                          ...prev,
                          language: e.target.value
                        }))}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Date Format</InputLabel>
                      <Select
                        value={uiSettings.dateFormat}
                        label="Date Format"
                        onChange={(e) => setUiSettings(prev => ({
                          ...prev,
                          dateFormat: e.target.value
                        }))}
                      >
                        <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
                        <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
                        <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Time Format</InputLabel>
                      <Select
                        value={uiSettings.timeFormat}
                        label="Time Format"
                        onChange={(e) => setUiSettings(prev => ({
                          ...prev,
                          timeFormat: e.target.value
                        }))}
                      >
                        <MenuItem value="12h">12 Hour</MenuItem>
                        <MenuItem value="24h">24 Hour</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Items Per Page"
                      type="number"
                      value={uiSettings.itemsPerPage}
                      onChange={(e) => setUiSettings(prev => ({
                        ...prev,
                        itemsPerPage: parseInt(e.target.value) || 10
                      }))}
                      sx={{ mb: 2 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={uiSettings.enableAnimations}
                          onChange={(e) => setUiSettings(prev => ({
                            ...prev,
                            enableAnimations: e.target.checked
                          }))}
                        />
                      }
                      label="Enable Animations"
                      sx={{ mb: 1, display: 'block' }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={uiSettings.compactMode}
                          onChange={(e) => setUiSettings(prev => ({
                            ...prev,
                            compactMode: e.target.checked
                          }))}
                        />
                      }
                      label="Compact Mode"
                      sx={{ display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardHeader title="Color Scheme" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Primary Color"
                      type="color"
                      value={uiSettings.primaryColor}
                      onChange={(e) => setUiSettings(prev => ({
                        ...prev,
                        primaryColor: e.target.value
                      }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Secondary Color"
                      type="color"
                      value={uiSettings.secondaryColor}
                      onChange={(e) => setUiSettings(prev => ({
                        ...prev,
                        secondaryColor: e.target.value
                      }))}
                    />
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('ui', uiSettings)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save UI Settings'}
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminSettings;