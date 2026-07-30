const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ROLES = require('../constants/roles');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
  getEmployeesQuerySchema
} = require('../validators/employeeValidators');

/**
 * @route GET /api/v1/employees
 * @desc Get list of all employees (Admin & PM only)
 */
router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER),
  validate(getEmployeesQuerySchema),
  employeeController.getEmployees
);

/**
 * @route POST /api/v1/employees
 * @desc Create new employee record (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

/**
 * @route GET /api/v1/employees/:id
 * @desc Get employee details by ID (Admin, PM, or Self)
 */
router.get(
  '/:id',
  authenticate,
  validate(employeeIdParamSchema),
  employeeController.getEmployeeById
);

/**
 * @route PUT /api/v1/employees/:id
 * @desc Update employee record by ID (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

/**
 * @route DELETE /api/v1/employees/:id
 * @desc Soft delete employee record by ID (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMINISTRATOR),
  validate(employeeIdParamSchema),
  employeeController.deleteEmployee
);

module.exports = router;
