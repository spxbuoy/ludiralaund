import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
} from '@mui/material';
import {
  Loyalty as LoyaltyIcon,
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
  Redeem as RedeemIcon,
  History as HistoryIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../app/hooks';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface LoyaltyStatus {
  currentPoints: number;
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
  history: any[];
  config: any;
}

const LoyaltyProgram: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Theme
  const [mode] = useState<'light' | 'dark'>('light');
  const theme = createTheme({ palette: { mode } });

  useEffect(() => {
    fetchLoyaltyStatus();
  }, []);

  const fetchLoyaltyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/loyalty/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyStatus(data);
      }
    } catch (error) {
      console.error('Error fetching loyalty status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!redeemPoints || parseInt(redeemPoints) <= 0) {
      setError('Please enter a valid number of points');
      return;
    }

    setRedeemLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: parseInt(redeemPoints) }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully redeemed ${redeemPoints} points for $${data.discountValue.toFixed(2)} discount!`);
        setRedeemDialogOpen(false);
        setRedeemPoints('');
        fetchLoyaltyStatus(); // Refresh loyalty status
      } else {
        setError(data.error || 'Failed to redeem points');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum': return '#e5e4e2';
      case 'gold': return '#ffd700';
      case 'silver': return '#c0c0c0';
      case 'bronze': return '#cd7f32';
      default: return '#667eea';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '⭐';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

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
          {/* Header */}
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
              Loyalty Program
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Earn points with every order and redeem them for exclusive rewards
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3 }}>
            {/* Current Status Card */}
            <Box sx={{ flex: 1 }}>
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
                    <Avatar sx={{ bgcolor: getTierColor(loyaltyStatus?.currentTier || 'New Member') }}>
                      {getTierIcon(loyaltyStatus?.currentTier || 'New Member')}
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {loyaltyStatus?.currentTier || 'New Member'}
                    </Typography>
                  }
                  subheader="Your current tier"
                />
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                      {loyaltyStatus?.currentPoints || 0}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Available Points
                    </Typography>
                  </Box>

                  {loyaltyStatus && loyaltyStatus.pointsToNextTier > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Progress to {loyaltyStatus.nextTier}</Typography>
                        <Typography variant="body2">
                          {loyaltyStatus.pointsToNextTier} points to go
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, ((loyaltyStatus.currentPoints / (loyaltyStatus.currentPoints + loyaltyStatus.pointsToNextTier)) * 100))}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#667eea',
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<RedeemIcon />}
                    onClick={() => setRedeemDialogOpen(true)}
                    disabled={!loyaltyStatus || loyaltyStatus.currentPoints < (loyaltyStatus.config?.minimumPointsForRedemption || 100)}
                    sx={{
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                      },
                    }}
                  >
                    Redeem Points
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* How It Works Card */}
            <Box sx={{ flex: 2 }}>
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
                      <TrophyIcon />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      How It Works
                    </Typography>
                  }
                  subheader="Earn points and unlock rewards"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        flex: 1,
                      }}
                    >
                      <ShoppingCartIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Earn Points
                      </Typography>
                      <Typography variant="body2">
                        Get 1 point for every $1 spent on completed orders
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                        color: 'white',
                        flex: 1,
                      }}
                    >
                      <StarIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Level Up
                      </Typography>
                      <Typography variant="body2">
                        Unlock higher tiers with more points for better rewards
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                        color: 'white',
                        flex: 1,
                      }}
                    >
                      <RedeemIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Redeem Rewards
                      </Typography>
                      <Typography variant="body2">
                        Use points for discounts on future orders
                      </Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Points History Card */}
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
                <Avatar sx={{ bgcolor: '#ff9800' }}>
                  <HistoryIcon />
                </Avatar>
              }
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Points History
                </Typography>
              }
              subheader="Your recent loyalty activity"
            />
            <CardContent>
              {loyaltyStatus && loyaltyStatus.history.length > 0 ? (
                <List>
                  {loyaltyStatus.history.slice(0, 10).map((entry: any, index: number) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {entry.type === 'earned' ? (
                            <CheckCircleIcon sx={{ color: '#4caf50' }} />
                          ) : entry.type === 'redeemed' ? (
                            <RedeemIcon sx={{ color: '#ff9800' }} />
                          ) : (
                            <HistoryIcon sx={{ color: '#9e9e9e' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={entry.description}
                          secondary={new Date(entry.timestamp).toLocaleDateString()}
                        />
                        <Chip
                          label={`${entry.type === 'redeemed' ? '-' : '+'}${entry.points} points`}
                          color={entry.type === 'earned' ? 'success' : entry.type === 'redeemed' ? 'warning' : 'default'}
                          size="small"
                        />
                      </ListItem>
                      {index < loyaltyStatus.history.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LoyaltyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No loyalty activity yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete your first order to start earning points!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Redeem Points Dialog */}
          <Dialog
            open={redeemDialogOpen}
            onClose={() => setRedeemDialogOpen(false)}
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
              Redeem Loyalty Points
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Available Points: <strong>{loyaltyStatus?.currentPoints || 0}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Minimum redemption: {loyaltyStatus?.config?.minimumPointsForRedemption || 100} points
                  <br />
                  Value: $0.01 per point
                </Typography>

                <TextField
                  fullWidth
                  label="Points to Redeem"
                  type="number"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                  InputProps={{
                    inputProps: {
                      min: loyaltyStatus?.config?.minimumPointsForRedemption || 100,
                      max: loyaltyStatus?.currentPoints || 0
                    }
                  }}
                  helperText={
                    redeemPoints &&
                    `You'll get $${((parseInt(redeemPoints) || 0) * (loyaltyStatus?.config?.redemptionValue || 0.01)).toFixed(2)} discount`
                  }
                />
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
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setRedeemDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRedeemPoints}
                variant="contained"
                disabled={redeemLoading || !redeemPoints}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  },
                }}
              >
                {redeemLoading ? 'Redeeming...' : 'Redeem Points'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default LoyaltyProgram;