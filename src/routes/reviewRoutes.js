const express = require('express');
const reviewController = require('../controllers/reviewController');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../constants/roles');
const {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  getReviewsQuerySchema
} = require('../validators/reviewValidators');

// Nested Router for /api/v1/tasks/:taskId/reviews
const taskReviewsRouter = express.Router({ mergeParams: true });

taskReviewsRouter.use(authenticate);

taskReviewsRouter.get(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.REVIEWER, ROLES.EMPLOYEE),
  validate(getReviewsQuerySchema),
  reviewController.getReviewsByTaskId
);

taskReviewsRouter.post(
  '/',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.REVIEWER, ROLES.EMPLOYEE),
  validate(createReviewSchema),
  reviewController.createReview
);

// Direct Router for /api/v1/reviews/:id
const directReviewsRouter = express.Router();

directReviewsRouter.use(authenticate);

directReviewsRouter.get(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.REVIEWER, ROLES.EMPLOYEE),
  validate(reviewIdParamSchema),
  reviewController.getReviewById
);

directReviewsRouter.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER, ROLES.REVIEWER),
  validate(updateReviewSchema),
  reviewController.updateReview
);

directReviewsRouter.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(reviewIdParamSchema),
  reviewController.deleteReview
);

module.exports = {
  taskReviewsRouter,
  directReviewsRouter
};
