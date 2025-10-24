import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalLaundryService,
  DryCleaning,
  Iron,
  CleaningServices,
  Close,
  Phone,
  Email,
  WhatsApp,
} from '@mui/icons-material';

interface Service {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  imageUrl?: string;
  isActive?: boolean; // Added to match backend
}

interface ServiceSelectionProps {
  onServiceSelect: (serviceId: string) => void;
  onNext: () => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ onServiceSelect, onNext }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { API_BASE_URL } = await import('../../services/api');
        const response = await fetch(`${API_BASE_URL}/services`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }

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
        setServices((servicesArray as Service[]).filter(service => service.isActive));
      } catch (error) {
        console.error('Services fetch error:', error);
        setError('Failed to load services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'wash-fold':
        return <LocalLaundryService />;
      case 'dry-cleaning':
        return <DryCleaning />;
      case 'ironing':
        return <Iron />;
      case 'stain-removal':
        return <CleaningServices />;
      default:
        return <LocalLaundryService />;
    }
  };

  const getServiceImage = (category: string) => {
    switch (category) {
      case 'wash-fold':
        return '/image/wash and fold.jpg';
      case 'dry-cleaning':
        return '/image/drycleaning.webp';
      case 'ironing':
        return '/image/ironing.webp';
      case 'stain-removal':
        return '/image/stain removal.jpg';
      default:
        return '/image/wash and fold.jpg';
    }
  };

  const getServiceDetails = (category: string) => {
    switch (category) {
      case 'wash-fold':
        return [
          'Separated by color and fabric type',
          'Eco-friendly detergents',
          'Gentle washing cycles',
          'Professional folding',
          'Ready for pickup in 24 hours'
        ];
      case 'dry-cleaning':
        return [
          'Professional stain treatment',
          'Gentle cleaning process',
          'Special care for delicate fabrics',
          'Eco-friendly solvents',
          'Same-day service available'
        ];
      case 'ironing':
        return [
          'Professional pressing equipment',
          'Attention to detail',
          'Proper temperature control',
          'Special care for delicate fabrics',
          'Ready in 24 hours'
        ];
      case 'stain-removal':
        return [
          'Advanced stain treatment',
          'Specialized cleaning agents',
          'Pre-treatment assessment',
          'Guaranteed results',
          'Same-day service available'
        ];
      default:
        return [
          'Professional service',
          'Quality guaranteed',
          'Timely delivery'
        ];
    }
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
  };

  const handleCloseDialog = () => {
    setSelectedService(null);
  };

  const handleBookService = () => {
    if (selectedService) {
      onServiceSelect(selectedService._id); // Use _id from backend
      setSelectedService(null);
      onNext(); // Move to the next step
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Our Services
      </Typography>
      <Typography variant="h6" paragraph align="center" color="text.secondary" sx={{ mb: 6 }}>
        Professional laundry services tailored to your needs
      </Typography>

      {/* Services Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(Array.isArray(services) ? services : []).map((service) => (
          <Box key={service._id} sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(25% - 24px)' } }}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }}
              onClick={() => handleServiceClick(service)}
            >
              <CardMedia
                component="img"
                height="200"
                image={service.imageUrl || getServiceImage(service.category)}
                alt={service.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getServiceIcon(service.category)}
                  <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                    {service.name}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {service.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  Starting at ¢{service.basePrice}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Service Details Dialog */}
      <Dialog 
        open={!!selectedService} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedService && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getServiceIcon(selectedService.category)}
                  <Typography variant="h5" sx={{ ml: 1 }}>
                    {selectedService.name}
                  </Typography>
                </Box>
                <IconButton onClick={handleCloseDialog}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                  <img 
                    src={selectedService.imageUrl || getServiceImage(selectedService.category)} 
                    alt={selectedService.name}
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                  <Typography variant="h6" gutterBottom>
                    Service Details
                  </Typography>
                  <List>
                    {getServiceDetails(selectedService.category).map((detail: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CleaningServices color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={detail} />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Pricing
                  </Typography>
                  <Typography variant="body1" color="primary" gutterBottom>
                    Starting at ¢{selectedService.basePrice}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    sx={{ mt: 2 }}
                    onClick={handleBookService}
                  >
                    Book This Service
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Contact Information */}
      <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Contact Us
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 32px)' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone sx={{ mr: 1, color: 'primary.main' }} />
              <Typography>(555) 123-4567</Typography>
            </Box>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 32px)' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Email sx={{ mr: 1, color: 'primary.main' }} />
              <Typography>info@sparklingclean.com</Typography>
            </Box>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 32px)' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WhatsApp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography>WhatsApp: (555) 123-4567</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ServiceSelection; 