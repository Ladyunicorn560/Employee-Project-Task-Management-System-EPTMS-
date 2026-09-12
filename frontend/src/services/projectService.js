import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Project Service — Implementation in Phase 4 */
const EMPTY_PAGINATED = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };

const projectService = {
  getAll: async (params) => {
    try {
      const response = await axiosInstance.get(API.PROJECTS.BASE, { params });
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
      const response = await axiosInstance.get(API.PROJECTS.BY_ID(id));
      return response.data.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return null;
      }
      throw err;
    }
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.PROJECTS.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.PROJECTS.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.PROJECTS.BY_ID(id));
    return response.data;
  },
  getMembers: async (id) => {
    try {
      const response = await axiosInstance.get(API.PROJECTS.MEMBERS(id));
      return response.data;
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_DEMO_MODE === 'true') {
        return EMPTY_PAGINATED;
      }
      throw err;
    }
  },
  addMember: async (projectId, payload) => {
    const response = await axiosInstance.post(API.PROJECTS.MEMBERS(projectId), payload);
    return response.data.data;
  },
  removeMember: async (projectId, employeeId) => {
    const response = await axiosInstance.delete(`${API.PROJECTS.MEMBERS(projectId)}/${employeeId}`);
    return response.data;
  },
};

export default projectService;
