const dashboardRepository = require('../repositories/dashboardRepository');
const logger = require('../utils/logger');

class DashboardService {
  /**
   * High-level Overview Metrics
   */
  async getOverviewMetrics(queryParams, currentUser) {
    const filters = {
      roleName: currentUser.roleName,
      userId: currentUser.userId,
      departmentId: queryParams.departmentId ? parseInt(queryParams.departmentId, 10) : undefined,
      projectId: queryParams.projectId ? parseInt(queryParams.projectId, 10) : undefined
    };

    logger.info(`Dashboard Overview requested by User ID: ${currentUser.userId} [Role: ${currentUser.roleName}]`);
    return dashboardRepository.getOverviewMetrics(filters);
  }

  /**
   * Project Analytics & Progress Distributions
   */
  async getProjectAnalytics(queryParams, currentUser) {
    const filters = {
      roleName: currentUser.roleName,
      userId: currentUser.userId,
      departmentId: queryParams.departmentId ? parseInt(queryParams.departmentId, 10) : undefined,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    };

    logger.info(`Project Analytics requested by User ID: ${currentUser.userId} [Role: ${currentUser.roleName}]`);
    return dashboardRepository.getProjectAnalytics(filters);
  }

  /**
   * Task Analytics & Breakdown
   */
  async getTaskAnalytics(queryParams, currentUser) {
    const filters = {
      roleName: currentUser.roleName,
      userId: currentUser.userId,
      projectId: queryParams.projectId ? parseInt(queryParams.projectId, 10) : undefined,
      employeeId: queryParams.employeeId ? parseInt(queryParams.employeeId, 10) : undefined,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    };

    logger.info(`Task Analytics requested by User ID: ${currentUser.userId} [Role: ${currentUser.roleName}]`);
    return dashboardRepository.getTaskAnalytics(filters);
  }

  /**
   * Employee Productivity & Workload Analytics
   */
  async getEmployeeAnalytics(queryParams, currentUser) {
    const filters = {
      roleName: currentUser.roleName,
      userId: currentUser.userId,
      departmentId: queryParams.departmentId ? parseInt(queryParams.departmentId, 10) : undefined,
      employeeId: queryParams.employeeId ? parseInt(queryParams.employeeId, 10) : undefined
    };

    logger.info(`Employee Analytics requested by User ID: ${currentUser.userId} [Role: ${currentUser.roleName}]`);
    return dashboardRepository.getEmployeeAnalytics(filters);
  }

  /**
   * Notification Analytics
   */
  async getNotificationAnalytics(queryParams, currentUser) {
    const filters = {
      roleName: currentUser.roleName,
      userId: currentUser.userId
    };

    logger.info(`Notification Analytics requested by User ID: ${currentUser.userId} [Role: ${currentUser.roleName}]`);
    return dashboardRepository.getNotificationAnalytics(filters);
  }
}

module.exports = new DashboardService();
