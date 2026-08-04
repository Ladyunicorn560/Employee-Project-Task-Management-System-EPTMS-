import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import PageLoader from '../ui/PageLoader';
import { ROUTES } from '../../constants/routes';

/**
 * ProtectedRoute
 * Guards routes that require authentication.
 * Optionally enforces role-based access control.
 *
 * @param {ReactNode} children - The protected page component
 * @param {string[]} allowedRoles - If provided, only these roles can access the route.
 *                                  If empty/omitted, any authenticated user can access.
 *
 * Redirect logic:
 *  - Not authenticated → /login (with `from` location saved for post-login redirect)
 *  - Authenticated but wrong role → /403
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show full-screen loader while checking persisted auth
  if (isLoading) {
    return <PageLoader message="Verifying session..." />;
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Role check (only if allowedRoles is specified)
  if (allowedRoles.length > 0 && user?.roleName) {
    const hasAccess = allowedRoles.includes(user.roleName);
    if (!hasAccess) {
      return <Navigate to={ROUTES.ERROR_403} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
