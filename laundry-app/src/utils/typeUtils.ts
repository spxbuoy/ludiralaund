// src/utils/typeUtils.ts
import { Order, OrderItem } from '../types/order';

// Type guard to check if an order has all required properties
export const isValidOrder = (order: any): order is Order => {
  return (
    order &&
    typeof order._id === 'string' &&
    order.customer &&
    typeof order.customer.firstName === 'string' &&
    typeof order.customer.lastName === 'string' &&
    order.payment &&
    typeof order.payment.status === 'string' &&
    Array.isArray(order.items) &&
    typeof order.status === 'string' &&
    typeof order.orderNumber === 'string' &&
    typeof order.formattedTotal === 'string'
  );
};

// Function to safely get order property with fallback
export const safeGetOrderProperty = <T>(
  order: any,
  propertyPath: string,
  fallback: T
): T => {
  try {
    const keys = propertyPath.split('.');
    let value = order;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

// Function to format order for display
export const formatOrderForDisplay = (order: any): Order => {
  if (isValidOrder(order)) {
    return order;
  } else {
    // Ensure all required properties of Order are provided with default values
    // when the input order is not valid according to isValidOrder.
    // This prevents the "A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value" error
  }
  return {
    _id: order._id || order.id || '',
    customer: {
      _id: order.customer?._id || '',
      firstName: order.customer?.firstName || 'Unknown',
      lastName: order.customer?.lastName || 'Customer',
      email: order.customer?.email || '',
      phoneNumber: order.customer?.phoneNumber || '',
    },
    serviceProvider: order.serviceProvider || null,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          service: item.service || '', // Assuming 'service' here refers to the service ID
          serviceName: item.serviceName || item.name || 'Unknown Service',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
          specialInstructions: item.specialInstructions || '',
        }))
      : [],
    status: order.status || 'pending',
    payment: {
      _id: order.payment?._id || '',
      order: order._id || '',
      customer: order.customer?._id || '',
      serviceProvider: order.serviceProvider?._id || null,
      amount: order.payment?.amount || order.totalAmount || 0,
      paymentMethod: order.payment?.paymentMethod || order.payment?.method || 'cash',
      paymentDetails: order.payment?.paymentDetails || {
        phoneNumber: order.payment?.paymentDetails?.phoneNumber || '',
        momoNetwork: order.payment?.paymentDetails?.momoNetwork || '',
      },
      status: order.payment?.status || 'pending',
 statusHistory: Array.isArray(order.payment?.statusHistory) ? order.payment?.statusHistory : [],
    },
    totalAmount: order.totalAmount || 0,
    subtotal: order.subtotal || 0,
    tax: order.tax || 0,
    deliveryFee: order.deliveryFee || 0,
    pickupAddress: order.pickupAddress || {
      type: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      instructions: '',
    },
    deliveryAddress: order.deliveryAddress || {
      type: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      instructions: '',
    },
    pickupDate: order.pickupDate || '',
    deliveryDate: order.deliveryDate || '',
    createdAt: order.createdAt || '',
    updatedAt: order.updatedAt || '',
    notes: order.notes || {
      customer: '',
      serviceProvider: '',
      admin: '',
    },
    orderNumber: order.orderNumber || `ORD-${(order._id || '').slice(-6).toUpperCase()}`,
    formattedTotal: order.formattedTotal || `¢${(order.totalAmount || 0).toFixed(2)}`,
    statusHistory: order.statusHistory || [],
  };
};