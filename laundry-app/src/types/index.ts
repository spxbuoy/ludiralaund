import { Order } from "./order";

export type UserRole = 'customer' | 'service_provider' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  addresses: Address[];
}
export interface AuthState {
  user: User | null;
  token: string | null; // Add this line
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}


// src/types/index.ts
export interface Address {
  id?: string; // Optional for User addresses
  type: string; // Required for Order and form consistency
  street: string;
  city: string;
  state: string;
  zipCode: string;
  instructions: string;
  isDefault?: boolean; // Optional for User addresses
}
export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  unit: 'kg' | 'piece';
  category: string;
}

export interface ServiceProvider {
  id: string;
  userId: string;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  assignedOrders: string[]; // Order IDs
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

export interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
export type { Order };
export type { OrderItem } from './order';

