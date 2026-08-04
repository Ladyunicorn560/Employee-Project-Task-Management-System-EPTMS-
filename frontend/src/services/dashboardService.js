import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/**
 * Dashboard Service
 * API wrappers for dashboard summary/statistics endpoints.
 */
const dashboardService = {
  /**
   * Get dashboard summary statistics.
   * @returns {Promise<object>} Dashboard stats (project counts, task counts, etc.)
   */
  getSummary: async () => {
    const response = await axiosInstance.get(API.DASHBOARD.BASE);
    return response.data.data;
  },
};

export default dashboardService;
