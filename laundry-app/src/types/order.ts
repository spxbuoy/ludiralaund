// src/types/order.ts
// Create this file to centralize your Order type definitions

export type OrderStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'ready_for_pickup' | 'ready_for_delivery' | 'picked_up' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface ServiceProvider {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  businessDetails?: any;
}

export interface Payment {
  _id: string;
  order: string;
  customer: string;
  serviceProvider?: string | null;
  amount: number;
  paymentMethod: string;
  paymentDetails: {
    phoneNumber?: string;
    momoNetwork?: string;
  };
  status: PaymentStatus;
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    notes: string;
  }>;
}

export interface ClothingItem {
  itemId: string;
  description: string;
  service: string;
  serviceName: string;
  unitPrice: number;
  isConfirmed?: boolean;
  specialInstructions?: string;
}

export interface OrderItem {
  service: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  clothingItems?: ClothingItem[];
}

export interface Address {
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  instructions: string;
}

export interface Order {
  _id: string;
  customer: Customer;
  serviceProvider?: ServiceProvider | null;
  items: OrderItem[];
  status: OrderStatus;
  payment: Payment;
  totalAmount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  pickupAddress: Address;
  deliveryAddress: Address;
  pickupDate: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
  notes: {
    customer: string;
    serviceProvider: string;
    admin: string;
  };
  orderNumber: string;
  formattedTotal: string;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    notes: string;
  }>;
}

export interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

// Status configuration objects
export const statusColors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  confirmed: 'info',
  assigned: 'info',
  in_progress: 'primary',
  ready_for_pickup: 'secondary',
  ready_for_delivery: 'secondary',
  picked_up: 'secondary', // Add this missing status
  completed: 'success',
  cancelled: 'error',
};

export const paymentStatusColors: Record<PaymentStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'error',
  completed: 'success',
  failed: 'error',
};

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  ready_for_pickup: 'Ready for Pickup',
  ready_for_delivery: 'Ready for Delivery',
  picked_up: 'Picked Up', // Add this missing status
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Payment Pending',
  completed: 'Payment Completed',
  failed: 'Payment Failed',
};