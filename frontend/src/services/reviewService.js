import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Review Service — Implementation in Phase 7 */
const EMPTY_PAGINATED = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };

const reviewService = {
  getAll: async (params) => {
    try {
      const response = await axiosInstance.get(API.REVIEWS.BASE, { params });
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },
  getByTaskId: async (taskId, params) => {
    try {
      const response = await axiosInstance.get(`/tasks/${taskId}/reviews`, { params });
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },
  createInTask: async (taskId, payload) => {
    const response = await axiosInstance.post(`/tasks/${taskId}/reviews`, payload);
    return response.data.data;
  },
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(API.REVIEWS.BY_ID(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return null;
      }
      throw err;
    }
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.REVIEWS.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.REVIEWS.BY_ID(id));
    return response.data;
  },
};

export default reviewService;
