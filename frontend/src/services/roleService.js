import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Role Service — Implementation in Phase 3 */
const EMPTY_PAGINATED = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };

const roleService = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get(API.ROLES.BASE);
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
      const response = await axiosInstance.get(API.ROLES.BY_ID(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return null;
      }
      throw err;
    }
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
