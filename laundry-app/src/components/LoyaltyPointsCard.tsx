import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import { Loyalty as LoyaltyIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface LoyaltyStatus {
  currentPoints: number;
  currentTier: string;
  pointsToNextTier: number;
  config: any;
}

const LoyaltyPointsCard: React.FC = () => {
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const navigate = useNavigate();

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

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        cursor: 'pointer',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
      onClick={() => navigate('/customer/loyalty')}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <LoyaltyIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Loyalty Points
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {loyaltyStatus?.currentTier || 'New Member'}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={getTierIcon(loyaltyStatus?.currentTier || 'New Member')}
            sx={{
              bgcolor: getTierColor(loyaltyStatus?.currentTier || 'New Member'),
              color: 'white',
              fontSize: '1.2rem',
            }}
          />
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
          {loyaltyStatus?.currentPoints || 0}
        </Typography>

        <Typography variant="body2" sx={{ textAlign: 'center', mb: 2, opacity: 0.8 }}>
          Available Points
        </Typography>

        {loyaltyStatus && loyaltyStatus.pointsToNextTier > 0 && (
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 2, opacity: 0.8 }}>
            {loyaltyStatus.pointsToNextTier} points to next tier
          </Typography>
        )}

        <Button
          variant="contained"
          fullWidth
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          View Loyalty Program
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoyaltyPointsCard;