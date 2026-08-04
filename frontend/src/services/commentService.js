import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Comment Service — Implementation in Phase 6 */
const commentService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.COMMENTS.BASE, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.COMMENTS.BY_ID(id));
    return response.data.data;
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.COMMENTS.BASE, payload);
    return response.data.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(API.COMMENTS.BY_ID(id), payload);
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.COMMENTS.BY_ID(id));
    return response.data;
  },
};

export default commentService;
