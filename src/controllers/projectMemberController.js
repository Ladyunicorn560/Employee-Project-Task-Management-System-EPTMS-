const projectMemberService = require('../services/projectMemberService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/projects/:projectId/members
 * @desc Assign an employee to a project as team member (Admin & assigned PM)
 * @access Private (Administrator, Project Manager)
 */
const assignMember = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const result = await projectMemberService.assignMember(projectId, req.body, req.user);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    status: HTTP_STATUS.CREATED,
    message: 'Member assigned to project successfully',
    data: result
  });
});

/**
 * @route GET /api/v1/projects/:projectId/members
 * @desc Get list of assigned team members for a project
 * @access Private (All authenticated users)
 */
const getProjectMembers = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const result = await projectMemberService.getProjectMembers(projectId, req.query, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Project members retrieved successfully',
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
 * @route DELETE /api/v1/projects/:projectId/members/:employeeId
 * @desc Remove an assigned team member from a project (Admin & assigned PM)
 * @access Private (Administrator, Project Manager)
 */
const removeMember = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const employeeId = parseInt(req.params.employeeId, 10);
  await projectMemberService.removeMember(projectId, employeeId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Member removed from project successfully'
  });
});

module.exports = {
  assignMember,
  getProjectMembers,
  removeMember
};
