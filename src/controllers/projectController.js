const projectService = require('../services/projectService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/projects
 * @desc Create new project (Admin & PM)
 * @access Private (Administrator, Project Manager)
 */
const createProject = asyncHandler(async (req, res) => {
  const result = await projectService.createProject(req.body, req.user);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    status: HTTP_STATUS.CREATED,
    message: 'Project created successfully',
    data: result
  });
});

/**
 * @route GET /api/v1/projects
 * @desc Get paginated list of projects with filtering & sorting
 * @access Private (All authenticated users)
 */
const getProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getProjects(req.query, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Projects retrieved successfully',
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
 * @route GET /api/v1/projects/:id
 * @desc Get project details by ID
 * @access Private (All authenticated users)
 */
const getProjectById = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const result = await projectService.getProjectById(projectId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Project retrieved successfully',
    data: result
  });
});

/**
 * @route PUT /api/v1/projects/:id
 * @desc Update an existing project (Admin or assigned PM)
 * @access Private (Administrator, Project Manager)
 */
const updateProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const result = await projectService.updateProject(projectId, req.body, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Project updated successfully',
    data: result
  });
});

/**
 * @route DELETE /api/v1/projects/:id
 * @desc Soft delete a project (Admin only)
 * @access Private (Administrator)
 */
const deleteProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  await projectService.deleteProject(projectId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Project soft-deleted successfully'
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
