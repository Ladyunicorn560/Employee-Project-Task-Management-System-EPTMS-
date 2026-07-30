const express = require('express');
const commentController = require('../controllers/commentController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../constants/roles');
const {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
  getCommentsQuerySchema
} = require('../validators/commentValidators');

// Nested Router for /api/v1/tasks/:taskId/comments
const taskCommentsRouter = express.Router({ mergeParams: true });

taskCommentsRouter.use(authenticate);

taskCommentsRouter.get(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(getCommentsQuerySchema),
  commentController.getCommentsByTaskId
);

taskCommentsRouter.post(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(createCommentSchema),
  commentController.createComment
);

// Direct Router for /api/v1/comments/:id
const directCommentsRouter = express.Router();

directCommentsRouter.use(authenticate);

directCommentsRouter.get(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(commentIdParamSchema),
  commentController.getCommentById
);

directCommentsRouter.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(updateCommentSchema),
  commentController.updateComment
);

directCommentsRouter.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(commentIdParamSchema),
  commentController.deleteComment
);

module.exports = {
  taskCommentsRouter,
  directCommentsRouter
};
