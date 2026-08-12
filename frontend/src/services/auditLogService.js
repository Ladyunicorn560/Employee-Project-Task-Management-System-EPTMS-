import axiosInstance from '../api/axiosInstance';

/** Audit Log Service */
const auditLogService = {
  getAll: async (params) => {
    const response = await axiosInstance.get('/audit-logs', { params });
    return response.data;
  }
};

export default auditLogService;
