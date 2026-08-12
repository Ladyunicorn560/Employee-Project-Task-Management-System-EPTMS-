const taskService = require('../services/taskService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route POST /api/v1/milestones/:milestoneId/tasks
 * @desc Create new task under a milestone (Admin & PM managing project)
 * @access Private (Administrator, Project Manager)
 */
const createTask = asyncHandler(async (req, res) => {
  const milestoneId = parseInt(req.params.milestoneId, 10);
  const result = await taskService.createTask(milestoneId, req.body, req.user);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    status: HTTP_STATUS.CREATED,
    message: 'Task created successfully',
    data: result
  });
});

/**
 * @route GET /api/v1/milestones/:milestoneId/tasks
 * @desc Get paginated list of tasks for a milestone
 * @access Private (All authenticated users)
 */
const getTasksByMilestoneId = asyncHandler(async (req, res) => {
  const milestoneId = parseInt(req.params.milestoneId, 10);
  const result = await taskService.getTasksByMilestoneId(milestoneId, req.query, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Tasks retrieved successfully',
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
 * @route GET /api/v1/tasks/:id
 * @desc Get task details by ID
 * @access Private (All authenticated users)
 */
const getTaskById = asyncHandler(async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const result = await taskService.getTaskById(taskId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Task retrieved successfully',
    data: result
  });
});

/**
 * @route PUT /api/v1/tasks/:id
 * @desc Update task record (Admin, assigned PM, or assigned Employee)
 * @access Private (Administrator, Project Manager, Employee)
 */
const updateTask = asyncHandler(async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const result = await taskService.updateTask(taskId, req.body, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Task updated successfully',
    data: result
  });
});

/**
 * @route DELETE /api/v1/tasks/:id
 * @desc Soft delete task record (Admin & PM managing project)
 * @access Private (Administrator, Project Manager)
 */
const deleteTask = asyncHandler(async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  await taskService.deleteTask(taskId, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Task soft-deleted successfully'
  });
});

/**
 * @route GET /api/v1/tasks
 * @desc Get tasks globally (all projects or milestones)
 * @access Private (All authenticated users)
 */
const getAllTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getAllTasks(req.query, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'Tasks retrieved successfully',
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  });
});

module.exports = {
  createTask,
  getTasksByMilestoneId,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask
};
