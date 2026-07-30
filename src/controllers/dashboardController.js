const dashboardService = require('../services/dashboardService');

class DashboardController {
  /**
   * GET /api/v1/dashboard/overview
   */
  async getOverview(req, res, next) {
    try {
      const data = await dashboardService.getOverviewMetrics(req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Dashboard overview metrics retrieved successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/projects
   */
  async getProjectAnalytics(req, res, next) {
    try {
      const data = await dashboardService.getProjectAnalytics(req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Project analytics retrieved successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/tasks
   */
  async getTaskAnalytics(req, res, next) {
    try {
      const data = await dashboardService.getTaskAnalytics(req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Task analytics retrieved successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/employees
   */
  async getEmployeeAnalytics(req, res, next) {
    try {
      const data = await dashboardService.getEmployeeAnalytics(req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Employee analytics retrieved successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/notifications
   */
  async getNotificationAnalytics(req, res, next) {
    try {
      const data = await dashboardService.getNotificationAnalytics(req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Notification analytics retrieved successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
