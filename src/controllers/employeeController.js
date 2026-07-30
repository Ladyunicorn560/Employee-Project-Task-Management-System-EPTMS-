const employeeService = require('../services/employeeService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/employees
 * @desc Create new employee record (Admin only)
 * @access Private (Administrator)
 */
const createEmployee = asyncHandler(async (req, res) => {
  const createdBy = req.user.userId;
  const result = await employeeService.createEmployee(req.body, createdBy);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    status: HTTP_STATUS.CREATED,
    message: 'Employee created successfully',
    data: result
  });
});

/**
 * @route GET /api/v1/employees
 * @desc Get paginated list of employees with optional filtering (Admin & PM)
 * @access Private (Administrator, Project Manager)
 */
const getEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployees(req.query);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Employees retrieved successfully',
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  });
});

/**
 * @route GET /api/v1/employees/:id
 * @desc Get single employee details by ID (Admin, PM, or Self)
 * @access Private
 */
const getEmployeeById = asyncHandler(async (req, res) => {
  const employeeId = parseInt(req.params.id, 10);
  const result = await employeeService.getEmployeeById(employeeId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Employee retrieved successfully',
    data: result
  });
});

/**
 * @route PUT /api/v1/employees/:id
 * @desc Update an existing employee record (Admin only)
 * @access Private (Administrator)
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employeeId = parseInt(req.params.id, 10);
  const updatedBy = req.user.userId;
  const result = await employeeService.updateEmployee(employeeId, req.body, updatedBy);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Employee updated successfully',
    data: result
  });
});

/**
 * @route DELETE /api/v1/employees/:id
 * @desc Soft delete an employee record (Admin only)
 * @access Private (Administrator)
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const employeeId = parseInt(req.params.id, 10);
  const deletedBy = req.user.userId;
  await employeeService.deleteEmployee(employeeId, deletedBy);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Employee soft-deleted successfully'
  });
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
