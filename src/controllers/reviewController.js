const reviewService = require('../services/reviewService');

class ReviewController {
  /**
   * GET /api/v1/tasks/:taskId/reviews
   */
  async getReviewsByTaskId(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const result = await reviewService.getReviewsByTaskId(taskId, req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Reviews retrieved successfully',
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
   * GET /api/v1/reviews/:id
   */
  async getReviewById(req, res, next) {
    try {
      const reviewId = parseInt(req.params.id, 10);
      const review = await reviewService.getReviewById(reviewId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Review details retrieved successfully',
        data: review
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tasks/:taskId/reviews
   */
  async createReview(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const newReview = await reviewService.createReview(taskId, req.body, req.user);
      return res.status(201).json({
        success: true,
        status: 201,
        message: 'Review created successfully',
        data: newReview
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/reviews/:id
   */
  async updateReview(req, res, next) {
    try {
      const reviewId = parseInt(req.params.id, 10);
      const updatedReview = await reviewService.updateReview(reviewId, req.body, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Review updated successfully',
        data: updatedReview
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/reviews/:id
   */
  async deleteReview(req, res, next) {
    try {
      const reviewId = parseInt(req.params.id, 10);
      const result = await reviewService.deleteReview(reviewId, req.user);
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

module.exports = new ReviewController();
