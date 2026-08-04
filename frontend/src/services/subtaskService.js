import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Subtask Service — Implementation in Phase 5 */
const subtaskService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.SUBTASKS.BASE, { params });
    return response.data;
  },
  getByTaskId: async (taskId, params) => {
    const response = await axiosInstance.get(API.TASKS.SUBTASKS(taskId), { params });
    return response.data;
  },
  createInTask: async (taskId, payload) => {
    const response = await axiosInstance.post(API.TASKS.SUBTASKS(taskId), payload);
    return response.data.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.SUBTASKS.BY_ID(id));
    return response.data.data;
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.SUBTASKS.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.SUBTASKS.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.SUBTASKS.BY_ID(id));
    return response.data;
  },
};

export default subtaskService;
