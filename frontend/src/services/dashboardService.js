import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

const MOCK_OVERVIEW = {
  employees: { total: 24, active: 22, inactive: 2 },
  projects: { total: 12, active: 8, completed: 3, onHold: 1 },
  tasks: { total: 54, inProgress: 24, completed: 22, pending: 8, completionRate: 81 },
  milestones: { total: 18, completed: 14, upcoming: 4 },
};

const MOCK_PROJECT_ANALYTICS = {
  statusDistribution: [
    { status: 'Active', count: 8 },
    { status: 'Completed', count: 3 },
    { status: 'On Hold', count: 1 },
  ],
  priorityDistribution: [
    { priority: 'High', count: 5 },
    { priority: 'Medium', count: 4 },
    { priority: 'Low', count: 3 },
  ],
  projectsList: [
    { id: 1, name: 'Enterprise Portal Redesign', progress: 75, status: 'Active', leaderName: 'Sarah Jenkins' },
    { id: 2, name: 'Mobile App API Integration', progress: 90, status: 'Active', leaderName: 'David Chen' },
    { id: 3, name: 'Cloud Migration Phase 2', progress: 45, status: 'Active', leaderName: 'Alex Rivera' },
  ],
};

const MOCK_TASK_ANALYTICS = {
  statusDistribution: [
    { status: 'In Progress', count: 24 },
    { status: 'Completed', count: 22 },
    { status: 'Pending Review', count: 8 },
  ],
  priorityDistribution: [
    { priority: 'Critical', count: 6 },
    { priority: 'High', count: 18 },
    { priority: 'Medium', count: 20 },
    { priority: 'Low', count: 10 },
  ],
};

const MOCK_EMPLOYEE_ANALYTICS = [
  { id: 1, name: 'Demo Administrator', assignedTasks: 8, completedTasks: 6, completionRate: 75 },
  { id: 2, name: 'Demo Manager', assignedTasks: 12, completedTasks: 9, completionRate: 75 },
  { id: 3, name: 'Demo Employee', assignedTasks: 6, completedTasks: 5, completionRate: 83 },
];

const MOCK_OVERDUE = [
  { id: 101, title: 'Database Index Optimization', type: 'Task', dueDate: '2026-09-10', status: 'In Progress', priority: 'High' },
  { id: 102, title: 'Quarterly Security Audit', type: 'Review', dueDate: '2026-09-11', status: 'Pending Review', priority: 'Critical' },
];

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
