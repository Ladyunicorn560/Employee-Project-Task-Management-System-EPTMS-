const express = require('express');
const projectMilestonesRouter = express.Router({ mergeParams: true });
const directMilestonesRouter = express.Router();
const milestoneController = require('../controllers/milestoneController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ROLES = require('../constants/roles');
const {
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneIdParamSchema,
  getMilestonesQuerySchema
} = require('../validators/milestoneValidators');

// -----------------------------------------------------------------------------
// Nested Routes (/api/v1/projects/:projectId/milestones)
// -----------------------------------------------------------------------------
projectMilestonesRouter.get(
  '/',
  authenticate,
  validate(getMilestonesQuerySchema),
  milestoneController.getMilestonesByProjectId
);

projectMilestonesRouter.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(createMilestoneSchema),
  milestoneController.createMilestone
);

// -----------------------------------------------------------------------------
// Direct Routes (/api/v1/milestones/:id)
// -----------------------------------------------------------------------------
directMilestonesRouter.get(
  '/:id',
  authenticate,
  validate(milestoneIdParamSchema),
  milestoneController.getMilestoneById
);

directMilestonesRouter.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(updateMilestoneSchema),
  milestoneController.updateMilestone
);

directMilestonesRouter.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(milestoneIdParamSchema),
  milestoneController.deleteMilestone
);

module.exports = {
  projectMilestonesRouter,
  directMilestonesRouter
};
