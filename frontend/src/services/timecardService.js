import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

const EMPTY_PAGINATED = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };

const timecardService = {
  getAll: async (params) => {
    try {
      const response = await axiosInstance.get(API.TIMECARDS.BASE, { params });
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(API.TIMECARDS.BY_ID(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return null;
      }
      throw err;
    }
  },

  submit: async (payload) => {
    const response = await axiosInstance.post(API.TIMECARDS.BASE, payload);
    return response.data.data;
  },

  approveManager: async (id, comments) => {
    const response = await axiosInstance.post(API.TIMECARDS.MANAGER_APPROVE(id), { comments });
    return response.data.data;
  },

  rejectManager: async (id, comments) => {
    const response = await axiosInstance.post(API.TIMECARDS.MANAGER_REJECT(id), { comments });
    return response.data.data;
  },

  approveFinancial: async (id, comments) => {
    const response = await axiosInstance.post(API.TIMECARDS.FINANCIAL_APPROVE(id), { comments });
    return response.data.data;
  },

  rejectFinancial: async (id, comments) => {
    const response = await axiosInstance.post(API.TIMECARDS.FINANCIAL_REJECT(id), { comments });
    return response.data.data;
  },

  getProjectBillingSummary: async (projectId) => {
    const response = await axiosInstance.get(API.TIMECARDS.PROJECT_BILLING(projectId));
    return response.data.data;
  }
};

export default timecardService;
