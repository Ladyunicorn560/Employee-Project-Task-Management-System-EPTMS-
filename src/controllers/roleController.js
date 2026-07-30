const roleService = require('../services/roleService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/roles
 * @desc Create new role (Admin only)
 * @access Private (Administrator)
 */
const createRole = asyncHandler(async (req, res) => {
  const createdBy = req.user.userId;
  const result = await roleService.createRole(req.body, createdBy);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    status: HTTP_STATUS.CREATED,
    message: 'Role created successfully',
    data: result
  });
});

/**
 * @route GET /api/v1/roles
 * @desc Get list of all roles
 * @access Private (All authenticated users)
 */
const getRoles = asyncHandler(async (req, res) => {
  const result = await roleService.getRoles(req.query);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Roles retrieved successfully',
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
 * @route GET /api/v1/roles/:id
 * @desc Get role details by ID
 * @access Private (All authenticated users)
 */
const getRoleById = asyncHandler(async (req, res) => {
  const roleId = parseInt(req.params.id, 10);
  const result = await roleService.getRoleById(roleId);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Role retrieved successfully',
    data: result
  });
});

/**
 * @route PUT /api/v1/roles/:id
 * @desc Update an existing role (Admin only)
 * @access Private (Administrator)
 */
const updateRole = asyncHandler(async (req, res) => {
  const roleId = parseInt(req.params.id, 10);
  const updatedBy = req.user.userId;
  const result = await roleService.updateRole(roleId, req.body, updatedBy);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Role updated successfully',
    data: result
  });
});

/**
 * @route DELETE /api/v1/roles/:id
 * @desc Soft delete a role (Admin only)
 * @access Private (Administrator)
 */
const deleteRole = asyncHandler(async (req, res) => {
  const roleId = parseInt(req.params.id, 10);
  const deletedBy = req.user.userId;
  await roleService.deleteRole(roleId, deletedBy);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Role soft-deleted successfully'
  });
});

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole
};
