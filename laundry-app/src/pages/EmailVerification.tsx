import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { verifyEmail } from '../features/auth/authSlice';

const EmailVerification: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { email, userId } = location.state || {};

  useEffect(() => {
    if (!email || !userId) {
      navigate('/register');
      return;
    }
  }, [email, userId, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError(null);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(verifyEmail({ email, code: verificationCode })).unwrap();
      
      setSuccess('Email verified successfully! Redirecting...');
      
      // Navigate based on user role
      setTimeout(() => {
        let targetPath = '/customer';
        switch (result.role) {
          case 'admin': targetPath = '/admin'; break;
          case 'service_provider': targetPath = '/provider'; break;
          case 'customer': targetPath = '/customer'; break;
          default: targetPath = '/customer';
        }
        navigate(targetPath, { replace: true });
      }, 1500);
    } catch (err) {
      setError('Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError(null);

    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Verification code resent successfully! Please check your email.');
        setCountdown(60); // 60 second cooldown
      } else {
        setError(data.error || 'Failed to resend verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email || !userId) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Verify Your Email
        </Typography>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          We've sent a 6-digit verification code to:
          <br />
          <strong>{email}</strong>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleVerifyEmail}>
          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            placeholder="000000"
            inputProps={{
              maxLength: 6,
              style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
            }}
            margin="normal"
            required
            autoComplete="off"
            error={!!error && verificationCode.length !== 6}
            helperText={verificationCode.length !== 6 ? 'Enter 6-digit code' : ''}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>
        </form>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Didn't receive the code?
          </Typography>
          
          <Button
            variant="text"
            onClick={handleResendCode}
            disabled={resendLoading || countdown > 0}
            sx={{ mt: 1 }}
          >
            {resendLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend Code'
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to Login
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailVerification; 