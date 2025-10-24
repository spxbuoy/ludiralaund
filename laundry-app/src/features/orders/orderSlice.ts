import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { OrderState } from '../../types';
import type { Order, OrderItem } from '../../types/order';

import { API_BASE_URL } from '../../services/api';

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData: {
    items: OrderItem[];
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
    isUrgent: boolean;
    priority: string;
    specialInstructions: string;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    totalAmount: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }
    
    const result = await response.json();
    return result.data;
  }
);

export const fetchOrders = createAsyncThunk('orders/fetchAll', async () => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch orders');
  }
  const data = await response.json();
  // If paginated, use data.data.docs; else, use data.data
  if (data && data.data) {
    if (Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data.data.docs)) {
      return data.data.docs;
    }
  }
  return [];
});

export const fetchOrdersByRole = createAsyncThunk('orders/fetchByRole', async (role: string) => {
  const response = await fetch(`${API_BASE_URL}/orders?role=${encodeURIComponent(role)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch orders');
  }
  const data = await response.json();
  if (data && data.data) {
    if (Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data.data.docs)) {
      return data.data.docs;
    }
  }
  return [];
});

export const fetchProviderOrders = createAsyncThunk(
  'orders/fetchProviderOrders',
  async ({ includeAvailable = false }: { includeAvailable?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/orders/provider/assigned?include_available=${includeAvailable}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch provider orders');
    }
    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch order');
    }
    
    return response.json();
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }: { orderId: string; status: string }) => {
    // Map frontend order statuses to backend tracking locations (OrderTracking.currentLocation)
    const statusToTracking: Record<string, string> = {
      pending: 'pending',
      confirmed: 'pickup_scheduled',
      assigned: 'at_facility',
      in_progress: 'cleaning',
      ready_for_pickup: 'at_facility',
      picked_up: 'picked_up',
      ready_for_delivery: 'ready_for_delivery',
      completed: 'delivered',
    };

    const payload: any = { status };
    if (statusToTracking[status]) {
      payload.currentLocation = statusToTracking[status];
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update order status');
    }
    
    const result = await response.json();
    return result.data;
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload as string;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create order';
      })
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      // Fetch Order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch order';
      })
      // Fetch by role
      .addCase(fetchOrdersByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrdersByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      // Provider orders
      .addCase(fetchProviderOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchProviderOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch provider orders';
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.orders.findIndex((order) => order._id === updated._id);
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], ...updated };
        }
        if (state.currentOrder?._id === updated._id) {
          state.currentOrder = { ...state.currentOrder, ...updated } as any;
        }
      });
  },
});

export const { clearCurrentOrder, clearError, setError } = orderSlice.actions;
export default orderSlice.reducer; 