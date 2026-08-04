/**
 * Token Utilities
 * All JWT / auth token interactions with localStorage are centralized here.
 * Never access localStorage for auth data directly — always use these helpers.
 */

const TOKEN_KEY = 'eptms_token';
const USER_KEY = 'eptms_user';

// ─── Token ────────────────────────────────────────────────────────────────────

/** Store JWT token in localStorage */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/** Retrieve JWT token from localStorage */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/** Remove JWT token from localStorage */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// ─── User ─────────────────────────────────────────────────────────────────────

/** Store serialized user object in localStorage */
export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/** Retrieve and parse user object from localStorage */
export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Remove user from localStorage */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// ─── Auth Clear ───────────────────────────────────────────────────────────────

/**
 * Clear all auth data from localStorage.
 * Called on logout or 401 response.
 */
export const clearAuth = () => {
  removeToken();
  removeUser();
};

// ─── Token Validity ───────────────────────────────────────────────────────────

/**
 * Basic check: token exists (not expired check — backend validates expiry).
 * Phase 2: Add JWT decode to check exp claim client-side.
 */
export const isTokenPresent = () => {
  const token = getToken();
  return !!token && token.length > 0;
};
