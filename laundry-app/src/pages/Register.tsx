import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Divider,
  Stack,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { register } from '../features/auth/authSlice';
import { UserRole } from '../types/auth';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import AppleIcon from '@mui/icons-material/Apple';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { formatUserData } from '../utils/textUtils';

const steps = ['Email Verification', 'User Information', 'Complete Registration'];

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as UserRole,
  });

  // Phone number validation functions
  const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
    const trimmed = phone.trim();
    if (!trimmed) {
      return { isValid: false, message: 'Phone number is required' };
    }

    // Allow common phone formats: digits, spaces, hyphens, parentheses, and a single leading +
    const cleaned = trimmed.replace(/[^\d+()\-\s]/g, '');
    const digitsOnly = cleaned.replace(/\D/g, '');

    // E.164 max is 15 digits (excluding +). Accept a broad range 6–15 digits
    if (digitsOnly.length < 6 || digitsOnly.length > 15) {
      return { isValid: false, message: 'Enter a valid phone number (6–15 digits)' };
    }

    // Ensure + appears at most once and only at the start if present
    const plusCount = (cleaned.match(/\+/g) || []).length;
    if (plusCount > 1 || (cleaned.includes('+') && cleaned[0] !== '+')) {
      return { isValid: false, message: 'Plus sign is only allowed at the beginning' };
    }

    return { isValid: true, message: '' };
  };

  const formatPhoneNumber = (value: string): string => {
    // Keep user's formatting but strip invalid characters; allow digits, spaces, hyphens, parentheses, and one leading +
    const clean = value.replace(/[^\d+()\-\s]/g, '');
    if (!clean) return '';

    // Ensure only one plus and only at the beginning
    if (clean[0] === '+') {
      return '+' + clean.slice(1).replace(/\+/g, '');
    }
    return clean.replace(/\+/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const formattedValue = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const checkEmailAvailability = async (): Promise<boolean> => {
    const ema = email.trim().toLowerCase();
    if (!ema) {
      setError('Email is required');
      return false;
    }
    setEmailCheckLoading(true);
    setError(null);
    try {
      const { API_BASE_URL } = await import('../services/api');
      const resp = await fetch(`${API_BASE_URL}/auth/email-available`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ema }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setEmailAvailable(null);
        setError(data.error || 'Failed to check email');
        return false;
      }
      if (data.available === false) {
        setEmailAvailable(false);
        setError('Email already registered');
        return false;
      }
      setEmailAvailable(true);
      return true;
    } catch (err) {
      setEmailAvailable(null);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    alert(`${provider} login will be implemented soon!`);
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return 'First name is required';
    }
    if (!formData.lastName.trim()) {
      return 'Last name is required';
    }
    
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      return phoneValidation.message;
    }
    
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  };

  const handleCheckEmail = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    // First check availability without sending a code
    const available = await checkEmailAvailability();
    if (!available) {
      return; // email is taken or check failed; don't proceed
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Verification code sent to your email!');
        setActiveStep(1);
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailVerified(true);
        setSuccess('Email verified successfully!');
        setActiveStep(2);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== REGISTRATION ATTEMPT STARTED ===');
    console.log('Form data:', { 
      email: email, 
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      password: formData.password ? '***' : 'empty',
      role: formData.role
    });
    
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      console.log('❌ Validation error:', validationError);
      setError(validationError);
      return;
    }

    if (!isEmailVerified) {
      setError('Please verify your email first');
      return;
    }

    console.log('✅ Starting registration process...');
    setLoading(true);
    try {
      // Format user data before sending to database (excluding password)
      const formattedUserData = formatUserData({
        email: email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      });

      console.log('🚀 Dispatching register action...');
      const result = await dispatch(register({
        ...formattedUserData,
        password: formData.password,
        role: formattedUserData.role as UserRole,
        verificationCode: verificationCode,
      })).unwrap();
      
      console.log('✅ Registration successful:', result);
      
      // After successful sign-up, redirect to login for explicit authentication
      console.log('🎯 Navigating to: /login');
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(typeof err === 'string' ? err : (err?.message || 'Registration failed. Please try again.'));
    } finally {
      console.log('🏁 Registration process finished');
      setLoading(false);
    }
  };

  const phoneValidation = validatePhoneNumber(formData.phoneNumber);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 1: Email Verification
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter your email address to receive a verification code
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailAvailable(null);
                setSuccess(null);
                if (error && error.toLowerCase().includes('email')) setError(null);
              }}
              onBlur={checkEmailAvailability}
              required
              sx={{ mb: 3 }}
              error={emailAvailable === false}
              helperText={emailAvailable === false ? 'Email already registered' : ''}
              InputProps={{
                endAdornment: (
                  emailCheckLoading ? (
                    <CircularProgress size={18} />
                  ) : email && emailAvailable !== null ? (
                    emailAvailable ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )
                  ) : null
                )
              }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleCheckEmail}
              disabled={loading || !email.trim() || emailAvailable === false || emailCheckLoading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 2: Verify Email
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter the 6-digit code sent to {email}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
              }}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{ flex: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                sx={{ flex: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify Code'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 3: Complete Registration
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Fill in your personal information to complete registration
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., +1 415 555 2671 or 024 123 4567"
                  error={formData.phoneNumber.length > 0 && !phoneValidation.isValid}
                  helperText={formData.phoneNumber.length > 0 ? phoneValidation.message : 'Enter your phone number'}
                  InputProps={{
                    endAdornment: formData.phoneNumber.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {phoneValidation.isValid ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  helperText={formData.password.length > 0 && formData.password.length < 8 ? 'Password must be at least 8 characters' : ''}
                  InputProps={{
                    endAdornment: formData.password.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {formData.password.length >= 8 ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  error={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword}
                  helperText={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword ? 'Passwords do not match' : ''}
                  InputProps={{
                    endAdornment: formData.confirmPassword.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {formData.password === formData.confirmPassword ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading || !phoneValidation.isValid}
                >
                  {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
                </Button>
              </Box>
            </form>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Left brand/illustration panel (hidden on small) */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, md: 6 },
          }}
        >
          <Box sx={{ color: 'white', maxWidth: 520 }}>
            <Typography variant={isXs ? 'h4' : 'h3'} fontWeight={700}>
              Create your Laundry App account
            </Typography>
            <Typography variant={isXs ? 'body1' : 'h6'} sx={{ opacity: 0.9, mt: 1.5 }}>
              Verify your email and complete a few details to get started with our services.
            </Typography>
          </Box>
        </Box>

        {/* Right form panel */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Paper
            elevation={10}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              width: '100%',
              maxWidth: 560,
              borderRadius: 3,
              mx: 'auto',
            }}
          >
            <Typography variant={isXs ? 'h5' : 'h4'} align="center" gutterBottom fontWeight={700}>
              Create Account
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Create your customer account to start using our laundry services
            </Typography>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: { xs: 2, sm: 4 } }} alternativeLabel={isXs}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Animated decorative element on first step */}
            {activeStep === 0 && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: { xs: 160, sm: 200 },
                    height: 8,
                    bgcolor: 'grey.200',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    '::before': {
                      content: '""',
                      position: 'absolute',
                      top: -6,
                      left: 0,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      animation: 'moveDot 1.6s ease-in-out infinite',
                    },
                    '@keyframes moveDot': {
                      '0%': { transform: 'translateX(0)' },
                      '50%': { transform: 'translateX(140px)' },
                      '100%': { transform: 'translateX(0)' },
                    },
                  }}
                />
              </Box>
            )}

            {renderStepContent(activeStep)}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login">Sign In</Link>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Register; 