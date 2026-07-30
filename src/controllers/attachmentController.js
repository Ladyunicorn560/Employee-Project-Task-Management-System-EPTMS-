const attachmentService = require('../services/attachmentService');

class AttachmentController {
  /**
   * GET /api/v1/tasks/:taskId/attachments
   */
  async getAttachmentsByTaskId(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const result = await attachmentService.getAttachmentsByTaskId(taskId, req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Attachments retrieved successfully',
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
   * GET /api/v1/attachments/:id
   */
  async getAttachmentById(req, res, next) {
    try {
      const attachmentId = parseInt(req.params.id, 10);
      const attachment = await attachmentService.getAttachmentById(attachmentId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Attachment details retrieved successfully',
        data: attachment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tasks/:taskId/attachments
   */
  async createAttachment(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const newAttachment = await attachmentService.createAttachment(taskId, req.body, req.user);
      return res.status(201).json({
        success: true,
        status: 201,
        message: 'Attachment uploaded successfully',
        data: newAttachment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/attachments/:id
   */
  async deleteAttachment(req, res, next) {
    try {
      const attachmentId = parseInt(req.params.id, 10);
      const result = await attachmentService.deleteAttachment(attachmentId, req.user);
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

module.exports = new AttachmentController();
