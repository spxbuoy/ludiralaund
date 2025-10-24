import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { UserRole } from '../types/auth';

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const isAdmin = hasRole('admin');
  const isCustomer = hasRole('customer');
  const isServiceProvider = hasRole('service_provider');

  const canManageUsers = () => {
    if (!user || user.role !== 'admin') return false;
    return (user as any).permissions?.canManageUsers ?? false;
  };

  const canManageOrders = () => {
    if (!user) return false;
    if (user.role === 'admin') return (user as any).permissions?.canManageOrders ?? false;
    if (user.role === 'service_provider') return true;
    return user.role === 'customer';
  };

  const canViewAnalytics = () => {
    if (!user) return false;
    if (user.role === 'admin') return (user as any).permissions?.canViewAnalytics ?? false;
    return user.role === 'service_provider';
  };

  const canManagePayments = () => {
    if (!user) return false;
    if (user.role === 'admin') return (user as any).permissions?.canManagePayments ?? false;
    return user.role === 'service_provider';
  };

  const canModerateReviews = () => {
    if (!user) return false;
    if (user.role === 'admin') return (user as any).permissions?.canModerateReviews ?? false;
    return user.role === 'service_provider';
  };

  return {
    hasRole,
    isAdmin,
    isCustomer,
    isServiceProvider,
    canManageUsers,
    canManageOrders,
    canViewAnalytics,
    canManagePayments,
    canModerateReviews,
  };
}; 