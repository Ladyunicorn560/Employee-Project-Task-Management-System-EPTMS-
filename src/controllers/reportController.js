const reportService = require('../services/reportService');
const {
  projectReportSchema,
  employeeReportSchema,
  taskReportSchema,
  milestoneReportSchema,
  reviewReportSchema,
  notificationReportSchema
} = require('../validators/reportValidators');

function _parseQuery(schema, rawQuery) {
  const result = schema.safeParse({ query: rawQuery });
  if (!result.success) {
    throw { status: 422, message: 'Invalid query parameters.', errors: result.error.flatten().fieldErrors };
  }
  return result.data.query;
}

function _getRbac(req) {
  return { roleName: req.user.roleName, userId: req.user.userId };
}

// GET /api/v1/reports/projects
async function getProjectReport(req, res, next) {
  try {
    const q = _parseQuery(projectReportSchema, req.query);
    const { roleName, userId } = _getRbac(req);
    const { data, total } = await reportService.generateProjectReport(roleName, userId, q);
    if (q.format !== 'json') return reportService.sendReport(res, q.format, data, 'project');
    res.json({ success: true, total, page: q.page, limit: q.limit, data });
  } catch (err) { next(err); }
}

// GET /api/v1/reports/employees
async function getEmployeeReport(req, res, next) {
  try {
    const q = _parseQuery(employeeReportSchema, req.query);
    const { roleName, userId } = _getRbac(req);
    const { data, total } = await reportService.generateEmployeeReport(roleName, userId, q);
    if (q.format !== 'json') return reportService.sendReport(res, q.format, data, 'employee');
    res.json({ success: true, total, page: q.page, limit: q.limit, data });
  } catch (err) { next(err); }
}

// GET /api/v1/reports/tasks
async function getTaskReport(req, res, next) {
  try {
    const q = _parseQuery(taskReportSchema, req.query);
    const { roleName, userId } = _getRbac(req);
    const { data, total } = await reportService.generateTaskReport(roleName, userId, q);
    if (q.format !== 'json') return reportService.sendReport(res, q.format, data, 'task');
    res.json({ success: true, total, page: q.page, limit: q.limit, data });
  } catch (err) { next(err); }
}

// GET /api/v1/reports/milestones
async function getMilestoneReport(req, res, next) {
  try {
    const q = _parseQuery(milestoneReportSchema, req.query);
    const { roleName, userId } = _getRbac(req);
    const { data, total } = await reportService.generateMilestoneReport(roleName, userId, q);
    if (q.format !== 'json') return reportService.sendReport(res, q.format, data, 'milestone');
    res.json({ success: true, total, page: q.page, limit: q.limit, data });
  } catch (err) { next(err); }
}

// GET /api/v1/reports/reviews
async function getReviewReport(req, res, next) {
  try {
    const q = _parseQuery(reviewReportSchema, req.query);
    const { roleName, userId } = _getRbac(req);
    const { data, total } = await reportService.generateReviewReport(roleName, userId, q);
    if (q.format !== 'json') return reportService.sendReport(res, q.format, data, 'review');
    res.json({ success: true, total, page: q.page, limit: q.limit, data });
  } catch (err) { next(err); }
}

// GET /api/v1/reports/notifications
async function getNotificationReport(req, res, next) {
  try {
    const q = _parseQuery(notificationReportSchema, req.query);
    const { roleName, userId } = _getRbac(req);
    const { data, total } = await reportService.generateNotificationReport(roleName, userId, q);
    if (q.format !== 'json') return reportService.sendReport(res, q.format, data, 'notification');
    res.json({ success: true, total, page: q.page, limit: q.limit, data });
  } catch (err) { next(err); }
}

module.exports = {
  getProjectReport,
  getEmployeeReport,
  getTaskReport,
  getMilestoneReport,
  getReviewReport,
  getNotificationReport
};
