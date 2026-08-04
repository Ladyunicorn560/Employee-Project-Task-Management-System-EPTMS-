import axiosInstance from '../api/axiosInstance';
import { API } from '../api/endpoints';

/** Project Member Service — Implementation in Phase 4 */
const memberService = {
  getProjectMembers: async (projectId) => {
    const response = await axiosInstance.get(API.PROJECTS.MEMBERS(projectId));
    return response.data.data;
  },
  addMember: async (projectId, payload) => {
    const response = await axiosInstance.post(API.PROJECTS.MEMBERS(projectId), payload);
    return response.data.data;
  },
  removeMember: async (projectId, memberId) => {
    const response = await axiosInstance.delete(`${API.PROJECTS.MEMBERS(projectId)}/${memberId}`);
    return response.data;
  },
};

export default memberService;
