import axios from 'axios';
import { getToken, clearAuth } from '../utils/tokenUtils';

/**
 * Centralized Axios instance for all EPTMS API requests.
 * - Reads base URL from VITE_API_BASE_URL env variable
 * - Automatically attaches JWT Authorization header
 * - Handles 401 responses by clearing auth and redirecting to login
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Automatically inject JWT token into every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Handle 401 Unauthorized globally — clear auth and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // In Demo Mode on public deployment, do NOT destroy session on 401
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return Promise.reject(error);
      }
      clearAuth();
      // Redirect to login (avoid full page reload for SPA)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
