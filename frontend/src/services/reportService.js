import axiosInstance from '../api/axiosInstance';

/**
 * Report Service
 * API wrapper for EPTMS analytics reports and binary file exporting.
 */
const reportService = {
  /**
   * Downloads a binary file (PDF, Excel, CSV) for a specific report type.
   *
   * @param {string} reportType - projects | employees | tasks | milestones | reviews | notifications
   * @param {string} format - pdf | xlsx | csv
   * @param {object} params - filter query parameters (departmentId, projectId, status, priority, etc.)
   * @returns {Promise<Blob>} - Returns binary raw Blob response object
   */
  export: async (reportType, format, params) => {
    const response = await axiosInstance.get(`/reports/${reportType}`, {
      params: { ...params, format },
      responseType: 'blob', // Critical for streaming binary assets without text corruption
    });
    return response.data;
  },

  /**
   * Fetches the report data in raw JSON format (useful for tables or data grids).
   *
   * @param {string} reportType - projects | employees | tasks | milestones | reviews | notifications
   * @param {object} params - query filters
   * @returns {Promise<object>}
   */
  getJsonReport: async (reportType, params) => {
    const response = await axiosInstance.get(`/reports/${reportType}`, {
      params: { ...params, format: 'json' },
    });
    return response.data;
  },
};

export default reportService;
