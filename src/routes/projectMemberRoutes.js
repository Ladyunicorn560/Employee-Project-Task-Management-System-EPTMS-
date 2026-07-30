const express = require('express');
const router = express.Router({ mergeParams: true });
const projectMemberController = require('../controllers/projectMemberController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ROLES = require('../constants/roles');
const {
  assignProjectMemberSchema,
  removeProjectMemberSchema,
  getProjectMembersQuerySchema
} = require('../validators/projectMemberValidators');

/**
 * @route GET /api/v1/projects/:projectId/members
 * @desc Get assigned team members for a project
 */
router.get(
  '/',
  authenticate,
  validate(getProjectMembersQuerySchema),
  projectMemberController.getProjectMembers
);

/**
 * @route POST /api/v1/projects/:projectId/members
 * @desc Assign employee as project member (Admin & assigned PM)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(assignProjectMemberSchema),
  projectMemberController.assignMember
);

/**
 * @route DELETE /api/v1/projects/:projectId/members/:employeeId
 * @desc Remove employee from project (Admin & assigned PM)
 */
router.delete(
  '/:employeeId',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(removeProjectMemberSchema),
  projectMemberController.removeMember
);

module.exports = router;
