// Prefer runtime override, then build-time env, then domain-based fallback, then localhost
export const API_BASE_URL =
  (typeof window !== 'undefined' && (window as any).API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')
    ? 'https://laundry-app-vzba.onrender.com/api'
    : 'http://localhost:5000/api');

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: 'customer' | 'service_provider' | 'admin';
  verificationCode: string;
}

export interface UserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'customer' | 'service_provider' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  addresses?: any[];
  preferences?: any;
  businessDetails?: any;
  earnings?: any;
  permissions?: any;
  loyaltyPoints?: number;
  token: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  userId: string;
  token: string;
  role: 'customer' | 'service_provider' | 'admin';
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Helper function to remove auth token
const removeAuthToken = (): void => {
  localStorage.removeItem('token');
};

// Base API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  let response: Response | undefined;

  try {
    console.log(`🔍 API request to: ${API_BASE_URL}${endpoint}`);
    console.log('🔍 Request options:', options);

    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🔍 Request headers:', headers);

    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);

    // Clone the response to avoid "body stream already read" error
    const responseClone = response.clone();

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, try to get text
      try {
        const text = await responseClone.text();
        console.log('🔍 Response text (JSON parse failed):', text);
        data = { error: text || 'Invalid response format' };
      } catch (textError) {
        console.log('🔍 Could not parse response as JSON or text');
        data = { error: 'Invalid response format' };
      }
    }

    console.log('🔍 Response data:', data);

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.log('❌ API request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ API request successful');
    return { data };
  } catch (error) {
    console.error('❌ API request error:', error);

    // If we have a response and it's not ok, try to get more error details
    if (response && !response.ok) {
      try {
        const errorData = await response.clone().json();
        return { error: errorData?.error || errorData?.message || (error instanceof Error ? error.message : 'Unknown error') };
      } catch {
        // If we can't parse error response, return the original error
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Auth API functions
export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<UserResponse>> => {
    try {
      console.log('🔍 Auth API login called');
      const response = await apiRequest<UserResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('🔍 Auth API login response:', response);

      if (response.data?.token) {
        console.log('🔍 Setting auth token');
        setAuthToken(response.data.token);
      } else if (response.error) {
        console.log('❌ Auth API login error:', response.error);
      }

      return response;
    } catch (error) {
      console.error('❌ Auth API login exception:', error);
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  },

  // Register
  register: async (userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    console.log('🔍 API register called with:', userData);
    const response = await apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    console.log('🔍 API register response:', response);
    return response;
  },

  // Get current user
  getMe: async (): Promise<ApiResponse<UserResponse>> => {
    return await apiRequest<UserResponse>('/auth/me');
  },

  // Update profile
  updateProfile: async (profileData: any): Promise<ApiResponse<UserResponse>> => {
    const response = await apiRequest<UserResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  // Change password
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    return await apiRequest<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return await apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (resetData: { resetToken: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    return await apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData),
    });
  },

  // Logout
  logout: (): void => {
    removeAuthToken();
  },
};

// Users API functions (admin only)
export const usersApi = {
  // Get all users
  getUsers: async (params?: { page?: number; pageSize?: number; keyword?: string }): Promise<ApiResponse<{ users: UserResponse[]; page: number; pages: number; total: number }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.keyword) queryParams.append('keyword', params.keyword);

    return await apiRequest<{ users: UserResponse[]; page: number; pages: number; total: number }>(`/users?${queryParams}`);
  },

  // Get user by ID
  getUserById: async (id: string): Promise<ApiResponse<UserResponse>> => {
    return await apiRequest<UserResponse>(`/users/${id}`);
  },

  // Create user
  createUser: async (userData: RegisterRequest): Promise<ApiResponse<UserResponse>> => {
    return await apiRequest<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user
  updateUser: async (id: string, userData: any): Promise<ApiResponse<UserResponse>> => {
    return await apiRequest<UserResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return await apiRequest<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Toggle user status
  toggleUserStatus: async (id: string): Promise<ApiResponse<{ _id: string; status: string }>> => {
    return await apiRequest<{ _id: string; status: string }>(`/users/${id}/toggle-status`, {
      method: 'PUT',
    });
  },

  // Get user statistics
  getUserStats: async (): Promise<ApiResponse<{ totalUsers: number; activeUsers: number; suspendedUsers: number; customers: number; serviceProviders: number; admins: number }>> => {
    return await apiRequest<{ totalUsers: number; activeUsers: number; suspendedUsers: number; customers: number; serviceProviders: number; admins: number }>('/users/stats');
  },

  // Update user preferences
  updateUserPreferences: async (preferences: { notificationPreferences?: any }): Promise<ApiResponse<{ preferences: any }>> => {
    return await apiRequest<{ preferences: any }>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
    return await apiRequest<{ status: string; message: string }>('/health');
  },
};

// Base HTTP methods
const httpMethods = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return await apiRequest<T>(endpoint, { method: 'GET' });
  },

  post: async <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return await apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: async <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return await apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return await apiRequest<T>(endpoint, { method: 'DELETE' });
  },

  patch: async <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return await apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};

// Export the complete API
export default {
  ...httpMethods,
  auth: authApi,
  users: usersApi,
  health: healthApi,
};
