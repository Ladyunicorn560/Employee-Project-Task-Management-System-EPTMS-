import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Notification Service — Implementation in Phase 8 */
const notificationService = {
  getAll: async (params) => {
    const response = await axiosInstance.get(API.NOTIFICATIONS.BASE, { params });
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await axiosInstance.put(API.NOTIFICATIONS.MARK_READ(id));
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await axiosInstance.put(API.NOTIFICATIONS.MARK_ALL_READ);
    return response.data;
  },
  remove: async (id) => {
    const response = await axiosInstance.delete(API.NOTIFICATIONS.BY_ID(id));
    return response.data;
  },
};

export default notificationService;
