import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

const timecardService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.TIMECARDS.BASE, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(API.TIMECARDS.BY_ID(id));
    return response.data.data;
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
