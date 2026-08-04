import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Project Service — Implementation in Phase 4 */
const projectService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.PROJECTS.BASE, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.PROJECTS.BY_ID(id));
    return response.data.data;
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
    const response = await axiosInstance.get(API.PROJECTS.MEMBERS(id));
    return response.data; // Return complete API response to handle pagination/data format
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
