import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Attachment Service — Implementation in Phase 6 */
const attachmentService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.ATTACHMENTS.BASE, { params });
    return response.data;
  },
  getByTaskId: async (taskId, params) => {
    const response = await axiosInstance.get(`/tasks/${taskId}/attachments`, { params });
    return response.data;
  },
  uploadInTask: async (taskId, payload) => {
    const response = await axiosInstance.post(`/tasks/${taskId}/attachments`, payload);
    return response.data.data;
  },
  getById: async (id) => {
    const response = await axiosInstance.get(API.ATTACHMENTS.BY_ID(id));
    return response.data.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.ATTACHMENTS.BY_ID(id));
    return response.data;
  },
};

export default attachmentService;
