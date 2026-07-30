const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../constants/roles');
const {
  notificationIdParamSchema,
  getNotificationsQuerySchema
} = require('../validators/notificationValidators');

router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(getNotificationsQuerySchema),
  notificationController.getNotifications
);

router.put(
  '/read-all',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  notificationController.markAllAsRead
);

router.get(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(notificationIdParamSchema),
  notificationController.getNotificationById
);

router.put(
  '/:id/read',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(notificationIdParamSchema),
  notificationController.markAsRead
);

router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(notificationIdParamSchema),
  notificationController.deleteNotification
);

module.exports = router;
