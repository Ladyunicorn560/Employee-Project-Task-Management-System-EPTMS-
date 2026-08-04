import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Report Service — Implementation in Phase 9 */
const reportService = {
  getSummary: async () => {
    const response = await axiosInstance.get(API.REPORTS.BASE);
    return response.data.data;
  },
  getEmployeeReport: async (params) => {
    const response = await axiosInstance.get(API.REPORTS.EMPLOYEE, { params });
    return response.data.data;
  },
  getProjectReport: async (params) => {
    const response = await axiosInstance.get(API.REPORTS.PROJECT, { params });
    return response.data.data;
  },
  getTaskReport: async (params) => {
    const response = await axiosInstance.get(API.REPORTS.TASK, { params });
    return response.data.data;
  },
};

export default reportService;
