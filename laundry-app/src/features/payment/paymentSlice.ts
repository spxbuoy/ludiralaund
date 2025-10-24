import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../services/api';

interface PaymentState {
  loading: boolean;
  error: string | null;
  paymentIntent: any | null;
  paymentMethods: any[];
  paymentHistory: {
    data: any[];
    pagination: any;
    loading: boolean;
    error: string | null;
  };
  paymentStats: any;
  selectedPayment: any | null;
}

const initialState: PaymentState = {
  loading: false,
  error: null,
  paymentIntent: null,
  paymentMethods: [],
  paymentHistory: {
    data: [],
    pagination: {},
    loading: false,
    error: null,
  },
  paymentStats: null,
  selectedPayment: null,
};

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

const jsonHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  ...authHeaders(),
});

const parseJsonSafe = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  throw new Error(text || `Unexpected response (${response.status} ${response.statusText})`);
};

// Mock payment methods for development
const mockPaymentMethods = [
  { id: 'mock_1', card: { brand: 'visa', last4: '4242' } },
];

export const createPaymentIntent = createAsyncThunk(
  'payment/createIntent',
  async (amount: number) => ({ id: 'mock_intent_' + Date.now(), amount, status: 'succeeded' })
);

export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchMethods',
  async () => mockPaymentMethods
);

export const savePaymentMethod = createAsyncThunk(
  'payment/saveMethod',
  async (paymentMethodId: string) => ({ id: paymentMethodId, card: { brand: 'visa', last4: '4242' } })
);

export const processPayment = createAsyncThunk(
  'payment/process',
  async ({ paymentIntentId }: { paymentIntentId: string; paymentMethodId: string }) => ({ status: 'succeeded', id: paymentIntentId })
);

export const processMoMoPayment = createAsyncThunk(
  'payment/processMoMo',
  async ({ paymentId, phoneNumber }: { paymentId: string; phoneNumber: string }) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/momo`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ phoneNumber }),
    });
    if (!response.ok) {
      const err = await parseJsonSafe(response).catch(() => ({ message: 'MoMo payment failed' }));
      throw new Error((err as any).message || 'MoMo payment failed');
    }
    return parseJsonSafe(response);
  }
);

export const checkMoMoStatus = createAsyncThunk(
  'payment/checkMoMoStatus',
  async (paymentId: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/momo/status`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to check MoMo status');
    }
    return parseJsonSafe(response);
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') queryParams.append(key, String(value));
    });
    const response = await fetch(`${API_BASE_URL}/payments/history?${queryParams}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to fetch payment history');
    }
    return parseJsonSafe(response);
  }
);

export const fetchPaymentStats = createAsyncThunk(
  'payment/fetchStats',
  async (params: { startDate?: string; endDate?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    const response = await fetch(`${API_BASE_URL}/payments/history/stats?${queryParams}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to fetch payment statistics');
    }
    return parseJsonSafe(response);
  }
);

export const exportPaymentHistory = createAsyncThunk(
  'payment/exportHistory',
  async (params: { status?: string; paymentMethod?: string; startDate?: string; endDate?: string; format?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') queryParams.append(key, String(value));
    });
    const response = await fetch(`${API_BASE_URL}/payments/history/export?${queryParams}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to export payment history');
    }
    if (params.format === 'csv') {
      return response.blob();
    }
    return parseJsonSafe(response);
  }
);

export const fetchPaymentReceipt = createAsyncThunk(
  'payment/fetchReceipt',
  async (paymentId: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/receipt`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to fetch payment receipt');
    }
    return parseJsonSafe(response);
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
    clearPaymentHistory: (state) => {
      state.paymentHistory.data = [];
      state.paymentHistory.pagination = {};
      state.paymentHistory.error = null;
    },
    setSelectedPayment: (state, action) => {
      state.selectedPayment = action.payload;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentIntent = action.payload;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create payment intent';
      })
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch payment methods';
      })
      .addCase(savePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods.push(action.payload);
      })
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state) => {
        state.loading = false;
        state.paymentIntent = null;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Payment processing failed';
      })
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.paymentHistory.loading = true;
        state.paymentHistory.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.paymentHistory.loading = false;
        const payload = action.payload as any;

        // Normalize various response shapes
        const root = payload?.data ?? payload;
        let docs: any[] = [];

        if (Array.isArray(root)) {
          docs = root;
        } else if (Array.isArray(root?.docs)) {
          docs = root.docs;
        } else if (Array.isArray(root?.data)) {
          docs = root.data;
        } else if (Array.isArray(payload?.docs)) {
          docs = payload.docs;
        }

        const pagination = root?.pagination ?? {
          page: root?.page ?? root?.currentPage ?? 1,
          pages: root?.pages ?? root?.totalPages ?? (root?.pagination?.pages ?? 1),
          total: root?.total ?? root?.totalDocs ?? root?.count ?? (Array.isArray(docs) ? docs.length : 0),
          limit: root?.limit ?? root?.pageSize ?? 10,
        };

        state.paymentHistory.data = Array.isArray(docs) ? docs : [];
        state.paymentHistory.pagination = pagination || {};
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.paymentHistory.loading = false;
        state.paymentHistory.error = action.error.message || 'Failed to fetch payment history';
      })
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.paymentStats = payload?.data ?? payload;
      })
      .addCase(fetchPaymentReceipt.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.selectedPayment = payload?.data ?? payload;
      });
  },
});

export const {
  clearPaymentError,
  clearPaymentIntent,
  clearPaymentHistory,
  setSelectedPayment,
  clearSelectedPayment,
} = paymentSlice.actions;

export default paymentSlice.reducer;
