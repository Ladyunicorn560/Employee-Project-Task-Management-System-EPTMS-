const subtaskService = require('../services/subtaskService');

class SubtaskController {
  /**
   * GET /api/v1/tasks/:taskId/subtasks
   */
  async getSubtasksByTaskId(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const result = await subtaskService.getSubtasksByTaskId(taskId, req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Subtasks retrieved successfully',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/subtasks/:id
   */
  async getSubtaskById(req, res, next) {
    try {
      const subtaskId = parseInt(req.params.id, 10);
      const subtask = await subtaskService.getSubtaskById(subtaskId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Subtask details retrieved successfully',
        data: subtask
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tasks/:taskId/subtasks
   */
  async createSubtask(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const newSubtask = await subtaskService.createSubtask(taskId, req.body, req.user);
      return res.status(201).json({
        success: true,
        status: 201,
        message: 'Subtask created successfully',
        data: newSubtask
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/subtasks/:id
   */
  async updateSubtask(req, res, next) {
    try {
      const subtaskId = parseInt(req.params.id, 10);
      const updatedSubtask = await subtaskService.updateSubtask(subtaskId, req.body, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Subtask updated successfully',
        data: updatedSubtask
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/subtasks/:id
   */
  async deleteSubtask(req, res, next) {
    try {
      const subtaskId = parseInt(req.params.id, 10);
      const result = await subtaskService.deleteSubtask(subtaskId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubtaskController();
