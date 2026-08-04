import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Milestone Service — Implementation in Phase 5 */
const milestoneService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.MILESTONES.BASE, { params });
    return response.data;
  },
  getByProjectId: async (projectId, params) => {
    const response = await axiosInstance.get(`${API.PROJECTS.BASE}/${projectId}/milestones`, { params });
    return response.data;
  },
  createInProject: async (projectId, payload) => {
    const response = await axiosInstance.post(`${API.PROJECTS.BASE}/${projectId}/milestones`, payload);
    return response.data.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.MILESTONES.BY_ID(id));
    return response.data.data;
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
