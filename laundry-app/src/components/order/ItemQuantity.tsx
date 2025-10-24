import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  LocalLaundryService,
  DryCleaning,
  Iron,
  CleaningServices,
  Checkroom,
  Home,
  Celebration,
  Work,
  LocalMall,
  Checkroom as ClothesIcon,
  Checkroom as ShirtIcon,
  Checkroom as DressIcon,
  Checkroom as PantsIcon,
  Checkroom as SkirtIcon,
  Checkroom as SocksIcon,
  Checkroom as UnderwearIcon,
  Checkroom as VestIcon,
  Checkroom as JacketIcon,
  Checkroom as CoatIcon,
  Checkroom as SweaterIcon,
  Checkroom as HoodieIcon,
  Checkroom as SuitIcon,
  Checkroom as TieIcon,
  Checkroom as ScarfIcon,
  Checkroom as UniformIcon,
  Checkroom as WeddingIcon,
  Checkroom as EveningIcon,
  Checkroom as LaceIcon,
  Checkroom as BeadedIcon,
  Checkroom as TraditionalIcon,
  Checkroom as KenteIcon,
  Checkroom as KabaIcon,
  Checkroom as AgbadaIcon,
  Checkroom as FuguIcon,
  Checkroom as KaftanIcon,
  Checkroom as BatakariIcon,
  Checkroom as AnkaraIcon,
  Checkroom as DashikiIcon,
  Checkroom as WrapperIcon,
  Checkroom as HeadwrapIcon,
  Checkroom as BedsheetIcon,
  Checkroom as PillowcaseIcon,
  Checkroom as BlanketIcon,
  Checkroom as DuvetIcon,
  Checkroom as CurtainsIcon,
  Checkroom as TableclothIcon,
  Checkroom as TowelIcon,
} from '@mui/icons-material';

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ItemQuantityProps {
  selectedServiceId: string;
  onItemsChange: (items: Item[], totalPrice: number) => void;
}

const ItemQuantity: React.FC<ItemQuantityProps> = ({ selectedServiceId, onItemsChange }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Sample items based on service type
  const getItemsForService = (serviceId: string): Item[] => {
    switch (serviceId) {
      case 'wash-fold':
        return [
          // Everyday & Casual Wear
          { id: 'tshirt', name: 'T-shirts', price: 2.50, quantity: 0 },
          { id: 'shirt', name: 'Shirts (short and long-sleeved)', price: 3.00, quantity: 0 },
          { id: 'polo', name: 'Polo shirts', price: 3.00, quantity: 0 },
          { id: 'tank', name: 'Tank tops', price: 2.00, quantity: 0 },
          { id: 'jeans', name: 'Jeans', price: 4.00, quantity: 0 },
          { id: 'chinos', name: 'Chinos', price: 3.50, quantity: 0 },
          { id: 'shorts', name: 'Shorts', price: 2.50, quantity: 0 },
          { id: 'skirt', name: 'Skirts', price: 3.00, quantity: 0 },
          { id: 'blouse', name: 'Blouses', price: 3.00, quantity: 0 },
          { id: 'dress-casual', name: 'Dresses (casual)', price: 4.00, quantity: 0 },
          { id: 'undergarments', name: 'Undergarments', price: 1.50, quantity: 0 },
          { id: 'socks', name: 'Socks', price: 1.00, quantity: 0 },
          { id: 'vest', name: 'Vests', price: 2.50, quantity: 0 },
          { id: 'leggings', name: 'Leggings', price: 2.50, quantity: 0 },
          
          // Traditional Wear
          { id: 'kente', name: 'Kente cloth garments', price: 6.00, quantity: 0 },
          { id: 'kaba', name: 'Kaba and slit', price: 5.00, quantity: 0 },
          { id: 'agbada', name: 'Agbada', price: 7.00, quantity: 0 },
          { id: 'fugu', name: 'Fugu (smock)', price: 5.00, quantity: 0 },
          { id: 'kaftan', name: 'Kaftans', price: 5.00, quantity: 0 },
          { id: 'batakari', name: 'Batakari', price: 5.00, quantity: 0 },
          { id: 'ankara', name: 'Ankara outfits', price: 5.00, quantity: 0 },
          { id: 'dashiki', name: 'Dashiki', price: 4.00, quantity: 0 },
          { id: 'wrapper', name: 'Wrapper', price: 4.00, quantity: 0 },
          { id: 'headwrap', name: 'Headwraps (duku)', price: 2.00, quantity: 0 },
          
          // Household Linen
          { id: 'bedsheet', name: 'Bedsheets', price: 5.00, quantity: 0 },
          { id: 'pillowcase', name: 'Pillowcases', price: 2.00, quantity: 0 },
          { id: 'blanket', name: 'Blankets', price: 6.00, quantity: 0 },
          { id: 'duvet', name: 'Duvet covers', price: 7.00, quantity: 0 },
          { id: 'curtains', name: 'Curtains', price: 8.00, quantity: 0 },
          { id: 'tablecloth', name: 'Tablecloths', price: 4.00, quantity: 0 },
          { id: 'towel', name: 'Towels', price: 3.00, quantity: 0 }
        ];
      case 'dry-cleaning':
        return [
          // Office & Formal Wear
          { id: 'dress-shirt', name: 'Dress shirts', price: 3.50, quantity: 0 },
          { id: 'trousers', name: 'Trousers/slacks', price: 4.00, quantity: 0 },
          { id: 'suit-jacket', name: 'Suit jackets', price: 5.00, quantity: 0 },
          { id: 'blazer', name: 'Blazers', price: 5.00, quantity: 0 },
          { id: 'formal-skirt', name: 'Formal skirts', price: 4.00, quantity: 0 },
          { id: 'tie', name: 'Ties', price: 2.00, quantity: 0 },
          { id: 'scarf', name: 'Scarves', price: 2.00, quantity: 0 },
          { id: 'waistcoat', name: 'Waistcoats (vests)', price: 3.50, quantity: 0 },
          { id: 'uniform', name: 'Corporate uniforms', price: 4.00, quantity: 0 },
          
          // Outerwear
          { id: 'jacket', name: 'Jackets', price: 5.00, quantity: 0 },
          { id: 'coat', name: 'Coats', price: 6.00, quantity: 0 },
          { id: 'cardigan', name: 'Cardigans', price: 4.00, quantity: 0 },
          { id: 'sweater', name: 'Sweaters', price: 4.00, quantity: 0 },
          { id: 'raincoat', name: 'Raincoats', price: 5.00, quantity: 0 },
          { id: 'hoodie', name: 'Hoodies', price: 4.00, quantity: 0 },
          
          // Special Occasions
          { id: 'wedding-gown', name: 'Wedding gowns', price: 15.00, quantity: 0 },
          { id: 'evening-dress', name: 'Evening dresses', price: 10.00, quantity: 0 },
          { id: 'lace', name: 'Lace garments', price: 8.00, quantity: 0 },
          { id: 'embroidered', name: 'Embroidered clothes', price: 7.00, quantity: 0 },
          { id: 'beaded', name: 'Beaded dresses', price: 9.00, quantity: 0 },
          { id: 'suit', name: 'Suits and tuxedos', price: 12.00, quantity: 0 }
        ];
      case 'ironing':
        return [
          // Everyday Items
          { id: 'shirts-iron', name: 'Shirts', price: 2.00, quantity: 0 },
          { id: 'pants-iron', name: 'Pants', price: 2.50, quantity: 0 },
          { id: 'dresses-iron', name: 'Dresses', price: 3.00, quantity: 0 },
          { id: 'skirts-iron', name: 'Skirts', price: 2.50, quantity: 0 },
          { id: 'blouses-iron', name: 'Blouses', price: 2.00, quantity: 0 },
          
          // Traditional Items
          { id: 'kente-iron', name: 'Kente Cloth', price: 4.00, quantity: 0 },
          { id: 'kaba-slit-iron', name: 'Kaba and Slit', price: 3.50, quantity: 0 },
          { id: 'agbada-iron', name: 'Agbada', price: 5.00, quantity: 0 },
          { id: 'fugu-iron', name: 'Fugu (Smock)', price: 4.50, quantity: 0 },
          
          // Formal Wear
          { id: 'suits-iron', name: 'Suits', price: 6.00, quantity: 0 },
          { id: 'formal-dresses-iron', name: 'Formal Dresses', price: 5.00, quantity: 0 },
          { id: 'wedding-gowns-iron', name: 'Wedding Gowns', price: 15.00, quantity: 0 }
        ];
      case 'stain-removal':
        return [
          { id: 'small-stain', name: 'Small Stain (Up to 2 inches)', price: 3.00, quantity: 0 },
          { id: 'medium-stain', name: 'Medium Stain (2-4 inches)', price: 5.00, quantity: 0 },
          { id: 'large-stain', name: 'Large Stain (4+ inches)', price: 8.00, quantity: 0 },
          { id: 'multiple-stains', name: 'Multiple Stains', price: 12.00, quantity: 0 },
          { id: 'oil-stain', name: 'Oil/Grease Stain', price: 6.00, quantity: 0 },
          { id: 'ink-stain', name: 'Ink Stain', price: 7.00, quantity: 0 },
          { id: 'blood-stain', name: 'Blood Stain', price: 6.00, quantity: 0 },
          { id: 'wine-stain', name: 'Wine/Red Stains', price: 5.00, quantity: 0 }
        ];
      default:
        return [];
    }
  };

  const getItemIcon = (itemId: string) => {
    // Everyday & Casual Wear
    if (['tshirt', 'shirt', 'polo', 'tank', 'blouse', 'dress-shirt'].includes(itemId)) {
      return <Checkroom />; // Shirt icon
    }
    if (['jeans', 'chinos', 'shorts', 'trousers', 'leggings'].includes(itemId)) {
      return <Checkroom />; // Pants icon
    }
    if (['skirt', 'formal-skirt'].includes(itemId)) {
      return <Checkroom />; // Skirt icon
    }
    if (['dress-casual', 'wedding-gown', 'evening-dress'].includes(itemId)) {
      return <Checkroom />; // Dress icon
    }
    if (['undergarments'].includes(itemId)) {
      return <Checkroom />; // Underwear icon
    }
    if (['socks'].includes(itemId)) {
      return <Checkroom />; // Socks icon
    }
    if (['vest', 'waistcoat'].includes(itemId)) {
      return <Checkroom />; // Vest icon
    }

    // Office & Formal Wear
    if (['suit-jacket', 'blazer', 'suit'].includes(itemId)) {
      return <Work />; // Suit icon
    }
    if (['tie'].includes(itemId)) {
      return <Work />; // Tie icon
    }
    if (['scarf'].includes(itemId)) {
      return <Work />; // Scarf icon
    }
    if (['uniform'].includes(itemId)) {
      return <Work />; // Uniform icon
    }

    // Outerwear
    if (['jacket', 'coat', 'raincoat'].includes(itemId)) {
      return <LocalMall />; // Coat icon
    }
    if (['cardigan', 'sweater'].includes(itemId)) {
      return <LocalMall />; // Sweater icon
    }
    if (['hoodie'].includes(itemId)) {
      return <LocalMall />; // Hoodie icon
    }

    // Traditional & Cultural Wear
    if (['kente', 'kaba', 'agbada', 'fugu', 'kaftan', 'batakari', 'ankara', 'dashiki', 'wrapper', 'headwrap'].includes(itemId)) {
      return <Celebration />; // Traditional wear icon
    }

    // Household Linen
    if (['bedsheet', 'pillowcase', 'blanket', 'duvet'].includes(itemId)) {
      return <Home />; // Bedding icon
    }
    if (['curtains'].includes(itemId)) {
      return <Home />; // Curtains icon
    }
    if (['tablecloth'].includes(itemId)) {
      return <Home />; // Tablecloth icon
    }
    if (['towel'].includes(itemId)) {
      return <Home />; // Towel icon
    }

    // Special Occasions
    if (['lace', 'embroidered', 'beaded'].includes(itemId)) {
      return <Celebration />; // Special occasion icon
    }

    return <LocalLaundryService />; // Default icon
  };

  useEffect(() => {
    setItems(getItemsForService(selectedServiceId));
  }, [selectedServiceId]);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalPrice(total);
    onItemsChange(items.filter(item => item.quantity > 0), total);
  }, [items, onItemsChange]);

  const handleQuantityChange = (itemId: string, change: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      )
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Items and Quantities
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        mb: 3 
      }}>
        {items.map((item) => (
          <Box 
            key={item.id}
            sx={{ 
              width: {
                xs: '100%',
                sm: 'calc(50% - 8px)',
                md: 'calc(33.33% - 11px)',
                lg: 'calc(25% - 12px)'
              }
            }}
          >
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getItemIcon(item.id)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {item.name}
              </Typography>
            </Box>
                <Typography color="text.secondary" gutterBottom>
                  ¢{item.price.toFixed(2)} per item
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
              <IconButton
                    onClick={() => handleQuantityChange(item.id, -1)}
                    disabled={item.quantity === 0}
                    size="small"
              >
                <RemoveIcon />
              </IconButton>
                  <Typography sx={{ mx: 2, minWidth: '30px', textAlign: 'center' }}>
                    {item.quantity}
                  </Typography>
                  <IconButton
                    onClick={() => handleQuantityChange(item.id, 1)}
                    size="small"
                  >
                <AddIcon />
              </IconButton>
            </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Order Summary
      </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography>Total Items:</Typography>
          <Typography>
            {items.reduce((sum, item) => sum + item.quantity, 0)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Total Price:</Typography>
          <Typography variant="h6" color="primary">
            ¢{totalPrice.toFixed(2)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ItemQuantity; 