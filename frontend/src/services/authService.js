import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/**
 * Auth Service
 * API wrappers for authentication endpoints.
 * Business logic lives in AuthContext; this file handles raw API calls.
 */

const authService = {
  /**
   * Login user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} { token, user, employee }
   */
  login: async (email, password) => {
    const response = await axiosInstance.post(API.AUTH.LOGIN, { email, password });
    return response.data.data;
  },

  /**
   * Get current authenticated user profile.
   * @returns {Promise<object>} User profile data
   */
  getProfile: async () => {
    const response = await axiosInstance.get(API.AUTH.ME);
    return response.data.data;
  },

  /**
   * Signal logout to backend.
   * @returns {Promise<void>}
   */
  logout: async () => {
    const response = await axiosInstance.post(API.AUTH.LOGOUT);
    return response.data;
  },

  /**
   * Change the authenticated user's password.
   * @param {object} payload - { currentPassword, newPassword }
   * @returns {Promise<object>}
   */
  changePassword: async (payload) => {
    const response = await axiosInstance.put(API.AUTH.CHANGE_PASSWORD, payload);
    return response.data;
  },

  /**
   * Request password reset link.
   * @param {string} email
   * @returns {Promise<object>}
   */
  forgotPassword: async (email) => {
    const response = await axiosInstance.post(API.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  },

  /**
   * Reset password with token.
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<object>}
   */
  resetPassword: async (token, newPassword) => {
    const response = await axiosInstance.post(API.AUTH.RESET_PASSWORD, { token, newPassword });
    return response.data;
  },
};

export default authService;
