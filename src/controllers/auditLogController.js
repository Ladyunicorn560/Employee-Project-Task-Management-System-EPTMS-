const auditLogService = require('../services/auditLogService');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route GET /api/v1/audit-logs
 * @desc Get paginated system audit log history (Admin only)
 * @access Private (Administrator)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.getAuditLogs(req.query);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    status: HTTP_STATUS.OK,
    message: 'System audit logs retrieved successfully',
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
  getAuditLogs
};
