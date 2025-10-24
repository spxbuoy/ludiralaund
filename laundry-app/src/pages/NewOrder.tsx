import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormControl,
  FormLabel,
  Collapse,
  IconButton,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Container,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import {
  Checkroom,
  LocationOn,
  Event,
  CreditCard,
  Add,
  Remove,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Phone,
  AccountBalance,
  Smartphone,
  AttachMoney,
} from '@mui/icons-material';
import PaystackPayment from '../components/PaystackPayment';

// Define interfaces
interface ClothingItem {
  itemId: string;
  description: string;
  service: string;
  serviceName: string;
  unitPrice: number;
  isConfirmed?: boolean;
  specialInstructions?: string;
}

interface Service {
  _id: string;
  id?: string;
  name: string;
  description: string;
  price?: number;
  basePrice?: number;
  category: string;
  imageUrl?: string;
  estimatedTime?: string;
  requirements?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  quantity?: number;
  icon?: string;
  specialInstructions?: string;
  clothingItems?: ClothingItem[];
}

interface OrderData {
  items: Service[];
  pickupAddress: {
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  deliveryAddress: {
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  pickupDate: string;
  deliveryDate: string;
  paymentMethod: string;
  paymentTiming: string;
  specialInstructions: string;
  isUrgent: boolean;
  priority: string;
  momoPhone: string;
  momoNetwork: string;
}

const NewOrderPage = () => {
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [expandedSection, setExpandedSection] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [orderData, setOrderData] = useState<OrderData>({
    items: [],
    pickupAddress: { type: 'home', street: '', city: '', state: '', zipCode: '', instructions: '' },
    deliveryAddress: { type: 'home', street: '', city: '', state: '', zipCode: '', instructions: '' },
    pickupDate: '',
    deliveryDate: '',
    paymentMethod: '',
    paymentTiming: 'before_pickup',
    specialInstructions: '',
    isUrgent: false,
    priority: 'normal',
    momoPhone: '',
    momoNetwork: 'mtn',
  });

  // Auth user info for payment initialization
  const authUser = useSelector((state: RootState) => (state as any)?.auth?.user);
  const safeLocalUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {} as any;
    }
  }, []);
  const customerEmail = (authUser?.email || safeLocalUser?.email || '').trim();
  const customerName = `${authUser?.firstName || safeLocalUser?.firstName || ''} ${authUser?.lastName || safeLocalUser?.lastName || ''}`.trim();

  // Paystack payment dialog state
  const [showPaystackDialog, setShowPaystackDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const getServiceIcon = (category: string): string => {
    switch (category) {
      case 'wash-fold':
        return '🧺';
      case 'dry-cleaning':
        return '👔';
      case 'ironing':
        return '👕';
      default:
        return '🏠';
    }
  };

  // Load static services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const { API_BASE_URL } = await import('../services/api');
        const response = await fetch(`${API_BASE_URL}/services/static`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }

        const result = await response.json();
        console.log('Static Services API response:', JSON.stringify(result, null, 2));

        if (result.success && Array.isArray(result.data)) {
          const mappedServices = result.data.map((service: any) => ({
            ...service,
            _id: service.id || service._id, // Ensure _id is always a string
            price: service.basePrice || service.price || 0,
            icon: getServiceIcon(service.category)
          }));
          setServices(mappedServices);
          console.log('Static services loaded:', mappedServices);
        } else {
          setError('Failed to load services');
          setServices([]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error loading services:', errorMessage, error);
        setError(`Failed to load services: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const steps = [
    { title: 'Select Services', icon: <Checkroom /> },
    { title: 'Pickup & Delivery', icon: <LocationOn /> },
    { title: 'Payment Details', icon: <CreditCard /> },
    { title: 'Order Summary', icon: <CheckCircle /> },
  ];

  // Calculate totals based on individual clothing items
  const calculateSubtotal = () => {
    return selectedServices.reduce((sum, service) => {
      if (service.clothingItems && service.clothingItems.length > 0) {
        // Calculate based on individual items
        return sum + service.clothingItems.reduce((itemSum, item) => itemSum + (item.unitPrice || 0), 0);
      } else {
        // Fallback to quantity-based calculation
        return sum + (service.price || 0) * (service.quantity || 0);
      }
    }, 0);
  };

  const calculateTax = (subtotal: number) => subtotal * 0.1;

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const deliveryFee = orderData.isUrgent ? 10 : 5;
    return subtotal + tax + deliveryFee;
  };

  // Helper: parse estimatedTime like "24-48 hours", "24 hours", "Same day", "2-3 days"
  const parseEstimatedTimeToDays = (estimated?: string): number => {
    if (!estimated) return 2; // default 2 days
    const lower = estimated.toLowerCase();
    if (lower.includes('same day')) return 1;
    const match = lower.match(/(\d+)(?:-(\d+))?\s*(hour|hours|day|days|week|weeks)/);
    if (!match) return 2;
    const start = parseInt(match[1], 10);
    const unit = match[3];
    let days = start;
    if (unit.startsWith('hour')) {
      days = Math.ceil(start / 24);
    } else if (unit.startsWith('week')) {
      days = start * 7;
    }
    return Math.max(1, days);
  };

  // Compute delivery date when pickup date, service, or urgent flag changes
  useEffect(() => {
    if (!orderData.pickupDate) return;
    // Use first selected service's estimatedTime for duration
    const selected = selectedServices[0];
    const baseDays = parseEstimatedTimeToDays(selected?.estimatedTime);
    const durationDays = orderData.isUrgent ? Math.max(1, Math.ceil(baseDays / 2)) : baseDays;
    const pickup = new Date(orderData.pickupDate + 'T00:00:00');
    const delivery = new Date(pickup);
    delivery.setDate(pickup.getDate() + durationDays);
    const yyyy = delivery.getFullYear();
    const mm = String(delivery.getMonth() + 1).padStart(2, '0');
    const dd = String(delivery.getDate()).padStart(2, '0');
    const deliveryStr = `${yyyy}-${mm}-${dd}`;
    setOrderData((prev) => ({ ...prev, deliveryDate: deliveryStr }));
  }, [orderData.pickupDate, orderData.isUrgent, selectedServices]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  // Legacy handlers - kept for backward compatibility if needed
  const handleServiceQuantityChange = (service: Service, change: number) => {
    // This is now mainly used for fallback scenarios
    const serviceId = service._id || service.id;
    const selectedService = selectedServices.find((s) => (s._id || s.id) === serviceId);
    const currentQuantity = selectedService?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity === 0) {
      setSelectedServices((prev) => prev.filter((s) => (s._id || s.id) !== serviceId));
    } else if (selectedService) {
      setSelectedServices((prev) =>
        prev.map((s) => ((s._id || s.id) === serviceId ? { ...s, quantity: newQuantity } : s))
      );
    } else {
      setSelectedServices((prev) => [...prev, { ...service, quantity: newQuantity, price: service.basePrice || service.price || 0, icon: getServiceIcon(service.category) }]);
    }
  };

  const copyPickupToDelivery = () => {
    setOrderData((prev) => ({
      ...prev,
      deliveryAddress: { ...prev.pickupAddress },
    }));
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validate required data
      if (selectedServices.length === 0) {
        throw new Error('Please select at least one service');
      }

      if (!orderData.pickupAddress.street || !orderData.deliveryAddress.street) {
        throw new Error('Pickup and delivery addresses are required');
      }

      if (!orderData.pickupDate || !orderData.deliveryDate) {
        throw new Error('Pickup and delivery dates are required');
      }

      if (!orderData.paymentMethod) {
        throw new Error('Payment method is required');
      }

      // Calculate totals
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const deliveryFee = orderData.isUrgent ? 10 : 5;
      const totalAmount = subtotal + tax + deliveryFee;

      // Prepare order data with individual clothing items
      const orderPayload = {
        items: selectedServices.map((service) => ({
          service: service._id || service.id, // Use _id first, fallback to id
          serviceName: service.name,
          quantity: service.quantity || 0,
          unitPrice: service.price || service.basePrice || 0,
          totalPrice: service.clothingItems && service.clothingItems.length > 0
            ? service.clothingItems.reduce((sum, item) => sum + (item.unitPrice || 0), 0)
            : (service.price || service.basePrice || 0) * (service.quantity || 0),
          specialInstructions: service.specialInstructions || '',
          // Include individual clothing items
          clothingItems: service.clothingItems || []
        })),
        pickupAddress: {
          type: orderData.pickupAddress.type || 'home',
          street: orderData.pickupAddress.street,
          city: orderData.pickupAddress.city,
          state: orderData.pickupAddress.state,
          zipCode: orderData.pickupAddress.zipCode,
          instructions: orderData.pickupAddress.instructions || ''
        },
        deliveryAddress: {
          type: orderData.deliveryAddress.type || 'home',
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          state: orderData.deliveryAddress.state,
          zipCode: orderData.deliveryAddress.zipCode,
          instructions: orderData.deliveryAddress.instructions || ''
        },
        pickupDate: orderData.pickupDate,
        deliveryDate: orderData.deliveryDate,
        paymentMethod: orderData.paymentMethod,
        isUrgent: orderData.isUrgent,
        priority: orderData.priority,
        specialInstructions: orderData.specialInstructions || '',
        subtotal: subtotal,
        tax: tax,
        deliveryFee: deliveryFee,
        totalAmount: totalAmount
      };

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      console.log('Submitting order payload:', JSON.stringify(orderPayload, null, 2));

      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit order');
      }

      console.log('Order created:', result.data);
      const createdOrder = result.data;

      // Check if payment method requires immediate payment (mobile money or card)
      if (orderData.paymentMethod === 'momo' || orderData.paymentMethod === 'mobile_money' || orderData.paymentMethod === 'credit_card') {
        // Store order ID and show payment dialog
        setCreatedOrderId(createdOrder._id);
        setShowPaystackDialog(true);
      } else {
        // For cash payments, just show success message
        alert('Order submitted successfully! You can track its progress in the Orders section.');
        resetForm();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Order submission error:', errorMessage, error);
      setError(errorMessage);
      alert(`Failed to submit order: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setOrderData({
      items: [],
      pickupAddress: { type: 'home', street: '', city: '', state: '', zipCode: '', instructions: '' },
      deliveryAddress: { type: 'home', street: '', city: '', state: '', zipCode: '', instructions: '' },
      pickupDate: '',
      deliveryDate: '',
      paymentMethod: '',
      paymentTiming: 'before_pickup',
      specialInstructions: '',
      isUrgent: false,
      priority: 'normal',
      momoPhone: '',
      momoNetwork: 'mtn',
    });
    setSelectedServices([]);
    setActiveStep(0);
    setCreatedOrderId(null);
    setShowPaystackDialog(false);
  };

  // Handle successful payment
  const handlePaymentSuccess = async (reference: string) => {
    setPaymentProcessing(false);
    setShowPaystackDialog(false);
    
    alert('Payment completed successfully! Your order is now confirmed.');
    
    // Navigate to orders page to show the confirmed order
    const navigate = () => {
      window.location.href = '/orders';
    };
    navigate();
    
    resetForm();
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentProcessing(false);
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}. You can retry payment from the Orders page.`);
    
    // Still navigate to orders page so user can see their order
    const navigate = () => {
      window.location.href = '/orders';
    };
    navigate();
  };

  // Handle payment dialog close
  const handlePaymentDialogClose = () => {
    if (!paymentProcessing) {
      setShowPaystackDialog(false);
      // Navigate to orders page
      const navigate = () => {
        window.location.href = '/orders';
      };
      navigate();
    }
  };

  // Stepper Component
  const StepperComponent = () => (
    <Box sx={{ mb: 4 }}>
      <Stepper activeStep={activeStep}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel icon={step.icon}>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );

  // Service Selection Step as a separate component (so its hooks don't affect parent hook order)
  const ServiceSelectionStep: React.FC<{
    services: Service[];
    selectedServices: Service[];
    setSelectedServices: React.Dispatch<React.SetStateAction<Service[]>>;
    error: string | null;
    loading: boolean;
    calculateSubtotal: () => number;
  }> = ({ services, selectedServices, setSelectedServices, error, loading, calculateSubtotal }) => {
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemInstructions, setNewItemInstructions] = useState('');
    const descriptionInputRef = useRef<HTMLInputElement | null>(null);

    const handleAddIndividualItem = () => {
      if (!selectedServiceId || !newItemDescription.trim()) return;

      const service = services.find(s => s._id === selectedServiceId);
      if (!service) return;

      const existingServiceIndex = selectedServices.findIndex(s => s._id === selectedServiceId);
      const tempItemId = `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newClothingItem = {
        itemId: tempItemId,
        description: newItemDescription.trim(),
        service: selectedServiceId,
        serviceName: service.name,
        unitPrice: service.basePrice || service.price || 0,
        specialInstructions: newItemInstructions.trim(),
        isConfirmed: false
      };

      if (existingServiceIndex >= 0) {
        // Add to existing service
        const updatedServices = [...selectedServices];
        if (!updatedServices[existingServiceIndex].clothingItems) {
          updatedServices[existingServiceIndex].clothingItems = [];
        }
        updatedServices[existingServiceIndex].clothingItems!.push(newClothingItem);
        updatedServices[existingServiceIndex].quantity = updatedServices[existingServiceIndex].clothingItems!.length;
        setSelectedServices(updatedServices);
      } else {
        // Create new service with this item
        const newService: Service = {
          ...service,
          quantity: 1,
          clothingItems: [newClothingItem]
        };
        setSelectedServices([...selectedServices, newService]);
      }

      setNewItemDescription('');
      setNewItemInstructions('');
      // Re-focus description for quick multi-add
      setTimeout(() => descriptionInputRef.current?.focus(), 0);
    };

    const handleRemoveItem = (serviceId: string, itemId: string) => {
      const updatedServices = selectedServices.map(service => {
        if (service._id === serviceId && service.clothingItems) {
          const filteredItems = service.clothingItems.filter(item => item.itemId !== itemId);
          return {
            ...service,
            clothingItems: filteredItems,
            quantity: filteredItems.length
          };
        }
        return service;
      }).filter(service => (service.quantity ?? 0) > 0);

      setSelectedServices(updatedServices);
    };

    const getTotalItemsCount = () => {
      return selectedServices.reduce((total, service) => {
        return total + (service.clothingItems?.length || 0);
      }, 0);
    };

    const quickAddItems = (serviceId: string, items: string[]) => {
      const service = services.find(s => s._id === serviceId);
      if (!service) return;

      const existingServiceIndex = selectedServices.findIndex(s => s._id === serviceId);
      const newClothingItems = items.map(item => ({
        itemId: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: item,
        service: serviceId,
        serviceName: service.name,
        unitPrice: service.basePrice || service.price || 0,
        specialInstructions: '',
        isConfirmed: false
      }));

      if (existingServiceIndex >= 0) {
        const updatedServices = [...selectedServices];
        if (!updatedServices[existingServiceIndex].clothingItems) {
          updatedServices[existingServiceIndex].clothingItems = [];
        }
        updatedServices[existingServiceIndex].clothingItems!.push(...newClothingItems);
        updatedServices[existingServiceIndex].quantity = updatedServices[existingServiceIndex].clothingItems!.length;
        setSelectedServices(updatedServices);
      } else {
        const newService: Service = {
          ...service,
          quantity: newClothingItems.length,
          clothingItems: newClothingItems
        };
        setSelectedServices([...selectedServices, newService]);
      }
    };

    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" align="center" gutterBottom>
          Add Your Clothing Items
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 2 }}>
          Select a service and add each clothing item individually for precise tracking
        </Typography>
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>How it works:</strong> Choose a service type (wash, dry cleaning, etc.), then add as many individual items as you need.
            Each item gets its own unique ID for tracking through the cleaning process.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && services.length === 0 && !error && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            No services available. Please try again later.
          </Alert>
        )}

        {!loading && services.length > 0 && (
          <>
            {/* Service Selection */}
            <Card sx={{ mb: 4, p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Step 1: Choose a Service Type
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the type of cleaning service you need for your items
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Service"
                  value={selectedServiceId || ''}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  placeholder="Select a service"
                >
                  {services.map((service) => (
                    <MenuItem key={service._id || service.id} value={service._id || service.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{service.icon}</span>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
                          {service.name} — ¢{(service.basePrice || service.price || 0).toFixed(2)} {service.estimatedTime ? `(${service.estimatedTime})` : ''}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                {/* Optional: show selected service details below dropdown */}
                {selectedServiceId && (
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {services.find(s => (s._id || s.id) === selectedServiceId)?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {services.find(s => (s._id || s.id) === selectedServiceId)?.description}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Card>

            {/* Item Entry Form - Always stays visible when service is selected */}
            {selectedServiceId && (
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Left Column - Item Entry Form */}
                <Card sx={{
                  flex: { xs: 1, lg: '1 1 60%' },
                  p: 3,
                  border: 2,
                  borderColor: 'primary.main',
                  position: 'sticky',
                  top: 20,
                  height: 'fit-content'
                }}>
                  <Typography variant="h5" gutterBottom>
                    Step 2: Add Your Items (One by One)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Selected Service: <strong>{services.find(s => s._id === selectedServiceId)?.name}</strong>
                  </Typography>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Keep adding items:</strong> Enter each item's description and press "Add Item".
                      The form stays here so you can keep adding more items easily!
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: 'column' }}>
                    <TextField
                      inputRef={descriptionInputRef}
                      label="Item Description *"
                      placeholder="e.g., Blue dress shirt, Black jeans, White T-shirt"
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      fullWidth
                      required
                      helperText="Be specific - this helps us track your item"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newItemDescription.trim()) {
                          e.preventDefault();
                          handleAddIndividualItem();
                        }
                      }}
                    />
                    <TextField
                      label="Special Instructions (Optional)"
                      placeholder="e.g., Handle with care, No bleach, Gentle cycle"
                      value={newItemInstructions}
                      onChange={(e) => setNewItemInstructions(e.target.value)}
                      fullWidth
                      helperText="Any special care instructions"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleAddIndividualItem}
                      disabled={!newItemDescription.trim()}
                      sx={{ flex: 1 }}
                    >
                      Add This Item
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => {
                        setNewItemDescription('');
                        setNewItemInstructions('');
                        setTimeout(() => descriptionInputRef.current?.focus(), 0);
                      }}
                      sx={{ flex: 1 }}
                    >
                      Clear Form
                    </Button>
                  </Box>

                  {/* Quick Add Examples */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Quick Add Common Items:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {[
                        ['White shirt', 'Black pants', 'Blue jeans'],
                        ['Cotton T-shirt', 'Dress shirt', 'Polo shirt'],
                        ['Blouse', 'Skirt', 'Dress'],
                        ['Sweater', 'Jacket', 'Hoodie']
                      ].map((itemGroup, index) => (
                        <Button
                          key={index}
                          size="small"
                          variant="outlined"
                          onClick={() => quickAddItems(selectedServiceId, itemGroup)}
                          sx={{ mb: 1, fontSize: '0.75rem' }}
                        >
                          + {itemGroup.join(', ')}
                        </Button>
                      ))}
                    </Box>
                  </Box>

                  {/* Current items count */}
                  {selectedServices.length > 0 && (
                    <Alert severity="info" sx={{ mt: 3 }}>
                      <Typography variant="body2">
                        ✅ <strong>{getTotalItemsCount()} items added</strong> - Keep adding more or proceed to step 2 when ready!
                      </Typography>
                    </Alert>
                  )}
                </Card>

                {/* Right Column - Items Preview (only show if items exist) */}
                {selectedServices.length > 0 && (
                  <Box sx={{ flex: { xs: 1, lg: '1 1 40%' } }}>
                    <Card sx={{ p: 3, bgcolor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        Added Items ({getTotalItemsCount()})
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Preview of your items - you can remove any if needed
                      </Typography>
                      {selectedServices.map((service) => (
                        <Box key={service._id || service.id} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                            {service.name} - ¢{(service.basePrice || service.price || 0).toFixed(2)} each
                          </Typography>
                          {service.clothingItems?.map((item, index) => (
                            <Box key={item.itemId} sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1,
                              px: 2,
                              mb: 1,
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              fontSize: '0.875rem'
                            }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  #{index + 1} - {item.description}
                                </Typography>
                                {item.specialInstructions && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.specialInstructions}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="primary">
                                  ¢{item.unitPrice.toFixed(2)}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveItem((service._id || service.id) as string, item.itemId)}
                                  sx={{ color: 'error.main', p: 0.5 }}
                                >
                                  <Remove fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ))}
                      <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">Subtotal ({getTotalItemsCount()} items):</Typography>
                          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                            ¢{calculateSubtotal().toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    );
  };

  // Address Selection Component
  const renderAddressSelectionStep = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h2" align="center" gutterBottom>
        Pickup & Delivery Details
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Tell us where to collect and deliver your items
      </Typography>
      <Card sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">Pickup Address</Typography>
        </Box>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup
            row
            name="pickupType"
            value={orderData.pickupAddress.type}
            onChange={(e) => setOrderData((prev) => ({ ...prev, pickupAddress: { ...prev.pickupAddress, type: e.target.value } }))}
          >
            {['home', 'work', 'other'].map((type) => (
              <FormControlLabel key={type} value={type} control={<Radio />} label={type.charAt(0).toUpperCase() + type.slice(1)} />
            ))}
          </RadioGroup>
        </FormControl>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Street Address"
            value={orderData.pickupAddress.street}
            onChange={(e) => {
              const value = e.target.value;
              setOrderData((prev) => ({
                ...prev,
                pickupAddress: { ...prev.pickupAddress, street: value }
              }));
            }}
            autoComplete="off"
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              sx={{ flex: '1 1 200px' }}
              label="City"
              value={orderData.pickupAddress.city}
              onChange={(e) => {
                const value = e.target.value;
                setOrderData((prev) => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, city: value }
                }));
              }}
              autoComplete="off"
            />
            <TextField
              sx={{ flex: '1 1 200px' }}
              label="Region"
              value={orderData.pickupAddress.state}
              onChange={(e) => {
                const value = e.target.value;
                setOrderData((prev) => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, state: value }
                }));
              }}
              autoComplete="off"
            />
            <TextField
              sx={{ flex: '1 1 200px' }}
              label="Zip Code"
              value={orderData.pickupAddress.zipCode}
              onChange={(e) => {
                const value = e.target.value;
                setOrderData((prev) => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, zipCode: value }
                }));
              }}
              autoComplete="off"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Special Instructions"
            value={orderData.pickupAddress.instructions}
            onChange={(e) => {
              const value = e.target.value;
              setOrderData((prev) => ({
                ...prev,
                pickupAddress: { ...prev.pickupAddress, instructions: value }
              }));
            }}
            autoComplete="off"
          />
        </Box>
      </Card>
      <Card sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOn sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h5">Delivery Address</Typography>
          </Box>
          <Button variant="outlined" onClick={copyPickupToDelivery}>
            Same as pickup
          </Button>
        </Box>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup
            row
            name="deliveryType"
            value={orderData.deliveryAddress.type}
            onChange={(e) => setOrderData((prev) => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, type: e.target.value } }))}
          >
            {['home', 'work', 'other'].map((type) => (
              <FormControlLabel key={type} value={type} control={<Radio />} label={type.charAt(0).toUpperCase() + type.slice(1)} />
            ))}
          </RadioGroup>
        </FormControl>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Street Address"
            value={orderData.deliveryAddress.street}
            onChange={(e) => {
              const value = e.target.value;
              setOrderData((prev) => ({
                ...prev,
                deliveryAddress: { ...prev.deliveryAddress, street: value }
              }));
            }}
            autoComplete="off"
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              sx={{ flex: '1 1 200px' }}
              label="City"
              value={orderData.deliveryAddress.city}
              onChange={(e) => {
                const value = e.target.value;
                setOrderData((prev) => ({
                  ...prev,
                  deliveryAddress: { ...prev.deliveryAddress, city: value }
                }));
              }}
              autoComplete="off"
            />
            <TextField
              sx={{ flex: '1 1 200px' }}
              label="Region"
              value={orderData.deliveryAddress.state}
              onChange={(e) => {
                const value = e.target.value;
                setOrderData((prev) => ({
                  ...prev,
                  deliveryAddress: { ...prev.deliveryAddress, state: value }
                }));
              }}
              autoComplete="off"
            />
            <TextField
              sx={{ flex: '1 1 200px' }}
              label="Zip Code"
              value={orderData.deliveryAddress.zipCode}
              onChange={(e) => {
                const value = e.target.value;
                setOrderData((prev) => ({
                  ...prev,
                  deliveryAddress: { ...prev.deliveryAddress, zipCode: value }
                }));
              }}
              autoComplete="off"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Special Instructions"
            value={orderData.deliveryAddress.instructions}
            onChange={(e) => {
              const value = e.target.value;
              setOrderData((prev) => ({
                ...prev,
                deliveryAddress: { ...prev.deliveryAddress, instructions: value }
              }));
            }}
            autoComplete="off"
          />
        </Box>
      </Card>
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Event sx={{ mr: 1, color: 'secondary.main' }} />
          <Typography variant="h5">Schedule Service</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              sx={{ flex: '1 1 200px' }}
              type="date"
              label="Pickup Date"
              value={orderData.pickupDate}
              onChange={(e) => setOrderData((prev) => ({ ...prev, pickupDate: e.target.value }))}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              sx={{ flex: '1 1 200px' }}
              type="date"
              label="Delivery Date"
              value={orderData.deliveryDate}
              disabled
              helperText="Delivery date is calculated from service duration"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <FormControlLabel
            control={<Checkbox checked={orderData.isUrgent} onChange={(e) => setOrderData((prev) => ({ ...prev, isUrgent: e.target.checked }))} />}
            label={
              <Box>
                <Typography>Urgent Service (+¢10.00)</Typography>
                <Typography variant="caption" color="text.secondary">Urgent halves the delivery duration.</Typography>
              </Box>
            }
          />
        </Box>
      </Card>
    </Box>
  );

  const renderPaymentSelectionStep = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h2" align="center" gutterBottom>
        Payment Details
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Choose when and how you'd like to pay
      </Typography>
      <Card sx={{ mb: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          When would you like to pay?
        </Typography>
        <RadioGroup
          name="paymentTiming"
          value={orderData.paymentTiming}
          onChange={(e) => setOrderData((prev) => ({ ...prev, paymentTiming: e.target.value }))}
        >
          <FormControlLabel
            value="before_pickup"
            control={<Radio />}
            label={
              <Box>
                <Typography>Pay Before Pickup</Typography>
                <Typography variant="body2" color="text.secondary">
                  Secure your order with advance payment
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="before_delivery"
            control={<Radio />}
            label={
              <Box>
                <Typography>Pay Before Delivery</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay after your items are cleaned and ready for delivery
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </Card>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Select Payment Method
        </Typography>
        <RadioGroup
          name="paymentMethod"
          value={orderData.paymentMethod}
          onChange={(e) => setOrderData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
        >
          {[
            { value: 'momo', label: 'Mobile Money (MoMo)', sublabel: 'Pay securely with MTN MoMo or AirtelTigo Money', icon: <Smartphone />, color: '#FFC107' },
            { value: 'cash', label: 'Cash Payment', sublabel: 'Pay with cash upon pickup or delivery', icon: <AttachMoney />, color: '#F57C00' },
          ].map((method) => (
            <FormControlLabel
              key={method.value}
              value={method.value}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: 1, borderColor: orderData.paymentMethod === method.value ? 'primary.main' : 'grey.300', borderRadius: 2, bgcolor: orderData.paymentMethod === method.value ? 'primary.light' : 'transparent' }}>
                  <Box sx={{ bgcolor: method.color, p: 1, borderRadius: '50%' }}>{method.icon}</Box>
                  <Box>
                    <Typography>{method.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.sublabel}
                    </Typography>
                  </Box>
                </Box>
              }
            />
          ))}
        </RadioGroup>
        {orderData.paymentMethod === 'momo' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mobile Money Details
            </Typography>
            <TextField
              fullWidth
              label="Phone Number (024XXXXXXX)"
              value={orderData.momoPhone}
              onChange={(e) => setOrderData((prev) => ({ ...prev, momoPhone: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <FormControl component="fieldset">
              <FormLabel component="legend">Network</FormLabel>
              <RadioGroup
                row
                name="momoNetwork"
                value={orderData.momoNetwork}
                onChange={(e) => setOrderData((prev) => ({ ...prev, momoNetwork: e.target.value }))}
              >
                {[
                  { value: 'mtn', label: 'MTN' },
                  { value: 'airteltigo', label: 'AirtelTigo' },
                  { value: 'vodafone', label: 'Vodafone' },
                ].map((network) => (
                  <FormControlLabel key={network.value} value={network.value} control={<Radio />} label={network.label} />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        )}
        <Alert severity="info" sx={{ mt: 2 }}>
          {orderData.paymentTiming === 'before_pickup'
            ? "Payment will be processed immediately after order confirmation. You'll receive a receipt via email."
            : "You'll receive payment instructions before delivery. Payment must be completed before handover."}
        </Alert>
      </Card>
    </Box>
  );

  const renderOrderSummaryStep = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h2" align="center" gutterBottom>
        Order Summary
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Review your order before confirming
      </Typography>
      <Card sx={{ mb: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Your Items
        </Typography>
        {selectedServices.map((service) => (
          <Box key={service._id || service.id} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '50%' }}>{service.icon}</Box>
              <Typography variant="h6" color="primary">{service.name}</Typography>
            </Box>
            
            {service.clothingItems && service.clothingItems.length > 0 ? (
              // Show individual clothing items
              <Box sx={{ ml: 3 }}>
                {service.clothingItems.map((item) => (
                  <Box key={item.itemId} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    py: 1, 
                    px: 2, 
                    mb: 1, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1 
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {item.itemId}: {item.description}
                      </Typography>
                      {item.specialInstructions && (
                        <Typography variant="caption" color="text.secondary">
                          Instructions: {item.specialInstructions}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                      ¢{item.unitPrice.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ textAlign: 'right', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" color="primary">
                    Service Total: ¢{service.clothingItems.reduce((sum, item) => sum + (item.unitPrice || 0), 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            ) : (
              // Fallback to quantity display
              <Box sx={{ ml: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Quantity: {service.quantity} × ¢{(service.price || service.basePrice || 0).toFixed(2)}
                </Typography>
                <Typography variant="subtitle2" color="primary">
                  Total: ¢{((service.price || service.basePrice || 0) * (service.quantity || 0)).toFixed(2)}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Card>
      <Card sx={{ mb: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Service Details
        </Typography>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setExpandedSection(expandedSection === 'addresses' ? '' : 'addresses')}>
            <Typography variant="subtitle1">Pickup & Delivery Addresses</Typography>
            <IconButton>{expandedSection === 'addresses' ? <ExpandLess /> : <ExpandMore />}</IconButton>
          </Box>
          <Collapse in={expandedSection === 'addresses'}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Pickup Address:
              </Typography>
              <Typography variant="body2">
                {orderData.pickupAddress.street}, {orderData.pickupAddress.city}, {orderData.pickupAddress.state} {orderData.pickupAddress.zipCode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {orderData.pickupDate}
              </Typography>
              <Typography variant="subtitle2" color="success.main" sx={{ mt: 2 }} gutterBottom>
                Delivery Address:
              </Typography>
              <Typography variant="body2">
                {orderData.deliveryAddress.street}, {orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {orderData.deliveryDate}
              </Typography>
            </Box>
          </Collapse>
        </Box>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mt: 2 }}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setExpandedSection(expandedSection === 'payment' ? '' : 'payment')}>
            <Typography variant="subtitle1">Payment Information</Typography>
            <IconButton>{expandedSection === 'payment' ? <ExpandLess /> : <ExpandMore />}</IconButton>
          </Box>
          <Collapse in={expandedSection === 'payment'}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2">
                <strong>Method:</strong> {orderData.paymentMethod?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Typography>
              <Typography variant="body2">
                <strong>Timing:</strong> {orderData.paymentTiming === 'before_pickup' ? 'Pay Before Pickup' : 'Pay Before Delivery'}
              </Typography>
              {orderData.paymentMethod === 'momo' && orderData.momoPhone && (
                <Typography variant="body2">
                  <strong>MoMo Number:</strong> {orderData.momoPhone} ({orderData.momoNetwork.toUpperCase()})
                </Typography>
              )}
            </Box>
          </Collapse>
        </Box>
      </Card>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Order Total
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Subtotal:</Typography>
            <Typography>¢{calculateSubtotal().toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Tax (10%):</Typography>
            <Typography>¢{calculateTax(calculateSubtotal()).toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Delivery Fee:</Typography>
            <Typography>¢{orderData.isUrgent ? '10.00' : '5.00'}</Typography>
          </Box>
          {orderData.isUrgent && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'warning.main' }}>
              <Typography>Urgent Service:</Typography>
              <Typography>Included</Typography>
            </Box>
          )}
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" color="primary">
              ¢{calculateTotal().toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        // Check if we have any items (either individual clothing items or quantity-based)
        return selectedServices.length > 0 && selectedServices.some(service => {
          return (service.clothingItems && service.clothingItems.length > 0) || (service.quantity && service.quantity > 0);
        });
      case 1:
        return (
          orderData.pickupAddress.street &&
          orderData.pickupAddress.city &&
          orderData.pickupAddress.state &&
          orderData.deliveryAddress.street &&
          orderData.deliveryAddress.city &&
          orderData.deliveryAddress.state &&
          orderData.pickupDate &&
          orderData.deliveryDate
        );
      case 2:
        return orderData.paymentMethod && orderData.paymentTiming;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h1" align="center" gutterBottom>
        Create New Order
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Get your laundry done with our professional service
      </Typography>
      <StepperComponent />
      {renderStepContent()}
      {/* Debug: keep hook order stable by avoiding early returns in renderStepContent */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{ px: 4, py: 1.5 }}
        >
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
              sx={{ px: 4, py: 1.5 }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitOrder}
              disabled={loading || !canProceed()}
              sx={{ px: 4, py: 1.5, display: 'flex', gap: 1 }}
            >
              {loading && <CircularProgress size={20} color="inherit" />}
              <span>{loading ? 'Submitting...' : 'Submit Order'}</span>
            </Button>
          )}
        </Box>
      </Box>

      {/* Paystack Payment Dialog */}
      {showPaystackDialog && createdOrderId && (
        <PaystackPayment
          open={showPaystackDialog}
          onClose={handlePaymentDialogClose}
          orderId={createdOrderId}
          amount={calculateTotal()}
          customerEmail={(JSON.parse(localStorage.getItem('user') || '{}').email || '').trim()}
          customerName={`${(JSON.parse(localStorage.getItem('user') || '{}').firstName || '').trim()} ${(JSON.parse(localStorage.getItem('user') || '{}').lastName || '').trim()}`.trim()}
          defaultMomoPhone={orderData.momoPhone}
          defaultMomoProvider={orderData.momoNetwork as 'mtn' | 'vodafone' | 'airteltigo'}
          autoStart={Boolean(orderData.momoPhone)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </Container>
  );

  function renderStepContent() {
    switch (activeStep) {
      case 0:
        return (
          <ServiceSelectionStep
            services={services}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            error={error}
            loading={loading}
            calculateSubtotal={calculateSubtotal}
          />
        );
      case 1:
        return renderAddressSelectionStep();
      case 2:
        return renderPaymentSelectionStep();
      case 3:
        return renderOrderSummaryStep();
      default:
        return (
          <ServiceSelectionStep
            services={services}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            error={error}
            loading={loading}
            calculateSubtotal={calculateSubtotal}
          />
        );
    }
  }
};

export default NewOrderPage;
