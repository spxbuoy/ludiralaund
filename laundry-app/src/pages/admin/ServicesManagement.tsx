
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { usePermissions } from '../../hooks/usePermissions';

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: 'wash-fold' | 'dry-cleaning' | 'ironing' | 'stain-removal' | 'specialty';
  isActive: boolean;
  estimatedTime: string;
  requirements?: string;
  imageUrl?: string;
}

const ServicesManagement: React.FC = () => {
  const { canManageOrders } = usePermissions();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch services data from API
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
        console.log('Raw API response:', data);
        
        let servicesArray: any[] = [];
        
        if (data.success && data.data) {
          if (Array.isArray(data.data.docs)) {
            servicesArray = data.data.docs;
          } else if (Array.isArray(data.data)) {
            servicesArray = data.data;
          }
        }
        
        console.log('Services array extracted:', servicesArray);
        
        const mappedServices = servicesArray.map((service: any) => ({
          ...service,
          id: service._id || service.id,
        }));
        
        console.log('Mapped services:', mappedServices);
        setServices(mappedServices);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wash-fold': return 'primary';
      case 'dry-cleaning': return 'secondary';
      case 'ironing': return 'warning';
      case 'stain-removal': return 'error';
      case 'specialty': return 'info';
      default: return 'default';
    }
  };

  const servicesArray = Array.isArray(services) ? services : [];
  const validServicesArray = servicesArray.filter(
    service => service && service.id && typeof service.category === 'string' && typeof service.name === 'string'
  );

  if (!canManageOrders()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to manage services.
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

  const backendUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Services Overview
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Services are now statically configured in the system. Contact a developer to modify available services.
      </Alert>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Services
              </Typography>
              <Typography variant="h4">
                {servicesArray.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Services
              </Typography>
              <Typography variant="h4" color="success.main">
                {servicesArray.filter(s => s.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Categories
              </Typography>
              <Typography variant="h4" color="info.main">
                {new Set(servicesArray.map(s => s.category)).size}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Price
              </Typography>
              <Typography variant="h4" color="primary.main">
                ¢{servicesArray.length > 0 ? (servicesArray.reduce((sum, s) => sum + s.basePrice, 0) / servicesArray.length).toFixed(2) : '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {validServicesArray.map((service) => (
          <Box key={service.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 18px)' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {service.imageUrl && (
                <Box sx={{ width: '100%', textAlign: 'center', pt: 2 }}>
                  <img src={service.imageUrl.startsWith('http') ? service.imageUrl : `${backendUrl}${service.imageUrl}`}
                       alt={service.name || 'Service'}
                       style={{ maxWidth: '90%', maxHeight: 120, borderRadius: 8 }} />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {service.name || 'Unnamed Service'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {service.description || 'No description provided.'}
                    </Typography>
                  </Box>
                  <Chip
                    label={service.isActive ? 'Active' : 'Inactive'}
                    color={service.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={(service.category || '').replace('-', ' ')}
                    color={getCategoryColor(service.category || '')}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="h6" color="primary">
                    ¢{typeof service.basePrice === 'number' ? service.basePrice.toFixed(2) : '0.00'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estimated Time: {service.estimatedTime}
                </Typography>
                
                {service.requirements && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Requirements: {service.requirements}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ServicesManagement;
