import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/**
 * Employee Service
 * API wrappers for employee CRUD endpoints.
 * Implementation will be added in Phase 2.
 */
const employeeService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.EMPLOYEES.BASE, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.EMPLOYEES.BY_ID(id));
    return response.data.data;
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.EMPLOYEES.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.EMPLOYEES.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.EMPLOYEES.BY_ID(id));
    return response.data;
  },
};

export default employeeService;
