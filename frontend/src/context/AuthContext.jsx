import { createContext, useState, useEffect, useCallback } from 'react';
import { getToken, getUser, setToken, setUser, clearAuth } from '../utils/tokenUtils';
import { lsGet, lsSet } from '../utils/storageUtils';
import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/**
 * AuthContext
 * Provides authentication state and actions to the entire application.
 *
 * User shape (normalized — flat for easy access):
 * {
 *   id, email, firstName, lastName,
 *   roleName, roleId,
 *   departmentName, departmentId,
 *   status, lastLoginDate
 * }
 *
 * Exposes:
 *   user          — Normalized current user object (or null)
 *   token         — JWT token string (or null)
 *   isAuthenticated — Boolean
 *   isLoading     — Boolean: initial auth check in progress
 *   login(email, password) — Authenticate and store credentials
 *   logout()      — Clear auth state and storage
 *   refreshUser() — Re-fetch current user profile from API
 */

export const AuthContext = createContext(null);

const REMEMBER_EMAIL_KEY = 'eptms_remember_email';

/**
 * Normalize backend user response to flat shape.
 * Backend returns: user.role.name, user.department.name
 * We normalize to: user.roleName, user.departmentName
 */
const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  return {
    id: rawUser.id,
    email: rawUser.email,
    firstName: rawUser.firstName || '',
    lastName: rawUser.lastName || '',
    roleName: rawUser.role?.name || rawUser.roleName || '',
    roleId: rawUser.role?.id || rawUser.roleId || null,
    departmentName: rawUser.department?.name || rawUser.departmentName || '',
    departmentId: rawUser.department?.id || rawUser.departmentId || null,
    status: rawUser.status || 'Active',
    lastLoginDate: rawUser.lastLoginDate || null,
  };
};

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
      setUserState(storedUser); // already normalized on last login
    }

    setIsLoading(false);
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  /**
   * Authenticate user with email and password.
   * Normalizes and stores the user object flat.
   * @param {string} email
   * @param {string} password
   * @param {boolean} rememberEmail - Store email for next login
   * @returns {Promise<object>} Normalized user
   */
  const login = useCallback(async (email, password, rememberEmail = false) => {
    const response = await axiosInstance.post(API.AUTH.LOGIN, { email, password });
    const { token: newToken, user: rawUser } = response.data.data;

    const normalized = normalizeUser(rawUser);

    setToken(newToken);
    setUser(normalized);
    setTokenState(newToken);
    setUserState(normalized);

    // Handle Remember Me
    if (rememberEmail) {
      lsSet(REMEMBER_EMAIL_KEY, email);
    } else {
      lsSet(REMEMBER_EMAIL_KEY, '');
    }

    return normalized;
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  /**
   * Signal logout to backend (fire-and-forget), then clear local auth state.
   */
  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(API.AUTH.LOGOUT);
    } catch {
      // Always clear local state regardless of backend response
    } finally {
      clearAuth();
      setTokenState(null);
      setUserState(null);
    }
  }, []);

  // ─── Refresh User Profile ─────────────────────────────────────────────────
  /**
   * Re-fetch and re-normalize the current user profile from the API.
   * Useful after profile updates or role changes.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API.AUTH.ME);
      // getProfile returns { user: { ... } }
      const rawUser = response.data.data?.user || response.data.data;
      const normalized = normalizeUser(rawUser);
      setUser(normalized);
      setUserState(normalized);
      return normalized;
    } catch {
      // If refresh fails (e.g. token expired), force logout
      await logout();
    }
  }, [logout]);

  // ─── Get Remembered Email ─────────────────────────────────────────────────
  const getRememberedEmail = useCallback(() => {
    return lsGet(REMEMBER_EMAIL_KEY, '');
  }, []);

  // ─── Context Value ────────────────────────────────────────────────────────
  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    getRememberedEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
