import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth Hook
 * Convenient accessor for AuthContext.
 * Throws an error if used outside of <AuthProvider>.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};

export default useAuth;
