const notificationService = require('../services/notificationService');

class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const result = await notificationService.getNotifications(req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Notifications retrieved successfully',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications/:id
   */
  async getNotificationById(req, res, next) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const notification = await notificationService.getNotificationById(notificationId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Notification details retrieved successfully',
        data: notification
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const updatedNotification = await notificationService.markAsRead(notificationId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Notification marked as read successfully',
        data: updatedNotification
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/notifications/read-all
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: result.message,
        data: { count: result.count }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req, res, next) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const result = await notificationService.deleteNotification(notificationId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
