const { z } = require('zod');

const VALID_WORK_MODES = ['Office', 'Client Site', 'WFH', 'Leave', 'Public Holiday'];

const timecardEntrySchema = z.object({
  projectId: z.number({ required_error: 'Project ID is required' }).int().positive(),
  taskId: z.number({ required_error: 'Task ID is required' }).int().nonnegative(),
  workDate: z.string({ required_error: 'Work date is required' }).refine(val => !isNaN(Date.parse(val)), { message: 'Invalid work date' }),
  workMode: z.enum(VALID_WORK_MODES, {
    errorMap: () => ({ message: `Work mode must be one of: ${VALID_WORK_MODES.join(', ')}` })
  }).default('Office'),
  hoursWorked: z.number({ required_error: 'Hours worked is required' }).min(0.25, 'Hours must be at least 0.25').max(24, 'Hours cannot exceed 24 per day'),
  description: z.string({ required_error: 'Description is required' }).trim().min(1, 'Description is required').max(500, 'Description cannot exceed 500 characters')
});

const submitTimecardSchema = z.object({
  body: z.object({
    weekStartDate: z.string({ required_error: 'Week start date is required' }).refine(val => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
    weekEndDate: z.string({ required_error: 'Week end date is required' }).refine(val => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
    managerId: z.number().int().positive().optional().nullable(),
    entries: z.array(timecardEntrySchema).min(1, 'Timecard must contain at least one work entry')
  })
});

const approvalSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val, 10)).refine(val => !isNaN(val) && val > 0, { message: 'Invalid Timecard ID' })
  }),
  body: z.object({
    comments: z.string().trim().max(1000, 'Comments cannot exceed 1000 characters').optional().nullable()
  })
});

const getTimecardQuerySchema = z.object({
  query: z.object({
    employeeId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    managerId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    projectOwnerId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    status: z.enum(['Draft', 'Submitted', 'ManagerApproved', 'FinancialApproved', 'ManagerRejected', 'FinancialRejected']).optional(),
    weekStartDate: z.string().optional(),
    weekEndDate: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10)
  })
});

module.exports = {
  submitTimecardSchema,
  approvalSchema,
  getTimecardQuerySchema
};
