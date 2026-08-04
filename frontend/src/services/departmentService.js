import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Department Service — Implementation in Phase 3 */
const departmentService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.DEPARTMENTS.BASE, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.DEPARTMENTS.BY_ID(id));
    return response.data.data;
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.DEPARTMENTS.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.DEPARTMENTS.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.DEPARTMENTS.BY_ID(id));
    return response.data;
  },
};

export default departmentService;
