import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  Stack,
  InputAdornment,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { login, clearError } from '../features/auth/authSlice';
import { useEffect } from 'react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!password.trim()) {
      return 'Password is required';
    }
    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    console.log('=== LOGIN ATTEMPT STARTED ===');
    console.log('Form data:', { email: email.trim(), password: password ? '***' : 'empty' });
    console.log('Current state:', { isSubmitting, loading });
    
    // Prevent double submission
    if (isSubmitting || loading) {
      console.log('❌ Login blocked - already submitting');
      return;
    }

    if (submitTimeoutRef.current) {
      console.log('❌ Login blocked - timeout active');
      return;
    }

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      console.log(' Validation error:', validationError);
      setLocalError(validationError);
      dispatch(clearError());
      return;
    }

    console.log(' Starting login process...');
    setIsSubmitting(true);
    setLocalError(null);
    
    // Set timeout to prevent rapid clicks
    submitTimeoutRef.current = setTimeout(() => {
      submitTimeoutRef.current = null;
    }, 2000);
    
    try {
      console.log('🔍 Testing API connection...');
      const { API_BASE_URL } = await import('../services/api');
      const testResponse = await fetch(`${API_BASE_URL}/health`);
      console.log('API health check:', testResponse.ok ? ' OK' : ' Failed');
      
      if (!testResponse.ok) {
        throw new Error('API health check failed');
      }
      
      console.log(' Dispatching login action...');
      const result = await dispatch(login({ email, password })).unwrap();
      console.log(' Login successful:', result);
      
      // Check if token was set
      const token = localStorage.getItem('token');
      console.log('🔍 Token check:', { token: token ? 'exists' : 'null' });
      
      // Check Redux state after login
      console.log('🔍 Checking Redux state after login...');
      const currentState = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.connect()?.getState();
      console.log('Current Redux state:', currentState);
      
      // Check if we're actually authenticated
      console.log('🔍 Checking authentication status...');
      const authState = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.connect()?.getState()?.auth;
      console.log('Auth state:', authState);
      
      // Wait a bit for Redux state to update
      console.log('⏳ Waiting for Redux state to update...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a re-render by dispatching a dummy action
      console.log('🔄 Forcing Redux state update...');
      dispatch(clearError());
      
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      setLocalError('Login failed. Please check your credentials and try again.');
    } finally {
      console.log('🏁 Login process finished');
      setIsSubmitting(false);
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
    }
  };

  // Clear local error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (localError) setLocalError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (localError) setLocalError(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left panel with brand/illustration */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', p: 6 }}>
          <Stack spacing={2} sx={{ color: 'white', maxWidth: 520 }}>
            <Typography variant="h3" fontWeight={700}>Welcome back to Laundry App</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Fast, reliable laundry services. Sign in to manage your orders, track progress, and more.
            </Typography>
          </Stack>
        </Box>

        {/* Right panel with form */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
          <Paper elevation={10} sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 440, borderRadius: 3 }}>
            <Stack spacing={1} sx={{ mb: 1, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>Sign in</Typography>
              <Typography variant="body2" color="text.secondary">Welcome back! Please enter your details.</Typography>
            </Stack>

            {(error || localError) && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => { dispatch(clearError()); setLocalError(null); }}>
                {localError || error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                margin="normal"
                required
                autoComplete="email"
                error={!email.trim() && isSubmitting}
                helperText={!email.trim() && isSubmitting ? 'Email is required' : ''}
                InputProps={{
                  startAdornment: <InputAdornment position="start">📧</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                margin="normal"
                required
                autoComplete="current-password"
                error={!password.trim() && isSubmitting}
                helperText={!password.trim() && isSubmitting ? 'Password is required' : ''}
                InputProps={{
                  startAdornment: <InputAdornment position="start">🔒</InputAdornment>,
                }}
              />

              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span />
                <Link component={RouterLink} to="/forgot-password" variant="body2">Forgot Password?</Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
                disabled={loading || isSubmitting || submitTimeoutRef.current !== null}
              >
                {loading || isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register">Sign Up</Link>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 