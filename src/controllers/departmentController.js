const departmentService = require('../services/departmentService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/departments
 * @desc Create new department (Admin only)
 * @access Private (Administrator)
 */
const createDepartment = asyncHandler(async (req, res) => {
  const createdBy = req.user.userId;
  const result = await departmentService.createDepartment(req.body, createdBy);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    status: HTTP_STATUS.CREATED,
    message: 'Department created successfully',
    data: result
  });
});

/**
 * @route GET /api/v1/departments
 * @desc Get list of all departments
 * @access Private (All authenticated users)
 */
const getDepartments = asyncHandler(async (req, res) => {
  const result = await departmentService.getDepartments(req.query);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Departments retrieved successfully',
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
 * @route GET /api/v1/departments/:id
 * @desc Get department details by ID
 * @access Private (All authenticated users)
 */
const getDepartmentById = asyncHandler(async (req, res) => {
  const departmentId = parseInt(req.params.id, 10);
  const result = await departmentService.getDepartmentById(departmentId);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Department retrieved successfully',
    data: result
  });
});

/**
 * @route PUT /api/v1/departments/:id
 * @desc Update an existing department (Admin only)
 * @access Private (Administrator)
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const departmentId = parseInt(req.params.id, 10);
  const updatedBy = req.user.userId;
  const result = await departmentService.updateDepartment(departmentId, req.body, updatedBy);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Department updated successfully',
    data: result
  });
});

/**
 * @route DELETE /api/v1/departments/:id
 * @desc Soft delete a department (Admin only)
 * @access Private (Administrator)
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const departmentId = parseInt(req.params.id, 10);
  const deletedBy = req.user.userId;
  await departmentService.deleteDepartment(departmentId, deletedBy);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Department soft-deleted successfully'
  });
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
