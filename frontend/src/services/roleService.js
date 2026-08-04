import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Role Service — Implementation in Phase 3 */
const roleService = {
  getAll: async () => {
    const response = await axiosInstance.get(API.ROLES.BASE);
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.ROLES.BY_ID(id));
    return response.data.data;
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.ROLES.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.ROLES.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.ROLES.BY_ID(id));
    return response.data;
  },
};

export default roleService;
