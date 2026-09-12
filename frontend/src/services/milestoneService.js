import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Milestone Service — Implementation in Phase 5 */
const EMPTY_PAGINATED = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };

const milestoneService = {
  getAll: async (params) => {
    try {
      const response = await axiosInstance.get(API.MILESTONES.BASE, { params });
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },
  getByProjectId: async (projectId, params) => {
    try {
      const response = await axiosInstance.get(`${API.PROJECTS.BASE}/${projectId}/milestones`, { params });
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },
  createInProject: async (projectId, payload) => {
    const response = await axiosInstance.post(`${API.PROJECTS.BASE}/${projectId}/milestones`, payload);
    return response.data.data;
  },
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(API.MILESTONES.BY_ID(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return null;
      }
      throw err;
    }
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.MILESTONES.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.MILESTONES.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.MILESTONES.BY_ID(id));
    return response.data;
  },
};

export default milestoneService;
