import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Task Service — Implementation in Phase 5 */
const EMPTY_PAGINATED = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };

const taskService = {
  getAll: async (params) => {
    try {
      const response = await axiosInstance.get(API.TASKS.BASE, { params });
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },
  getByMilestoneId: async (milestoneId, params) => {
    try {
      const response = await axiosInstance.get(`/milestones/${milestoneId}/tasks`, { params });
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },
  createInMilestone: async (milestoneId, payload) => {
    const response = await axiosInstance.post(`/milestones/${milestoneId}/tasks`, payload);
    return response.data.data;
  },
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(API.TASKS.BY_ID(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return null;
      }
      throw err;
    }
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.TASKS.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.TASKS.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.TASKS.BY_ID(id));
    return response.data;
  },
  getSubtasks: async (id) => {
    try {
      const response = await axiosInstance.get(API.TASKS.SUBTASKS(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return [];
      }
      throw err;
    }
  },
  getComments: async (id) => {
    try {
      const response = await axiosInstance.get(API.TASKS.COMMENTS(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return [];
      }
      throw err;
    }
  },
  getAttachments: async (id) => {
    try {
      const response = await axiosInstance.get(API.TASKS.ATTACHMENTS(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return [];
      }
      throw err;
    }
  },
  getReviews: async (id) => {
    try {
      const response = await axiosInstance.get(API.TASKS.REVIEWS(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return [];
      }
      throw err;
    }
  },
};

export default taskService;
