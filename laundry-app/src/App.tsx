import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './app/store';
import { getMe } from './features/auth/authSlice';
import ThemeModeProvider from './app/ThemeModeProvider';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import NewOrder from './pages/NewOrder';
import Orders from './pages/Orders';
import Orders_t from './pages/provider/ProviderOrders';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Services from './pages/Services';
import ServiceProviderDashboard from './pages/dashboards/ServiceProviderDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderAvailability from './pages/provider/ProviderAvailability';
import CustomerChat from './pages/dashboards/CustomerChat';
import SupplierChat from './pages/dashboards/SupplierChat';
import AdminChat from './pages/dashboards/AdminChat';
import ProviderChat from './pages/provider/ProviderChat'; // Import ProviderChat
import ChatList from './pages/ChatList'; // Import ChatList

// Admin pages
import UsersManagement from './pages/admin/UsersManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import ServicesManagement from './pages/admin/ServicesManagement';
import Analytics from './pages/admin/Analytics';
import PaymentsManagement from './pages/admin/PaymentsManagement';
import ReviewsManagement from './pages/admin/ReviewsManagement';

// Payment History
import PaymentHistory from './pages/PaymentHistory';
import TestPaymentAPI from './pages/TestPaymentAPI';
import PaymentCallback from './pages/PaymentCallback';
import LoyaltyProgram from './pages/LoyaltyProgram';

// Authentication Initialization Component
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);
  const [bootstrapped, setBootstrapped] = React.useState(false);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      console.log('🔍 AuthInitializer bootstrap:', { token: token ? 'exists' : 'null' });
      if (token) {
        try {
          await dispatch(getMe()).unwrap();
        } catch (e) {
          console.warn('getMe failed during bootstrap:', e);
        }
      }
      if (mounted) setBootstrapped(true);
    };
    bootstrap();
    return () => { mounted = false; };
  }, [dispatch]);

  // Block routing until initial auth check completes to avoid redirecting to landing on refresh
  if (!bootstrapped || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);

  console.log('🔍 ProtectedRoute check:', { isAuthenticated, user: user ? 'exists' : 'null' });

  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

// Role-Based Route Component
const RoleBasedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  console.log('🛡️ RoleBasedRoute Check:', {
    pathname: location.pathname,
    isAuthenticated,
    userRole: user?.role,
    allowedRoles,
  });

  if (!isAuthenticated || !user) {
    console.log('❌ RoleBasedRoute: Not authenticated, redirecting to /');
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  console.log('✅ RoleBasedRoute: Access granted.');
  return <>{children}</>;
};

// Unauthorized Access Page
const Unauthorized: React.FC = () => {
  return (
    <MainLayout title="Unauthorized">
      <div style={{ padding: '2rem' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    </MainLayout>
  );
};

// Root Route Component
const RootRoute: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  console.log('📍 RootRoute Check:', {
    pathname: location.pathname,
    isAuthenticated,
    userRole: user?.role,
  });

  if (!isAuthenticated || !user) {
    console.log('❌ RootRoute: Not authenticated, redirecting to /');
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case 'admin':
      console.log('Redirecting to /admin');
      return <Navigate to="/admin" />;
    case 'service_provider':
      console.log('Redirecting to /provider');
      return <Navigate to="/provider" />;
    case 'customer':
      console.log('Redirecting to /customer');
      return <Navigate to="/customer" />;
    default:
      console.log('Redirecting to /login');
      return <Navigate to="/login" />;
  }
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeModeProvider>
        <AuthInitializer>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              {/* Paystack redirects here after payment. This page verifies then redirects to Orders */}
              <Route path="/payment/callback/:orderId" element={<PaymentCallback />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Chat Routes */}
              <Route
                path="/chat/customer/:chatRoomId"
                element={
                  <RoleBasedRoute allowedRoles={['customer']}>
                    <MainLayout title="Support Chat">
                      <CustomerChat />
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/chat/supplier/:chatRoomId"
                element={
                  <RoleBasedRoute allowedRoles={['service_provider']}>
                    <MainLayout title="Customer Chat">
                      <SupplierChat />
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/chat/admin/:chatRoomId"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <MainLayout title="Shop Owner Chat">
                      <AdminChat />
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Chat List Route */}
              <Route
                path="/chats"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'service_provider']}>
                    <MainLayout title="Chats">
                      <ChatList />
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Test Route */}
              <Route
                path="/test-api"
                element={
                  <MainLayout title="API Test">
                    <TestPaymentAPI />
                  </MainLayout>
                }
              />

              {/* Root Route - Redirects to appropriate dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RootRoute />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes */}
              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <MainLayout title="Shop Owner Dashboard">
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="users" element={<UsersManagement />} />
                        <Route path="orders" element={<OrdersManagement />} />
                        <Route path="services" element={<ServicesManagement />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="payment-history" element={<PaymentHistory />} />
                        <Route path="reviews" element={<ReviewsManagement />} />
                      </Routes>
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/customer/*"
                element={
                  <RoleBasedRoute allowedRoles={['customer']}>
                    <MainLayout title="Customer Dashboard">
                      <Routes>
                        <Route index element={<CustomerDashboard />} />
                        <Route path="new-order" element={<NewOrder />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="payment-history" element={<PaymentHistory />} />
                        <Route path="services" element={<Services />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="loyalty" element={<LoyaltyProgram />} />
                      </Routes>
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Service Provider Routes */}
              <Route
                path="/provider/*"
                element={
                  <RoleBasedRoute allowedRoles={['service_provider']}>
                    <MainLayout title="Provider Dashboard">
                      <Routes>
                        <Route index element={<ServiceProviderDashboard />} />
                        <Route path="orders" element={<Orders_t />} />
                        <Route path="earnings" element={<ProviderEarnings />} />
                        <Route path="availability" element={<ProviderAvailability />} />
                        <Route path="payment-history" element={<PaymentHistory />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="chat/:chatRoomId" element={<ProviderChat />} />
                      </Routes>
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Unauthorized Access */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/new-order"
                element={
                  <ProtectedRoute>
                    <MainLayout title="New Order">
                      <NewOrder />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <MainLayout title="My Orders">
                      <Orders />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MainLayout title="Profile">
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout title="Settings">
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <MainLayout title="Services">
                      <Services />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthInitializer>
      </ThemeModeProvider>
    </Provider>
  );
};

export default App;
