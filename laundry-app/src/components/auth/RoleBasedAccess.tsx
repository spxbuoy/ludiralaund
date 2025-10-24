import React from 'react';
import { UserRole } from '../../types/auth';
import { usePermissions } from '../../hooks/usePermissions';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { hasRole } = usePermissions();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedAccess; 