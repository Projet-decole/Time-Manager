// frontend/src/components/common/RoleProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

/**
 * Role hierarchy - higher roles include permissions of lower roles
 * manager can access both manager and employee routes
 * employee can only access employee routes
 */
const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']
};

/**
 * Route guard component that protects routes based on user role
 * Wraps ProtectedRoute to ensure authentication first
 * Redirects to /access-denied if user doesn't have required role
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.roles - Array of roles that can access this route
 */
export default function RoleProtectedRoute({ children, roles = [] }) {
  return (
    <ProtectedRoute>
      <RoleCheck roles={roles}>
        {children}
      </RoleCheck>
    </ProtectedRoute>
  );
}

/**
 * Internal component that checks if user has required role
 */
function RoleCheck({ roles, children }) {
  const { user } = useAuth();

  // Get all roles the user has access to based on hierarchy
  const userRoles = ROLE_HIERARCHY[user?.role] || [];

  // Check if user has any of the required roles
  const hasPermission = roles.some(role => userRoles.includes(role));

  if (!hasPermission) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
