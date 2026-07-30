const notificationRepository = require('../repositories/notificationRepository');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class NotificationService {
  /**
   * Helper method to trigger an event-driven notification (used internally by other services)
   */
  async createEventNotification({
    recipientId,
    triggeredById,
    taskId,
    projectId,
    notificationType,
    message,
    deliveryChannel = 'In-App',
    createdBy
  }, transaction = null) {
    if (!recipientId) return null;

    // Do not notify users of their own actions
    if (recipientId === (triggeredById || createdBy)) {
      return null;
    }

    // Check duplicate unread notification to prevent spam
    const isDuplicate = await notificationRepository.findDuplicateUnread(
      recipientId,
      notificationType,
      taskId,
      projectId
    );

    if (isDuplicate) {
      logger.info(`Suppressed duplicate unread notification [Type: ${notificationType}, RecipientID: ${recipientId}, TaskID: ${taskId}]`);
      return null;
    }

    const notifId = await notificationRepository.create({
      recipientId,
      triggeredById,
      taskId,
      projectId,
      notificationType,
      message,
      deliveryChannel,
      createdBy
    }, transaction);

    logger.info(`Notification created successfully [ID: ${notifId}, Type: ${notificationType}, RecipientID: ${recipientId}]`);
    return notifId;
  }

  /**
   * Fetches paginated & filtered notifications list for current user (or filtered by Admin)
   */
  async getNotifications(queryParams, currentUser) {
    let targetRecipientId = currentUser.userId;

    if (currentUser.roleName === ROLES.ADMINISTRATOR) {
      targetRecipientId = queryParams.recipientId !== undefined ? queryParams.recipientId : null;
    }

    return notificationRepository.findByRecipientId(targetRecipientId, queryParams);
  }

  /**
   * Fetches single notification details by ID
   */
  async getNotificationById(notificationId, currentUser) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification with ID ${notificationId} was not found`);
    }

    // Ownership / RBAC Guard
    if (currentUser.roleName !== ROLES.ADMINISTRATOR && notification.recipient.id !== currentUser.userId) {
      logger.warn(`Unauthorized notification view attempt: User ${currentUser.email} tried to view Notification ID ${notificationId}`);
      throw new ForbiddenError('Access denied. You can only access your own notifications.');
    }

    return notification;
  }

  /**
   * Marks single notification as read
   */
  async markAsRead(notificationId, currentUser) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification with ID ${notificationId} was not found`);
    }

    // Ownership / RBAC Guard
    if (currentUser.roleName !== ROLES.ADMINISTRATOR && notification.recipient.id !== currentUser.userId) {
      logger.warn(`Unauthorized notification mark-read attempt: User ${currentUser.email} tried to modify Notification ID ${notificationId}`);
      throw new ForbiddenError('Access denied. You can only access your own notifications.');
    }

    await notificationRepository.markAsRead(notificationId, currentUser.userId);

    logger.info(`Notification marked as read [ID: ${notificationId}, User: ${currentUser.userId}]`);
    return notificationRepository.findById(notificationId);
  }

  /**
   * Marks all unread notifications for current user as read
   */
  async markAllAsRead(currentUser) {
    const count = await notificationRepository.markAllAsRead(currentUser.userId, currentUser.userId);

    logger.info(`Marked all notifications as read [Count: ${count}, User: ${currentUser.userId}]`);
    return {
      message: `Successfully marked ${count} notification(s) as read`,
      count
    };
  }

  /**
   * Soft deletes a notification record
   */
  async deleteNotification(notificationId, currentUser) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification with ID ${notificationId} was not found`);
    }

    // Ownership / RBAC Guard
    if (currentUser.roleName !== ROLES.ADMINISTRATOR && notification.recipient.id !== currentUser.userId) {
      logger.warn(`Unauthorized notification delete attempt: User ${currentUser.email} tried to delete Notification ID ${notificationId}`);
      throw new ForbiddenError('Access denied. You can only delete your own notifications.');
    }

    await notificationRepository.softDelete(notificationId, currentUser.userId);

    logger.info(`Notification soft-deleted successfully [ID: ${notificationId}, DeletedBy: ${currentUser.userId}]`);
    return { message: `Notification with ID ${notificationId} was soft-deleted successfully` };
  }
}

module.exports = new NotificationService();
