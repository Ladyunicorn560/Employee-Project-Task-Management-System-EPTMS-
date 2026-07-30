const commentService = require('../services/commentService');

class CommentController {
  /**
   * GET /api/v1/tasks/:taskId/comments
   */
  async getCommentsByTaskId(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const result = await commentService.getCommentsByTaskId(taskId, req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Comments retrieved successfully',
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
   * GET /api/v1/comments/:id
   */
  async getCommentById(req, res, next) {
    try {
      const commentId = parseInt(req.params.id, 10);
      const comment = await commentService.getCommentById(commentId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Comment details retrieved successfully',
        data: comment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tasks/:taskId/comments
   */
  async createComment(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const newComment = await commentService.createComment(taskId, req.body.commentText, req.user);
      return res.status(201).json({
        success: true,
        status: 201,
        message: 'Comment created successfully',
        data: newComment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/comments/:id
   */
  async updateComment(req, res, next) {
    try {
      const commentId = parseInt(req.params.id, 10);
      const updatedComment = await commentService.updateComment(commentId, req.body.commentText, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Comment updated successfully',
        data: updatedComment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/comments/:id
   */
  async deleteComment(req, res, next) {
    try {
      const commentId = parseInt(req.params.id, 10);
      const result = await commentService.deleteComment(commentId, req.user);
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

module.exports = new CommentController();
