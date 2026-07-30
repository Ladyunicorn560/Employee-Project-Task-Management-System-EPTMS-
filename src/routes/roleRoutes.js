const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ROLES = require('../constants/roles');
const {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
  getRolesQuerySchema
} = require('../validators/roleValidators');

/**
 * @route GET /api/v1/roles
 * @desc Get list of all roles (All authenticated users)
 */
router.get(
  '/',
  authenticate,
  validate(getRolesQuerySchema),
  roleController.getRoles
);

/**
 * @route POST /api/v1/roles
 * @desc Create new role (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(createRoleSchema),
  roleController.createRole
);

/**
 * @route GET /api/v1/roles/:id
 * @desc Get role details by ID (All authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  validate(roleIdParamSchema),
  roleController.getRoleById
);

/**
 * @route PUT /api/v1/roles/:id
 * @desc Update role record by ID (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(updateRoleSchema),
  roleController.updateRole
);

/**
 * @route DELETE /api/v1/roles/:id
 * @desc Soft delete role record by ID (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(roleIdParamSchema),
  roleController.deleteRole
);

module.exports = router;
