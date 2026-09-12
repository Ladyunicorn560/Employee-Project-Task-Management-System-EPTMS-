import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

const MOCK_OVERVIEW = {
  employees: { total: 0, active: 0, inactive: 0 },
  projects: { total: 0, active: 0, completed: 0, onHold: 0 },
  tasks: { total: 0, inProgress: 0, completed: 0, pending: 0, completionRate: 0 },
  milestones: { total: 0, completed: 0, upcoming: 0 },
};

const MOCK_PROJECT_ANALYTICS = {
  statusDistribution: [],
  priorityDistribution: [],
  projectsList: [],
};

const MOCK_TASK_ANALYTICS = {
  statusDistribution: [],
  priorityDistribution: [],
};

const MOCK_EMPLOYEE_ANALYTICS = [];

const MOCK_OVERDUE = [];

/**
 * Dashboard Service (Frontend)
 * API wrappers for all dashboard analytics endpoints.
 */
const dashboardService = {
  getOverview: async (params) => {
    try {
      const response = await axiosInstance.get(API.DASHBOARD.OVERVIEW, { params });
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return MOCK_OVERVIEW;
      }
      throw err;
    }
  },

  getProjectAnalytics: async (params) => {
    try {
      const response = await axiosInstance.get(API.DASHBOARD.PROJECTS, { params });
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return MOCK_PROJECT_ANALYTICS;
      }
      throw err;
    }
  },

  getTaskAnalytics: async (params) => {
    try {
      const response = await axiosInstance.get(API.DASHBOARD.TASKS, { params });
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return MOCK_TASK_ANALYTICS;
      }
      throw err;
    }
  },

  getEmployeeAnalytics: async (params) => {
    try {
      const response = await axiosInstance.get(API.DASHBOARD.EMPLOYEES, { params });
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return MOCK_EMPLOYEE_ANALYTICS;
      }
      throw err;
    }
  },

  getNotificationAnalytics: async () => {
    try {
      const response = await axiosInstance.get(API.DASHBOARD.NOTIFICATIONS);
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return { total: 5, unread: 2 };
      }
      throw err;
    }
  },

  getOverdueItems: async () => {
    try {
      const response = await axiosInstance.get(API.DASHBOARD.OVERDUE);
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return MOCK_OVERDUE;
      }
      throw err;
    }
  },
};

export default dashboardService;
