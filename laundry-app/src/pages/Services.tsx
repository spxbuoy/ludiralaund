import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
  Container,
  Card,
  CardContent,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  LocalLaundryService as LaundryIcon,
  DryCleaning as DryCleaningIcon,
  Iron as IronIcon,
  Bed as BedIcon,
  Curtains as CurtainsIcon,
  Business as BusinessIcon,
  LocalShipping as ShippingIcon,
  CleaningServices as CleaningIcon,
  DeliveryDining as DeliveryIcon,
  VerifiedUser as VerifiedIcon,
  Park as EcoIcon,
  Speed as SpeedIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const { API_BASE_URL } = await import('../services/api');
        const response = await fetch(`${API_BASE_URL}/services`);
        const data = await response.json();
        let servicesArray = [];
        if (Array.isArray(data)) {
          servicesArray = data;
        } else if (Array.isArray(data.services)) {
          servicesArray = data.services;
        } else if (Array.isArray(data.data)) {
          servicesArray = data.data;
        } else if (data.data && Array.isArray(data.data.services)) {
          servicesArray = data.data.services;
        }
        setServices(servicesArray.filter((service: any) => service.isActive));
      } catch (err: any) {
        setError('Failed to load services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const howItWorks = [
    {
      title: 'Place Order',
      description: 'Select your services and schedule pickup online.',
      icon: <LaundryIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Free Pickup',
      description: 'We collect your items from your doorstep.',
      icon: <ShippingIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Expert Cleaning',
      description: 'Our professionals clean and care for your garments.',
      icon: <CleaningIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Fresh Delivery',
      description: 'Your clean clothes are returned to you, ready to wear.',
      icon: <DeliveryIcon sx={{ fontSize: 40 }} />,
    },
  ];

  const differentiators = [
    {
      title: 'Quality Guarantee',
      description: 'We guarantee the quality of our service or your money back.',
      icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Eco-Friendly',
      description: 'Using environmentally friendly cleaning products.',
      icon: <EcoIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Fast Turnaround',
      description: 'Quick service without compromising quality.',
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer support for your convenience.',
      icon: <SupportIcon sx={{ fontSize: 40 }} />,
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" gutterBottom>
            Your Laundry, Our Care
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Eco-friendly washing with free pickup & delivery
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
            onClick={() => navigate('/new-order')}
          >
            Book Now
          </Button>
        </Container>
      </Box>

      {/* Introduction */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Professional Laundry Services
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
          Experience the convenience of professional laundry services. We handle your garments with care,
          using eco-friendly products and state-of-the-art equipment. Save time and enjoy fresh,
          perfectly cleaned clothes delivered right to your doorstep.
        </Typography>
      </Container>

      {/* Core Services */}
      <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom>
            Our Services
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <Box 
              sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center',
                mt: 2
              }}
            >
              {services.map((service, index) => (
                <Card
                  key={service._id || index}
                  sx={{
                    width: isMobile ? '100%' : 'calc(33.333% - 16px)',
                    minWidth: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  {service.imageUrl && (
                    <Box sx={{ width: '100%', textAlign: 'center', pt: 2 }}>
                      <img src={service.imageUrl} alt={service.name} style={{ maxWidth: '90%', maxHeight: 120, borderRadius: 8 }} />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      {service.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {service.description}
                    </Typography>
                    <Typography variant="subtitle2" color="primary">
                      Starting at ¢{service.basePrice}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" align="center" gutterBottom>
          How It Works
        </Typography>
        <Box 
          sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'center',
            mt: 2
          }}
        >
          {howItWorks.map((step, index) => (
            <Box 
              key={index}
              sx={{ 
                width: isMobile ? '100%' : 'calc(25% - 24px)',
                minWidth: 200,
                textAlign: 'center'
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {step.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Differentiators */}
      <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom>
            Why Choose Us
          </Typography>
          <Box 
            sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              justifyContent: 'center',
              mt: 2
            }}
          >
            {differentiators.map((item, index) => (
              <Paper
                key={index}
                sx={{
                  width: isMobile ? '100%' : 'calc(25% - 16px)',
                  minWidth: 200,
                  p: 3,
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom>
            Ready to Experience Our Service?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Book your laundry service now and enjoy the convenience of professional cleaning.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/new-order')}
          >
            Book Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Services; 