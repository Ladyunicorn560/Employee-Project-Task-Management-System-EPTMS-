const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ROLES = require('../constants/roles');
const {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdParamSchema,
  getDepartmentsQuerySchema
} = require('../validators/departmentValidators');

/**
 * @route GET /api/v1/departments
 * @desc Get list of all departments (All authenticated users)
 */
router.get(
  '/',
  authenticate,
  validate(getDepartmentsQuerySchema),
  departmentController.getDepartments
);

/**
 * @route POST /api/v1/departments
 * @desc Create new department (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(createDepartmentSchema),
  departmentController.createDepartment
);

/**
 * @route GET /api/v1/departments/:id
 * @desc Get department details by ID (All authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  validate(departmentIdParamSchema),
  departmentController.getDepartmentById
);

/**
 * @route PUT /api/v1/departments/:id
 * @desc Update department record by ID (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(updateDepartmentSchema),
  departmentController.updateDepartment
);

/**
 * @route DELETE /api/v1/departments/:id
 * @desc Soft delete department record by ID (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(departmentIdParamSchema),
  departmentController.deleteDepartment
);

module.exports = router;
