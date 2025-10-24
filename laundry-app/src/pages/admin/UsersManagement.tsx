import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';
import { UserRole, User, AdminUser, CustomerUser, ServiceProviderUser } from '../../types/auth';
import { formatUserData } from '../../utils/textUtils';
import { API_BASE_URL } from '../../services/api';

interface UserWithStatus extends User {
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
}

const UsersManagement: React.FC = () => {
  const { canManageUsers } = usePermissions();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'add'>('view');
  const [error, setError] = useState<string | null>(null);
  
  // Form state for add/edit user
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'customer' as UserRole,
    status: 'active' as 'active' | 'inactive' | 'suspended',
    password: '',
    confirmPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Fetch real users data from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        // Ensure users is always an array
        const usersArray = Array.isArray(data) ? data : (data.users || data.data || []);
        setUsers(usersArray);
      } catch (error) {
        console.error('Users fetch error:', error);
        setError('Failed to load users');
        setUsers([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleViewUser = (user: UserWithStatus) => {
    setSelectedUser(user);
    setDialogType('view');
    setDialogOpen(true);
  };

  const handleEditUser = (user: UserWithStatus) => {
    setSelectedUser(user);
    setDialogType('edit');
    // Populate form with user's current data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '', // Email will be readonly
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'customer',
      status: user.status || 'active',
      password: '', // Not needed for editing
      confirmPassword: '', // Not needed for editing
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setDialogType('add');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'customer',
      status: 'active',
      password: '',
      confirmPassword: '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId || userId === 'undefined') {
      setError('Invalid user ID. Cannot delete user.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        // Ensure users is always an array
        const usersArray = Array.isArray(users) ? users : [];
        setUsers(usersArray.filter(user => user.id !== userId));
        setError(null);
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      // Ensure users is always an array
      const usersArray = Array.isArray(users) ? users : [];
      const user = usersArray.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const updatedUser = await response.json();
      setUsers(usersArray.map(user => 
        user.id === userId ? updatedUser : user
      ));
      setError(null);
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Only validate email for new users, not when editing
    if (dialogType === 'add') {
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }

    if (dialogType === 'add') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (dialogType === 'add') {
        // Format user data before sending to database (excluding password)
        const formattedUserData = formatUserData({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
        });

        // Real API call to create user
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formattedUserData,
            password: formData.password,
            status: formData.status,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create user');
        }

        const newUser = await response.json();
        
        // Refresh the users list to get the updated data
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const usersArray = Array.isArray(usersData) ? usersData : (usersData.users || usersData.data || []);
          setUsers(usersArray);
        }

        setDialogOpen(false);
        setError(null);
      } else if (dialogType === 'edit') {
        // Format user data before sending to database (exclude email for editing)
        const formattedUserData = formatUserData({
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
        });

        // Real API call to update user (exclude email since it's readonly)
        const response = await fetch(`${API_BASE_URL}/users/${selectedUser?.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formattedUserData,
            status: formData.status,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user');
        }

        // Refresh the users list
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const usersArray = Array.isArray(usersData) ? usersData : (usersData.users || usersData.data || []);
          setUsers(usersArray);
        }

        setDialogOpen(false);
        setError(null);
      }
    } catch (err) {
      console.error('User operation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform user operation');
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'error';
      case 'service_provider': return 'warning';
      case 'customer': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  if (!canManageUsers()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to manage users.
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
          Users Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {Array.isArray(users) ? users.map((user) => (
          <Box key={user.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 18px)' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2
                  }}>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                  <Chip
                    label={user.status}
                    color={getStatusColor(user.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Login: {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Never'
                  }
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created: {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewUser(user)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit User">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.status === 'active' ? 'Suspend User' : 'Activate User'}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleUserStatus(user.id)}
                    >
                      {user.status === 'active' ? <BlockIcon /> : <ActiveIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete User">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Card>
          </Box>
        )) : (
          <Typography variant="body1" color="text.secondary">
            No users available
          </Typography>
        )}
      </Box>

      {/* User Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'add' ? 'Add New User' : 
           dialogType === 'edit' ? 'Edit User' : 'User Details'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'add' || dialogType === 'edit' ? (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  required
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  error={!!formErrors.email}
                  helperText={dialogType === 'edit' ? 'Email cannot be changed when editing a user' : formErrors.email}
                  required
                  disabled={dialogType === 'edit'}
                  InputProps={{
                    readOnly: dialogType === 'edit',
                  }}
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                  error={!!formErrors.phoneNumber}
                  helperText={formErrors.phoneNumber}
                  required
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => handleFormChange('role', e.target.value)}
                  >
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="service_provider">Service Provider</MenuItem>
                    <MenuItem value="admin">Shop Owner</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {dialogType === 'add' && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    required
                  />
                </Box>
              )}
              
              {formData.role === 'service_provider' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Service Provider Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Service provider specific details can be configured after user creation.
                  </Typography>
                </Box>
              )}
              
              {formData.role === 'admin' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Shop Owner Permissions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Shop Owner permissions will be set to default values. They can be modified after user creation.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              {selectedUser && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    User Information
                  </Typography>
                  <Typography><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</Typography>
                  <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
                  <Typography><strong>Phone:</strong> {selectedUser.phoneNumber}</Typography>
                  <Typography><strong>Role:</strong> {selectedUser.role}</Typography>
                  <Typography><strong>Status:</strong> {selectedUser.status}</Typography>
                  <Typography><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</Typography>
                  <Typography><strong>Last Login:</strong> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          {(dialogType === 'edit' || dialogType === 'add') && (
            <Button 
              variant="contained" 
              onClick={handleFormSubmit}
              disabled={Object.keys(formErrors).length > 0}
            >
              {dialogType === 'add' ? 'Create User' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagement;
