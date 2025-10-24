import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Missing reset token.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.resetPassword({ resetToken: token, newPassword });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError('Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
      <Paper elevation={8} sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" color="textSecondary">
          Enter your new password
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

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="new-password"
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="new-password"
          />

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={isSubmitting || !token}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ResetPassword;