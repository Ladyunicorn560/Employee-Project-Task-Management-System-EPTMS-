const timecardService = require('../services/timecardService');

class TimecardController {
  /**
   * POST /api/v1/timecards
   * Submit weekly timecard
   */
  async submitTimecard(req, res, next) {
    try {
      const timecard = await timecardService.submitTimecard(req.body, req.user);
      return res.status(201).json({
        success: true,
        status: 201,
        message: 'Timecard submitted successfully',
        data: timecard
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/timecards
   * List timecards with filters
   */
  async getTimecards(req, res, next) {
    try {
      const result = await timecardService.getTimecards(req.query, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Timecards retrieved successfully',
        data: result.items,
        pagination: {
          total: result.totalCount,
          page: req.query.page || 1,
          limit: req.query.limit || 10,
          totalPages: Math.ceil(result.totalCount / (req.query.limit || 10))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/timecards/:id
   * Get single timecard details
   */
  async getTimecardById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const timecard = await timecardService.getTimecardById(id, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Timecard details retrieved successfully',
        data: timecard
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/timecards/:id/manager-approve
   * Stage 1: Manager Approval
   */
  async approveManager(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await timecardService.approveManagerTimecard(id, req.body, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Timecard approved by manager',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/timecards/:id/manager-reject
   * Stage 1: Manager Rejection
   */
  async rejectManager(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await timecardService.rejectManagerTimecard(id, req.body, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Timecard rejected by manager',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/timecards/:id/financial-approve
   * Stage 2: Project Owner Financial / Billing Approval
   */
  async approveFinancial(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await timecardService.approveFinancialTimecard(id, req.body, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Timecard financially approved for billing',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/timecards/:id/financial-reject
   * Stage 2: Project Owner Financial Rejection
   */
  async rejectFinancial(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await timecardService.rejectFinancialTimecard(id, req.body, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Timecard financial approval rejected',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/timecards/:id
   * Edit & Resubmit rejected timecard
   */
  async updateTimecard(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const timecard = await timecardService.updateTimecard(id, req.body, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Timecard edited and resubmitted successfully',
        data: timecard
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/timecards/missing
   * Get missing timecard weeks for employee
   */
  async getMissingTimecards(req, res, next) {
    try {
      const missing = await timecardService.getMissingTimecards(req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Missing timecards retrieved successfully',
        data: missing
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/timecards/projects/:projectId/billing
   * Get Project Billing Summary for Project Owner
   */
  async getProjectBillingSummary(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const billingSummary = await timecardService.getProjectBillingSummary(projectId, req.user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Project billing summary retrieved successfully',
        data: billingSummary
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TimecardController();
