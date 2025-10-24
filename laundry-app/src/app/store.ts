import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import orderReducer from '../features/orders/orderSlice';
import serviceReducer from '../features/services/serviceSlice';
import paymentReducer from '../features/payment/paymentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,  
    orders: orderReducer,
    services: serviceReducer,
    payment: paymentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 