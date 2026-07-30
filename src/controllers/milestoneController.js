const milestoneService = require('../services/milestoneService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/projects/:projectId/milestones
 * @desc Create new milestone for a project (Admin & PM managing project)
 * @access Private (Administrator, Project Manager)
 */
const createMilestone = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const result = await milestoneService.createMilestone(projectId, req.body, req.user);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    status: HTTP_STATUS.CREATED,
    message: 'Milestone created successfully',
    data: result
  });
});

/**
 * @route GET /api/v1/projects/:projectId/milestones
 * @desc Get paginated list of milestones for a project
 * @access Private (All authenticated users)
 */
const getMilestonesByProjectId = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const result = await milestoneService.getMilestonesByProjectId(projectId, req.query, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Milestones retrieved successfully',
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
 * @route GET /api/v1/milestones/:id
 * @desc Get milestone details by ID
 * @access Private (All authenticated users)
 */
const getMilestoneById = asyncHandler(async (req, res) => {
  const milestoneId = parseInt(req.params.id, 10);
  const result = await milestoneService.getMilestoneById(milestoneId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Milestone retrieved successfully',
    data: result
  });
});

/**
 * @route PUT /api/v1/milestones/:id
 * @desc Update milestone record (Admin & PM managing project)
 * @access Private (Administrator, Project Manager)
 */
const updateMilestone = asyncHandler(async (req, res) => {
  const milestoneId = parseInt(req.params.id, 10);
  const result = await milestoneService.updateMilestone(milestoneId, req.body, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Milestone updated successfully',
    data: result
  });
});

/**
 * @route DELETE /api/v1/milestones/:id
 * @desc Soft delete milestone record (Admin & PM managing project)
 * @access Private (Administrator, Project Manager)
 */
const deleteMilestone = asyncHandler(async (req, res) => {
  const milestoneId = parseInt(req.params.id, 10);
  await milestoneService.deleteMilestone(milestoneId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Milestone soft-deleted successfully'
  });
});

module.exports = {
  createMilestone,
  getMilestonesByProjectId,
  getMilestoneById,
  updateMilestone,
  deleteMilestone
};
