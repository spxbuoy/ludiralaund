import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AdminUser, CustomerUser, ServiceProviderUser, Address, UserRole } from '../../types/auth';
import { authApi, UserResponse, RegisterResponse } from '../../services/api';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null; // Add this line
}

// Update your initial state to include the token

// Helper function to transform API user response to frontend user type
const transformUserResponse = (apiUser: UserResponse): User => {
  const baseUser = {
    id: apiUser._id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    role: apiUser.role,
    phoneNumber: apiUser.phoneNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Update your AuthState interface to include the token property

  // Add preferences to base user for all roles
  const userWithPreferences = {
    ...baseUser,
    preferences: apiUser.preferences || {
      notificationPreferences: {
        email: true,
        sms: false,
        chatEmail: true,
        push: true,
      },
      language: 'en',
      timezone: 'UTC',
    },
  };

  switch (apiUser.role) {
    case 'admin':
      return {
        ...userWithPreferences,
        role: 'admin',
        permissions: apiUser.permissions || {
          canManageUsers: true,
          canManageOrders: true,
          canManageServices: true,
          canViewAnalytics: true,
          canManagePayments: true,
          canModerateReviews: true,
          canManageNotifications: true,
          canViewAuditLogs: true,
        },
      } as AdminUser;
    case 'service_provider':
      return {
        ...userWithPreferences,
        role: 'service_provider',
        location: '',
        businessDetails: apiUser.businessDetails || {
          businessName: '',
          serviceAreas: [],
          availableServices: [],
          operatingHours: {},
        },
        earnings: apiUser.earnings || {
          total: 0,
          pending: 0,
          completed: 0,
        },
      } as ServiceProviderUser;
    case 'customer':
      return {
        ...userWithPreferences,
        role: 'customer',
        addresses: apiUser.addresses || [],
        loyaltyPoints: apiUser.loyaltyPoints || 0,
      } as CustomerUser;
    default:
      return userWithPreferences as User;
  }
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🔍 Login thunk called with:', { email: credentials.email });
      const response = await authApi.login(credentials);
      console.log('🔍 Login API response:', response);

      if (response.error) {
        console.log('❌ Login API error:', response.error);
        return rejectWithValue(response.error);
      }

      if (!response.data) {
        console.log('❌ Login API returned no data');
        return rejectWithValue('Login failed: No user data received');
      }

      console.log('✅ Login successful, transforming user data');
      return transformUserResponse(response.data);
    } catch (error) {
      console.error('❌ Login thunk error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    phoneNumber: string; 
    role?: UserRole;
    verificationCode: string;
  }, { rejectWithValue }) => {
    try {
      console.log('🔍 Register thunk called with:', userData);
      const response = await authApi.register(userData);
      console.log('🔍 Auth API response:', response);
      
      if (response.error) {
        console.log('❌ API error:', response.error);
        return rejectWithValue(response.error);
      }
      
      console.log('✅ API success, returning data:', response.data);
      // Return the registration response data
      return response.data! as RegisterResponse;
    } catch (error) {
      console.error('❌ Register thunk error:', error);
      return rejectWithValue('Registration failed');
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getMe();
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return transformUserResponse(response.data!);
    } catch (error) {
      return rejectWithValue('Failed to get user data');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { firstName: string; lastName: string; phoneNumber?: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(profileData);
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return transformUserResponse(response.data!);
    } catch (error) {
      return rejectWithValue('Profile update failed');
    }
  }
);

export const addAddress = createAsyncThunk(
  'auth/addAddress',
  async (addressData: Omit<Address, 'id'>, { rejectWithValue }) => {
    try {
      // This would need to be implemented in the backend
      return {
        id: Date.now().toString(),
        ...addressData,
      };
    } catch (error) {
      return rejectWithValue('Failed to add address');
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'auth/deleteAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      // This would need to be implemented in the backend
      return addressId;
    } catch (error) {
      return rejectWithValue('Failed to delete address');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (verificationData: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const { API_BASE_URL } = await import('../../services/api');
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Verification failed');
      }

      // Set token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return transformUserResponse(data);
    } catch (error) {
      return rejectWithValue('Email verification failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      authApi.logout();
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
 state.token = localStorage.getItem('token'); // Assuming token is set in localStorage by authApi.login
        // Removed window.location.href redirection logic
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        // Set token if provided
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
 state.token = action.payload.token;
        }
        // Create a basic user object from the registration response
        const user: User = {
          id: action.payload.userId,
          firstName: '', // Will be filled by getMe call
          lastName: '', // Will be filled by getMe call
          email: action.payload.email,
          role: action.payload.role, // Use role from response
          phoneNumber: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.user = user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Address
      .addCase(addAddress.fulfilled, (state, action) => {
        if (state.user && 'addresses' in state.user) {
          (state.user as CustomerUser).addresses.push(action.payload);
        }
      })
      // Delete Address
      .addCase(deleteAddress.fulfilled, (state, action) => {
        if (state.user && 'addresses' in state.user) {
          (state.user as CustomerUser).addresses = (state.user as CustomerUser).addresses.filter(
            (addr) => addr.id !== action.payload
          );
        }
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
 state.token = localStorage.getItem('token'); // Assuming token is set in localStorage
        state.isAuthenticated = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
 state.token = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
      });
  },

});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
