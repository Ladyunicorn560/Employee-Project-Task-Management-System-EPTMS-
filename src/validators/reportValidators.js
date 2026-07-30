const { z } = require('zod');

const VALID_FORMATS = ['pdf', 'xlsx', 'csv'];

const VALID_STATUSES = [
  'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived',
  'Not Started', 'Assigned', 'In Progress', 'Blocked', 'Ready for Review',
  'Under Review', 'Changes Required', 'Pending', 'Approved', 'Rejected'
];

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const baseReportQuerySchema = z.object({
  format: z
    .enum(VALID_FORMATS, {
      errorMap: () => ({ message: `Format must be one of: ${VALID_FORMATS.join(', ')}` })
    })
    .optional()
    .default('pdf'),
  projectId: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  departmentId: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  employeeId: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  reviewerId: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  status: z.enum(VALID_STATUSES).optional(),
  priority: z.enum(VALID_PRIORITIES).optional(),
  startDate: z.string().optional().refine(v => !v || !isNaN(Date.parse(v)), { message: 'startDate must be a valid date' }),
  endDate: z.string().optional().refine(v => !v || !isNaN(Date.parse(v)), { message: 'endDate must be a valid date' }),
  page: z.string().optional().default('1').transform(v => parseInt(v, 10)),
  limit: z.string().optional().default('100').transform(v => Math.min(parseInt(v, 10), 1000))
});

const projectReportSchema = z.object({ query: baseReportQuerySchema });
const employeeReportSchema = z.object({ query: baseReportQuerySchema });
const taskReportSchema = z.object({ query: baseReportQuerySchema });
const milestoneReportSchema = z.object({ query: baseReportQuerySchema });
const reviewReportSchema = z.object({ query: baseReportQuerySchema });
const notificationReportSchema = z.object({ query: baseReportQuerySchema });

module.exports = {
  projectReportSchema,
  employeeReportSchema,
  taskReportSchema,
  milestoneReportSchema,
  reviewReportSchema,
  notificationReportSchema,
  VALID_FORMATS
};
