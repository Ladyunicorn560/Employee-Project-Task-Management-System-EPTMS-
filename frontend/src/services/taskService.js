import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Task Service — Implementation in Phase 5 */
const taskService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.TASKS.BASE, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.TASKS.BY_ID(id));
    return response.data.data;
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
    const response = await axiosInstance.get(API.TASKS.SUBTASKS(id));
    return response.data.data;
  },
  getComments: async (id) => {
    const response = await axiosInstance.get(API.TASKS.COMMENTS(id));
    return response.data.data;
  },
  getAttachments: async (id) => {
    const response = await axiosInstance.get(API.TASKS.ATTACHMENTS(id));
    return response.data.data;
  },
  getReviews: async (id) => {
    const response = await axiosInstance.get(API.TASKS.REVIEWS(id));
    return response.data.data;
  },
};

export default taskService;
