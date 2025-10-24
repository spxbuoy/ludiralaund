import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { authApi } from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('If this email exists, a reset link has been sent. Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
      <Paper elevation={8} sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Forgot Password
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" color="textSecondary">
          Enter your email to receive a reset link
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
          />

          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;