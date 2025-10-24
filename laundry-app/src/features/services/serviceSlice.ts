import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: 'everyday' | 'formal' | 'traditional' | 'bedding' | 'household';
  imageUrl?: string;
  unit: 'kg' | 'piece';
}

interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
}

const initialState: ServiceState = {
  services: [
    // Everyday Wear
    {
      id: 'shirts-blouses',
      name: 'Shirts & Blouses',
      description: 'Wash and iron for casual and formal shirts (cotton, linen, blends)',
      basePrice: 5.00,
      category: 'everyday',
      unit: 'piece',
    },
    {
      id: 'tshirts-polo',
      name: 'T-shirts & Polo Shirts',
      description: 'Wash and fold for daily wear t-shirts and polo shirts',
      basePrice: 4.00,
      category: 'everyday',
      unit: 'piece',
    },
    {
      id: 'trousers-pants',
      name: 'Trousers & Pants',
      description: 'Wash and press for dress pants, casual trousers, and jeans',
      basePrice: 6.00,
      category: 'everyday',
      unit: 'piece',
    },
    {
      id: 'skirts',
      name: 'Skirts',
      description: 'Wash and press for various lengths and fabrics',
      basePrice: 5.00,
      category: 'everyday',
      unit: 'piece',
    },
    {
      id: 'dresses-casual',
      name: 'Casual Dresses',
      description: 'Wash and press for casual and work dresses',
      basePrice: 7.00,
      category: 'everyday',
      unit: 'piece',
    },
    {
      id: 'shorts',
      name: 'Shorts',
      description: 'Wash and fold for casual shorts',
      basePrice: 4.00,
      category: 'everyday',
      unit: 'piece',
    },
    {
      id: 'socks',
      name: 'Socks',
      description: 'Wash and fold for pairs of socks',
      basePrice: 1.00,
      category: 'everyday',
      unit: 'piece',
    },

    // Formal & Work Wear
    {
      id: 'suits',
      name: 'Suits',
      description: 'Dry cleaning for jackets and trousers',
      basePrice: 15.00,
      category: 'formal',
      unit: 'piece',
    },
    {
      id: 'blazers',
      name: 'Blazers & Sport Coats',
      description: 'Dry cleaning for formal jackets',
      basePrice: 12.00,
      category: 'formal',
      unit: 'piece',
    },
    {
      id: 'ties',
      name: 'Ties',
      description: 'Dry cleaning for formal ties',
      basePrice: 4.00,
      category: 'formal',
      unit: 'piece',
    },
    {
      id: 'dresses-formal',
      name: 'Formal Dresses',
      description: 'Dry cleaning for evening wear and formal dresses',
      basePrice: 20.00,
      category: 'formal',
      unit: 'piece',
    },

    // Traditional/Local Attire
    {
      id: 'ankara',
      name: 'Ankara/Print Fabrics',
      description: 'Specialized washing, starching, and meticulous ironing for traditional prints',
      basePrice: 8.00,
      category: 'traditional',
      unit: 'piece',
    },
    {
      id: 'kente',
      name: 'Kente Cloth',
      description: 'Specialized hand washing for delicate traditional fabric',
      basePrice: 15.00,
      category: 'traditional',
      unit: 'piece',
    },
    {
      id: 'smocks',
      name: 'Smocks',
      description: 'Specialized cleaning for traditional northern Ghanaian attire',
      basePrice: 10.00,
      category: 'traditional',
      unit: 'piece',
    },

    // Bedding & Linens
    {
      id: 'bed-sheets',
      name: 'Bed Sheets',
      description: 'Wash and press for flat and fitted sheets',
      basePrice: 8.00,
      category: 'bedding',
      unit: 'piece',
    },
    {
      id: 'pillowcases',
      name: 'Pillowcases',
      description: 'Wash and press for standard pillowcases',
      basePrice: 3.00,
      category: 'bedding',
      unit: 'piece',
    },
    {
      id: 'duvet-covers',
      name: 'Duvet Covers',
      description: 'Wash and press for duvet and quilt covers',
      basePrice: 12.00,
      category: 'bedding',
      unit: 'piece',
    },
    {
      id: 'duvets',
      name: 'Duvets/Comforters',
      description: 'Specialized washing for large bedding items',
      basePrice: 20.00,
      category: 'bedding',
      unit: 'piece',
    },
    {
      id: 'blankets',
      name: 'Blankets',
      description: 'Wash and press for light blankets',
      basePrice: 15.00,
      category: 'bedding',
      unit: 'piece',
    },
    {
      id: 'towels',
      name: 'Towels',
      description: 'Wash and fold for bath towels, hand towels, and face cloths',
      basePrice: 4.00,
      category: 'bedding',
      unit: 'piece',
    },

    // Other Household Items
    {
      id: 'curtains',
      name: 'Curtains & Drapes',
      description: 'Specialized cleaning for window treatments',
      basePrice: 15.00,
      category: 'household',
      unit: 'piece',
    },
    {
      id: 'tablecloths',
      name: 'Tablecloths & Napkins',
      description: 'Wash and press for dining linens',
      basePrice: 8.00,
      category: 'household',
      unit: 'piece',
    },
    {
      id: 'slipcovers',
      name: 'Slipcovers',
      description: 'Wash and press for furniture covers',
      basePrice: 12.00,
      category: 'household',
      unit: 'piece',
    },
  ],
  loading: false,
  error: null,
};

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async () => {
    // In a real app, this would be an API call
    return initialState.services;
  }
);

const serviceSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch services';
      });
  },
});

export default serviceSlice.reducer; 