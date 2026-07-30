const express = require('express');
const attachmentController = require('../controllers/attachmentController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../constants/roles');
const {
  createAttachmentSchema,
  attachmentIdParamSchema,
  getAttachmentsQuerySchema
} = require('../validators/attachmentValidators');

// Nested Router for /api/v1/tasks/:taskId/attachments
const taskAttachmentsRouter = express.Router({ mergeParams: true });

taskAttachmentsRouter.use(authenticate);

taskAttachmentsRouter.get(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(getAttachmentsQuerySchema),
  attachmentController.getAttachmentsByTaskId
);

taskAttachmentsRouter.post(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(createAttachmentSchema),
  attachmentController.createAttachment
);

// Direct Router for /api/v1/attachments/:id
const directAttachmentsRouter = express.Router();

directAttachmentsRouter.use(authenticate);

directAttachmentsRouter.get(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.REVIEWER),
  validate(attachmentIdParamSchema),
  attachmentController.getAttachmentById
);

directAttachmentsRouter.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE),
  validate(attachmentIdParamSchema),
  attachmentController.deleteAttachment
);

module.exports = {
  taskAttachmentsRouter,
  directAttachmentsRouter
};
