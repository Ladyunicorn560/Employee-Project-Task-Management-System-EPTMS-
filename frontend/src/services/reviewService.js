import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Review Service — Implementation in Phase 7 */
const reviewService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.REVIEWS.BASE, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.REVIEWS.BY_ID(id));
    return response.data.data;
  },
  create: async (payload) => {
    const response = await axiosInstance.post(API.REVIEWS.BASE, payload);
    return response.data.data;
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
