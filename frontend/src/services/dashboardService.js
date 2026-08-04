import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/**
 * Dashboard Service (Frontend)
 * API wrappers for all dashboard analytics endpoints.
 */
const dashboardService = {
  /**
   * Get high-level overview metrics.
   * Returns: { employees, projects, tasks, milestones }
   * @returns {Promise<object>}
   */
  getOverview: async () => {
    const response = await axiosInstance.get(API.DASHBOARD.OVERVIEW);
    return response.data.data;
  },

  /**
   * Get project analytics and progress distributions.
   * @param {object} params - Optional filters (departmentId, startDate, endDate)
   * @returns {Promise<object>}
   */
  getProjectAnalytics: async (params) => {
    const response = await axiosInstance.get(API.DASHBOARD.PROJECTS, { params });
    return response.data.data;
  },

  /**
   * Get task analytics and status/priority breakdown.
   * @param {object} params - Optional filters (projectId, employeeId, startDate, endDate)
   * @returns {Promise<object>}
   */
  getTaskAnalytics: async (params) => {
    const response = await axiosInstance.get(API.DASHBOARD.TASKS, { params });
    return response.data.data;
  },

  /**
   * Get employee productivity and workload analytics.
   * @param {object} params - Optional filters
   * @returns {Promise<object>}
   */
  getEmployeeAnalytics: async (params) => {
    const response = await axiosInstance.get(API.DASHBOARD.EMPLOYEES, { params });
    return response.data.data;
  },

  /**
   * Get notification analytics.
   * @returns {Promise<object>}
   */
  getNotificationAnalytics: async () => {
    const response = await axiosInstance.get(API.DASHBOARD.NOTIFICATIONS);
    return response.data.data;
  },
};

export default dashboardService;
