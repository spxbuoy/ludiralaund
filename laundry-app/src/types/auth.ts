export type UserRole = 'customer' | 'service_provider' | 'admin';

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  instructions: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'customer' | 'service_provider' | 'admin';
  addresses?: Address[];
  phoneNumber?: string;
  preferences?: {
    notificationPreferences: {
      email: boolean;
      sms: boolean;
      chatEmail: boolean;
      push: boolean;
    };
    language: string;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser extends User {
  role: 'admin';
  permissions: {
    canManageUsers: boolean;
    canManageOrders: boolean;
    canManageServices: boolean;
    canViewAnalytics: boolean;
    canManagePayments: boolean;
    canModerateReviews: boolean;
    canManageNotifications: boolean;
    canViewAuditLogs: boolean;
  };
}

export interface CustomerUser extends User {
  role: 'customer';
  addresses: Address[];
  phoneNumber: string;
  loyaltyPoints?: number;
}

export interface ServiceProviderUser extends User {
  role: 'service_provider';
  phoneNumber: string;
  location: string;
  businessDetails: {
    businessName: string;
    serviceAreas: string[];
    availableServices: string[];
    operatingHours: {
      [key: string]: {
        open: string;
        close: string;
      };
    };
  };
  earnings?: {
    total: number;
    pending: number;
    completed: number;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
} 