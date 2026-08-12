const express = require('express');
const milestoneTasksRouter = express.Router({ mergeParams: true });
const directTasksRouter = express.Router();
const taskController = require('../controllers/taskController');
const { taskSubtasksRouter } = require('./subtaskRoutes');
const { taskCommentsRouter } = require('./commentRoutes');
const { taskAttachmentsRouter } = require('./attachmentRoutes');
const { taskReviewsRouter } = require('./reviewRoutes');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ROLES = require('../constants/roles');
const {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  getTasksQuerySchema,
  getAllTasksQuerySchema
} = require('../validators/taskValidators');

// -----------------------------------------------------------------------------
// Nested Routes (/api/v1/milestones/:milestoneId/tasks)
// -----------------------------------------------------------------------------
milestoneTasksRouter.get(
  '/',
  authenticate,
  validate(getTasksQuerySchema),
  taskController.getTasksByMilestoneId
);

milestoneTasksRouter.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(createTaskSchema),
  taskController.createTask
);

// Mount nested sub-resources under /api/v1/tasks/:taskId
directTasksRouter.use('/:taskId/subtasks', taskSubtasksRouter);
directTasksRouter.use('/:taskId/comments', taskCommentsRouter);
directTasksRouter.use('/:taskId/attachments', taskAttachmentsRouter);
directTasksRouter.use('/:taskId/reviews', taskReviewsRouter);

// -----------------------------------------------------------------------------
// Direct Routes (/api/v1/tasks)
// -----------------------------------------------------------------------------
directTasksRouter.get(
  '/',
  authenticate,
  validate(getAllTasksQuerySchema),
  taskController.getAllTasks
);

directTasksRouter.get(
  '/:id',
  authenticate,
  validate(taskIdParamSchema),
  taskController.getTaskById
);

directTasksRouter.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(updateTaskSchema),
  taskController.updateTask
);

directTasksRouter.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(taskIdParamSchema),
  taskController.deleteTask
);

module.exports = {
  milestoneTasksRouter,
  directTasksRouter
};
