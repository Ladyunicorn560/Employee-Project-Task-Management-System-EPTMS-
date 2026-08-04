import { createContext, useState, useEffect, useCallback } from 'react';
import { getToken, getUser, setToken, setUser, clearAuth } from '../utils/tokenUtils';
import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/**
 * AuthContext
 * Provides authentication state and actions to the entire application.
 *
 * Exposes:
 *   user          — Current user object (or null)
 *   token         — JWT token string (or null)
 *   isAuthenticated — Boolean: is the user logged in?
 *   isLoading     — Boolean: initial auth check in progress
 *   login(email, password) — Authenticate and store credentials
 *   logout()      — Clear auth state and storage
 *   refreshUser() — Re-fetch current user profile from API
 */

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Initialize auth from persisted storage on mount ──────────────────────
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUserState(storedUser);
    }

    setIsLoading(false);
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  /**
   * Authenticate user with email and password.
   * Stores token and user in localStorage on success.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} User data
   */
  const login = useCallback(async (email, password) => {
    const response = await axiosInstance.post(API.AUTH.LOGIN, { email, password });
    const { token: newToken, user: userData, employee } = response.data.data;

    // Merge employee profile into user if present
    const fullUser = { ...userData, ...(employee || {}) };

    setToken(newToken);
    setUser(fullUser);
    setTokenState(newToken);
    setUserState(fullUser);

    return fullUser;
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  /**
   * Signal logout to backend (fire-and-forget), then clear local auth state.
   */
  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(API.AUTH.LOGOUT);
    } catch {
      // Ignore errors — always clear local state regardless
    } finally {
      clearAuth();
      setTokenState(null);
      setUserState(null);
    }
  }, []);

  // ─── Refresh User Profile ─────────────────────────────────────────────────
  /**
   * Re-fetch the current user profile from the API.
   * Useful after profile updates.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API.AUTH.ME);
      const updatedUser = response.data.data;
      setUser(updatedUser);
      setUserState(updatedUser);
      return updatedUser;
    } catch {
      // If refresh fails (e.g. token expired), log out
      logout();
    }
  }, [logout]);

  // ─── Context Value ────────────────────────────────────────────────────────
  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
