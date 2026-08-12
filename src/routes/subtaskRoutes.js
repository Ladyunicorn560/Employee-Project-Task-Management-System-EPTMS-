const express = require('express');
const subtaskController = require('../controllers/subtaskController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../constants/roles');
const {
  createSubtaskSchema,
  updateSubtaskSchema,
  subtaskIdParamSchema,
  getSubtasksQuerySchema
} = require('../validators/subtaskValidators');

// Nested Router for /api/v1/tasks/:taskId/subtasks
const taskSubtasksRouter = express.Router({ mergeParams: true });

taskSubtasksRouter.use(authenticate);

taskSubtasksRouter.get(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(getSubtasksQuerySchema),
  subtaskController.getSubtasksByTaskId
);

taskSubtasksRouter.post(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(createSubtaskSchema),
  subtaskController.createSubtask
);

// Direct Router for /api/v1/subtasks/:id
const directSubtasksRouter = express.Router();

directSubtasksRouter.use(authenticate);

directSubtasksRouter.get(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(subtaskIdParamSchema),
  subtaskController.getSubtaskById
);

directSubtasksRouter.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(updateSubtaskSchema),
  subtaskController.updateSubtask
);

directSubtasksRouter.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(subtaskIdParamSchema),
  subtaskController.deleteSubtask
);

module.exports = {
  taskSubtasksRouter,
  directSubtasksRouter
};
