const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const projectMemberRoutes = require('./projectMemberRoutes');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ROLES = require('../constants/roles');
const {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  getProjectsQuerySchema
} = require('../validators/projectValidators');

// Mount nested Project Member Routes (/api/v1/projects/:projectId/members)
router.use('/:projectId/members', projectMemberRoutes);

/**
 * @route GET /api/v1/projects
 * @desc Get list of projects with filtering, sorting, & pagination
 */
router.get(
  '/',
  authenticate,
  validate(getProjectsQuerySchema),
  projectController.getProjects
);

/**
 * @route POST /api/v1/projects
 * @desc Create new project (Admin & PM only)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(createProjectSchema),
  projectController.createProject
);

/**
 * @route GET /api/v1/projects/:id
 * @desc Get project details by ID
 */
router.get(
  '/:id',
  authenticate,
  validate(projectIdParamSchema),
  projectController.getProjectById
);

/**
 * @route PUT /api/v1/projects/:id
 * @desc Update project record by ID (Admin or assigned PM)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(updateProjectSchema),
  projectController.updateProject
);

/**
 * @route DELETE /api/v1/projects/:id
 * @desc Soft delete project record by ID (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(projectIdParamSchema),
  projectController.deleteProject
);

module.exports = router;
