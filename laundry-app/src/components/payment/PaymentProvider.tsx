import React from 'react';

interface PaymentProviderProps {
  children: React.ReactNode;
}

const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  // Bypass Stripe completely and just render children
  return <>{children}</>;
};

export default PaymentProvider; 